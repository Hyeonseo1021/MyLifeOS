// src/api/weather.ts
import client from './client';

export interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  humidity: number;
  min: number;
  max: number;
}

export const weatherApi = {
  get: (lat: number, lon: number) => 
    client<WeatherData>(`/weather?lat=${lat}&lon=${lon}`),
};