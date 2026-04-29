import { z } from 'zod';

export interface AiGenerateParams {
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AiGenerateResult<T> {
  data: T;
  rawResponse: string;
  tokenUsed: number;
  durationMs: number;
}

export interface AiProvider {
  generateStructuredJson<T>(
    params: AiGenerateParams & { schema: z.ZodSchema<T> },
  ): Promise<AiGenerateResult<T>>;

  generateText(params: AiGenerateParams): Promise<AiGenerateResult<string>>;
}
