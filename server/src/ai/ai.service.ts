import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { TavilySearch } from "@langchain/tavily";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { MongoClient } from "mongodb";
import { PromptTemplate } from '@langchain/core/prompts';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"; 
const pdf = require('pdf-parse'); 

import { TodoService } from '../todo/todo.service';
import { TodoDocument } from 'src/todo/todo.schema';
import { ChatLog } from './chatLog.schema';
import { VectorDoc } from './vectorDoc.schema';
import { ChatSession } from './chatSession.schema';
import { Note } from './note.schema';
import { Settings } from 'src/setting/setting.schema';

@Injectable()
export class AiService {
  private model: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;
  private searchTool: TavilySearch;
  private vectorStore: MongoDBAtlasVectorSearch;

  constructor(
    private todoService: TodoService,
    @InjectModel(ChatLog.name) private chatLogModel: Model<ChatLog>,
    @InjectModel(ChatSession.name) private chatSessionModel: Model<ChatSession>,
    @InjectModel(VectorDoc.name) private vectorDocModel: Model<VectorDoc>,
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectModel(Settings.name) private settingsModel: Model<Settings>,
  ) {
    this.model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.3,
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
        new SystemMessage("사용자의 메시지를 바탕으로 15자 이내의 짧고 간결한 대화 주제를 한글로 만들어줘. 따옴표 없이 텍스트만 출력해."),
        new HumanMessage(message)
      ]);

      return response.content as string;
    } catch (e) {
      return "새로운 대화";
    }
  }

  async processChatWithFile(message: string, sessionId: string, file: any) {
    const fileLogs: { level: string; message: string }[] = [];
    let fileContent = '';
    
    if (file) {
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      fileLogs.push({ level: 'INFO', message: `Receiving file: ${originalName}` });
      
      try {
        if (file.mimetype === 'application/pdf') {
          const pdfData = await pdf(file.buffer);
          fileContent = pdfData.text;
        } else {
          fileContent = file.buffer.toString('utf-8');
        }

        if (fileContent.trim()) {
            fileLogs.push({ level: 'INFO', message: `Extracted total ${fileContent.length} chars.` });

            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,   
                chunkOverlap: 200,  
            });

            const docs = await splitter.createDocuments([fileContent]);
            fileLogs.push({ level: 'INFO', message: `Split into ${docs.length} chunks.` });

            const vectorDocs: any[] = []; 

            for (let i = 0; i < docs.length; i++) {
                const doc = docs[i];
                const embedding = await this.embeddings.embedQuery(doc.pageContent);
                
                vectorDocs.push({
                    content: doc.pageContent,
                    embedding: embedding,
                    metadata: {
                        filename: originalName,
                        chunkIndex: i, 
                        uploadedAt: new Date(),
                        sessionId: sessionId
                    }
                });
            }

            if (vectorDocs.length > 0) {
              await this.vectorDocModel.insertMany(vectorDocs);
            }
            
            fileLogs.push({ level: 'SUCCESS', message: `Successfully vectorized ${docs.length} chunks.` });
        }
      } catch (e) {
          console.error(e);
          fileLogs.push({ level: 'ERROR', message: 'File processing failed: ' + e.message });
      }
    }

    const contextToSend = fileContent ? fileContent.substring(0, 4000) : undefined;
    const chatResult = await this.chat(message, sessionId, contextToSend);
    
    return {
        ...chatResult,
        logs: [...fileLogs, ...chatResult.logs]
    };
  }

  async getSettings() {
    let settings = await this.settingsModel.findOne();
    if (!settings) {
      settings = await this.settingsModel.create({});
    }
    return settings;
  }

  async updateSettings(data: Partial<Settings>) {
    const settings = await this.getSettings();
    Object.assign(settings, data);
    return settings.save();
  }

  async chat(message: string, sessionId: string, directContext?: string) {
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
      const rawTodos = await this.todoService.findAll() as TodoDocument[]; 
      const pendingTodos = rawTodos.filter(t => !t.done);
      
      if (pendingTodos.length > 0) {
        todoContext = pendingTodos.map(t => `- [ID: ${t.id}] [${t.date}] ${t.text}`).join('\n');
      }
    } catch (e) { }

    let ragContext = "";
    let sources: any[] = [];
    let isFileMode = false;

    if (directContext) {
        isFileMode = true;
        ragContext = `[★긴급: 사용자가 방금 업로드한 파일 내용]:\n${directContext}\n\n(위 내용은 사용자가 방금 업로드한 문서입니다. 사용자의 질문이 '요약', '정리', '분석'이라면 무조건 이 내용을 바탕으로 답변하고, 절대 할 일로 등록하지 마세요.)`;
        logs.push({ level: 'SUCCESS', message: 'Using direct file context.' });
    } else {
        try {
            let results = await this.vectorStore.similaritySearch(message, 5);
            
            if (results.length === 0) {
              const recentDocs = await this.vectorDocModel
                .find({ 'metadata.sessionId': sessionId })
                .sort({ 'metadata.uploadedAt': -1 }) 
                .limit(5);

              if (recentDocs.length > 0) {
                results = recentDocs.map(d => ({
                   pageContent: d.content,
                   metadata: d.metadata
                })) as any;
                logs.push({ level: 'WARNING', message: `Search failed. Fallback to latest ${recentDocs.length} docs.` });
              }
            }

            if (results.length > 0) {
                ragContext = results.map(doc => `[참고 자료 (${doc.metadata?.filename || '문서'})]:\n${doc.pageContent}`).join("\n\n");
                logs.push({ level: 'SUCCESS', message: `RAG: Found ${results.length} relevant chunks.` });

                sources = results.map(doc => ({
                    filename: doc.metadata?.filename || 'Unknown Source',
                    content: doc.pageContent.slice(0, 200) + '...', 
                    page: doc.metadata?.page,
                    score: 0 
                }));
            } else {
                ragContext = "관련된 저장 문서가 없습니다.";
            }
        } catch (e) { 
            console.error(e);
            ragContext = "RAG 검색 중 오류 발생"; 
        }
    }

    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'add_todo',
          description: '새로운 일정을 추가합니다. 주의: 문서나 파일의 내용을 요약, 정리, 분석해달라는 요청은 일정이 아닙니다. 절대 이 도구를 호출하지 마세요.',
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
      {
        type: 'function' as const,
        function: {
          name: 'complete_todo',
          description: '기존 일정을 완료 처리합니다.',
          parameters: {
            type: 'object',
            properties: {
              todoId: { type: 'string', description: '완료 처리할 할 일의 고유 ID' },
            },
            required: ['todoId'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'update_todo',
          description: '기존 일정의 내용이나 날짜를 수정합니다.',
          parameters: {
            type: 'object',
            properties: {
              todoId: { type: 'string', description: '수정할 할 일의 고유 ID' },
              text: { type: 'string', description: '수정된 할 일 내용' },
              date: { type: 'string', description: '수정된 YYYY-MM-DD 형식의 날짜' },
            },
            required: ['todoId'],
          },
        },
      },
    ];

    const settings = await this.getSettings();
    const userName = settings.username || 'User';

    try {
      const modelWithTools = this.model.bindTools(tools);

      const systemPrompt = `
        당신은 유능하고 전문적인 AI 비서 'Jarvis'입니다.
        현재 당신이 모시는 사용자의 이름(호칭)은 '${userName}'입니다.
        대화할 때 상황에 맞게 적절히 이름을 불러 친근감을 표현하세요.
        
        [상황 정보]
        - 날짜: ${this.getTodayStr()}
        - 할 일 목록: 
        ${todoContext}
        - 참고 자료(RAG): 
        ${ragContext}

        [★최우선 명령★]
        ${isFileMode ? "현재 사용자가 파일을 업로드했습니다. 사용자의 질문이 '요약해줘', '알려줘', '설명해줘' 등이라면, 절대 'add_todo'를 사용하지 말고 제공된 파일 내용을 바탕으로 답변만 하세요." : ""}

        [업무 처리 가이드]
        1. '참고 자료'가 존재한다면, 사용자의 질문에 대해 그 자료를 기반으로 답변하는 것을 최우선으로 하세요. 
        2. '요약', '정리', '분석'은 할 일(Todo)이 아닙니다. 답변으로 처리하세요.
        3. 사용자가 명확하게 "일정에 추가해줘", "할 일로 등록해"라고 할 때만 'add_todo'를 사용하세요.
      `;

      const result = await modelWithTools.invoke([
        new SystemMessage(systemPrompt),
        ...history,
        new HumanMessage(message),
      ]);

      let finalReply = result.content as string;
      const toolCalls = result.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          const args = toolCall.args;

          if (toolCall.name === 'add_todo') {
             if ((ragContext.length > 50 || isFileMode) && (args.text.includes('요약') || args.text.includes('정리') || args.text.includes('분석'))) {
                 finalReply = "파일 내용을 확인했습니다. 요약해 드리겠습니다. (일정 등록 건너뜀)";
                 continue; 
             }

            const targetDate = args.date || this.getTodayStr();
            await this.todoService.create({ text: args.text, date: targetDate, done: false });
            const confirmation = `일정에 [${args.text}] 항목을 추가했습니다.`;
            finalReply = finalReply ? `${finalReply}\n\n${confirmation}` : confirmation;
            logs.push({ level: 'SUCCESS', message: `Executed: add_todo (${args.text})` });
          } 
          else if (toolCall.name === 'complete_todo') {
            await this.todoService.updateStatus(args.todoId, true);
            const confirmation = `해당 일정을 완료 처리했습니다.`;
            finalReply = finalReply ? `${finalReply}\n\n${confirmation}` : confirmation;
            logs.push({ level: 'SUCCESS', message: `Executed: complete_todo (${args.todoId})` });
          }
          else if (toolCall.name === 'update_todo') {
            await this.todoService.updateContent(args.todoId, args.text, args.date);
            const confirmation = `요청하신 대로 일정을 수정했습니다.`;
            finalReply = finalReply ? `${finalReply}\n\n${confirmation}` : confirmation;
            logs.push({ level: 'SUCCESS', message: `Executed: update_todo (${args.todoId})` });
          }
        }
      }

      await this.chatLogModel.create({ sessionId, role: 'user', content: message });
      if (!finalReply) finalReply = "요청하신 작업을 처리했습니다.";
      await this.chatLogModel.create({ sessionId, role: 'assistant', content: finalReply });

      return { reply: finalReply, logs, title: session.title, sources };

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
    const sessions = await this.chatSessionModel
      .find()
      .sort({ updatedAt: -1 });
      
    return sessions.map(s => ({
      sessionId: s.sessionId,
      title: s.title,
      updatedAt: s.updatedAt
    }));
  }

  async getSessionFiles(sessionId: string) {
    const docs = await this.vectorDocModel
      .find({ 'metadata.sessionId': sessionId })
      .sort({ 'metadata.uploadedAt': -1 }); 
    return docs.map(doc => ({
      filename: doc.metadata?.filename || 'Unknown File',
      content: doc.content.slice(0, 300) + '...', 
    }));
  }

  async clearChatHistory(sessionId: string) {
    try {
      Promise.all([
        this.chatSessionModel.deleteOne({ sessionId }),
        this.chatLogModel.deleteMany({ sessionId }),
        this.vectorDocModel.deleteMany({ 'metadata.sessionId': sessionId })
      ]);

      return { success: true };
    } catch (e) {
      throw new Error('채팅 내역 삭제 실패');
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
      아래 일정 정보를 바탕으로 오늘 하루 브리핑을 해주세요.

      [현재 상황]
      - 날씨: {weather}
      - 오늘 날짜: {today_date}

      [업무 현황]
      1. 미완료 과거 업무:
      {overdue_list}
      
      2. 오늘의 할 일:
      {today_list}

      [작성 가이드]
      - 이모티콘을 사용하지 마세요.
      - 미완료 업무가 있다면 가볍게 언급하여 처리를 권장하세요.
      - 오늘의 할 일을 중심으로 브리핑하세요.
      - 전체 분량은 3문장 내외로 간결하게 작성하세요.
      - 정중하고 전문적인 비서의 말투를 사용하세요.

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
        return [];
      }

      return items.map((item: any) => ({
        title: item.title || item.content?.slice(0, 50) + "..." || "제목 없음",
        url: item.url || "#",
        category: 'TECH'
      }));

    } catch (error) {
      return [];
    }
  }
  async createNote(title: string, content: string, tags: string[]) {
    const textToEmbed = `Title: ${title || 'Untitled'}\nContent: ${content}\nTags: ${tags.join(', ')}`;
    const embedding = await this.embeddings.embedQuery(textToEmbed);

    return this.noteModel.create({
      title,
      content,
      tags,
      embedding 
    });
  }

  async getNotes() {
    return this.noteModel.find().sort({ createdAt: -1 });
  }

  async updateNote(id: string, title: string, content: string, tags: string[]) {
    const textToEmbed = `Title: ${title || 'Untitled'}\nContent: ${content}\nTags: ${tags.join(', ')}`;
    const embedding = await this.embeddings.embedQuery(textToEmbed);

    return this.noteModel.findByIdAndUpdate(id, {
      title,
      content,
      tags,
      embedding 
    }, { new: true });
  }

  async deleteNote(id: string) {
    return this.noteModel.findByIdAndDelete(id);
  }
}