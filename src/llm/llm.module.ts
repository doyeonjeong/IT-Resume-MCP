import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmService } from './llm.service';
import llmConfig from '../config/llm.config';

@Module({
  imports: [ConfigModule.forFeature(llmConfig)],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
