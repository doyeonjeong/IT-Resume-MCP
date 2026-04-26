import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import llmConfig from '../config/llm.config';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;
  private gemini: GoogleGenAI | null = null;

  constructor(
    @Inject(llmConfig.KEY)
    private config: ConfigType<typeof llmConfig>,
  ) {
    this.initProviders();
  }

  private initProviders() {
    if (this.config.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: this.config.anthropicApiKey });
      this.logger.log('Claude (Anthropic) provider initialized');
    }
    if (this.config.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: this.config.openaiApiKey });
      this.logger.log('OpenAI provider initialized');
    }
    if (this.config.googleApiKey) {
      this.gemini = new GoogleGenAI({ apiKey: this.config.googleApiKey });
      this.logger.log('Gemini provider initialized');
    }
    if (!this.anthropic && !this.openai && !this.gemini) {
      this.logger.error(
        'No LLM API key found. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY in .env',
      );
    }
  }

  async generateText(
    systemPrompt: string,
    userPrompt: string,
    maxTokens = 4096,
  ): Promise<string> {
    // Fallback order: Claude → OpenAI → Gemini (per provider env config)
    const preferred = this.config.provider;

    const orderedProviders: Array<() => Promise<string>> = [];

    const tryWithClaude = () =>
      this.callClaude(systemPrompt, userPrompt, maxTokens);
    const tryWithOpenAI = () =>
      this.callOpenAI(systemPrompt, userPrompt, maxTokens);
    const tryWithGemini = () =>
      this.callGemini(systemPrompt, userPrompt, maxTokens);

    if (preferred === 'claude' && this.anthropic) {
      orderedProviders.push(tryWithClaude, tryWithOpenAI, tryWithGemini);
    } else if (preferred === 'openai' && this.openai) {
      orderedProviders.push(tryWithOpenAI, tryWithClaude, tryWithGemini);
    } else {
      // default: gemini first if set, else claude, else openai
      orderedProviders.push(tryWithGemini, tryWithClaude, tryWithOpenAI);
    }

    for (const tryProvider of orderedProviders) {
      try {
        const result = await tryProvider();
        if (result) return result;
      } catch (err) {
        this.logger.warn(
          `Provider failed, trying next: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    return '[오류] 사용 가능한 LLM API가 없습니다. .env 파일에서 ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY 중 하나 이상을 설정해주세요.';
  }

  private async callClaude(
    system: string,
    user: string,
    maxTokens: number,
  ): Promise<string> {
    if (!this.anthropic) throw new Error('Anthropic not initialized');
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    });
    const block = response.content[0];
    if (block.type !== 'text')
      throw new Error('Unexpected response type from Claude');
    return block.text;
  }

  private async callOpenAI(
    system: string,
    user: string,
    maxTokens: number,
  ): Promise<string> {
    if (!this.openai) throw new Error('OpenAI not initialized');
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    return completion.choices[0].message.content ?? '';
  }

  private async callGemini(
    system: string,
    user: string,
    maxTokens: number,
  ): Promise<string> {
    if (!this.gemini) throw new Error('Gemini not initialized');
    const response = await this.gemini.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: `${system}\n\n${user}` }] }],
      config: { maxOutputTokens: maxTokens },
    });
    return response.text ?? '';
  }

  async generateResume(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    return this.generateText(systemPrompt, userPrompt, 4096);
  }

  async generatePortfolio(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    return this.generateText(systemPrompt, userPrompt, 3000);
  }

  async generateCoverLetter(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    return this.generateText(systemPrompt, userPrompt, 2000);
  }
}
