import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { z } from 'zod';
import { AiProvider, AiGenerateParams, AiGenerateResult } from './ai.provider.interface';

@Injectable()
export class OpenAiProvider implements AiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);
  private client?: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.openaiApiKey');
    if (apiKey) {
      this.client = new OpenAI({ apiKey, timeout: 120000 });
    }
  }

  async generateStructuredJson<T>(
    params: AiGenerateParams & { schema: z.ZodSchema<T> },
  ): Promise<AiGenerateResult<T>> {
    const client = this.getClient(params);
    if (!client) {
      throw new Error('OpenAI API key not configured');
    }

    const startTime = Date.now();
    const model = params.model || this.configService.get<string>('ai.model') || 'gpt-4o';

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt },
        ],
        temperature: params.temperature ?? 0.3,
        max_tokens: params.maxTokens ?? 4096,
        response_format: { type: 'json_object' },
      });

      const rawResponse = response.choices[0].message.content || '';
      const parsed = JSON.parse(rawResponse);
      const data = params.schema.parse(parsed);

      return {
        data,
        rawResponse,
        tokenUsed: response.usage?.total_tokens || 0,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`OpenAI API error: ${error.message}`);
      throw error;
    }
  }

  async generateText(params: AiGenerateParams): Promise<AiGenerateResult<string>> {
    const client = this.getClient(params);
    if (!client) {
      throw new Error('OpenAI API key not configured');
    }

    const startTime = Date.now();
    const model = params.model || this.configService.get<string>('ai.model') || 'gpt-4o';

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt },
        ],
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2048,
      });

      const data = response.choices[0].message.content || '';

      return {
        data,
        rawResponse: data,
        tokenUsed: response.usage?.total_tokens || 0,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`OpenAI API error: ${error.message}`);
      throw error;
    }
  }

  private getClient(params: AiGenerateParams) {
    if (params.apiKey) {
      return new OpenAI({
        apiKey: params.apiKey,
        baseURL: params.baseUrl || 'https://api.deepseek.com',
        timeout: 120000,
      });
    }
    return this.client;
  }
}
