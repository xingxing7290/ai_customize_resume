import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobTargetDto, UpdateJobTargetDto } from './dto';
import { AiService } from '../ai/ai.service';
import { FileLoggerService } from '../../common/logger/file-logger.service';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private fileLogger: FileLoggerService,
  ) {}

  async create(userId: string, dto: CreateJobTargetDto) {
    const jdText = await this.resolveJdText(userId, dto.sourceUrl, dto.rawJdText);
    const job = await this.prisma.jobTarget.create({
      data: {
        userId,
        ...dto,
        rawJdText: jdText,
        status: jdText ? 'PARSING' : 'INIT',
      },
    });
    this.fileLogger.operation('job_created', {
      userId,
      jobTargetId: job.id,
      hasSourceUrl: Boolean(dto.sourceUrl),
      hasJdText: Boolean(jdText),
    });

    if (!jdText?.trim()) {
      return job;
    }

    return this.parseAndUpdate(userId, job.id, jdText);
  }

  async findAll(userId: string) {
    return this.prisma.jobTarget.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const job = await this.prisma.jobTarget.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Job target not found');
    }

    if (job.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return job;
  }

  async update(userId: string, id: string, dto: UpdateJobTargetDto) {
    await this.findOne(userId, id);

    return this.prisma.jobTarget.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.jobTarget.delete({
      where: { id },
    });
  }

  async reparse(userId: string, id: string) {
    const job = await this.findOne(userId, id);
    const jdText = await this.resolveJdText(userId, job.sourceUrl, job.rawJdText);

    if (!jdText?.trim()) {
      return this.prisma.jobTarget.update({
        where: { id },
        data: {
          status: 'PARSE_FAILED',
          parseError: 'No job description text or readable URL content was provided.',
        },
      });
    }

    await this.prisma.jobTarget.update({
      where: { id },
      data: {
        rawJdText: jdText,
        status: 'PARSING',
        parseError: null,
      },
    });

    return this.parseAndUpdate(userId, id, jdText);
  }

  private async parseAndUpdate(userId: string, jobTargetId: string, jdText: string) {
    try {
      const parsed = await this.aiService.parseJobDescription(userId, jdText, jobTargetId);

      const updated = await this.prisma.jobTarget.update({
        where: { id: jobTargetId },
        data: {
          status: 'PARSE_SUCCESS',
          parsedJobTitle: parsed.jobTitle,
          parsedCompanyName: parsed.companyName,
          parsedLocation: parsed.location,
          parsedResponsibilities: JSON.stringify(parsed.responsibilities || []),
          parsedRequirements: JSON.stringify(parsed.requirements || []),
          parsedTechStack: JSON.stringify(parsed.techStack || []),
          parseError: null,
        },
      });
      this.fileLogger.operation('job_parsed', { userId, jobTargetId, status: updated.status });
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.fileLogger.error(message, stack, 'JobsService');
      return this.prisma.jobTarget.update({
        where: { id: jobTargetId },
        data: {
          status: 'PARSE_FAILED',
          parseError: message,
        },
      });
    }
  }

  private async resolveJdText(userId: string, sourceUrl?: string | null, rawJdText?: string | null) {
    if (rawJdText?.trim()) {
      return rawJdText.trim();
    }

    if (!sourceUrl?.trim()) {
      return undefined;
    }

    try {
      const response = await fetch(sourceUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AIResumeBot/1.0)',
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Fetch failed with HTTP ${response.status}`);
      }

      const html = await response.text();
      const text = this.htmlToText(html).slice(0, 20000);
      this.fileLogger.operation('job_url_fetched', {
        userId,
        sourceUrl,
        textLength: text.length,
      });

      return text || `岗位链接：${sourceUrl}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.fileLogger.operation('job_url_fetch_failed', { userId, sourceUrl, message });
      return `岗位链接：${sourceUrl}\n\n系统未能自动抓取该页面，请在页面中补充粘贴岗位 JD 文本后重新解析。`;
    }
  }

  private htmlToText(html: string) {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
