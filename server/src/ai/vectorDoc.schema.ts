import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VectorDocDocument = HydratedDocument<VectorDoc>;

@Schema()
export class VectorDoc {
  @Prop({ required: true })
  content: string;

  @Prop({ type: [Number] }) 
  embedding: number[]; 

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const VectorDocSchema = SchemaFactory.createForClass(VectorDoc);