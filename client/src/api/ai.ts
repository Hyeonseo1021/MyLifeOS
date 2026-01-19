import axios from 'axios';
import type { WeatherData, TodoItem, IssueItem } from '../types';

const BASE_URL = 'http://localhost:3000'; 

export const aiApi = {
  generateBriefing: async (weather: WeatherData, todos: TodoItem[]) => {
    const response = await axios.post<{ briefing: string }>(`${BASE_URL}/ai/briefing`, {
      weather,
      todos,
    });
    return response.data;
  },
  getIssues: async () => {
    const response = await axios.post<{ issues: IssueItem[] }>(`${BASE_URL}/ai/issue`);
    return response.data.issues;
  },
  chat: async (message: string) => {
    const response = await axios.post<{ reply: string, logs: any[] }>(`${BASE_URL}/ai/chat`, {
      message,
    });
    return response.data;
  }
};