import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather') // 주소: http://localhost:3000/weather
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  async getWeather(@Query('lat') lat: string, @Query('lon') lon: string) {
    // 위도 경도가 없으면 서울시청 좌표 기본값
    const latitude = lat ? parseFloat(lat) : 37.5665;
    const longitude = lon ? parseFloat(lon) : 126.9780;
    
    return this.weatherService.getWeather(latitude, longitude);
  }
}