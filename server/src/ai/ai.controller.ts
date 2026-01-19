import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}
  
  @Post('chat')
  async chat(@Body() body: { message: string }) {
    return this.aiService.chat(body.message);
  }

  @Post('briefing')
  async getBriefing(@Body() body: { weather: any, todos: any[] }) {
    const response = await this.aiService.generateBriefing(body.weather, body.todos);
    return { briefing: response };
  }

  @Post('issue')
  async getIssue(@Body() body: { topic: string }) {
    const response = await this.aiService.getIssues();
    return { issues: response };
  }
}