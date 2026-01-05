// src/types/index.ts

export type TabType = 'HOME' | 'MLO' | 'MEMORY' | 'SETTINGS';
export type AiState = 'idle' | 'processing' | 'speaking';

export interface TodoItem {
  _id: string;
  text: string;
  done: boolean;
  date: string;
}

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  min: number;
  max: number;
  location: string;
}

export interface CreateTodoDto {
  text: string;
  done: boolean;
  date: string;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system'; 
  content: string;
  timestamp: Date;
}