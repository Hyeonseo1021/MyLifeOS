import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { TodoModule } from 'src/todo/todo.module';
import { ChatLog, ChatLogSchema } from './chatLog.schema';
import { VectorDoc, VectorDocSchema } from './vectorDoc.schema';

@Module({
  imports: [TodoModule, MongooseModule.forFeature([{ name: ChatLog.name, schema: ChatLogSchema }, { name: VectorDoc.name, schema: VectorDocSchema }]),],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}