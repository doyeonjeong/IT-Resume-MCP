import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type {
  LocalChatInput,
  LocalChatOutput,
  LocalLLMClient,
} from './local-llm.client';

export interface OpenAICompatibleClientOptions {
  baseUrl: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
}

export class OpenAICompatibleClient implements LocalLLMClient {
  private readonly logger = new Logger(OpenAICompatibleClient.name);
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly client: OpenAI;

  constructor(options: OpenAICompatibleClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.model = options.model;
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs;

    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseUrl,
      timeout: this.timeoutMs,
    });

    this.logger.log(
      `OpenAI-compatible client initialized: model=${this.model}, baseUrl=${this.baseUrl}, timeout=${this.timeoutMs}ms`,
    );
  }

  async chat(input: LocalChatInput): Promise<LocalChatOutput> {
    try {
      const response = await this.client.chat.completions.create({
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
          'LOCAL_LLM_EMPTY_RESPONSE: OpenAI-compatible endpoint returned no content.',
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
      const lowerMessage = message.toLowerCase();

      if (status === 401 || status === 403) {
        throw new Error(
          'LOCAL_LLM_AUTH_FAILED: API key does not have access to the configured endpoint or model.',
        );
      }
      if (status === 404) {
        throw new Error(
          `LOCAL_LLM_MODEL_UNAVAILABLE: ${this.model} is not available at ${this.baseUrl}.`,
        );
      }
      if (status === 429) {
        throw new Error(
          'LOCAL_LLM_RATE_LIMITED: Endpoint rate limit reached. Retry later or switch model.',
        );
      }
      if (
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('abort') ||
        status === 408
      ) {
        throw new Error(
          `LOCAL_LLM_TIMEOUT: ${this.timeoutMs}ms exceeded. Try a smaller model or raise LLM_TIMEOUT_MS.`,
        );
      }
      if (
        lowerMessage.includes('fetch') ||
        lowerMessage.includes('econnrefused') ||
        lowerMessage.includes('connect')
      ) {
        throw new Error(
          `LOCAL_LLM_CONNECTION_FAILED: Endpoint ${this.baseUrl} is unreachable. Verify the server is running.`,
        );
      }

      throw new Error(`LOCAL_LLM_REQUEST_FAILED: ${message}`);
    }
  }
}
