import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from './llm.service';
import llmConfig from '../config/llm.config';
import { ConfigType } from '@nestjs/config';

const makeConfig = (
  overrides: Partial<ConfigType<typeof llmConfig>> = {},
): ConfigType<typeof llmConfig> => ({
  provider: 'gemini',
  anthropicApiKey: undefined,
  openaiApiKey: undefined,
  googleApiKey: undefined,
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'gemma4:26b',
  llmTimeoutMs: 120000,
  ...overrides,
});

async function buildService(
  config: ConfigType<typeof llmConfig>,
): Promise<LlmService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [LlmService, { provide: llmConfig.KEY, useValue: config }],
  }).compile();
  return module.get<LlmService>(LlmService);
}

describe('LlmService', () => {
  describe('initialization', () => {
    it('initializes Anthropic when ANTHROPIC_API_KEY is set', async () => {
      const svc = await buildService(
        makeConfig({ anthropicApiKey: 'test-anthropic-key' }),
      );
      expect((svc as any).anthropic).not.toBeNull();
    });

    it('initializes OpenAI when OPENAI_API_KEY is set', async () => {
      const svc = await buildService(
        makeConfig({ openaiApiKey: 'test-openai-key' }),
      );
      expect((svc as any).openai).not.toBeNull();
    });

    it('initializes Gemini when GOOGLE_API_KEY is set', async () => {
      const svc = await buildService(
        makeConfig({ googleApiKey: 'test-google-key' }),
      );
      expect((svc as any).gemini).not.toBeNull();
    });

    it('all providers null when no keys configured', async () => {
      const svc = await buildService(makeConfig());
      expect((svc as any).anthropic).toBeNull();
      expect((svc as any).openai).toBeNull();
      expect((svc as any).gemini).toBeNull();
    });
  });

  describe('fallback behavior', () => {
    it('returns error message when no provider is available', async () => {
      const svc = await buildService(makeConfig());
      const result = await svc.generateText('system', 'user');
      expect(result).toContain('LLM API가 없습니다');
    });

    it('falls back to next provider when primary fails', async () => {
      const svc = await buildService(
        makeConfig({
          provider: 'claude',
          anthropicApiKey: 'bad-key',
          googleApiKey: 'also-bad',
        }),
      );

      // Mock callClaude to fail, callGemini to succeed
      (svc as any).callClaude = jest
        .fn()
        .mockRejectedValue(new Error('Claude quota exceeded'));
      (svc as any).callOpenAI = jest
        .fn()
        .mockRejectedValue(new Error('OpenAI not available'));
      (svc as any).callGemini = jest.fn().mockResolvedValue('Gemini response');

      const result = await svc.generateText('system', 'user');
      expect(result).toBe('Gemini response');
      expect((svc as any).callClaude).toHaveBeenCalledTimes(1);
      expect((svc as any).callGemini).toHaveBeenCalledTimes(1);
    });

    it('uses claude first when provider=claude and anthropicApiKey is set', async () => {
      const svc = await buildService(
        makeConfig({
          provider: 'claude',
          anthropicApiKey: 'key',
        }),
      );

      (svc as any).callClaude = jest.fn().mockResolvedValue('Claude OK');
      (svc as any).callOpenAI = jest.fn().mockResolvedValue('OpenAI OK');
      (svc as any).callGemini = jest.fn().mockResolvedValue('Gemini OK');

      const result = await svc.generateText('sys', 'usr');
      expect(result).toBe('Claude OK');
      expect((svc as any).callOpenAI).not.toHaveBeenCalled();
    });

    it('uses openai first when provider=openai and openaiApiKey is set', async () => {
      const svc = await buildService(
        makeConfig({
          provider: 'openai',
          openaiApiKey: 'key',
        }),
      );

      (svc as any).callClaude = jest.fn().mockResolvedValue('Claude OK');
      (svc as any).callOpenAI = jest.fn().mockResolvedValue('OpenAI OK');
      (svc as any).callGemini = jest.fn().mockResolvedValue('Gemini OK');

      const result = await svc.generateText('sys', 'usr');
      expect(result).toBe('OpenAI OK');
      expect((svc as any).callClaude).not.toHaveBeenCalled();
    });
  });

  describe('delegate methods', () => {
    let svc: LlmService;

    beforeEach(async () => {
      svc = await buildService(makeConfig({ googleApiKey: 'key' }));
      (svc as any).generateText = jest.fn().mockResolvedValue('generated');
    });

    it('generateResume delegates to generateText with 4096 tokens', async () => {
      await svc.generateResume('sys', 'usr');
      expect((svc as any).generateText).toHaveBeenCalledWith(
        'sys',
        'usr',
        4096,
      );
    });

    it('generatePortfolio delegates to generateText with 3000 tokens', async () => {
      await svc.generatePortfolio('sys', 'usr');
      expect((svc as any).generateText).toHaveBeenCalledWith(
        'sys',
        'usr',
        3000,
      );
    });

    it('generateCoverLetter delegates to generateText with 2000 tokens', async () => {
      await svc.generateCoverLetter('sys', 'usr');
      expect((svc as any).generateText).toHaveBeenCalledWith(
        'sys',
        'usr',
        2000,
      );
    });
  });
});
