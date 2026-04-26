import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type {
  LocalChatInput,
  LocalChatOutput,
  LocalLLMClient,
} from './local-llm.client';

interface HuggingFaceRouterClientOptions {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  timeoutMs?: number;
}

export class HuggingFaceRouterClient implements LocalLLMClient {
  private readonly logger = new Logger(HuggingFaceRouterClient.name);
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;

  constructor(options?: HuggingFaceRouterClientOptions) {
    this.baseUrl =
      options?.baseUrl ||
      process.env.HUGGINGFACE_BASE_URL ||
      'https://router.huggingface.co/v1';
    this.model =
      options?.model ||
      process.env.HUGGINGFACE_MODEL ||
      'zai-org/GLM-5.1:preferred';
    this.apiKey =
      options?.apiKey ||
      process.env.HF_TOKEN ||
      process.env.HUGGINGFACE_API_KEY;
    this.timeoutMs =
      options?.timeoutMs || Number(process.env.LLM_TIMEOUT_MS) || 120_000;

    this.logger.log(
      `Hugging Face router client initialized: model=${this.model}, baseUrl=${this.baseUrl}, timeout=${this.timeoutMs}ms`,
    );
  }

  async chat(input: LocalChatInput): Promise<LocalChatOutput> {
    if (!this.apiKey) {
      throw new Error(
        'HUGGINGFACE_AUTH_MISSING: Set HF_TOKEN or HUGGINGFACE_API_KEY before using the Hugging Face backend.',
      );
    }

    const client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseUrl,
      timeout: this.timeoutMs,
    });

    try {
      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          ...(input.system
            ? [{ role: 'system' as const, content: input.system }]
            : []),
          ...input.messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
        ...(input.temperature != null && { temperature: input.temperature }),
        ...(input.maxTokens != null && { max_tokens: input.maxTokens }),
      });

      const content = response.choices[0]?.message?.content;
      const normalizedContent = Array.isArray(content)
        ? content
            .map((item) =>
              typeof item === 'string' ? item : 'text' in item ? item.text : '',
            )
            .join('')
        : content;

      if (!normalizedContent) {
        throw new Error(
          'HUGGINGFACE_EMPTY_RESPONSE: Hugging Face router returned no content.',
        );
      }

      return {
        content: normalizedContent,
        raw: response,
      };
    } catch (error: unknown) {
      const status =
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        typeof error.status === 'number'
          ? error.status
          : undefined;
      const message = error instanceof Error ? error.message : String(error);

      if (status === 401 || status === 403) {
        throw new Error(
          'HUGGINGFACE_AUTH_FAILED: HF_TOKEN does not have access to the selected model/provider.',
        );
      }
      if (status === 404) {
        throw new Error(
          `HUGGINGFACE_MODEL_UNAVAILABLE: ${this.model} is not currently available through the configured Hugging Face endpoint.`,
        );
      }
      if (status === 429) {
        throw new Error(
          'HUGGINGFACE_RATE_LIMITED: Hugging Face rate limit reached. Retry later or switch provider/model.',
        );
      }
      if (
        message.toLowerCase().includes('timeout') ||
        message.toLowerCase().includes('abort')
      ) {
        throw new Error(
          `HUGGINGFACE_TIMEOUT: ${this.timeoutMs}ms exceeded. Try a smaller model or raise LLM_TIMEOUT_MS.`,
        );
      }

      throw new Error(`HUGGINGFACE_REQUEST_FAILED: ${message}`);
    }
  }
}
