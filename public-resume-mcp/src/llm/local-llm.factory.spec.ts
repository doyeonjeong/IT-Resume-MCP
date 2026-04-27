import type { ConfigType } from '@nestjs/config';
import llmConfig from '../config/llm.config';
import {
  createLocalLlmClient,
  LOCAL_LLM_PROVIDERS,
} from './local-llm.factory';
import { OllamaClient } from './ollama.client';
import { OpenAICompatibleClient } from './openai-compatible.client';

type LlmConfig = ConfigType<typeof llmConfig>;

const baseConfig: LlmConfig = {
  provider: 'gemini',
  anthropicApiKey: undefined,
  openaiApiKey: undefined,
  googleApiKey: undefined,
  localLlmProvider: 'ollama',
  localLlmBaseUrl: undefined,
  localLlmModel: undefined,
  localLlmApiKey: undefined,
  llmTimeoutMs: 120_000,
};

describe('createLocalLlmClient', () => {
  it('creates Ollama client when provider=ollama', () => {
    const client = createLocalLlmClient({ ...baseConfig, localLlmProvider: 'ollama' });
    expect(client).toBeInstanceOf(OllamaClient);
  });

  it('creates OpenAI-compatible client when provider=openai-compatible', () => {
    const client = createLocalLlmClient({
      ...baseConfig,
      localLlmProvider: 'openai-compatible',
    });
    expect(client).toBeInstanceOf(OpenAICompatibleClient);
  });

  it('defaults to ollama when no provider specified', () => {
    const client = createLocalLlmClient({ ...baseConfig, localLlmProvider: 'ollama' });
    expect(client).toBeInstanceOf(OllamaClient);
  });

  it('throws on unknown provider value', () => {
    expect(() =>
      createLocalLlmClient({ ...baseConfig, localLlmProvider: 'mlx' }),
    ).toThrow(/INVALID_LOCAL_LLM_PROVIDER/);
  });

  it('throws on typo in provider value', () => {
    expect(() =>
      createLocalLlmClient({ ...baseConfig, localLlmProvider: 'ollma' }),
    ).toThrow(/INVALID_LOCAL_LLM_PROVIDER/);
  });

  it('error message lists all valid providers', () => {
    try {
      createLocalLlmClient({ ...baseConfig, localLlmProvider: 'bogus' });
      fail('expected throw');
    } catch (err) {
      const msg = (err as Error).message;
      for (const p of LOCAL_LLM_PROVIDERS) {
        expect(msg).toContain(p);
      }
    }
  });

  it('uses provider-specific defaults when env values are unset', () => {
    expect(() =>
      createLocalLlmClient({ ...baseConfig, localLlmProvider: 'ollama' }),
    ).not.toThrow();
    expect(() =>
      createLocalLlmClient({ ...baseConfig, localLlmProvider: 'openai-compatible' }),
    ).not.toThrow();
  });
});
