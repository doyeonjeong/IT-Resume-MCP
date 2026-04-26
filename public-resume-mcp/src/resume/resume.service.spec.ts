import { Test, TestingModule } from '@nestjs/testing';
import { ResumeService } from './resume.service';
import { LlmService } from '../llm/llm.service';
import { ProfileService } from '../profile/profile.service';
import { GenerateResumeDto } from './dto/generate-resume.dto';
import { GenerateCoverLetterDto } from './dto/generate-cover-letter.dto';
import { GeneratePortfolioDto } from './dto/generate-portfolio.dto';

const MOCK_PROFILE = {
  name: '정도연',
  title: '모바일/풀스택 개발자',
  summary: 'iOS와 NestJS 기반의 백엔드 개발 경험이 있는 개발자',
  skills: [
    'Swift',
    'NestJS',
    'TypeScript',
    'React',
    'Claude API',
    'MCP Protocol',
  ],
  projects: [
    {
      title: 'Resume MCP',
      description: 'JD 분석 후 이력서를 자동 생성하는 로컬 MCP 서버',
      techStack: ['NestJS', 'TypeScript', 'MCP SDK', 'Claude API'],
      achievements: '이력서 작성 시간 80% 단축',
      role: '솔로 개발',
    },
    {
      title: 'dyotube-studio',
      description: 'YouTube 콘텐츠 관리 도구',
      techStack: ['Electron', 'React', 'TypeScript'],
      achievements: '영상 메타데이터 일괄 편집 기능 구현',
      role: '솔로 개발',
    },
  ],
};

const JD_MOBILE = `
[스텝에이아이 iOS 개발자 채용]
- Swift, SwiftUI 능숙자
- AI 기능 연동 경험 우대
- 1인 개발 경험 보유자 우대
`;

const JD_FULLSTACK = `
[풀스택 개발자 채용]
- NestJS, TypeScript 기반 백엔드 개발
- React 프론트엔드 경험
- AI/LLM 연동 경험 우대
`;

const JD_AI_AGENT = `
[AI 에이전틱 개발자 채용]
- LLM API 연동 경험 (Claude, GPT 등)
- MCP, Tool Use 경험 우대
- 에이전트 파이프라인 설계 경험
`;

