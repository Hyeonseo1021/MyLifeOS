import { Controller, Post, Body, Get, Query, Delete } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: { message: string; sessionId: string }) {
    return this.aiService.chat(body.message, body.sessionId);
  }

  @Get('history')
  async getHistory(@Query('sessionId') sessionId: string) {
    return this.aiService.getChatHistory(sessionId);
  }

  @Get('sessions')
  async getSessions() {
    return this.aiService.getSessions();
  }

  @Delete('history')
  async clearHistory(@Query('sessionId') sessionId: string) {
    return this.aiService.clearChatHistory(sessionId);
  }

  @Post('briefing')
  async generateBriefing(@Body() body: { weather: any; todos: any[] }) {
    const result = await this.aiService.generateBriefing(body.weather, body.todos);
    return { briefing: result }; 
  }

  @Get('issue')
  async getIssues() {
    return this.aiService.getIssues(); 
  }
}