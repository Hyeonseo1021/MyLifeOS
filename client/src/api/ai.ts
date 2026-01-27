import axios from 'axios';

export interface ChatSessionData {
    sessionId: string;
    title: string;
    updatedAt: string;
}

const BASE_URL = 'http://localhost:3000'; 

export const aiApi = {
  generateBriefing: async (weather: any, todos: any[]) => {
    const response = await axios.post<{ briefing: string }>(`${BASE_URL}/ai/briefing`, { weather, todos });
    return response.data; 
  },

  getIssues: async () => {
    const response = await axios.get<any[]>(`${BASE_URL}/ai/issue`);
    return response.data;
  },

  chat: async (message: string, sessionId: string) => {
    const response = await axios.post<{ reply: string, logs: any[], title?: string }>(`${BASE_URL}/ai/chat`, { message, sessionId });
    return response.data;
  },

  chatWithFile: async (formData: FormData) => {
    const response = await axios.post<{ reply: string, logs: any[], title?: string }>(`${BASE_URL}/ai/chat/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getHistory: async (sessionId: string) => {
    const response = await axios.get(`${BASE_URL}/ai/history?sessionId=${sessionId}`);
    return response.data; 
  },

  getSessions: async () => {
    const response = await axios.get<ChatSessionData[]>(`${BASE_URL}/ai/sessions`);
    return response.data;
  },

  clearHistory: async (sessionId: string) => {
    const response = await axios.delete(`${BASE_URL}/ai/history?sessionId=${sessionId}`);
    return response.data;
  },

  deleteSession: async (sessionId: string) => {
    const response = await axios.delete(`${BASE_URL}/ai/history?sessionId=${sessionId}`);
    return response.data;
  },
};