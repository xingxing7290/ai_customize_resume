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
    const validation = this.validateJdText(jdText);
    const job = await this.prisma.jobTarget.create({
      data: {
        userId,
        ...dto,
        rawJdText: jdText,
        status: validation.ok ? 'PARSING' : 'PARSE_FAILED',
        parseError: validation.ok ? null : validation.reason,
      },
    });

    this.fileLogger.operation('job_created', {
      userId,
      jobTargetId: job.id,
      hasSourceUrl: Boolean(dto.sourceUrl),
      hasJdText: Boolean(jdText),
    });

    if (!validation.ok) {
      this.fileLogger.operation('job_parse_skipped', {
        userId,
        jobTargetId: job.id,
        reason: validation.reason,
      });
      return job;
    }

    return this.parseAndUpdate(userId, job.id, jdText!);
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
    const validation = this.validateJdText(jdText);

    if (!validation.ok) {
      this.fileLogger.operation('job_parse_skipped', {
        userId,
        jobTargetId: id,
        reason: validation.reason,
      });

      return this.prisma.jobTarget.update({
        where: { id },
        data: {
          rawJdText: jdText,
          status: 'PARSE_FAILED',
          parsedJobTitle: null,
          parsedCompanyName: null,
          parsedLocation: null,
          parsedResponsibilities: null,
          parsedRequirements: null,
          parsedTechStack: null,
          parsedSalary: null,
          parsedBenefits: null,
          parseError: validation.reason,
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

    return this.parseAndUpdate(userId, id, jdText!);
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

      if (this.validateJdText(text).ok) {
        return text;
      }

      this.fileLogger.operation('job_url_fetch_unusable', {
        userId,
        sourceUrl,
        textLength: text.length,
      });

      const renderedText = await this.renderUrlToText(userId, sourceUrl);
      return renderedText || text || `Job URL: ${sourceUrl}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.fileLogger.operation('job_url_fetch_failed', { userId, sourceUrl, message });
      const renderedText = await this.renderUrlToText(userId, sourceUrl);
      return renderedText || `Job URL: ${sourceUrl}\n\nThe system could not fetch readable job content from this page. Paste the full JD text and reparse.`;
    }
  }

  private async renderUrlToText(userId: string, sourceUrl: string) {
    let browser: any;

    try {
      const puppeteer = await import('puppeteer');
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
        ],
      });

      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      );
      await page.setViewport({ width: 1366, height: 900 });
      await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });

      try {
        await page.waitForFunction(
          () => {
            const text = document.body?.innerText || '';
            return text.replace(/\s+/g, '').length > 500;
          },
          { timeout: 12000 },
        );
      } catch {
        // Some job sites keep network or scripts pending; use the best rendered text we have.
      }

      const text = await page.evaluate(() => document.body?.innerText || '');
      const normalized = text.replace(/\s+/g, ' ').trim().slice(0, 20000);
      this.fileLogger.operation('job_url_rendered', {
        userId,
        sourceUrl,
        textLength: normalized.length,
      });

      return normalized;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.fileLogger.operation('job_url_render_failed', { userId, sourceUrl, message });
      return undefined;
    } finally {
      if (browser) {
        await browser.close().catch(() => undefined);
      }
    }
  }

  private validateJdText(jdText?: string | null): { ok: boolean; reason?: string } {
    const text = jdText?.trim();
    if (!text) {
      return { ok: false, reason: 'No job description text or readable URL content was provided.' };
    }

    const compact = text.replace(/\s+/g, '');
    const lower = text.toLowerCase();
    const blockerPatterns = [
      '加载中',
      '请稍候',
      '安全校验',
      'security_check',
      '验证码',
      '登录后查看',
      'access denied',
      'forbidden',
      'captcha',
      'enable javascript',
      'just a moment',
    ];
    const jobSignals = [
      '岗位职责',
      '职位描述',
      '任职要求',
      '工作职责',
      'responsibilities',
      'requirements',
      'qualifications',
      '薪资',
      '经验',
      '学历',
    ];
    const hasBlockerText = blockerPatterns.some((pattern) => lower.includes(pattern.toLowerCase()));
    const hasJobSignals = jobSignals.some((signal) => lower.includes(signal.toLowerCase()));

    if (compact.length < 80) {
      return {
        ok: false,
        reason: 'Fetched content is too short to parse as a job description. Paste the full JD text and reparse.',
      };
    }

    if (hasBlockerText && !hasJobSignals) {
      return {
        ok: false,
        reason: 'The job URL returned a loading/security-check page instead of real JD content. Paste the full JD text and reparse.',
      };
    }

    return { ok: true };
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
