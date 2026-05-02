import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { ProfileService } from '../profile/profile.service';
import type { Profile } from '../profile/profile.service';
import { GenerateResumeDto } from './dto/generate-resume.dto';
import { GeneratePortfolioDto } from './dto/generate-portfolio.dto';
import { GenerateCoverLetterDto } from './dto/generate-cover-letter.dto';
import {
  RESUME_SYSTEM_PROMPT,
  COVER_LETTER_SYSTEM_PROMPT,
  PORTFOLIO_SYSTEM_PROMPT,
} from '../llm/prompts/generate-resume.prompt';

@Injectable()
export class ResumeService {
  constructor(
    private readonly llmService: LlmService,
    private readonly profileService: ProfileService,
  ) {}

  async generateResume(dto: GenerateResumeDto): Promise<string> {
    const profile = await this.profileService.getProfileForGeneration();
    const profileContext = this.profileService.buildProfileContext(profile);
    const lang = dto.language === 'en' ? 'English' : '한국어';

    const userPrompt = `다음 프로필과 채용 공고를 바탕으로 맞춤형 이력서를 ${lang}로 작성해주세요.

## 지원자 프로필
${profileContext}

## 채용 공고 (JD)
회사: ${dto.companyName || '미지정'}
직무: ${dto.position}

${dto.jdText}

## 요청사항
- JD의 기술 스택과 내 경험을 최대한 매핑하여 관련성 높은 프로젝트를 강조하되, 전체 프로젝트 목록은 반드시 최신순(시작일 기준 내림차순)으로 정렬
- "기타 및 대외 활동" 등 짧은 이력 섹션은 "프로젝트 경험" 섹션보다 위에 배치
- 성과는 구체적인 수치로 표현 (수치가 없으면 정성적 성과라도 명시)
- 회사가 "${dto.companyName || '해당 회사'}"임을 감안해 문화/가치관에 맞는 톤으로 작성
- 플레이스홀더 절대 미사용`;

    return this.llmService.generateResume(RESUME_SYSTEM_PROMPT, userPrompt);
  }

  async generatePortfolio(dto: GeneratePortfolioDto): Promise<string> {
    const profile = await this.profileService.getProfileForGeneration();
    const profileContext = this.profileService.buildProfileContext(profile);
    const lang = dto.language === 'en' ? 'English' : '한국어';

    const userPrompt = `다음 프로필을 바탕으로 ${lang} 포트폴리오 요약본을 작성해주세요.

## 지원자 프로필
${profileContext}

## 요청사항
- 프로젝트별로 기술 선택 이유와 비즈니스 임팩트를 명시
- 각 프로젝트 마다 핵심 기여 포인트 3개 이내로 요약
- 전체 분량: 마크다운 기준 400줄 이내`;

    return this.llmService.generatePortfolio(
      PORTFOLIO_SYSTEM_PROMPT,
      userPrompt,
    );
  }

  async generateCoverLetter(dto: GenerateCoverLetterDto): Promise<string> {
    const profile = await this.profileService.getProfileForGeneration();
    const profileContext = this.profileService.buildProfileContext(profile);
    const lang = dto.language === 'en' ? 'English' : '한국어';

    const userPrompt = `다음 프로필과 채용 공고를 바탕으로 ${lang} 자기소개서를 작성해주세요.

## 지원자 프로필
${profileContext}

## 채용 공고 (JD)
회사: ${dto.companyName}
직무: ${dto.position}

${dto.jdText}

## 요청사항
- 총 1,000자 이내 (한국어 기준)
- "${dto.companyName}"의 미션/제품과 내 프로젝트 경험을 연결
- 핵심 강점 3가지를 STAR 형식으로 간결하게 기술
- 플레이스홀더 절대 미사용, 프로필에 있는 사실만 기술`;

    return this.llmService.generateCoverLetter(
      COVER_LETTER_SYSTEM_PROMPT,
      userPrompt,
    );
  }
}
