import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TodoService } from './todo.service';

@Controller('todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  findAll() {
    return this.todoService.findAll();
  }

  @Post()
  create(@Body() body: { text: string }) {
    return this.todoService.create(body.text);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { done: boolean }) {
    return this.todoService.update(id, body.done);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.todoService.remove(id);
  }
}