import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Todo, TodoDocument } from './todo.schema';

@Injectable()
export class TodoService {
  constructor(@InjectModel(Todo.name) private todoModel: Model<TodoDocument>) {}

  async findAll(): Promise<Todo[]> {
    return this.todoModel.find().sort({ createdAt: -1 }).exec();
  }

  async create(text: string): Promise<Todo> {
    const newTodo = new this.todoModel({ text });
    return newTodo.save();
  }

  async update(id: string, done: boolean): Promise<Todo | null> {
    return this.todoModel.findByIdAndUpdate(id, { done }, { new: true }).exec();
  }

  async remove(id: string): Promise<Todo | null> {
    return this.todoModel.findByIdAndDelete(id).exec();
  }
}