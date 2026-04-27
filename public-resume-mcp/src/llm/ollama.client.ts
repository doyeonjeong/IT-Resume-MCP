import { Logger } from '@nestjs/common';
import type {
  LocalLLMClient,
  LocalChatInput,
  LocalChatOutput,
} from './local-llm.client';

export interface OllamaClientOptions {
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

interface OllamaChatResponse {
  message?: {
    role: string;
    content: string;
  };
  done?: boolean;
}

export class OllamaClient implements LocalLLMClient {
  private readonly logger = new Logger(OllamaClient.name);
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(options: OllamaClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.model = options.model;
    this.timeoutMs = options.timeoutMs;

    this.logger.log(
      `Ollama client initialized: model=${this.model}, baseUrl=${this.baseUrl}, timeout=${this.timeoutMs}ms`,
    );
  }

  async chat(input: LocalChatInput): Promise<LocalChatOutput> {
    const messages: Array<{ role: string; content: string }> = [];

    if (input.system) {
      messages.push({ role: 'system', content: input.system });
    }
    for (const msg of input.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const body = {
      model: this.model,
      messages,
      stream: false,
      options: {
        ...(input.temperature != null && {
          temperature: input.temperature,
        }),
        ...(input.maxTokens != null && {
          num_predict: input.maxTokens,
        }),
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(
          `OLLAMA_HTTP_ERROR: ${response.status} ${response.statusText} - ${text}`,
        );
      }

      const data = (await response.json()) as OllamaChatResponse;

      if (!data.message?.content) {
        throw new Error('OLLAMA_EMPTY_RESPONSE: Ollama returned no content');
      }

      return {
        content: data.message.content,
        raw: data,
      };
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(
          `OLLAMA_TIMEOUT: ${this.timeoutMs}ms exceeded. Check model size or LLM_TIMEOUT_MS.`,
        );
      }
      if (
        err instanceof TypeError &&
        (err.message.includes('fetch') || err.message.includes('ECONNREFUSED'))
      ) {
        throw new Error(
          `OLLAMA_CONNECTION_FAILED: Ollama server (${this.baseUrl}) is unreachable. Try 'ollama serve'.`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
