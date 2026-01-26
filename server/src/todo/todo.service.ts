import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Todo, TodoDocument } from './todo.schema';

interface CreateTodoData {
  text: string;
  date: string;
  done: boolean;
}

@Injectable()
export class TodoService {
  constructor(@InjectModel(Todo.name) private todoModel: Model<TodoDocument>) {}

  async findAll(): Promise<TodoDocument[]> {
    return this.todoModel.find().sort({ createdAt: -1 }).exec();
  }

  async create(data: CreateTodoData): Promise<TodoDocument> {
    const newTodo = new this.todoModel(data);
    return newTodo.save();
  }

  async update(id: string, done: boolean): Promise<TodoDocument | null> {
    return this.todoModel.findByIdAndUpdate(id, { done }, { new: true }).exec();
  }

  async updateStatus(id: string, done: boolean): Promise<TodoDocument | null> {
    return this.todoModel.findByIdAndUpdate(id, { done }, { new: true }).exec();
  }

  async updateContent(id: string, text?: string, date?: string): Promise<TodoDocument | null> {
    const updateData: any = {};
    if (text) updateData.text = text;
    if (date) updateData.date = date;

    return this.todoModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async remove(id: string): Promise<TodoDocument | null> {
    return this.todoModel.findByIdAndDelete(id).exec();
  }
}