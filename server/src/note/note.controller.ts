import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { NoteService } from './note.service';

@Controller('note')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Get()
  getNotes() {
    return this.noteService.getNotes();
  }

  @Post()
  createNote(@Body() body: { title: string; content: string; tags: string[] }) {
    return this.noteService.createNote(body.title, body.content, body.tags);
  }

  @Put(':id')
  updateNote(@Param('id') id: string, @Body() body: { title: string; content: string; tags: string[] }) {
    return this.noteService.updateNote(id, body.title, body.content, body.tags);
  }

  @Delete(':id')
  deleteNote(@Param('id') id: string) {
    return this.noteService.deleteNote(id);
  }
}