import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OpenAIEmbeddings } from '@langchain/openai'; 
import { Note } from './note.schema';

@Injectable()
export class NoteService {
  private embeddings: OpenAIEmbeddings;

  constructor(
    @InjectModel(Note.name) private noteModel: Model<Note>,
  ) {
    this.embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  async createNote(title: string, content: string, tags: string[]) {
    const textToEmbed = `Title: ${title || 'Untitled'}\nContent: ${content}\nTags: ${tags.join(', ')}`;
    const embedding = await this.embeddings.embedQuery(textToEmbed);

    return this.noteModel.create({
      title,
      content,
      tags,
      embedding 
    });
  }

  async getNotes() {
    return this.noteModel.find().sort({ createdAt: -1 });
  }

  async updateNote(id: string, title: string, content: string, tags: string[]) {
    const textToEmbed = `Title: ${title || 'Untitled'}\nContent: ${content}\nTags: ${tags.join(', ')}`;
    const embedding = await this.embeddings.embedQuery(textToEmbed);

    return this.noteModel.findByIdAndUpdate(id, {
      title,
      content,
      tags,
      embedding 
    }, { new: true });
  }

  async deleteNote(id: string) {
    return this.noteModel.findByIdAndDelete(id);
  }
}