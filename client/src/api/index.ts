// src/api/index.ts
import { todoApi } from './todo';
import { weatherApi } from './weather';

// 추후 MLO, Memory API가 생기면 여기서 import해서 합치면 됩니다.
export const api = {
  todo: todoApi,
  weather: weatherApi
  // mlo: mloApi,
  // memory: memoryApi,
};