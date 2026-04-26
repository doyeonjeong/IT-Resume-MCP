import { HuggingFaceRouterClient } from './huggingface.client';
import type { LocalLLMClient } from './local-llm.client';
import { OllamaClient } from './ollama.client';

export type LocalLlmProvider = 'ollama' | 'huggingface';

export function createLocalLlmClient(
  provider = (process.env.LOCAL_LLM_PROVIDER || 'ollama') as LocalLlmProvider,
): LocalLLMClient {
  if (provider === 'huggingface') {
    return new HuggingFaceRouterClient();
  }

  return new OllamaClient();
}
