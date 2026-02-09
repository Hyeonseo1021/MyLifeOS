import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Note extends Document {
  @Prop() 
  title: string;

  @Prop({ default: '' })
  content: string; 

  @Prop({ type: [String], default: [] })
  tags: string[]; 
  
  @Prop({ type: [Number], select: false }) 
  embedding: number[]; 
}

export const NoteSchema = SchemaFactory.createForClass(Note);