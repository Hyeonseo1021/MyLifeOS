import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WeatherService {
  private readonly weatherApiKey = '7e83a92a200eaef2257cd434ccf9e5c9'; 

  async getWeather(lat: number, lon: number) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&lang=kr&units=metric&appid=${this.weatherApiKey}`;
      const { data } = await axios.get(url);
      
      return {
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main, 
        location: data.name,
        humidity: data.main.humidity,
        min: Math.round(data.main.temp_min),
        max: Math.round(data.main.temp_max),
      };
    } catch (error) {
      console.warn('⚠️ 날씨 API 호출 실패 (키 활성화 대기 중이거나 오류). 데모 데이터를 사용합니다.');
      
      return { 
        temp: 18, 
        condition: 'Clear', 
        location: '서울 (Demo)', 
        humidity: 40, 
        min: 10, 
        max: 20 
      };
    }
  }
}