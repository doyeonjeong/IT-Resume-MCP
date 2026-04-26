import { registerAs } from '@nestjs/config';

export default registerAs('llm', () => ({
  provider: process.env.LLM_PROVIDER || 'gemini',
  localLlmProvider: process.env.LOCAL_LLM_PROVIDER || 'ollama',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  googleApiKey: process.env.GOOGLE_API_KEY,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'gemma4:26b',
  huggingFaceBaseUrl:
    process.env.HUGGINGFACE_BASE_URL || 'https://router.huggingface.co/v1',
  huggingFaceModel:
    process.env.HUGGINGFACE_MODEL || 'zai-org/GLM-5.1:preferred',
  huggingFaceApiKey: process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY,
  llmTimeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 120_000,
}));
