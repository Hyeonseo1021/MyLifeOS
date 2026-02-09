import { apiClient, fileApiClient } from './client';
import type { ChatResponse, ChatSessionData, SourceItem} from './types';

export const aiApi = {
  generateBriefing: async (weather: any, todos: any[]) => {
    return await apiClient.post<{ briefing: string }>('/ai/briefing', { weather, todos });
  },

  getIssues: async () => {
    return await apiClient.get<any[]>('/ai/issue');
  },

  chat: async (message: string, sessionId: string) => {
    return await apiClient.post<ChatResponse>('/ai/chat', { message, sessionId });
  },

  chatWithFile: async (formData: FormData) => {
    return await fileApiClient.post<ChatResponse>('/ai/chat/file', formData);
  },

  getHistory: async (sessionId: string) => {
    return await apiClient.get(`/ai/history?sessionId=${sessionId}`);
  },

  getSessions: async () => {
    return await apiClient.get<ChatSessionData[]>('/ai/sessions');
  },

  getContextFiles: async (sessionId: string) => {
    return await apiClient.get<SourceItem[]>(`/ai/context/${sessionId}`);
  },

  clearHistory: async (sessionId: string) => {
    return await apiClient.delete(`/ai/history?sessionId=${sessionId}`);
  },

  deleteSession: async (sessionId: string) => {
    return await apiClient.delete(`/ai/history?sessionId=${sessionId}`);
  },
};