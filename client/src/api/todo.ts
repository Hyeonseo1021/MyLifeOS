import { apiClient } from './client'; 
import type { TodoItem, CreateTodoDto } from '../types'; 

export const todoApi = {
  getAll: async () => {
    return await apiClient.get<TodoItem[]>('/todos');
  },

  create: async (data: CreateTodoDto) => {
    return await apiClient.post<TodoItem>('/todos', data);
  },

  update: async (id: string, done: boolean) => {
    return await apiClient.patch<void>(`/todos/${id}`, { done });
  },

  delete: async (id: string) => {
    return await apiClient.delete<void>(`/todos/${id}`);
  },
};