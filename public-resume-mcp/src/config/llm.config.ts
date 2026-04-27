import { registerAs } from '@nestjs/config';

export default registerAs('llm', () => ({
  provider: process.env.LLM_PROVIDER || 'gemini',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  googleApiKey: process.env.GOOGLE_API_KEY,
  // Local LLM (single source of truth — factory applies provider-specific defaults)
  localLlmProvider: (process.env.LOCAL_LLM_PROVIDER || 'ollama').trim(),
  localLlmBaseUrl: process.env.LOCAL_LLM_BASE_URL,
  localLlmModel: process.env.LOCAL_LLM_MODEL,
  localLlmApiKey: process.env.LOCAL_LLM_API_KEY,
  llmTimeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 120_000,
}));
