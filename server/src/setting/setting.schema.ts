// src/ai/settings.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Settings extends Document {
  @Prop({ default: 'User' })
  username: string; 

  @Prop({ default: 'dark' })
  theme: string;

  @Prop({ default: 'ko' })
  language: string;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);