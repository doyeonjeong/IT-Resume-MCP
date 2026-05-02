import { Controller, Post, Body } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { GenerateResumeDto } from './dto/generate-resume.dto';
import { GeneratePortfolioDto } from './dto/generate-portfolio.dto';
import { GenerateCoverLetterDto } from './dto/generate-cover-letter.dto';
import { JdDto } from './dto/jd.dto';
import { LlmService } from '../llm/llm.service';

@Controller('resume')
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
    private readonly llmService: LlmService,
  ) {}

  @Post('generate')
  async generateResume(@Body() dto: GenerateResumeDto) {
    const markdown = await this.resumeService.generateResume(dto);
    return { markdown };
  }

  @Post('generate-portfolio')
  async generatePortfolio(@Body() dto: GeneratePortfolioDto) {
    const markdown = await this.resumeService.generatePortfolio(dto);
    return { markdown };
  }

  @Post('generate-cover-letter')
  async generateCoverLetter(@Body() dto: GenerateCoverLetterDto) {
    const markdown = await this.resumeService.generateCoverLetter(dto);
    return { markdown };
  }

  @Post('analyze-jd')
  async analyzeJd(@Body() jdDto: JdDto) {
    const prompt = `다음 채용 공고(JD)를 분석하고 주요 요구 역량, 기술 스택, 우대 사항을 요약해 주세요.\n\n---\n${jdDto.jdText}\n---\n\n분석 결과:`;
    return this.llmService.generateText('당신은 JD 분석 전문가입니다.', prompt);
  }
}
