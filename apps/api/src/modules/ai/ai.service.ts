import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAiProvider } from './providers/openai.provider';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ParseJobSchema,
  GenerateResumeSchema,
  ValidateResumeSchema,
  ParseResumeSchema,
} from './schemas';
import {
  PARSE_JOB_SYSTEM_PROMPT,
  buildParseJobUserPrompt,
  GENERATE_RESUME_SYSTEM_PROMPT,
  buildGenerateResumeUserPrompt,
  VALIDATE_RESUME_SYSTEM_PROMPT,
  buildValidateResumeUserPrompt,
  PARSE_RESUME_SYSTEM_PROMPT,
  buildParseResumeUserPrompt,
} from './prompts';
import { checkConsistency, extractProfileForCheck } from './utils';

const RESUME_PARSE_AI_TIMEOUT_MS = Number(
  process.env.RESUME_PARSE_AI_TIMEOUT_MS || 15000,
);

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
    const firstLine = (
      namedTitle?.replace(/^岗位名称[:：]\s*/, '') ||
      lines[0] ||
      '未命名岗位'
    ).trim();
    const techKeywords = [
      'JavaScript',
      'TypeScript',
      'React',
      'Next.js',
      'Vue',
      'Node.js',
      'NestJS',
      'Java',
      'Spring',
      'Python',
      'Go',
      'MySQL',
      'PostgreSQL',
      'Redis',
      'Docker',
      'Kubernetes',
      'AWS',
      'Linux',
      'Git',
    ];
    const matchedTech = techKeywords.filter((keyword) =>
      jdText.toLowerCase().includes(keyword.toLowerCase()),
    );

    return {
      jobTitle: firstLine.slice(0, 80),
      companyName: undefined,
      location: undefined,
      salary: this.matchFirst(jdText, [
        /薪资待遇[:：]\s*([^\n]+)/,
        /(\d+(?:\.\d+)?\s*[-~至]\s*\d+(?:\.\d+)?\s*(?:万|K)(?:·\d+薪)?)/,
      ]),
      responsibilities: lines.slice(0, 6),
      requirements: lines.slice(0, 8),
      preferredQualifications: [],
      keywords: matchedTech,
      techStack: matchedTech,
      experienceRequirement: this.matchFirst(jdText, [
        /工作经验要求[:：]\s*([^\n]+)/,
        /(\d+\s*-\s*\d+\s*年|\d+年以上|经验不限|应届(?:生|毕业生)?)/,
      ]),
      educationRequirement: this.matchFirst(jdText, [
        /学历要求[:：]\s*([^\n]+)/,
        /(博士|硕士|本科|大专|中专|高中|学历不限)/,
      ]),
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
    const skills = (profileData.skillRecords || []).map(
      (skill: any) => skill.name,
    );
    const workExperiences = (profileData.workExperiences || []).map(
      (work: any) => ({
        company: work.company,
        title: work.title,
        startDate: work.startDate,
        endDate: work.endDate,
        description: work.description,
        highlights: this.splitListText(work.highlights),
      }),
    );
    const projectExperiences = (profileData.projectExperiences || []).map(
      (project: any) => ({
        name: project.name,
        role: project.role,
        description: project.description,
        highlights: this.splitListText(project.highlights),
        techStack: this.splitListText(project.techStack),
      }),
    );

    return {
      summary:
        profileData.summary ||
        profileData.selfEvaluation ||
        `面向${jobData.jobTitle || '目标岗位'}的定制简历。`,
      skills,
      workExperiences,
      projectExperiences,
      certificates: (profileData.certificateRecords || []).map(
        (cert: any) => cert.name,
      ),
      selfEvaluation: profileData.selfEvaluation || profileData.summary,
      optimizationNotes: [
        '当前使用本地降级生成：仅基于用户已填写资料重组内容，未虚构经历。',
      ],
      gapAnalysis: jobData.techStack
        ? [`请确认简历中是否覆盖岗位技术关键词：${jobData.techStack}`]
        : [],
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
        isConsistent:
          programmaticCheck.isConsistent && aiResult.data.isConsistent,
        issues: [...programmaticCheck.issues, ...aiResult.data.issues],
        missingKeywords: aiResult.data.missingKeywords,
        possibleFabrications: [
          ...programmaticCheck.possibleFabrications,
          ...aiResult.data.possibleFabrications,
        ],
        suggestions: aiResult.data.suggestions,
        warnings: programmaticCheck.warnings,
      };

      await this.updateTaskLogSuccess(taskLog.id, {
        data: finalResult,
        tokenUsed: aiResult.tokenUsed,
        durationMs: aiResult.durationMs,
      });
      return finalResult;
    } catch (error) {
      await this.updateTaskLogFailed(taskLog.id, error);
      throw error;
    }
  }

  private buildFallbackResumeParse(resumeText: string) {
    const lines = resumeText
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const compactText = lines.join('\n');
    const email = this.matchFirst(compactText, [
      /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
    ]);
    const phone = this.matchFirst(compactText, [
      /((?:\+?86[-\s]?)?1[3-9]\d[-\s]?\d{4}[-\s]?\d{4})/,
      /(\+?\d[\d\s().-]{7,}\d)/,
    ]);
    const name = lines.find((line) => {
      if (line.length > 40) return false;
      if (email && line.includes(email)) return false;
      if (phone && line.includes(phone)) return false;
      return !/(resume|curriculum vitae|简历|邮箱|电话|手机|email|phone)/i.test(
        line,
      );
    });
    const techKeywords = [
      'JavaScript',
      'TypeScript',
      'React',
      'Next.js',
      'Vue',
      'Node.js',
      'NestJS',
      'Java',
      'Spring',
      'Python',
      'Go',
      'C++',
      'C#',
      'MySQL',
      'PostgreSQL',
      'Redis',
      'Docker',
      'Kubernetes',
      'AWS',
      'Linux',
      'Git',
    ];
    const skillRecords = techKeywords
      .filter((keyword) =>
        compactText.toLowerCase().includes(keyword.toLowerCase()),
      )
      .map((name) => ({ name, category: 'Technology' }));

    return {
      name,
      email,
      phone,
      location: undefined,
      summary: this.extractFallbackSummary(lines),
      educationRecords: [],
      workExperiences: [],
      projectExperiences: [],
      skillRecords,
      certificateRecords: [],
    };
  }

  private extractFallbackSummary(lines: string[]) {
    const summaryStart = lines.findIndex((line) =>
      /(summary|profile|个人简介|自我评价|职业概况)/i.test(line),
    );
    if (summaryStart < 0) return undefined;
    return (
      lines
        .slice(summaryStart + 1, summaryStart + 4)
        .filter((line) => line.length > 10 && line.length < 300)
        .join('\n') || undefined
    );
  }

  private buildFallbackResumeParseV2(resumeText: string) {
    const normalizedText = this.normalizeResumeText(resumeText);
    const lines = this.resumeLines(normalizedText);
    const compactText = lines.join('\n');
    const email = this.matchFirst(compactText, [
      /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
    ]);
    const phone = this.matchFirst(compactText, [
      /((?:\+?86[-\s]?)?1[3-9]\d[-\s]?\d{4}[-\s]?\d{4})/,
      /(\+?\d[\d\s().-]{7,}\d)/,
    ]);
    const name = this.extractResumeName(compactText, lines, email, phone);
    const location = this.matchFirst(compactText, [
      /(?:所在地|现居|居住地|地址|城市|Location)[:：\s]*([^\n]{2,40})/i,
      /(北京|上海|广州|深圳|杭州|成都|武汉|南京|苏州|西安|天津|重庆|长沙|郑州|青岛|厦门|合肥|佛山|东莞|无锡|宁波)/,
    ]);

    return {
      name,
      email,
      phone,
      location,
      summary: this.extractFallbackSummaryV2(normalizedText, lines),
      educationRecords: this.extractFallbackEducation(normalizedText),
      workExperiences: this.extractFallbackWork(normalizedText),
      projectExperiences: this.extractFallbackProjects(normalizedText),
      skillRecords: this.extractFallbackSkills(normalizedText),
      certificateRecords: this.extractFallbackCertificates(normalizedText),
    };
  }

  private normalizeResumeText(text: string) {
    return text
      .replace(/\u0000/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(
        /(个人信息|基本信息|联系方式|教育经历|教育背景|学习经历|学习背景|工作经历|实习经历|项目经历|项目经验|专业技能|技能清单|技能特长|证书|资格证书|获奖经历|自我评价|个人简介|职业概况|Work Experience|Project Experience|Summary|Education|Skills|Certificates)/gi,
        '\n$1\n',
      )
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private resumeLines(text: string) {
    return text
      .split(/\n|[•●◆◇▪▫]\s*/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  private extractResumeName(
    text: string,
    lines: string[],
    email?: string,
    phone?: string,
  ) {
    const named = this.matchFirst(text, [
      /(?:姓名|姓\s*名|Name)[:：\s]*([\u4e00-\u9fa5·]{2,8}|[A-Za-z][A-Za-z\s]{1,40})/i,
    ]);
    if (named) return named;

    return lines.find((line) => {
      if (line.length > 24) return false;
      if (email && line.includes(email)) return false;
      if (phone && line.includes(phone)) return false;
      if (
        /(resume|curriculum vitae|简历|邮箱|电话|手机|email|phone|求职意向|个人信息|基本信息)/i.test(
          line,
        )
      )
        return false;
      return (
        /^[\u4e00-\u9fa5·]{2,8}$/.test(line) ||
        /^[A-Za-z][A-Za-z\s]{1,30}$/.test(line)
      );
    });
  }

  private extractFallbackSummaryV2(text: string, lines: string[]) {
    const section = this.extractResumeSection(
      text,
      ['个人简介', '自我评价', '职业概况', 'Summary', 'Profile'],
      [
        '教育经历',
        '教育背景',
        '学习经历',
        '学习背景',
        '工作经历',
        '项目经历',
        '专业技能',
        '技能清单',
        '证书',
      ],
    );
    const sourceLines = section ? this.resumeLines(section) : lines;
    return (
      sourceLines
        .filter(
          (line) =>
            line.length > 12 &&
            line.length < 260 &&
            !/(邮箱|电话|手机|email|phone)/i.test(line),
        )
        .slice(0, 3)
        .join('\n') || undefined
    );
  }

  private extractFallbackEducation(text: string) {
    const section = this.extractResumeSection(
      text,
      ['教育经历', '教育背景', '学习经历', '学习背景', 'Education'],
      [
        '工作经历',
        '实习经历',
        '项目经历',
        '项目经验',
        '专业技能',
        '技能清单',
        '证书',
        'Certificates',
      ],
    );
    const lines = this.resumeLines(section || text);
    const schools = lines
      .filter((line) => /(大学|学院|学校|University|College)/i.test(line))
      .slice(0, 8);
    return schools.map((line) => {
      const parts = this.pipeParts(line);
      const headerParts = this.datedHeaderParts(parts);
      return {
        school:
          headerParts.fields[0] ||
          this.matchFirst(line, [
            /([\u4e00-\u9fa5A-Za-z\s·-]*(?:大学|学院|学校|University|College)[\u4e00-\u9fa5A-Za-z\s·-]*)/i,
          ]) ||
          line.slice(0, 80),
        degree:
          headerParts.fields[1] ||
          this.matchFirst(line, [
            /(博士|硕士|研究生|本科|大专|学士|Doctor|Master|Bachelor|MBA)/i,
          ]) ||
          '',
        major:
          headerParts.fields[2] ||
          this.matchFirst(line, [/(?:专业|Major)[:：\s]*([^\n，,|]{2,40})/i]),
        startDate:
          this.matchFirst(line, [
            /((?:19|20)\d{2}(?:[./](?:0?[1-9]|1[0-2]))?)/,
          ]) || '',
        endDate: this.matchFirst(line, [
          /(?:-|至|到|~|—)\s*((?:19|20)\d{2}(?:[./](?:0?[1-9]|1[0-2]))?|至今|Present)/i,
        ]),
        description: line,
      };
    });
  }

  private extractFallbackWork(text: string) {
    const section = this.extractResumeSection(
      text,
      ['工作经历', '实习经历', 'Work Experience', 'Experience'],
      [
        '项目经历',
        '项目经验',
        'Project Experience',
        'Projects',
        '专业技能',
        '技能清单',
        'Skills',
        '证书',
        'Certificates',
        '教育经历',
        '教育背景',
        '学习经历',
        '学习背景',
        'Education',
      ],
    );
    return this.splitResumeBlocks(section)
      .filter((block) => !this.isProjectLikeBlock(block))
      .map((block) => {
        const lines = this.resumeLines(block);
        const header =
          lines.find((line) =>
            /(公司|科技|集团|有限|股份|工作室|中心|Company|Inc\.?|Ltd\.?)/i.test(
              line,
            ),
          ) || lines[0];
        const parts = this.pipeParts(header || '');
        const headerParts = this.datedHeaderParts(parts);
        return {
          company:
            headerParts.fields[0] ||
            this.matchFirst(header || '', [
              /([\u4e00-\u9fa5A-Za-z0-9（）()·\s-]{2,60}(?:公司|科技|集团|有限|股份|工作室|中心|Company|Inc\.?|Ltd\.?))/i,
            ]) ||
            header ||
            '',
          title:
            headerParts.fields[1] ||
            lines.find((line) =>
              /(工程师|开发|经理|主管|专员|负责人|架构师|顾问|Engineer|Developer|Manager|Lead)/i.test(
                line,
              ),
            ) ||
            '',
          startDate:
            this.matchFirst(block, [
              /((?:19|20)\d{2}(?:[./](?:0?[1-9]|1[0-2]))?)/,
            ]) || '',
          endDate: this.matchFirst(block, [
            /(?:-|至|到|~|—)\s*((?:19|20)\d{2}(?:[./](?:0?[1-9]|1[0-2]))?|至今|Present)/i,
          ]),
          description: lines.slice(0, 4).join('\n'),
          highlights: lines.slice(1, 8).join('\n'),
        };
      })
      .filter((item) => item.company || item.title)
      .slice(0, 8);
  }

  private extractFallbackProjects(text: string) {
    const section = this.extractResumeSection(
      text,
      ['项目经历', '项目经验', 'Project Experience', 'Projects'],
      [
        '专业技能',
        '技能清单',
        'Skills',
        '证书',
        'Certificates',
        '教育经历',
        '教育背景',
        '学习经历',
        '学习背景',
        'Education',
        '工作经历',
        'Work Experience',
      ],
    );
    const workSection = this.extractResumeSection(
      text,
      ['工作经历', '实习经历', 'Work Experience', 'Experience'],
      [
        '专业技能',
        '技能清单',
        'Skills',
        '证书',
        'Certificates',
        '教育经历',
        '教育背景',
        '学习经历',
        '学习背景',
        'Education',
      ],
    );
    const blocks = [
      ...this.splitResumeBlocks(section),
      ...this.splitResumeBlocks(workSection).filter((block) =>
        this.isProjectLikeBlock(block),
      ),
      ...this.splitResumeBlocks(text).filter((block) =>
        this.isProjectLikeBlock(block),
      ),
    ];

    return blocks
      .map((block) => {
        const lines = this.resumeLines(block);
        const name = (
          lines.find((line) =>
            /(项目|系统|平台|应用|网站|小程序|Project)/i.test(line),
          ) ||
          lines[0] ||
          ''
        ).slice(0, 80);
        const parts = this.pipeParts(name);
        const headerParts = this.datedHeaderParts(parts);
        const titleRole = this.splitProjectTitleRole(
          headerParts.fields.join(' ') || name,
        );
        return {
          name: titleRole.name || headerParts.fields[0] || name,
          role:
            titleRole.role ||
            headerParts.fields[1] ||
            lines.find((line) =>
              /(角色|职责|负责|工程师|开发|负责人|Role)/i.test(line),
            ),
          startDate:
            this.matchFirst(block, [
              /((?:19|20)\d{2}(?:[./](?:0?[1-9]|1[0-2]))?)/,
            ]) || undefined,
          endDate: this.matchFirst(block, [
            /(?:-|至|到|~|—)\s*((?:19|20)\d{2}(?:[./](?:0?[1-9]|1[0-2]))?|至今|Present)/i,
          ]),
          description: lines.slice(0, 4).join('\n'),
          highlights: lines.slice(1, 8).join('\n'),
          techStack: this.extractFallbackSkills(block)
            .map((skill) => skill.name)
            .join(', '),
        };
      })
      .filter((item) => item.name)
      .slice(0, 30);
  }

  private extractFallbackSkills(text: string) {
    const section =
      this.extractResumeSection(
        text,
        ['专业技能', '技能清单', '技能特长', 'Skills'],
        [
          '项目经历',
          '证书',
          'Certificates',
          '教育经历',
          '教育背景',
          '学习经历',
          '学习背景',
          '工作经历',
        ],
      ) || text;
    const techKeywords = [
      'JavaScript',
      'TypeScript',
      'React',
      'Next.js',
      'Vue',
      'Node.js',
      'NestJS',
      'Java',
      'Spring',
      'Python',
      'Go',
      'C++',
      'C#',
      'C语言',
      'MySQL',
      'PostgreSQL',
      'Redis',
      'Docker',
      'Kubernetes',
      'Linux',
      'Git',
      'HTML',
      'CSS',
      'Tailwind',
      'Prisma',
      'SQLite',
      'MongoDB',
      'Nginx',
      'Puppeteer',
      'OpenAI',
      'DeepSeek',
      'STM32',
      'FreeRTOS',
      'ARM',
      'RTOS',
      'CAN',
      'UART',
      'I2C',
      'SPI',
    ];
    const matched = techKeywords.filter((keyword) =>
      new RegExp(
        `(^|[^A-Za-z0-9+#])${this.escapeRegExp(keyword)}([^A-Za-z0-9+#]|$)`,
        'i',
      ).test(section),
    );
    const extra = this.resumeLines(section)
      .flatMap((line) => line.split(/[,，、;；|/]/))
      .map((item) => item.trim())
      .filter(
        (item) =>
          item.length >= 2 &&
          item.length <= 30 &&
          !/(技能|熟悉|掌握|了解|负责)/.test(item),
      )
      .slice(0, 20);
    return Array.from(new Set([...matched, ...extra]))
      .slice(0, 40)
      .map((name) => ({ name, category: 'Technology' }));
  }

  private extractFallbackCertificates(text: string) {
    const section =
      this.extractResumeSection(
        text,
        ['证书', '资格证书', '获奖经历', 'Certificates'],
        ['项目经历', '工作经历', '教育经历', '专业技能'],
      ) || text;
    return this.resumeLines(section)
      .filter((line) =>
        /(证书|认证|CET|英语|软考|PMP|AWS|阿里云|腾讯云|Certificate|Certification)/i.test(
          line,
        ),
      )
      .slice(0, 10)
      .map((line) => ({
        name: line.slice(0, 100),
        description: line,
      }));
  }

  private extractResumeSection(text: string, starts: string[], ends: string[]) {
    const lines = text.split('\n');
    const normalizeHeading = (value: string) =>
      value.replace(/[:：]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const startSet = new Set(starts.map((item) => normalizeHeading(item)));
    const endSet = new Set(ends.map((item) => normalizeHeading(item)));
    const startLine = lines.findIndex((line) =>
      startSet.has(normalizeHeading(line)),
    );
    if (startLine >= 0) {
      const relativeEnd = lines
        .slice(startLine + 1)
        .findIndex((line) => endSet.has(normalizeHeading(line)));
      const endLine =
        relativeEnd >= 0 ? startLine + 1 + relativeEnd : lines.length;
      return lines
        .slice(startLine + 1, endLine)
        .join('\n')
        .trim();
    }

    const startMatches = starts
      .map((key) => ({
        key,
        index: text.search(new RegExp(this.escapeRegExp(key), 'i')),
      }))
      .filter((item) => item.index >= 0)
      .sort((a, b) => a.index - b.index);
    if (!startMatches.length) return undefined;
    const start = startMatches[0].index + startMatches[0].key.length;
    const end = ends
      .map((key) =>
        text.slice(start).search(new RegExp(this.escapeRegExp(key), 'i')),
      )
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0];
    return text
      .slice(start, end === undefined ? undefined : start + end)
      .trim();
  }

  private splitResumeBlocks(section?: string) {
    if (!section) return [];
    const lines = this.resumeLines(section);
    const dateHeaderIndexes = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => this.isDateRangeLine(line))
      .map(({ index }) => index);

    if (dateHeaderIndexes.length > 1) {
      return dateHeaderIndexes.map((start, position) => {
        const end = dateHeaderIndexes[position + 1] ?? lines.length;
        const previous = lines[start - 1];
        const next = lines[start + 1];
        const nextLooksLikeTitle =
          next &&
          !this.isDateRangeLine(next) &&
          !this.isResumeHeading(next) &&
          next.length <= 120 &&
          this.isProjectLikeBlock(next) &&
          !/^(负责|实现|支持|开发|参与|主要|搭建|完成设备|完成.*功能)/.test(
            next,
          );
        const realStart =
          previous &&
          !this.isDateRangeLine(previous) &&
          !this.isResumeHeading(previous) &&
          previous.length <= 120 &&
          !nextLooksLikeTitle
            ? start - 1
            : start;
        return lines.slice(realStart, end).join('\n').trim();
      });
    }

    const blocks = section
      .split(
        /\n\s*\n|(?=^[^\n]*(?:19|20)\d{2}(?:[./](?:0?[1-9]|1[0-2]))?\s*(?:-|至|到|~|—)\s*(?:(?:19|20)\d{2}|至今|Present))/m,
      )
      .map((block) => block.trim())
      .filter((block) => block.length > 10);
    return blocks.length ? blocks : [section.trim()].filter(Boolean);
  }

  private pipeParts(line: string) {
    return line
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean);
  }

  private datedHeaderParts(parts: string[]) {
    const hasLeadingDate = parts.length > 1 && this.isDateRangeLine(parts[0]);

    return {
      dateRange: hasLeadingDate ? parts[0] : undefined,
      fields: hasLeadingDate ? parts.slice(1) : parts,
    };
  }

  private isDateRangeLine(line?: string) {
    return Boolean(
      line &&
      /^(?:19|20)\d{2}(?:[./](?:0?[1-9]|1[0-2]))?\s*(?:-|至|到|~|—)\s*(?:(?:19|20)\d{2}(?:[./](?:0?[1-9]|1[0-2]))?|至今|Present)$/i.test(
        line.trim(),
      ),
    );
  }

  private isResumeHeading(line: string) {
    return /^(个人信息|基本信息|联系方式|教育经历|教育背景|学习经历|学习背景|工作经历|实习经历|项目经历|项目经验|专业技能|技能清单|技能特长|证书|资格证书|获奖经历|自我评价|个人简介|职业概况|Work Experience|Project Experience|Summary|Education|Skills|Certificates)$/i.test(
      line.trim(),
    );
  }

  private isProjectLikeBlock(block: string) {
    const lines = this.resumeLines(block);
    const header = lines.find((line) => !this.isDateRangeLine(line)) || '';
    const text = `${header}\n${block}`;
    const projectLike =
      /(项目|平台|系统|APP|App|小程序|设备|网关|上位机|工具软件|知识库|说明书|通信|控制|开发与交付|Project|Platform|System)/i.test(
        text,
      );
    const companyLike =
      /(公司|科技|集团|有限|股份|工作室|中心|Company|Inc\.?|Ltd\.?|LLC|Co\.)/i.test(
        header,
      );
    return projectLike && !companyLike;
  }

  private splitProjectTitleRole(text?: string) {
    const source = (text || '').replace(/\s+/g, ' ').trim();
    if (!source) return { name: undefined, role: undefined };
    const cleaned = source.replace(
      /^(?:19|20)\d{2}(?:[./](?:0?[1-9]|1[0-2]))?\s*(?:-|至|到|~|—)\s*(?:(?:19|20)\d{2}(?:[./](?:0?[1-9]|1[0-2]))?|至今|Present)\s*/,
      '',
    );
    const rolePattern =
      /(程序开发工程师|平台搭建工程师|嵌入式软件工程师|嵌入式开发工程师|软件开发与优化工程师|全栈开发工程师|后端开发工程师|软件开发工程师|软件工程师|开发工程师|项目开发|项目负责人|技术负责人|负责人|工程师|Developer|Engineer|Lead)$/i;
    const match = cleaned.match(rolePattern);
    if (!match || match.index === undefined || match.index <= 0) {
      return { name: cleaned || undefined, role: undefined };
    }

    return {
      name: cleaned.slice(0, match.index).trim() || cleaned,
      role: match[0].trim(),
    };
  }

  async parseResumeFromText(
    userId: string,
    resumeText: string,
    runtimeConfig?: { apiKey?: string; baseUrl?: string; model?: string },
  ) {
    const taskLog = await this.createTaskLog(
      userId,
      'PARSE_RESUME',
      'temp',
      'ResumeImport',
      { textLength: resumeText.length },
    );

    const fallback = this.buildFallbackResumeParseV2(resumeText);

    try {
      const result = await this.withTimeout(
        this.openAiProvider.generateStructuredJson({
          systemPrompt: PARSE_RESUME_SYSTEM_PROMPT,
          userPrompt: buildParseResumeUserPrompt(resumeText),
          schema: ParseResumeSchema,
          temperature: 0.2,
          apiKey: runtimeConfig?.apiKey,
          baseUrl: runtimeConfig?.baseUrl,
          model: runtimeConfig?.model,
        }),
        RESUME_PARSE_AI_TIMEOUT_MS,
        'Resume AI parse timed out',
      );

      const data = this.rebucketParsedExperiences(
        this.mergeParsedResume(result.data, fallback),
      );
      await this.updateTaskLogSuccess(taskLog.id, {
        data: this.isSparseParsedResume(result.data)
          ? {
              ...data,
              fallbackReason: 'AI returned sparse resume parse result',
            }
          : data,
        tokenUsed: result.tokenUsed,
        durationMs: result.durationMs,
      });
      return data;
    } catch (error) {
      await this.updateTaskLogSuccess(taskLog.id, {
        data: {
          ...fallback,
          fallbackReason: error.message || String(error),
        },
        tokenUsed: 0,
        durationMs: 0,
      });
      return this.rebucketParsedExperiences(fallback);
    }
  }

  private mergeParsedResume(primary: any, fallback: any) {
    return {
      name: primary?.name || fallback.name,
      email: primary?.email || fallback.email,
      phone: primary?.phone || fallback.phone,
      location: primary?.location || fallback.location,
      summary: primary?.summary || fallback.summary,
      educationRecords: this.mergeRecords(
        primary?.educationRecords,
        fallback.educationRecords,
        (item) =>
          `${item?.school || ''}|${item?.degree || ''}|${item?.major || ''}`,
      ),
      workExperiences: this.mergeRecords(
        primary?.workExperiences,
        fallback.workExperiences,
        (item) =>
          `${item?.company || ''}|${item?.title || ''}|${item?.startDate || ''}`,
      ),
      projectExperiences: this.mergeRecords(
        primary?.projectExperiences,
        fallback.projectExperiences,
        (item) =>
          `${item?.name || ''}|${item?.role || ''}|${item?.startDate || ''}`,
      ),
      skillRecords: this.mergeRecords(
        primary?.skillRecords,
        fallback.skillRecords,
        (item) => item?.name || '',
      ),
      certificateRecords: this.mergeRecords(
        primary?.certificateRecords,
        fallback.certificateRecords,
        (item) => item?.name || '',
      ),
    };
  }

  private mergeRecords(
    primary: any[] | undefined,
    fallback: any[] | undefined,
    keyOf: (item: any) => string,
  ) {
    const records = [...(primary || []), ...(fallback || [])];
    const seen = new Set<string>();
    return records.filter((item) => {
      const key = keyOf(item).replace(/\s+/g, ' ').trim().toLowerCase();
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private rebucketParsedExperiences(data: any) {
    const educationRecords = [...(data?.educationRecords || [])];
    const workExperiences = [];
    const projectExperiences = [];

    for (const work of data?.workExperiences || []) {
      if (this.isEducationLikeRecord(work)) {
        educationRecords.push(this.workToEducationRecord(work));
      } else if (this.shouldMoveWorkToProject(work)) {
        projectExperiences.push(this.workToProjectExperience(work));
      } else {
        workExperiences.push(work);
      }
    }

    for (const project of data?.projectExperiences || []) {
      const normalized = this.normalizeParsedProject(project);
      if (this.isEducationLikeRecord(normalized)) {
        educationRecords.push(this.projectToEducationRecord(normalized));
      } else {
        projectExperiences.push(normalized);
      }
    }

    return {
      ...data,
      educationRecords: this.dedupeEducation(educationRecords),
      workExperiences,
      projectExperiences: this.dedupeProjects(projectExperiences),
    };
  }

  private shouldMoveWorkToProject(work: any) {
    const company = String(work?.company || '').trim();
    const title = String(work?.title || '').trim();
    const description = String(work?.description || '').trim();
    const companyIsDate = this.isDateRangeLine(company);
    const companyLike =
      /(公司|科技|集团|有限|股份|工作室|中心|Company|Inc\.?|Ltd\.?|LLC|Co\.)/i.test(
        company,
      );
    const projectLike =
      /(项目|平台|系统|APP|App|小程序|设备|网关|上位机|工具软件|知识库|说明书|通信|控制|开发与交付|Project|Platform|System)/i.test(
        `${company} ${title} ${description}`,
      );
    return projectLike && (companyIsDate || !companyLike);
  }

  private isEducationLikeRecord(record: any) {
    const text = [
      record?.school,
      record?.degree,
      record?.major,
      record?.company,
      record?.title,
      record?.name,
      record?.role,
      record?.description,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join(' ');
    const educationLike =
      /(大学|学院|学校|本科|专科|大专|硕士|博士|学士|研究生|专业|学历|University|College|Bachelor|Master|Doctor|Education)/i.test(
        text,
      );
    const projectLike =
      /(项目|平台|系统|APP|App|小程序|设备|网关|上位机|工具软件|知识库|说明书|通信|控制|Project|Platform|System)/i.test(
        text,
      );
    const companyLike =
      /(公司|科技|集团|有限|股份|工作室|中心|Company|Inc\.?|Ltd\.?|LLC|Co\.)/i.test(
        text,
      );
    return educationLike && !projectLike && !companyLike;
  }

  private workToEducationRecord(work: any) {
    const source = [work?.company, work?.title, work?.description]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join(' ');
    return this.normalizeParsedEducation({
      school: this.extractSchoolName(source) || work?.company,
      degree: work?.degree || this.extractDegree(source) || work?.title,
      major: work?.major || this.extractMajor(source),
      startDate: work?.startDate,
      endDate: work?.endDate,
      description: work?.description || source,
    });
  }

  private projectToEducationRecord(project: any) {
    const source = [project?.name, project?.role, project?.description]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join(' ');
    return this.normalizeParsedEducation({
      school: this.extractSchoolName(source) || project?.name,
      degree: project?.degree || this.extractDegree(source) || project?.role,
      major: project?.major || this.extractMajor(source),
      startDate: project?.startDate,
      endDate: project?.endDate,
      description: project?.description || source,
    });
  }

  private normalizeParsedEducation(record: any) {
    const source = [
      record?.school,
      record?.degree,
      record?.major,
      record?.description,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join(' ');
    return {
      ...record,
      school: this.extractSchoolName(source) || record?.school,
      degree: this.extractDegree(source) || record?.degree,
      major: this.extractMajor(source) || record?.major,
    };
  }

  private extractSchoolName(text: string) {
    return this.matchFirst(text, [
      /([\u4e00-\u9fa5A-Za-z\s·-]{0,40}?(?:大学|学院|学校|University|College))/i,
    ]);
  }

  private extractDegree(text: string) {
    return this.matchFirst(text, [
      /(博士|硕士|研究生|本科|大专|专科|学士|Doctor|Master|Bachelor|MBA)/i,
    ]);
  }

  private extractMajor(text: string) {
    return this.matchFirst(text, [
      /(?:专业|Major)[:：\s]*([^\n，,|]{2,40})/i,
      /(计算机科学与技术|软件工程|电子信息工程|自动化|通信工程|电子工程|Computer Science|Software Engineering)/i,
    ]);
  }

  private workToProjectExperience(work: any) {
    const source = [work?.title, work?.company, work?.description]
      .map((value) => String(value || '').trim())
      .find((value) => value && !this.isDateRangeLine(value));
    const titleRole = this.splitProjectTitleRole(source);
    return this.normalizeParsedProject({
      name: titleRole.name || source || work?.title || work?.company,
      role: titleRole.role || work?.title,
      startDate: work?.startDate,
      endDate: work?.endDate,
      description: work?.description,
      highlights: work?.highlights,
      techStack: work?.techStack,
    });
  }

  private normalizeParsedProject(project: any) {
    const name = String(project?.name || '').trim();
    const role = String(project?.role || '').trim();
    const preferred = this.isDateRangeLine(name) && role ? role : name;
    const titleRole = this.splitProjectTitleRole(preferred || role);
    return {
      ...project,
      name: titleRole.name || preferred || role,
      role: titleRole.role || (preferred === role ? project?.role : role),
    };
  }

  private dedupeProjects(projects: any[]) {
    const seen = new Set<string>();
    return projects.filter((project) => {
      const name = String(project?.name || '').trim();
      if (!name) return false;
      if (this.isBadProjectName(name)) return false;
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private isBadProjectName(name: string) {
    return (
      /^\d{1,3}$/.test(name) ||
      this.isDateRangeLine(name) ||
      /^(负责|实现|支持|开发|参与|主要|搭建|完成|涉及|使用|基于|通过)/.test(
        name,
      )
    );
  }

  private dedupeEducation(records: any[]) {
    const seen = new Set<string>();
    return records
      .map((record) => this.normalizeParsedEducation(record))
      .filter((record) => {
        const school = String(record?.school || '').trim();
        if (!school) return false;
        const key = `${school}|${record?.degree || ''}|${record?.major || ''}`
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  private isSparseParsedResume(data: any) {
    return (
      !data?.name &&
      !data?.email &&
      !data?.phone &&
      !data?.educationRecords?.length &&
      !data?.workExperiences?.length &&
      !data?.projectExperiences?.length &&
      !data?.skillRecords?.length &&
      !data?.certificateRecords?.length
    );
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    message: string,
  ): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`${message} after ${timeoutMs}ms`)),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
