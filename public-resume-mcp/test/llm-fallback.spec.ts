import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from '../src/llm/llm.service';
import llmConfig from '../src/config/llm.config';
import { ConfigType } from '@nestjs/config';

describe('LlmService Fallback (e2e)', () => {
  let service: LlmService;

  const mockConfig: ConfigType<typeof llmConfig> = {
    provider: 'claude',
    anthropicApiKey: undefined,
    openaiApiKey: undefined,
    googleApiKey: undefined,
    ollamaBaseUrl: 'http://localhost:11434',
    ollamaModel: 'gemma4:26b',
    llmTimeoutMs: 120000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        {
          provide: llmConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return error message when no API keys are configured', async () => {
    const result = await service.generateText('system', 'user');
    expect(result).toContain('LLM API가 없습니다');
  });

  it('all providers should be null when no keys are set', () => {
    expect((service as any).anthropic).toBeNull();
    expect((service as any).openai).toBeNull();
    expect((service as any).gemini).toBeNull();
  });
});
