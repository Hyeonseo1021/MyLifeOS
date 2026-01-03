// src/types/index.ts

export type TabType = 'HOME' | 'MLO' | 'MEMORY' | 'SETTINGS';
export type AiState = 'idle' | 'processing' | 'speaking';

export interface TodoItem {
  _id: string;
  text: string;
  done: boolean;
}

export interface CreateTodoDto {
  text: string;
  done: boolean;
}

export interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}