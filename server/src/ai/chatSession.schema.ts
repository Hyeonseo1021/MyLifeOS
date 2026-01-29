import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true }) 
export class ChatSession extends Document {
  @Prop({ required: true, unique: true })
  sessionId: string; 

  @Prop({ default: '새로운 대화' })
  title: string; 
  
  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);