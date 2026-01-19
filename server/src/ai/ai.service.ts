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

@Injectable()
export class AiService {
  private model: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;
  private searchTool: TavilySearch;
  private vectorStore: MongoDBAtlasVectorSearch;

  constructor(
    private todoService: TodoService,

    @InjectModel(ChatLog.name) private chatLogModel: Model<ChatLog> 
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async chat(message: string, sessionId: string = 'default-session') {
    const logs: { level: string; message: string }[] = [];
    logs.push({ level: 'INFO', message: `User: "${message}"` });

    // 2. 기억(History) 로드
    const historyDocs = await this.chatLogModel.find({ sessionId })
      .sort({ createdAt: -1 }).limit(10);
    
    const history: BaseMessage[] = historyDocs.reverse().map(doc => {
      if (doc.role === 'user') return new HumanMessage(doc.content);
      return new AIMessage(doc.content);
    });

    // 3. 할 일(Todo) 컨텍스트
    let todoContext = "확인된 할 일이 없습니다.";
    try {
      const rawTodos = await this.todoService.findAll();
      const pendingTodos = rawTodos.filter(t => !t.done);
      if (pendingTodos.length > 0) {
        todoContext = pendingTodos.map(t => `- [${t.date}] ${t.text}`).join('\n');
      }
    } catch (e) { /* 무시 */ }

    // 4. RAG(지식) 검색
    let ragContext = "관련된 문서 정보가 없습니다.";
    try {
        const results = await this.vectorStore.similaritySearch(message, 3);
        if (results.length > 0) {
            ragContext = results.map(doc => `[문서 내용]: ${doc.pageContent}`).join("\n\n");
            logs.push({ level: 'SUCCESS', message: `RAG: Found ${results.length} docs.` });
        }
    } catch (e) { /* 인덱스 준비 안됨 등 무시 */ }

    // 5. 도구 및 프롬프트
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'add_todo',
          description: '일정을 추가합니다.',
          parameters: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              date: { type: 'string' },
            },
            required: ['text'],
          },
        },
      },
    ];

    try {
      const modelWithTools = this.model.bindTools(tools);
      
      const systemPrompt = `
        당신은 통합 AI 비서 'Jarvis'입니다.

        [정보 소스]
        1. 할 일 목록: ${todoContext}
        2. RAG 지식: ${ragContext}
        3. 대화 맥락: (지금 나누고 있는 대화 내용)

        [행동 지침]
        1. **우선순위**: 질문에 답변할 때 [소스 1]과 [소스 2], 그리고 **[대화 맥락]**을 모두 종합하여 판단하세요.
        2. **기억력**: 사용자가 방금 말한 내용이나 이전 대화 내용을 물어보면, **기억(대화 히스토리)을 바탕으로 답변**하세요. (이때는 RAG에 없어도 됩니다.)
        3. **환각 방지**: 
           - 대화 내용에도 없고, [소스 1, 2]에도 없는 '새로운 개인정보'를 물어볼 때만 "정보가 없습니다"라고 답하세요.
        4. **일상 대화**: 인사나 잡담은 자연스럽게 받아주세요.
        - 오늘 날짜: ${this.getTodayStr()}
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
        const toolCall = toolCalls[0];
        if (toolCall.name === 'add_todo') {
            const args = toolCall.args;
            const targetDate = args.date || this.getTodayStr();
            await this.todoService.create({ text: args.text, date: targetDate, done: false });
            finalReply = `✅ 일정에 "${args.text}"를 추가했습니다.`;
            logs.push({ level: 'SUCCESS', message: `Executed: add_todo` });
        }
      }

      // 저장
      await this.chatLogModel.create({ sessionId, role: 'user', content: message });
      if (finalReply) await this.chatLogModel.create({ sessionId, role: 'assistant', content: finalReply });

      return { reply: finalReply, logs };

    } catch (error: any) {
      console.error(error);
      return { reply: "오류 발생", logs: [{ level: 'ERROR', message: error.message }] };
    }
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