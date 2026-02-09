
import { apiClient } from './client'; 
import type { WeatherData } from './types';

export const weatherApi = {
  get: (lat: number, lon: number) => {
    return apiClient.get<WeatherData>(`/weather?lat=${lat}&lon=${lon}`);
  },
};