describe('ResumeService', () => {
  let service: ResumeService;
  let llmService: jest.Mocked<LlmService>;
  let profileService: jest.Mocked<ProfileService>;
  let generateResumeMock: jest.Mock;
  let generatePortfolioMock: jest.Mock;
  let generateCoverLetterMock: jest.Mock;
  let getProfileForGenerationMock: jest.Mock;

  beforeEach(async () => {
    const mockLlm = {
      generateResume: jest
        .fn()
        .mockResolvedValue('# 이력서 결과\n\n## 프로젝트'),
      generatePortfolio: jest
        .fn()
        .mockResolvedValue('# 포트폴리오\n\n## 프로젝트'),
      generateCoverLetter: jest
        .fn()
        .mockResolvedValue('# 자기소개서\n\n안녕하세요'),
    };
    const mockProfile = {
      getProfileForGeneration: jest.fn().mockResolvedValue(MOCK_PROFILE),
      buildProfileContext: jest.fn().mockImplementation(
        (profile) => `이름: ${profile.name}
직무: ${profile.title}
자기소개: ${profile.summary}
보유 기술: ${profile.skills.join(', ')}

프로젝트 경험:
${profile.projects
  .map(
    (project) => `### ${project.title}
- 설명: ${project.description}
- 기술 스택: ${project.techStack.join(', ')}`,
  )
  .join('\n\n')}`,
      ),
    };
    generateResumeMock = mockLlm.generateResume;
    generatePortfolioMock = mockLlm.generatePortfolio;
    generateCoverLetterMock = mockLlm.generateCoverLetter;
    getProfileForGenerationMock = mockProfile.getProfileForGeneration;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeService,
        { provide: LlmService, useValue: mockLlm },
        { provide: ProfileService, useValue: mockProfile },
      ],
    }).compile();

    service = module.get<ResumeService>(ResumeService);
    llmService = module.get(LlmService);
    profileService = module.get(ProfileService);
  });

  describe('generateResume', () => {
    it('reads profile before generating', async () => {
      const dto: GenerateResumeDto = {
        jdText: JD_MOBILE,
        position: 'iOS 개발자',
        language: 'ko',
      };
      await service.generateResume(dto);
      expect(getProfileForGenerationMock).toHaveBeenCalledTimes(1);
    });

    it('passes system prompt and user prompt to LlmService', async () => {
      const dto: GenerateResumeDto = {
        jdText: JD_MOBILE,
        position: 'iOS 개발자',
        language: 'ko',
      };
      await service.generateResume(dto);
      expect(generateResumeMock).toHaveBeenCalledWith(
        expect.stringContaining('이력서 작성 전문가'),
        expect.stringContaining('채용 공고'),
      );
    });

    it('includes JD content in user prompt', async () => {
      const dto: GenerateResumeDto = {
        jdText: JD_MOBILE,
        position: 'iOS 개발자',
        language: 'ko',
      };
      await service.generateResume(dto);
      const [, userPrompt] = generateResumeMock.mock.calls[0];
      expect(userPrompt).toContain('iOS 개발자');
      expect(userPrompt).toContain('스텝에이아이');
    });

    it('includes profile name in user prompt', async () => {
      const dto: GenerateResumeDto = {
        jdText: JD_MOBILE,
        position: 'iOS 개발자',
        language: 'ko',
      };
      await service.generateResume(dto);
      const [, userPrompt] = generateResumeMock.mock.calls[0];
      expect(userPrompt).toContain('정도연');
    });

    it('includes company name when provided', async () => {
      const dto: GenerateResumeDto = {
        jdText: JD_AI_AGENT,
        position: 'AI 에이전틱 개발자',
        companyName: '스텝에이아이',
        language: 'ko',
      };
      await service.generateResume(dto);
      const [, userPrompt] = generateResumeMock.mock.calls[0];
      expect(userPrompt).toContain('스텝에이아이');
    });

    it('includes all profile skills in context', async () => {
      const dto: GenerateResumeDto = {
        jdText: JD_FULLSTACK,
        position: '풀스택 개발자',
        language: 'ko',
      };
      await service.generateResume(dto);
      const [, userPrompt] = generateResumeMock.mock.calls[0];
      expect(userPrompt).toContain('NestJS');
      expect(userPrompt).toContain('TypeScript');
      expect(userPrompt).toContain('MCP Protocol');
    });

    it('returns the generated resume string', async () => {
      const dto: GenerateResumeDto = {
        jdText: JD_MOBILE,
        position: 'iOS 개발자',
        language: 'ko',
      };
      const result = await service.generateResume(dto);
      expect(result).toContain('이력서 결과');
    });

    it('works with English language parameter', async () => {
      const dto: GenerateResumeDto = {
        jdText: JD_MOBILE,
        position: 'iOS Developer',
        language: 'en',
      };
      await service.generateResume(dto);
      const [, userPrompt] = generateResumeMock.mock.calls[0];
      expect(userPrompt).toContain('English');
    });
  });

  describe('generateCoverLetter', () => {
    it('passes cover letter system prompt', async () => {
      const dto: GenerateCoverLetterDto = {
        jdText: JD_AI_AGENT,
        position: 'AI 에이전틱 개발자',
        companyName: '스텝에이아이',
        language: 'ko',
      };
      await service.generateCoverLetter(dto);
      expect(generateCoverLetterMock).toHaveBeenCalledWith(
        expect.stringContaining('자기소개서 작성 전문가'),
        expect.stringContaining('스텝에이아이'),
      );
    });

    it('includes 1000 character limit instruction', async () => {
      const dto: GenerateCoverLetterDto = {
        jdText: JD_AI_AGENT,
        position: 'AI 에이전틱 개발자',
        companyName: '스텝에이아이',
        language: 'ko',
      };
      await service.generateCoverLetter(dto);
      const [, userPrompt] = generateCoverLetterMock.mock.calls[0];
      expect(userPrompt).toContain('1,000자');
    });

    it('includes STAR format instruction', async () => {
      const dto: GenerateCoverLetterDto = {
        jdText: JD_AI_AGENT,
        position: 'AI 에이전틱 개발자',
        companyName: '스텝에이아이',
        language: 'ko',
      };
      await service.generateCoverLetter(dto);
      const [, userPrompt] = generateCoverLetterMock.mock.calls[0];
      expect(userPrompt).toContain('STAR');
    });
  });

  describe('generatePortfolio', () => {
    it('generates portfolio without JD', async () => {
      const dto: GeneratePortfolioDto = { language: 'ko' };
      await service.generatePortfolio(dto);
      expect(generatePortfolioMock).toHaveBeenCalledWith(
        expect.stringContaining('포트폴리오 작성 전문가'),
        expect.any(String),
      );
    });

    it('includes all projects in user prompt', async () => {
      const dto: GeneratePortfolioDto = { language: 'ko' };
      await service.generatePortfolio(dto);
      const [, userPrompt] = generatePortfolioMock.mock.calls[0];
      expect(userPrompt).toContain('Resume MCP');
      expect(userPrompt).toContain('dyotube-studio');
    });
  });

  describe('prompt quality criteria', () => {
    it('STAR format mention in resume system prompt', async () => {
      const dto: GenerateResumeDto = {
        jdText: JD_AI_AGENT,
        position: 'AI 개발자',
        language: 'ko',
      };
      await service.generateResume(dto);
      const [systemPrompt] = generateResumeMock.mock.calls[0];
      expect(systemPrompt).toContain('STAR');
    });

    it('no-placeholder instruction in resume system prompt', async () => {
      const dto: GenerateResumeDto = {
        jdText: JD_AI_AGENT,
        position: 'AI 개발자',
        language: 'ko',
      };
      await service.generateResume(dto);
      const [, userPrompt] = generateResumeMock.mock.calls[0];
      expect(userPrompt).toContain('플레이스홀더 절대 미사용');
    });

    it('JD keyword mapping instruction in resume system prompt', async () => {
      const dto: GenerateResumeDto = {
        jdText: JD_AI_AGENT,
        position: 'AI 개발자',
        language: 'ko',
      };
      await service.generateResume(dto);
      const [systemPrompt] = generateResumeMock.mock.calls[0];
      expect(systemPrompt).toContain('JD');
    });
  });
});
