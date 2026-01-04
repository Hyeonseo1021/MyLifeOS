// src/types/index.ts

export type TabType = 'HOME' | 'MLO' | 'MEMORY' | 'SETTINGS';
export type AiState = 'idle' | 'processing' | 'speaking';

export interface TodoItem {
  _id: string;
  text: string;
  done: boolean;
  date: string;
}

export interface CreateTodoDto {
  text: string;
  done: boolean;
  date: string;
}

export interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}