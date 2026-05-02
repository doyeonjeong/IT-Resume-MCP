import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmModule } from './llm/llm.module';
import { ProfileModule } from './profile/profile.module';
import { ResumeModule } from './resume/resume.module';
import llmConfig from './config/llm.config';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [llmConfig],
      ignoreEnvFile: true,
    }),
    LlmModule,
    ProfileModule,
    ResumeModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
