import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FileLoggerService } from '../../common/logger/file-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateJobTargetDto, UpdateJobTargetDto } from './dto';

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

    return this.parseAndUpdate(userId, job.id, jdText!);
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
          parsedJobTitle: this.cleanParsedTitle(parsed.jobTitle),
          parsedCompanyName: parsed.companyName,
          parsedLocation: parsed.location,
          parsedResponsibilities: JSON.stringify(parsed.responsibilities || []),
          parsedRequirements: JSON.stringify(parsed.requirements || []),
          parsedTechStack: JSON.stringify(parsed.techStack || parsed.keywords || []),
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
      return cleaned;
    }
    if (!sourceUrl?.trim()) return undefined;

    const normalizedUrl = sourceUrl.trim();

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
      if (this.validateJdText(cleanedText).ok) return cleanedText;

      this.fileLogger.operation('job_url_fetch_unusable', {
        userId,
        sourceUrl: normalizedUrl,
        textLength: text.length,
      });

      const renderedText = await this.renderUrlToText(userId, normalizedUrl);
      const cleanedRenderedText = renderedText ? this.sanitizeJobText(renderedText) : renderedText;
      if (this.validateJdText(cleanedRenderedText).ok) return cleanedRenderedText;

      const fallback = this.buildUrlFallbackJd(normalizedUrl, cleanedRenderedText || cleanedText);
      this.fileLogger.operation('job_url_fallback_built', {
        userId,
        sourceUrl: normalizedUrl,
        textLength: fallback.length,
      });
      return fallback;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.fileLogger.operation('job_url_fetch_failed', { userId, sourceUrl: normalizedUrl, message });

      const renderedText = await this.renderUrlToText(userId, normalizedUrl);
      const cleanedRenderedText = renderedText ? this.sanitizeJobText(renderedText) : renderedText;
      if (this.validateJdText(cleanedRenderedText).ok) return cleanedRenderedText;

      return this.buildUrlFallbackJd(normalizedUrl, cleanedRenderedText);
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
    return title.replace(/^岗位名称[:：]\s*/, '').trim();
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
