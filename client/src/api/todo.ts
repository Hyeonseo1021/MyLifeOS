// src/api/todo.ts
import client from './client';
import type { TodoItem, CreateTodoDto } from '../types';

export const todoApi = {
  // get all todos
  getAll: () => client<TodoItem[]>('/todos'),

  // create todo
  create: (data: CreateTodoDto) => client<TodoItem>('/todos', { 
    method: 'POST', 
    data 
  }),

  // change todo
  update: (id: string, done: boolean) => client<void>(`/todos/${id}`, { 
    method: 'PATCH', 
    data: { done } 
  }),

  // delete todo
  delete: (id: string) => client<void>(`/todos/${id}`, { 
    method: 'DELETE' 
  }),
};