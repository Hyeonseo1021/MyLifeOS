import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { TavilySearch } from "@langchain/tavily";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { MongoClient } from "mongodb";
import { PromptTemplate } from '@langchain/core/prompts';
import { TodoService } from '../todo/todo.service';
import { ChatLog } from './chatLog.schema';
import { VectorDoc } from './vectorDoc.schema';
import { ChatSession } from './chatSession.schema';

@Injectable()
export class AiService {
  private model: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;
  private searchTool: TavilySearch;
  private vectorStore: MongoDBAtlasVectorSearch;

  constructor(
    private todoService: TodoService,
    @InjectModel(ChatLog.name) private chatLogModel: Model<ChatLog>,
    @InjectModel(ChatSession.name) private chatSessionModel: Model<ChatSession>
  ) {
    this.model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.5,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.searchTool = new TavilySearch({
      maxResults: 5,
      topic: 'news',
    });

    const client = new MongoClient(process.env.MONGODB_URI || "");
    const collection = client.db("mylifeos").collection("vectordocs");

    this.vectorStore = new MongoDBAtlasVectorSearch(this.embeddings, {
      collection: collection as any,
      indexName: "vector_index",
      textKey: "content",
      embeddingKey: "embedding",
    });
  }

  private getTodayStr(): string {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }

  private async generateTitle(message: string): Promise<string> {
    try {
      const summaryModel = new ChatOpenAI({
        modelName: 'gpt-3.5-turbo',
        temperature: 0.3,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });

      const response = await summaryModel.invoke([
        new SystemMessage("사용자의 메시지를 바탕으로 15자 이내의 짧고 간결한 대화 주제(제목)를 한글로 만들어줘. 따옴표 없이 텍스트만 출력해."),
        new HumanMessage(message)
      ]);

      return response.content as string;
    } catch (e) {
      return "새로운 대화";
    }
  }

