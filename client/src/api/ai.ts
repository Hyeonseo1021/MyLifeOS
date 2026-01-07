import axios from 'axios';
import type { WeatherData, TodoItem } from '../types';

const BASE_URL = 'http://localhost:3000'; 

export const aiApi = {
  generateBriefing: async (weather: WeatherData, todos: TodoItem[]) => {
    const response = await axios.post<{ briefing: string }>(`${BASE_URL}/ai/briefing`, {
      weather,
      todos,
    });
    return response.data;
  },
};