// types.ts
export interface SourceItem {
  filename: string;
  content: string;
  page?: number;
  score?: number;
}

export interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  humidity: number;
  min: number;
  max: number;
}

export interface NoteItem {
  _id: string; 
  title: string;
  content: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatSessionData {
  sessionId: string;
  title: string;
  updatedAt: string;
}

export interface ChatResponse {
  reply: string;
  logs: any[];
  title?: string;
  sources?: {        
    filename: string;
    content: string;
    page?: number;
    score?: number;
  }[];
}


export interface BriefingResponse {
  briefing: string;
}

export interface Settings {
  username?: string;
  theme?: 'dark' | 'light' | 'system';
  language?: 'ko' | 'en';
}