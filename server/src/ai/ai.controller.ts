import { Controller, Post, Body, Get, Param, Query, Put, Delete, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: { message: string; sessionId: string }) {
    return this.aiService.chat(body.message, body.sessionId);
  }

  @Post('chat/file')
  @UseInterceptors(FileInterceptor('file'))
  async chatWithFile(
    @Body() body: { message: string; sessionId: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.aiService.processChatWithFile(body.message, body.sessionId, file);
  }

  @Get('history')
  async getHistory(@Query('sessionId') sessionId: string) {
    return this.aiService.getChatHistory(sessionId);
  }

  @Get('sessions')
  async getSessions() {
    return this.aiService.getSessions();
  }

  @Get('context/:sessionId')
  async getContext(@Param('sessionId') sessionId: string) {
    const docs = await this.aiService.getSessionFiles(sessionId); 
    return docs;
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

  @Post('notes')
  async createNote(@Body() body: { title: string; content: string; tags: string[] }) {
    return this.aiService.createNote(body.title, body.content, body.tags);
  }

  @Get('notes')
  async getNotes() {
    return this.aiService.getNotes();
  }

  @Put('notes/:id')
  async updateNote(
    @Param('id') id: string, 
    @Body() body: { title: string; content: string; tags: string[] }
  ) {
    return this.aiService.updateNote(id, body.title, body.content, body.tags);
  }

  @Delete('notes/:id')
  async deleteNote(@Param('id') id: string) {
    return this.aiService.deleteNote(id);
  }
}