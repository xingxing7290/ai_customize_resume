import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAiProvider } from './providers/openai.provider';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ParseJobSchema,
  GenerateResumeSchema,
} from './schemas';
import {
  PARSE_JOB_SYSTEM_PROMPT,
  buildParseJobUserPrompt,
  GENERATE_RESUME_SYSTEM_PROMPT,
  buildGenerateResumeUserPrompt,
} from './prompts';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private openAiProvider: OpenAiProvider,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async parseJobDescription(
    userId: string,
    jdText: string,
    jobTargetId: string,
  ) {
    const taskLog = await this.createTaskLog(
      userId,
      'PARSE_JOB',
      jobTargetId,
      'JobTarget',
      { jdText: jdText.substring(0, 1000) },
    );

    try {
      const result = await this.openAiProvider.generateStructuredJson({
        systemPrompt: PARSE_JOB_SYSTEM_PROMPT,
        userPrompt: buildParseJobUserPrompt(jdText),
        schema: ParseJobSchema,
        temperature: 0.2,
      });

      await this.updateTaskLogSuccess(taskLog.id, result);
      return result.data;
    } catch (error) {
      await this.updateTaskLogFailed(taskLog.id, error);
      throw error;
    }
  }

  async generateTailoredResume(
    userId: string,
    profileData: any,
    jobData: any,
    resumeVersionId: string,
  ) {
    const taskLog = await this.createTaskLog(
      userId,
      'GENERATE_RESUME',
      resumeVersionId,
      'ResumeVersion',
      { profileId: profileData.id, jobTitle: jobData.jobTitle },
    );

    try {
      const result = await this.openAiProvider.generateStructuredJson({
        systemPrompt: GENERATE_RESUME_SYSTEM_PROMPT,
        userPrompt: buildGenerateResumeUserPrompt(profileData, jobData),
        schema: GenerateResumeSchema,
        temperature: 0.3,
      });

      await this.updateTaskLogSuccess(taskLog.id, result);
      return result.data;
    } catch (error) {
      await this.updateTaskLogFailed(taskLog.id, error);
      throw error;
    }
  }

  private async createTaskLog(
    userId: string,
    taskType: string,
    relatedEntityId: string,
    relatedEntityType: string,
    requestPayload: any,
  ) {
    return this.prisma.aITaskLog.create({
      data: {
        userId,
        taskType: taskType as any,
        status: 'PROCESSING',
        requestPayload,
        relatedEntityId,
        relatedEntityType,
      },
    });
  }

  private async updateTaskLogSuccess(
    logId: string,
    result: { data: any; tokenUsed: number; durationMs: number },
  ) {
    return this.prisma.aITaskLog.update({
      where: { id: logId },
      data: {
        status: 'SUCCESS',
        responsePayload: result.data,
        tokenUsed: result.tokenUsed,
        durationMs: result.durationMs,
      },
    });
  }

  private async updateTaskLogFailed(logId: string, error: any) {
    return this.prisma.aITaskLog.update({
      where: { id: logId },
      data: {
        status: 'FAILED',
        errorMessage: error.message || String(error),
      },
    });
  }
}
