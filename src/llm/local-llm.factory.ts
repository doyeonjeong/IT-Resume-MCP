import type { ConfigType } from '@nestjs/config';
import llmConfig from '../config/llm.config';
import type { LocalLLMClient } from './local-llm.client';
import { OllamaClient } from './ollama.client';
import { OpenAICompatibleClient } from './openai-compatible.client';

export type LocalLlmProvider = 'ollama' | 'openai-compatible';

export const LOCAL_LLM_PROVIDERS: ReadonlyArray<LocalLlmProvider> = [
  'ollama',
  'openai-compatible',
];

const PROVIDER_DEFAULTS: Record<
  LocalLlmProvider,
  { baseUrl: string; model: string; apiKey: string }
> = {
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'gemma4:26b',
    apiKey: '',
  },
  'openai-compatible': {
    baseUrl: 'http://localhost:8080/v1',
    model: 'mlx-community/gemma-4-26b-a4b-it-4bit',
    apiKey: 'local',
  },
};

function isLocalLlmProvider(value: string): value is LocalLlmProvider {
  return (LOCAL_LLM_PROVIDERS as readonly string[]).includes(value);
}

export function createLocalLlmClient(
  config: ConfigType<typeof llmConfig>,
): LocalLLMClient {
  const raw = config.localLlmProvider;
  if (!isLocalLlmProvider(raw)) {
    throw new Error(
      `INVALID_LOCAL_LLM_PROVIDER: "${raw}". Set LOCAL_LLM_PROVIDER to one of: ${LOCAL_LLM_PROVIDERS.join(
        ', ',
      )}.`,
    );
  }

  const defaults = PROVIDER_DEFAULTS[raw];
  const baseUrl = config.localLlmBaseUrl ?? defaults.baseUrl;
  const model = config.localLlmModel ?? defaults.model;
  const apiKey = config.localLlmApiKey ?? defaults.apiKey;
  const timeoutMs = config.llmTimeoutMs;

  if (raw === 'ollama') {
    return new OllamaClient({ baseUrl, model, timeoutMs });
  }
  return new OpenAICompatibleClient({ baseUrl, model, apiKey, timeoutMs });
}
