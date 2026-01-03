import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TodoDocument = HydratedDocument<Todo>;

@Schema({
    timestamps: true
})
export class Todo {
    @Prop({
        required: true
    })
    text: string;

    @Prop({
        default: false
    })
    done: boolean;   
}

export const TodoSchema = SchemaFactory.createForClass(Todo);