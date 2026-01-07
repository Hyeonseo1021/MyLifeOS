// src/api/index.ts
import { todoApi } from './todo';
import { weatherApi } from './weather';
import { aiApi } from './ai';

export const api = {
  todo: todoApi,
  weather: weatherApi,
  ai: aiApi,
  // mlo: mloApi,
  // memory: memoryApi,
};