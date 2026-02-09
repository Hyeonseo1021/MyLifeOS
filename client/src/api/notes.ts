import { apiClient } from './client';
import type { NoteItem } from './types';

export const noteApi = {
  getNotes: async () => {
    return await apiClient.get<NoteItem[]>('/notes');
  },

  createNote: async (title: string, content: string, tags: string[]) => {
    return await apiClient.post<NoteItem>('/notes', { title, content, tags });
  },

  updateNote: async (id: string, title: string, content: string, tags: string[]) => {
    return await apiClient.put<NoteItem>(`/notes/${id}`, { title, content, tags });
  },

  deleteNote: async (id: string) => {
    return await apiClient.delete(`/notes/${id}`);
  }
};