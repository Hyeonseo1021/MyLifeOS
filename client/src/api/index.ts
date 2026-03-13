// src/api/index.ts
import { todoApi } from './todo';
import { weatherApi } from './weather';
import { aiApi } from './ai';
import { noteApi } from './notes';

export const api = {
  todo: todoApi,
  weather: weatherApi,
  ai: aiApi,
  note: noteApi,
};