export interface LocalChatInput {
  system?: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
}

export interface LocalChatOutput {
  content: string;
  raw?: unknown;
}

export interface LocalLLMClient {
  chat(input: LocalChatInput): Promise<LocalChatOutput>;
}
