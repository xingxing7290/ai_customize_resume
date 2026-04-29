import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { promisify } from 'util';
import { FileLoggerService } from '../../common/logger/file-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateJobTargetDto, UpdateJobTargetDto } from './dto';

const execFileAsync = promisify(execFile);

type JobUrlFields = {
  jobTitle?: string | null;
  companyName?: string | null;
  salary?: string | null;
  experienceRequirement?: string | null;
  educationRequirement?: string | null;
  location?: string | null;
  responsibilities?: string[];
  requirements?: string[];
  techStack?: string[];
  benefits?: string[];
};

type JobUrlFetchResult = {
  ok?: boolean;
  url?: string;
  fields?: JobUrlFields;
  rawTextLength?: number;
  cleanedTextLength?: number;
  cleanedText?: string;
  diagnostics?: Record<string, unknown>;
  error?: string | null;
};

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private fileLogger: FileLoggerService,
  ) {}

  async create(userId: string, dto: CreateJobTargetDto) {
    const resolved = await this.resolveJdText(userId, dto.sourceUrl, dto.rawJdText);
    const jdText = resolved.text;
    const validation = this.validateJdText(jdText);
    const job = await this.prisma.jobTarget.create({
      data: {
        userId,
        ...dto,
        rawJdText: jdText,
        status: validation.ok ? 'PARSING' : 'PARSE_FAILED',
        parseError: validation.ok ? null : validation.reason,
        ...this.buildParsedFieldUpdate(resolved.structured?.fields),
      },
    });

    this.fileLogger.operation('job_created', {
      userId,
      jobTargetId: job.id,
      hasSourceUrl: Boolean(dto.sourceUrl),
      hasJdText: Boolean(jdText),
      validation,
    });

    if (!validation.ok) {
      this.fileLogger.operation('job_parse_skipped', {
        userId,
        jobTargetId: job.id,
        reason: validation.reason,
      });
      return job;
    }

    return this.parseAndUpdate(userId, job.id, jdText!, resolved.structured?.fields);
  }

  async findAll(userId: string) {
    return this.prisma.jobTarget.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const job = await this.prisma.jobTarget.findUnique({ where: { id } });

    if (!job) throw new NotFoundException('Job target not found');
    if (job.userId !== userId) throw new ForbiddenException('Access denied');

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
    return this.prisma.jobTarget.delete({ where: { id } });
  }

  async reparse(userId: string, id: string) {
    const job = await this.findOne(userId, id);
    const resolved = await this.resolveJdText(userId, job.sourceUrl, job.rawJdText);
    const jdText = resolved.text;
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
          parsedExperienceRequirement: null,
          parsedEducationRequirement: null,
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
        ...this.buildParsedFieldUpdate(resolved.structured?.fields),
      },
    });

    return this.parseAndUpdate(userId, id, jdText!, resolved.structured?.fields);
  }

  private async parseAndUpdate(userId: string, jobTargetId: string, jdText: string, structuredFields?: JobUrlFields) {
    try {
      const parsed = await this.aiService.parseJobDescription(userId, jdText, jobTargetId);
      const structuredUpdate = this.buildParsedFieldUpdate(structuredFields);

      const updated = await this.prisma.jobTarget.update({
        where: { id: jobTargetId },
        data: {
          status: 'PARSE_SUCCESS',
          parsedJobTitle: this.cleanParsedTitle(structuredFields?.jobTitle || parsed.jobTitle),
          parsedCompanyName: structuredFields?.companyName || parsed.companyName,
          parsedLocation: structuredFields?.location || parsed.location,
          parsedResponsibilities: JSON.stringify(this.preferArray(structuredFields?.responsibilities, parsed.responsibilities)),
          parsedRequirements: JSON.stringify(this.preferArray(structuredFields?.requirements, parsed.requirements)),
          parsedTechStack: JSON.stringify(this.preferArray(structuredFields?.techStack, parsed.techStack || parsed.keywords)),
          parsedSalary: structuredFields?.salary || parsed.salary,
          parsedExperienceRequirement: structuredFields?.experienceRequirement || parsed.experienceRequirement,
          parsedEducationRequirement: structuredFields?.educationRequirement || parsed.educationRequirement,
          parsedBenefits: JSON.stringify(this.preferArray(structuredFields?.benefits, parsed.benefits)),
          ...structuredUpdate,
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
      const cleaned = this.sanitizeJobText(rawJdText.trim());
      this.fileLogger.operation('job_text_sanitized', {
        userId,
        sourceUrl: sourceUrl?.trim() || null,
        beforeLength: rawJdText.trim().length,
        afterLength: cleaned.length,
      });
      return { text: cleaned };
    }
    if (!sourceUrl?.trim()) return { text: undefined };

    const normalizedUrl = sourceUrl.trim();
    const structured = await this.fetchJobUrlWithPython(userId, normalizedUrl);
    if (structured?.ok && structured.cleanedText && this.validateJdText(structured.cleanedText).ok) {
      this.fileLogger.operation('job_url_python_used', {
        userId,
        sourceUrl: normalizedUrl,
        textLength: structured.cleanedText.length,
        fields: this.summarizeUrlFields(structured.fields),
      });
      return { text: structured.cleanedText, structured };
    }

    try {
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.7',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) throw new Error(`Fetch failed with HTTP ${response.status}`);

      const html = await response.text();
      const text = this.htmlToText(html).slice(0, 20000);
      this.fileLogger.operation('job_url_fetched', {
        userId,
        sourceUrl: normalizedUrl,
        textLength: text.length,
      });

      const cleanedText = this.sanitizeJobText(text);
      const fetchedStructured = this.extractStructuredFieldsFromText(normalizedUrl, cleanedText || text);
      if (this.validateJdText(cleanedText).ok) {
        return {
          text: this.buildStructuredJdText(normalizedUrl, fetchedStructured.fields || {}, cleanedText),
          structured: this.mergeStructuredResult(structured, fetchedStructured),
        };
      }

      this.fileLogger.operation('job_url_fetch_unusable', {
        userId,
        sourceUrl: normalizedUrl,
        textLength: text.length,
      });

      const renderedText = await this.renderUrlToText(userId, normalizedUrl);
      const cleanedRenderedText = renderedText ? this.sanitizeJobText(renderedText) : renderedText;
      const renderedStructured = this.extractStructuredFieldsFromText(normalizedUrl, cleanedRenderedText || renderedText || '');
      if (this.validateJdText(cleanedRenderedText).ok) {
        return {
          text: this.buildStructuredJdText(normalizedUrl, renderedStructured.fields || {}, cleanedRenderedText || renderedText || ''),
          structured: this.mergeStructuredResult(structured, renderedStructured),
        };
      }

      const fallback = this.buildUrlFallbackJd(normalizedUrl, cleanedRenderedText || cleanedText);
      this.fileLogger.operation('job_url_fallback_built', {
        userId,
        sourceUrl: normalizedUrl,
        textLength: fallback.length,
      });
      return { text: fallback, structured };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.fileLogger.operation('job_url_fetch_failed', { userId, sourceUrl: normalizedUrl, message });

      const renderedText = await this.renderUrlToText(userId, normalizedUrl);
      const cleanedRenderedText = renderedText ? this.sanitizeJobText(renderedText) : renderedText;
      const renderedStructured = this.extractStructuredFieldsFromText(normalizedUrl, cleanedRenderedText || renderedText || '');
      if (this.validateJdText(cleanedRenderedText).ok) {
        return {
          text: this.buildStructuredJdText(normalizedUrl, renderedStructured.fields || {}, cleanedRenderedText || renderedText || ''),
          structured: this.mergeStructuredResult(structured, renderedStructured),
        };
      }

      return { text: this.buildUrlFallbackJd(normalizedUrl, cleanedRenderedText), structured };
    }
  }

  private async fetchJobUrlWithPython(userId: string, sourceUrl: string): Promise<JobUrlFetchResult | undefined> {
    const scriptPath = this.resolveJobFetcherScript();
    if (!scriptPath) {
      this.fileLogger.operation('job_url_python_missing', { userId, sourceUrl });
      return undefined;
    }

    const pythonCandidates = [
      process.env.JOB_FETCHER_PYTHON,
      process.platform === 'win32' ? 'python' : 'python3',
      'python',
    ].filter(Boolean) as string[];

    for (const python of Array.from(new Set(pythonCandidates))) {
      try {
        const { stdout, stderr } = await execFileAsync(
          python,
          [scriptPath, sourceUrl, '--render', '--timeout', String(Number(process.env.JOB_FETCHER_TIMEOUT_SECONDS || 25))],
          {
            timeout: Number(process.env.JOB_FETCHER_PROCESS_TIMEOUT_MS || 45000),
            maxBuffer: 8 * 1024 * 1024,
            windowsHide: true,
          },
        );
        const parsed = JSON.parse(stdout.trim()) as JobUrlFetchResult;
        this.fileLogger.operation('job_url_python_finished', {
          userId,
          sourceUrl,
          python,
          ok: Boolean(parsed.ok),
          rawTextLength: parsed.rawTextLength,
          cleanedTextLength: parsed.cleanedTextLength,
          fields: this.summarizeUrlFields(parsed.fields),
          diagnostics: parsed.diagnostics,
          stderr: stderr?.slice(0, 1000) || undefined,
        });
        return parsed;
      } catch (error) {
        const maybeWithOutput = error as Error & { stdout?: string; stderr?: string };
        if (maybeWithOutput.stdout?.trim()) {
          try {
            const parsed = JSON.parse(maybeWithOutput.stdout.trim()) as JobUrlFetchResult;
            this.fileLogger.operation('job_url_python_finished', {
              userId,
              sourceUrl,
              python,
              ok: Boolean(parsed.ok),
              rawTextLength: parsed.rawTextLength,
              cleanedTextLength: parsed.cleanedTextLength,
              fields: this.summarizeUrlFields(parsed.fields),
              diagnostics: parsed.diagnostics,
              stderr: maybeWithOutput.stderr?.slice(0, 1000) || undefined,
            });
            return parsed;
          } catch {
            // Fall through to regular failure logging.
          }
        }
        const message = error instanceof Error ? error.message : String(error);
        this.fileLogger.operation('job_url_python_failed', {
          userId,
          sourceUrl,
          python,
          errorMessage: message,
        });
      }
    }

    return undefined;
  }

  private resolveJobFetcherScript() {
    const candidates = [
      resolve(process.cwd(), 'scripts', 'job_url_fetcher.py'),
      resolve(process.cwd(), 'apps', 'api', 'scripts', 'job_url_fetcher.py'),
      resolve(__dirname, '..', '..', '..', 'scripts', 'job_url_fetcher.py'),
    ];
    return candidates.find((candidate) => existsSync(candidate));
  }

  private buildParsedFieldUpdate(fields?: JobUrlFields) {
    if (!fields) return {};
    return {
      parsedJobTitle: fields.jobTitle || undefined,
      parsedCompanyName: fields.companyName || undefined,
      parsedLocation: fields.location || undefined,
      parsedSalary: fields.salary || undefined,
      parsedExperienceRequirement: fields.experienceRequirement || undefined,
      parsedEducationRequirement: fields.educationRequirement || undefined,
      parsedResponsibilities: fields.responsibilities?.length ? JSON.stringify(fields.responsibilities) : undefined,
      parsedRequirements: fields.requirements?.length ? JSON.stringify(fields.requirements) : undefined,
      parsedTechStack: fields.techStack?.length ? JSON.stringify(fields.techStack) : undefined,
      parsedBenefits: fields.benefits?.length ? JSON.stringify(fields.benefits) : undefined,
    };
  }

  private preferArray(primary?: string[] | null, fallback?: string[] | null) {
    return primary?.length ? primary : fallback || [];
  }

  private summarizeUrlFields(fields?: JobUrlFields) {
    if (!fields) return undefined;
    return {
      jobTitle: fields.jobTitle,
      companyName: fields.companyName,
      salary: fields.salary,
      experienceRequirement: fields.experienceRequirement,
      educationRequirement: fields.educationRequirement,
      location: fields.location,
      responsibilitiesCount: fields.responsibilities?.length || 0,
      requirementsCount: fields.requirements?.length || 0,
      techStackCount: fields.techStack?.length || 0,
    };
  }

  private mergeStructuredResult(primary?: JobUrlFetchResult, fallback?: JobUrlFetchResult): JobUrlFetchResult | undefined {
    if (!primary && !fallback) return undefined;
    const fields = this.mergeJobUrlFields(primary?.fields, fallback?.fields);
    return {
      ok: Boolean(primary?.ok || fallback?.ok),
      url: primary?.url || fallback?.url,
      fields,
      rawTextLength: primary?.rawTextLength || fallback?.rawTextLength,
      cleanedTextLength: primary?.cleanedTextLength || fallback?.cleanedTextLength,
      cleanedText: primary?.cleanedText || fallback?.cleanedText,
      diagnostics: {
        ...(fallback?.diagnostics || {}),
        ...(primary?.diagnostics || {}),
      },
      error: primary?.error || fallback?.error,
    };
  }

  private mergeJobUrlFields(primary?: JobUrlFields, fallback?: JobUrlFields): JobUrlFields {
    return {
      jobTitle: primary?.jobTitle || fallback?.jobTitle,
      companyName: primary?.companyName || fallback?.companyName,
      salary: primary?.salary || fallback?.salary,
      experienceRequirement: primary?.experienceRequirement || fallback?.experienceRequirement,
      educationRequirement: primary?.educationRequirement || fallback?.educationRequirement,
      location: primary?.location || fallback?.location,
      responsibilities: primary?.responsibilities?.length ? primary.responsibilities : fallback?.responsibilities || [],
      requirements: primary?.requirements?.length ? primary.requirements : fallback?.requirements || [],
      techStack: primary?.techStack?.length ? primary.techStack : fallback?.techStack || [],
      benefits: primary?.benefits?.length ? primary.benefits : fallback?.benefits || [],
    };
  }

  private extractStructuredFieldsFromText(sourceUrl: string, text: string): JobUrlFetchResult {
    const titleCompany = text.match(/([^\n]{2,50}?)招聘[_-]([^\n]{2,80}?)招聘/);
    const salary = this.matchFirst(text, [
      /薪资待遇[:：]\s*([^\n]+)/,
      /(\d+(?:\.\d+)?\s*[-~至]\s*\d+(?:\.\d+)?\s*(?:万|K|k)(?:·\d+薪)?)/,
      /(面议)/,
    ]);
    const experienceRequirement = this.matchFirst(text, [
      /工作经验要求[:：]\s*([^\n]+)/,
      /(\d+\s*-\s*\d+\s*年|\d+年以上|\d+年及以上|经验不限|应届(?:生|毕业生)?|在校\/应届)/,
    ]);
    const educationRequirement = this.matchFirst(text, [
      /学历要求[:：]\s*([^\n]+)/,
      /(博士|硕士|本科|大专|中专|高中|学历不限)/,
    ]);
    const location = this.matchFirst(text, [
      /工作地点\s*\n?(.{2,60}?)(?:\s*以担保|\s*公司信息|\n|$)/,
      /工作地点[:：]\s*(.{2,60}?)(?:\s*以担保|\s*公司信息|\n|$)/,
      /(北京|上海|广州|深圳|杭州|成都|武汉|西安|苏州|南京|天津|重庆|郑州|长沙|青岛|沈阳)[^\n\s]{0,20}/,
    ]);
    const url = this.safeParseUrl(sourceUrl);
    const queryTitle = url?.searchParams.get('query') ? decodeURIComponent(url.searchParams.get('query') || '') : undefined;
    const jobTitle = this.cleanParsedTitle(
      titleCompany?.[1]
        || this.matchFirst(text, [
          /^([^\n]{2,50}?(?:工程师|开发|经理|主管|专员|实习生|架构师|设计师|顾问|运维|测试))招聘/m,
          /(?:举报|APP|登录\/注册)\s*([\u4e00-\u9fa5A-Za-z0-9+#/（）()·\-\s]{2,40}?(?:工程师|开发|经理|主管|专员|实习生|架构师|设计师|顾问|运维|测试))\s*(?:\d|面议|北京|上海|广州|深圳)/,
          /([\u4e00-\u9fa5A-Za-z0-9+#/（）()·\-\s]{2,40}?(?:工程师|开发|经理|主管|专员|实习生|架构师|设计师|顾问|运维|测试))\s*(?:\d+(?:\.\d+)?\s*[-~至]\s*\d+(?:\.\d+)?\s*(?:万|K|k)|面议)/,
          /岗位名称[:：]\s*([^\n]{2,80})/,
          /职位[:：]\s*([^\n]{2,80})/,
        ])
        || queryTitle,
    );
    const companyNameRaw = titleCompany?.[2]
      || this.matchFirst(text, [
        /公司名称[:：]\s*([^\n]{2,80})/,
        /公司信息\s*(.{2,80}?有限责任公司)/,
        /公司信息\s*(.{2,80}?股份有限公司)/,
        /公司信息\s*(.{2,80}?(?:有限责任公司|股份有限公司|公司|集团))/,
        /(.{2,80}?有限责任公司)\s*(?:已审核|融资|C轮|B轮|A轮|上市|民营)/,
        /(.{2,80}?股份有限公司)\s*(?:已审核|融资|C轮|B轮|A轮|上市|民营)/,
        /(.{2,80}?(?:有限责任公司|股份有限公司|公司|集团))\s*(?:已审核|融资|C轮|B轮|A轮|上市|民营)/,
      ]);
    const companyName = this.normalizeCompanyName(companyNameRaw, text);
    const responsibilities = this.extractSectionItems(text, ['岗位职责', '工作职责', '职位描述', '工作内容'], ['任职要求', '岗位要求', '职位要求', '工作地点', '公司信息']);
    const requirements = this.extractSectionItems(text, ['任职要求', '岗位要求', '职位要求', '任职资格'], ['工作地点', '公司信息', '工商信息', '职位发布者']);
    const techStack = this.extractTechStack(text);
    const benefits = this.extractBenefits(text);
    const fields: JobUrlFields = {
      jobTitle,
      companyName,
      salary,
      experienceRequirement,
      educationRequirement,
      location,
      responsibilities,
      requirements: requirements.length ? requirements : responsibilities,
      techStack,
      benefits,
    };

    return {
      ok: Boolean(jobTitle || companyName || salary || responsibilities.length || requirements.length),
      url: sourceUrl,
      fields,
      rawTextLength: text.length,
      cleanedTextLength: text.length,
      cleanedText: this.buildStructuredJdText(sourceUrl, fields, text),
      diagnostics: { source: 'node-text-extractor' },
    };
  }

  private buildStructuredJdText(sourceUrl: string, fields: JobUrlFields, body: string) {
    const lines = [
      `岗位网址：${sourceUrl}`,
      `岗位名称：${fields.jobTitle || ''}`,
      `公司名称：${fields.companyName || ''}`,
      `薪资待遇：${fields.salary || ''}`,
      `工作经验要求：${fields.experienceRequirement || ''}`,
      `学历要求：${fields.educationRequirement || ''}`,
      `工作地点：${fields.location || ''}`,
      fields.techStack?.length ? `技术关键词：${fields.techStack.join('、')}` : '',
      fields.benefits?.length ? `福利待遇：${fields.benefits.join('、')}` : '',
      fields.responsibilities?.length ? '岗位职责：' : '',
      ...(fields.responsibilities || []).map((item, index) => `${index + 1}、${item}`),
      fields.requirements?.length ? '任职要求：' : '',
      ...(fields.requirements || []).map((item, index) => `${index + 1}、${item}`),
      '页面正文：',
      body,
    ];
    return lines.filter(Boolean).join('\n').slice(0, 20000);
  }

  private matchFirst(text: string, patterns: RegExp[]) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) return match[1].replace(/\s+/g, ' ').trim();
    }
    return undefined;
  }

  private extractSectionItems(text: string, starts: string[], ends: string[]) {
    const startPositions = starts
      .map((key) => ({ key, index: text.indexOf(key) }))
      .filter((item) => item.index >= 0)
      .sort((a, b) => a.index - b.index);
    if (!startPositions.length) return [];
    const start = startPositions[0].index + startPositions[0].key.length;
    const end = ends
      .map((key) => text.indexOf(key, start))
      .filter((index) => index > start)
      .sort((a, b) => a - b)[0] || Math.min(text.length, start + 5000);
    return this.splitJobItems(text.slice(start, end));
  }

  private splitJobItems(text: string) {
    const lines = text
      .split(/\n|。|；|;/)
      .map((line) => line.replace(/^\d+[、.]\s*/, '').trim())
      .filter((line) => line.length > 2 && line.length < 300);
    return Array.from(new Set(lines)).slice(0, 20);
  }

  private extractTechStack(text: string) {
    const techWords = [
      'C语言', 'C++', 'Python', 'Java', 'JavaScript', 'TypeScript', 'Linux', 'RTOS', 'ARM', 'STM32', 'DSP',
      'FPGA', 'Zynq', 'UART', 'I2C', 'SPI', 'CAN', 'USB', 'EtherCAT', 'Modbus', 'Profibus', 'DeviceNET',
      'React', 'Vue', 'Node.js', 'Spring', 'MySQL', 'Redis', 'Docker', 'Kubernetes',
    ];
    return techWords.filter((word) => new RegExp(`(^|[^A-Za-z0-9])${this.escapeRegExp(word)}([^A-Za-z0-9]|$)`, 'i').test(text));
  }

  private extractBenefits(text: string) {
    const benefits = ['五险一金', '绩效奖金', '年终奖', '带薪假期', '节日慰问', '餐补', '包住', '周末双休', '定期体检', '股票期权'];
    return benefits.filter((benefit) => text.includes(benefit));
  }

  private escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private normalizeCompanyName(companyName: string | undefined, text: string) {
    if (!companyName) return undefined;
    const trimmed = companyName.replace(/\s+/g, '').trim();
    for (const suffix of ['有限责任公司', '股份有限公司', '有限公司']) {
      const expanded = `${trimmed}${suffix}`;
      if (!trimmed.endsWith(suffix) && text.replace(/\s+/g, '').includes(expanded)) return expanded;
    }
    return trimmed;
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
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.7' });
      await page.setViewport({ width: 1366, height: 900 });
      await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await this.waitForRenderedPage(page);

      let normalized = await page.evaluate(() => {
        const clean = (value?: string | null) => (value || '').replace(/\s+/g, ' ').trim();
        const textOf = (selector: string) => clean((document.querySelector(selector) as HTMLElement | null)?.innerText);
        const isZhipin = location.hostname.includes('zhipin.com');

        if (isZhipin) {
          const detailParts = [
            textOf('.job-title'),
            textOf('.name'),
            textOf('.salary'),
            textOf('.job-primary'),
            textOf('.job-sec'),
            textOf('.job-detail'),
            textOf('.detail-content'),
            textOf('.job-detail-section'),
            textOf('.job-detail-container'),
            textOf('.job-banner'),
            textOf('.company-info'),
          ].filter(Boolean);

          if (detailParts.join('').length > 120) {
            return `来源：BOSS直聘职位详情页\n${detailParts.join('\n')}`;
          }

          const detailLink = Array.from(document.querySelectorAll('a'))
            .map((anchor) => ({
              text: clean((anchor as HTMLElement).innerText),
              href: (anchor as HTMLAnchorElement).href,
            }))
            .find((item) => item.href.includes('/job_detail/') || item.href.includes('/wapi/zpgeek/job/detail'));

          if (detailLink?.href) {
            return `BOSS_DETAIL_LINK:${detailLink.href}`;
          }

          const cards = Array.from(document.querySelectorAll('.job-card-wrapper, .job-list-box li, .job-card-left, .job-primary, .search-job-result li'))
            .map((node) => clean((node as HTMLElement).innerText))
            .filter((value) => value.length > 40 && !value.includes('加载中，请稍候'));

          if (cards.length > 0) {
            return `来源：BOSS直聘搜索结果\n已提取可见职位卡片：\n${cards[0]}`;
          }
        }

        return document.body?.innerText || '';
      });

      if (normalized.startsWith('BOSS_DETAIL_LINK:')) {
        const detailUrl = normalized.replace('BOSS_DETAIL_LINK:', '').trim();
        this.fileLogger.operation('job_url_detail_link_found', { userId, sourceUrl, detailUrl });
        await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await this.waitForRenderedPage(page);
        normalized = await page.evaluate(() => {
          const clean = (value?: string | null) => (value || '').replace(/\s+/g, ' ').trim();
          const textOf = (selector: string) => clean((document.querySelector(selector) as HTMLElement | null)?.innerText);
          const parts = [
            textOf('.job-title'),
            textOf('.name'),
            textOf('.salary'),
            textOf('.job-primary'),
            textOf('.job-sec'),
            textOf('.job-detail'),
            textOf('.detail-content'),
            textOf('.job-detail-section'),
            textOf('.job-detail-container'),
            textOf('.job-banner'),
            textOf('.company-info'),
            clean(document.body?.innerText),
          ].filter(Boolean);
          return `来源：BOSS直聘职位详情页\n${Array.from(new Set(parts)).join('\n')}`;
        });
      }

      normalized = normalized.replace(/\s+/g, ' ').trim().slice(0, 20000);
      this.fileLogger.operation('job_url_rendered', {
        userId,
        sourceUrl,
        textLength: normalized.length,
        preview: normalized.slice(0, 200),
      });

      return normalized;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.fileLogger.operation('job_url_render_failed', { userId, sourceUrl, errorMessage });
      return undefined;
    } finally {
      if (browser) await browser.close().catch(() => undefined);
    }
  }

  private validateJdText(jdText?: string | null): { ok: boolean; reason?: string } {
    const text = jdText?.trim();
    if (!text) return { ok: false, reason: 'No job description text or readable URL content was provided.' };

    const compact = text.replace(/\s+/g, '');
    const lower = text.toLowerCase();
    const blockerPatterns = [
      '加载中',
      '请稍候',
      '安全验证',
      'security_check',
      '验证码',
      '登录后查看',
      'access denied',
      'forbidden',
      'captcha',
      'enable javascript',
      'just a moment',
    ];

    // Strong JD section headings: if present, we should not treat the page as generic navigation.
    const strongSections = [
      '职位描述',
      '岗位职责',
      '工作职责',
      '任职要求',
      '岗位要求',
      '岗位介绍',
      '职位要求',
      '工作内容',
      '工作地点',
      '薪资',
      '福利',
      '任职资格',
    ];

    const jobSignals = [
      ...strongSections,
      '公司信息',
      '公司介绍',
      '工商信息',
      '职位详情',
      '岗位名称',
      'responsibilities',
      'requirements',
      'qualifications',
    ];
    const hasBlockerText = blockerPatterns.some((pattern) => lower.includes(pattern.toLowerCase()));
    const hasJobSignals = jobSignals.some((signal) => lower.includes(signal.toLowerCase()));
    const hasStrongSections = strongSections.some((signal) => text.includes(signal));
    const looksLikeGenericNavigation =
      !hasStrongSections &&
      lower.includes('热门职位') &&
      lower.includes('首页') &&
      (lower.includes('登录/注册') || lower.includes('登录')) &&
      !lower.includes('职位描述');

    if (compact.length < 80) {
      return {
        ok: false,
        reason: 'Fetched content is too short to parse as a job description. Paste the full JD text and reparse.',
      };
    }

    if (looksLikeGenericNavigation) {
      return {
        ok: false,
        reason: 'The URL rendered a generic job search/navigation page, not a specific job detail page.',
      };
    }

    if (hasBlockerText && !hasJobSignals) {
      return {
        ok: false,
        reason: 'The job URL returned a loading/security-check page instead of real JD content.',
      };
    }

    if (hasStrongSections) return { ok: true };
    return { ok: hasJobSignals };
  }

  private async waitForRenderedPage(page: any) {
    try {
      await page.waitForFunction(
        () => {
          const text = document.body?.innerText || '';
          const compact = text.replace(/\s+/g, '');
          if (compact.length < 120) return false;
          return !/加载中，请稍候|Loading/i.test(text) || compact.length > 500;
        },
        { timeout: 12000 },
      );
    } catch {
      // Some job sites keep scripts pending or require login. Use the best text available.
    }
  }

  private buildUrlFallbackJd(sourceUrl: string, renderedText?: string) {
    const parsed = this.safeParseUrl(sourceUrl);
    const hostname = parsed?.hostname || '';
    const query = parsed?.searchParams.get('query') || parsed?.searchParams.get('keyword') || '';
    const decodedQuery = query ? decodeURIComponent(query) : '';
    const cityName = this.cityNameFromZhipinCode(parsed?.searchParams.get('city'));

    if (hostname.includes('zhipin.com') && decodedQuery) {
      return [
        `岗位名称：${decodedQuery}`,
        '来源：BOSS直聘搜索页',
        cityName ? `工作地点：${cityName}` : '',
        `岗位关键词：${decodedQuery}`,
        `任职要求：与${decodedQuery}相关的岗位要求，请在岗位详情页补充完整 JD 后点击“保存并重新解析”。`,
        '解析说明：BOSS直聘搜索结果页当前未向未登录/服务器环境公开具体职位卡片，系统已根据 URL 查询词创建可编辑岗位目标。',
      ].filter(Boolean).join('\n');
    }

    if (renderedText?.trim()) return renderedText.trim();

    return `岗位网址：${sourceUrl}\n解析说明：系统无法从该页面读取到完整 JD，请打开具体职位详情页，或粘贴完整岗位描述后重新解析。`;
  }

  private cleanParsedTitle(title?: string) {
    if (!title) return title;
    const cleaned = title
      .replace(/^岗位名称[:：]\s*/, '')
      .replace(/^.*(?:举报|APP)\s*/g, '')
      .replace(/^(?:微信扫码分享|扫码分享|举报|APP|登录\/注册|消息|我要招人|\s)+/g, '')
      .trim();
    const titleMatch = cleaned.match(/([\u4e00-\u9fa5A-Za-z0-9+#/（）()·\-\s]{2,30}?(?:工程师|开发|经理|主管|专员|实习生|架构师|设计师|顾问|运维|测试))/);
    return (titleMatch?.[1] || cleaned).trim();
  }

  private safeParseUrl(sourceUrl: string) {
    try {
      return new URL(sourceUrl);
    } catch {
      return undefined;
    }
  }

  private cityNameFromZhipinCode(code?: string | null) {
    const cities: Record<string, string> = {
      '101010100': '北京',
      '101020100': '上海',
      '101280100': '广州',
      '101280600': '深圳',
      '101210100': '杭州',
      '101030100': '天津',
      '101110100': '西安',
      '101190400': '苏州',
      '101200100': '武汉',
      '101270100': '成都',
      '101180100': '郑州',
      '101040100': '重庆',
      '101230200': '厦门',
      '101250100': '长沙',
      '101120200': '青岛',
      '101070100': '沈阳',
      '101090100': '石家庄',
      '101300100': '南宁',
      '101240100': '南昌',
      '101160100': '兰州',
    };
    return code ? cities[code] : undefined;
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

  private sanitizeJobText(text: string) {
    const original = (text || '').trim();
    if (!original) return original;

    // Normalize line breaks first to make section slicing reliable.
    const lines = original
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    // Remove common navigation/footer noise often present in copied job pages.
    const dropContains = [
      '首页',
      '登录/注册',
      '扫码分享',
      '举报',
      '热门职位',
      '热门城市',
      '热门公司',
      '关于我们',
      '使用与帮助',
      '法律协议',
      '资质公示',
      '未经',
      '版权所有',
      'ICP备',
      '公网安备',
      '网络110',
      '人力资源许可证',
      '电子营业执照',
      '算法备案',
      '未成年人',
      '投诉',
      '监督电话',
      '查看全部信息',
      '查看更多',
      '相似职位',
      '最新招聘',
      '消息',
      '我要招人',
      '更新于',
      '收藏',
      '立即投递',
      '立即沟通',
    ];

    const filtered = lines.filter((line) => {
      if (line.length <= 1) return false;
      if (dropContains.some((needle) => line.includes(needle))) return false;
      return true;
    });

    const joined = filtered.join('\n');

    // Slice "职位描述/任职要求" section if present.
    const startKeys = ['职位描述', '岗位职责', '工作职责', '职位介绍', '任职要求', '岗位要求', '职位要求'];
    const endKeys = ['公司信息', '工商信息', '公司基本信息', '认证资质', '相似职位', '最新招聘', '关于我们'];

    const startIndex = startKeys
      .map((key) => joined.indexOf(key))
      .filter((idx) => idx >= 0)
      .sort((a, b) => a - b)[0];

    const endIndex = endKeys
      .map((key) => joined.indexOf(key))
      .filter((idx) => idx >= 0)
      .sort((a, b) => a - b)[0];

    let core = joined;
    if (typeof startIndex === 'number' && startIndex >= 0) {
      core = joined.slice(startIndex, endIndex && endIndex > startIndex ? endIndex : undefined);
    } else if (typeof endIndex === 'number' && endIndex > 0) {
      // If we can't find explicit JD start, still cut off footer/company blocks.
      core = joined.slice(0, endIndex);
    }

    // Keep a short header from the beginning to help model pick up title/salary/location if present.
    const header = filtered.slice(0, 12).join('\n');

    const merged = [header, core]
      .map((part) => part.trim())
      .filter(Boolean)
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .slice(0, 20000);

    return merged || original.slice(0, 20000);
  }
}
