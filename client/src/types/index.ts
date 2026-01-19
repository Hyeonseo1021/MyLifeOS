

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

export interface ChatMessage {
  id: number; 
  role: 'user' | 'ai' | 'system'; 
  text: string; 
}


export interface LogEntry {
  id: number;
  timestamp: Date;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
}


export interface AiChatResponse {
  reply: string;
  logs?: LogEntry[]; 
}

export interface IssueItem {
  title: string;
  url: string;
  category: string;
}