  async chat(message: string, sessionId: string) {
    const logs: { level: string; message: string }[] = [];
    logs.push({ level: 'INFO', message: `User Input: "${message}"` });

    let session = await this.chatSessionModel.findOne({ sessionId });
    if (!session) {
      session = await this.chatSessionModel.create({ sessionId, title: '새로운 대화' });
    }

    if (session.title === '새로운 대화' && message.length > 5) {
      this.generateTitle(message).then(async (title) => {
        session.title = title;
        await session.save();
      });
    }

    const historyDocs = await this.chatLogModel.find({ sessionId })
      .sort({ createdAt: -1 }).limit(10);

    const history: BaseMessage[] = historyDocs.reverse().map(doc => {
      if (doc.role === 'user') return new HumanMessage(doc.content);
      return new AIMessage(doc.content);
    });

    let todoContext = "현재 등록된 할 일이 없습니다.";
    try {
      const rawTodos = await this.todoService.findAll();
      const pendingTodos = rawTodos.filter(t => !t.done);
      if (pendingTodos.length > 0) {
        todoContext = pendingTodos.map(t => `- [${t.date}] ${t.text}`).join('\n');
      }
    } catch (e) { }

    let ragContext = "";
    try {
      const results = await this.vectorStore.similaritySearch(message, 3);
      if (results.length > 0) {
        ragContext = results.map(doc => `[관련 지식]: ${doc.pageContent}`).join("\n\n");
        logs.push({ level: 'SUCCESS', message: `RAG: Found ${results.length} docs.` });
      } else {
        ragContext = "관련된 저장 문서가 없습니다.";
      }
    } catch (e) { ragContext = "RAG 검색 불가"; }

    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'add_todo',
          description: '일정을 추가합니다. 사용자의 발언에서 계획, 약속, 할 일이 감지되면 사용하세요.',
          parameters: {
            type: 'object',
            properties: {
              text: { type: 'string', description: '할 일 내용' },
              date: { type: 'string', description: 'YYYY-MM-DD 형식의 날짜' },
            },
            required: ['text'],
          },
        },
      },
    ];

    try {
      const modelWithTools = this.model.bindTools(tools);

      const systemPrompt = `
        당신은 유능하고 센스 있는 AI 비서 'Jarvis'입니다.
        사용자와 자연스럽게 대화하며 필요한 도움을 제공하세요.

        [현재 상황 정보]
        - 오늘 날짜: ${this.getTodayStr()}
        - 사용자의 남은 할 일: 
        ${todoContext}
        - 참고 지식(RAG): 
        ${ragContext}

        [업무 처리 가이드]
        1. **자연스러운 일정 감지**: 사용자가 굳이 "일정 추가해줘"라고 명령하지 않아도, 대화 내용이 **미래의 계획, 약속, 해야 할 업무**를 포함한다면 스스로 판단하여 'add_todo' 도구를 실행하세요.
        2. **맥락 기반 답변**: 사용자의 질문에 답할 때는 **[참고 지식]**과 **[이전 대화 내역]**을 최우선으로 고려하세요.
        3. **정보의 정확성**: 개인적인 일정이나 RAG에 있는 지식은 사실대로 답하되, 모르는 외부 정보는 솔직히 모른다고 하거나 검색이 필요하다고 말하세요.
        4. **톤앤매너**: 딱딱한 기계처럼 굴지 말고, 정중하지만 친근한 비서처럼 대답하세요.
      `;

      logs.push({ level: 'WARNING', message: 'Generating response...' });

      const result = await modelWithTools.invoke([
        new SystemMessage(systemPrompt),
        ...history,
        new HumanMessage(message),
      ]);

      let finalReply = result.content as string;
      const toolCalls = result.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          if (toolCall.name === 'add_todo') {
            const args = toolCall.args;
            const targetDate = args.date || this.getTodayStr();

            await this.todoService.create({ text: args.text, date: targetDate, done: false });

            const confirmation = `✅ 일정에 [${args.text}] 내용을 추가했습니다.`;
            finalReply = finalReply ? `${finalReply}\n\n${confirmation}` : confirmation;

            logs.push({ level: 'SUCCESS', message: `Executed: add_todo (${args.text})` });
          }
        }
      }

      await this.chatLogModel.create({ sessionId, role: 'user', content: message });
      if (!finalReply) finalReply = "처리가 완료되었습니다.";
      await this.chatLogModel.create({ sessionId, role: 'assistant', content: finalReply });

      return { reply: finalReply, logs, title: session.title };

    } catch (error: any) {
      console.error(error);
      return { reply: "시스템 오류가 발생했습니다.", logs: [{ level: 'ERROR', message: error.message }] };
    }
  }

  async getChatHistory(sessionId: string) {
    const logs = await this.chatLogModel.find({ sessionId })
      .sort({ createdAt: 1 })
      .limit(100);

    return logs.map(log => ({
      id: log._id,
      role: log.role === 'assistant' ? 'ai' : log.role,
      text: log.content,
    }));
  }

  async getSessions() {
    const sessions = await this.chatSessionModel.find().sort({ updatedAt: -1 });
    return sessions.map(s => ({
      sessionId: s.sessionId,
      title: s.title,
      updatedAt: s.updatedAt
    }));
  }

  async clearChatHistory(sessionId: string) {
    await this.chatLogModel.deleteMany({ sessionId });
    await this.chatSessionModel.deleteOne({ sessionId });
    return { success: true };
  }

  async generateBriefing(weather: any, todos: any[]): Promise<string> {
    const todayStr = this.getTodayStr();
    
    const overdueTodos = todos.filter(t => t.date < todayStr && !t.done);
    
    const todayTodos = todos.filter(t => t.date === todayStr); 

    const weatherStr = weather 
      ? `${weather.condition}, ${weather.temp}°C (${weather.location})`
      : '날씨 정보 없음';

    const overdueStr = overdueTodos.length > 0
      ? overdueTodos.map(t => `- ${t.text} (밀림)`).join('\n')
      : '없음';

    const todayStrList = todayTodos.length > 0
      ? todayTodos.map(t => `- ${t.text} (${t.done ? '완료' : '진행 중'})`).join('\n')
      : '일정 없음';

    const prompt = PromptTemplate.fromTemplate(`
      당신은 사용자의 개인 AI 비서 'Jarvis'입니다.
      아래 필터링된 일정 정보를 바탕으로 오늘 하루 브리핑을 해주세요.

      [현재 상황]
      - 날씨: {weather}
      - 오늘 날짜: {today_date}

      [업무 현황]
      1. 처리하지 못한 지난 업무:
      {overdue_list}
      
      2. 오늘의 할 일:
      {today_list}

      [작성 가이드]
      - **지난 업무가 있다면** 가볍게 상기시켜주되, 부담스럽지 않게 오늘 처리하라고 권유하세요.
      - **오늘 할 일**을 메인으로 브리핑하세요.
      - 전체 분량은 **3문장 내외**로 자연스럽게 연결하세요.
      - 말투는 정중하면서도 든든한 비서처럼 하세요.

      [브리핑 메시지]:
    `);
    
    const chain = prompt.pipe(this.model);
    
    const result = await chain.invoke({
      weather: weatherStr,
      today_date: todayStr,
      overdue_list: overdueStr,
      today_list: todayStrList,
    });

    return result.content as string;
  }

  async getIssues(): Promise<any[]> {
    try {
      const rawResponse = await this.searchTool.invoke({
        query: "최신 IT 인공지능 기술 뉴스"
      });
      
      let parsedData;
      if (typeof rawResponse === 'string') {
        try {
          parsedData = JSON.parse(rawResponse);
        } catch (e) {
          return [];
        }
      } else {
        parsedData = rawResponse;
      }

      let items: any[] = [];

      if (Array.isArray(parsedData)) {
        items = parsedData;
      } else if (parsedData && Array.isArray(parsedData.results)) {
        items = parsedData.results;
      } else if (parsedData && typeof parsedData === 'object') {
        items = Object.values(parsedData);
      }

      if (!Array.isArray(items)) {
        console.log("뉴스 데이터 형식이 배열이 아님:", parsedData); 
        return [];
      }

      return items.map((item: any) => ({
        title: item.title || item.content?.slice(0, 50) + "..." || "제목 없음",
        url: item.url || "#",
        category: 'TECH'
      }));

    } catch (error) {
      console.error("News Error:", error);
      return [];
    }
  }

  async 
}