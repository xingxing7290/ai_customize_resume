import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAiProvider } from './providers/openai.provider';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ParseJobSchema,
  GenerateResumeSchema,
  ValidateResumeSchema,
} from './schemas';
import {
  PARSE_JOB_SYSTEM_PROMPT,
  buildParseJobUserPrompt,
  GENERATE_RESUME_SYSTEM_PROMPT,
  buildGenerateResumeUserPrompt,
  VALIDATE_RESUME_SYSTEM_PROMPT,
  buildValidateResumeUserPrompt,
} from './prompts';
import { checkConsistency, extractProfileForCheck } from './utils';

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
    runtimeConfig?: { apiKey?: string; baseUrl?: string; model?: string },
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
        apiKey: runtimeConfig?.apiKey,
        baseUrl: runtimeConfig?.baseUrl,
        model: runtimeConfig?.model,
      });

      await this.updateTaskLogSuccess(taskLog.id, result);
      return result.data;
    } catch (error) {
      const fallback = this.buildFallbackJobParse(jdText);
      await this.updateTaskLogSuccess(taskLog.id, {
        data: {
          ...fallback,
          fallbackReason: error.message || String(error),
        },
        tokenUsed: 0,
        durationMs: 0,
      });
      return fallback;
    }
  }

  async generateTailoredResume(
    userId: string,
    profileData: any,
    jobData: any,
    resumeVersionId: string,
    runtimeConfig?: { apiKey?: string; baseUrl?: string; model?: string },
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
        maxTokens: 8192,
        apiKey: runtimeConfig?.apiKey,
        baseUrl: runtimeConfig?.baseUrl,
        model: runtimeConfig?.model,
      });

      await this.updateTaskLogSuccess(taskLog.id, result);
      return result.data;
    } catch (error) {
      const fallback = this.buildFallbackResume(profileData, jobData);
      await this.updateTaskLogSuccess(taskLog.id, {
        data: {
          ...fallback,
          fallbackReason: error.message || String(error),
        },
        tokenUsed: 0,
        durationMs: 0,
      });
      return fallback;
    }
  }

  private buildFallbackJobParse(jdText: string) {
    const lines = jdText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const namedTitle = lines.find((line) => /^岗位名称[:：]/.test(line));
    const firstLine = (namedTitle?.replace(/^岗位名称[:：]\s*/, '') || lines[0] || '未命名岗位').trim();
    const techKeywords = [
      'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue', 'Node.js',
      'NestJS', 'Java', 'Spring', 'Python', 'Go', 'MySQL', 'PostgreSQL',
      'Redis', 'Docker', 'Kubernetes', 'AWS', 'Linux', 'Git',
    ];
    const matchedTech = techKeywords.filter((keyword) =>
      jdText.toLowerCase().includes(keyword.toLowerCase()),
    );

    return {
      jobTitle: firstLine.slice(0, 80),
      companyName: undefined,
      location: undefined,
      salary: this.matchFirst(jdText, [/薪资待遇[:：]\s*([^\n]+)/, /(\d+(?:\.\d+)?\s*[-~至]\s*\d+(?:\.\d+)?\s*(?:万|K)(?:·\d+薪)?)/]),
      responsibilities: lines.slice(0, 6),
      requirements: lines.slice(0, 8),
      preferredQualifications: [],
      keywords: matchedTech,
      techStack: matchedTech,
      experienceRequirement: this.matchFirst(jdText, [/工作经验要求[:：]\s*([^\n]+)/, /(\d+\s*-\s*\d+\s*年|\d+年以上|经验不限|应届(?:生|毕业生)?)/]),
      educationRequirement: this.matchFirst(jdText, [/学历要求[:：]\s*([^\n]+)/, /(博士|硕士|本科|大专|中专|高中|学历不限)/]),
      benefits: [],
      category: matchedTech.length > 0 ? '技术岗位' : '通用岗位',
    };
  }

  private matchFirst(text: string, patterns: RegExp[]) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    return undefined;
  }

  private buildFallbackResume(profileData: any, jobData: any) {
    const skills = (profileData.skillRecords || []).map((skill: any) => skill.name);
    const workExperiences = (profileData.workExperiences || []).map((work: any) => ({
      company: work.company,
      title: work.title,
      startDate: work.startDate,
      endDate: work.endDate,
      description: work.description,
      highlights: this.splitListText(work.highlights),
    }));
    const projectExperiences = (profileData.projectExperiences || []).map((project: any) => ({
      name: project.name,
      role: project.role,
      description: project.description,
      highlights: this.splitListText(project.highlights),
      techStack: this.splitListText(project.techStack),
    }));

    return {
      summary: profileData.summary || profileData.selfEvaluation || `面向${jobData.jobTitle || '目标岗位'}的定制简历。`,
      skills,
      workExperiences,
      projectExperiences,
      certificates: (profileData.certificateRecords || []).map((cert: any) => cert.name),
      selfEvaluation: profileData.selfEvaluation || profileData.summary,
      optimizationNotes: ['当前使用本地降级生成：仅基于用户已填写资料重组内容，未虚构经历。'],
      gapAnalysis: jobData.techStack ? [`请确认简历中是否覆盖岗位技术关键词：${jobData.techStack}`] : [],
    };
  }

  private splitListText(value?: string | null): string[] {
    if (!value) return [];
    return value
      .split(/\r?\n|,|，|;|；/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async validateGeneratedResume(
    userId: string,
    profileData: any,
    generatedResume: any,
    jobData: any,
    resumeVersionId: string,
  ) {
    const taskLog = await this.createTaskLog(
      userId,
      'VALIDATE_RESUME',
      resumeVersionId,
      'ResumeVersion',
      { profileId: profileData.id },
    );

    try {
      // 1. 先进行程序化一致性检查
      const sourceProfile = extractProfileForCheck(profileData);
      const programmaticCheck = checkConsistency(sourceProfile, {
        skills: generatedResume.skills,
        workExperiences: generatedResume.workExperiences,
        projectExperiences: generatedResume.projectExperiences,
        certificates: generatedResume.certificates,
      });

      // 2. 再进行 AI 辅助检查
      const aiResult = await this.openAiProvider.generateStructuredJson({
        systemPrompt: VALIDATE_RESUME_SYSTEM_PROMPT,
        userPrompt: buildValidateResumeUserPrompt(
          {
            skills: sourceProfile.skills,
            projects: sourceProfile.projects,
            works: sourceProfile.workExperiences,
            certificates: sourceProfile.certificates,
          },
          generatedResume,
          jobData,
        ),
        schema: ValidateResumeSchema,
        temperature: 0.1,
      });

      // 3. 合并结果
      const finalResult = {
        isConsistent: programmaticCheck.isConsistent && aiResult.data.isConsistent,
        issues: [...programmaticCheck.issues, ...aiResult.data.issues],
        missingKeywords: aiResult.data.missingKeywords,
        possibleFabrications: [
          ...programmaticCheck.possibleFabrications,
          ...aiResult.data.possibleFabrications,
        ],
        suggestions: aiResult.data.suggestions,
        warnings: programmaticCheck.warnings,
      };

      await this.updateTaskLogSuccess(taskLog.id, { data: finalResult, tokenUsed: aiResult.tokenUsed, durationMs: aiResult.durationMs });
      return finalResult;
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
        requestPayload: JSON.stringify(requestPayload),
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
        responsePayload: JSON.stringify(result.data),
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
