import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('briefing')
  async getBriefing(@Body() body: { weather: any, todos: any[] }) {
    const response = await this.aiService.generateBriefing(body.weather, body.todos);
    return { briefing: response };
  }
}