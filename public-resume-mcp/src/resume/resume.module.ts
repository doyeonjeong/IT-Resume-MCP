import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { LlmModule } from '../llm/llm.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [LlmModule, ProfileModule],
  controllers: [ResumeController],
  providers: [ResumeService],
})
export class ResumeModule {}
