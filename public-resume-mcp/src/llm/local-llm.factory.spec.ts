import { HuggingFaceRouterClient } from './huggingface.client';
import { createLocalLlmClient } from './local-llm.factory';
import { OllamaClient } from './ollama.client';

describe('createLocalLlmClient', () => {
  it('creates Ollama client by default', () => {
    const client = createLocalLlmClient('ollama');
    expect(client).toBeInstanceOf(OllamaClient);
  });

  it('creates Hugging Face router client when requested', () => {
    const client = createLocalLlmClient('huggingface');
    expect(client).toBeInstanceOf(HuggingFaceRouterClient);
  });
});
