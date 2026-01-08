import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { TavilySearch } from "@langchain/tavily";


@Injectable()
export class AiService {
  private model: ChatOpenAI;
  private searchTool: TavilySearch;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    this.searchTool = new TavilySearch({
      maxResults: 5,
      topic: 'news',
    });
  }

  private getTodayStr(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
}