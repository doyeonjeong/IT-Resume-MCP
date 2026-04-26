import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmModule } from './llm/llm.module';
import { ProfileModule } from './profile/profile.module';
import { ResumeModule } from './resume/resume.module';
import llmConfig from './config/llm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [llmConfig],
    }),
    LlmModule,
    ProfileModule,
    ResumeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
