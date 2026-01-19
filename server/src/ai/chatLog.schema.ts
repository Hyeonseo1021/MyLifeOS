import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true }) 
export class ChatLog extends Document {
  @Prop({ required: true, default: 'default-session' })
  sessionId: string; 

  @Prop({ required: true, enum: ['user', 'assistant', 'system'] })
  role: string; 

  @Prop({ required: true })
  content: string;
}

export const ChatLogSchema = SchemaFactory.createForClass(ChatLog);