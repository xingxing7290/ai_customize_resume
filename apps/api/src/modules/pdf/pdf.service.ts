import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

export type ResumeTemplate = 'modern' | 'classic' | 'compact';

interface ResumeData {
  profile: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  contentSummary?: string;
  contentSkills?: string | string[] | null;
  contentWorkExperiences?: string | ResumeItem[] | null;
  contentProjectExperiences?: string | ResumeItem[] | null;
  contentCertificates?: string | string[] | null;
  contentSelfEvaluation?: string;
  jobTarget?: {
    parsedJobTitle?: string;
    parsedCompanyName?: string;
  };
}

interface ResumeItem {
  company?: string;
  companyName?: string;
  title?: string;
  name?: string;
  projectName?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  highlights?: string[] | string;
  techStack?: string[] | string;
}

@Injectable()
export class PdfService {
  normalizeTemplate(value?: string): ResumeTemplate {
    return value === 'classic' || value === 'compact' ? value : 'modern';
  }

  async generatePdf(resume: ResumeData, template?: string): Promise<Buffer> {
    const html = this.generateHtml(resume, template);
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  generateHtml(resume: ResumeData, template?: string): string {
    const selected = this.normalizeTemplate(template);
    const { profile, contentSummary, contentSelfEvaluation, jobTarget } = resume;
    const parsedSkills = this.parseJsonArray<string>(resume.contentSkills);
    const parsedWorkExperiences = this.parseJsonArray<ResumeItem>(resume.contentWorkExperiences).map((exp) => ({
      ...exp,
      highlights: this.parseJsonArray<string>(exp.highlights),
      techStack: this.parseJsonArray<string>(exp.techStack),
    }));
    const parsedProjectExperiences = this.parseJsonArray<ResumeItem>(resume.contentProjectExperiences).map((proj) => ({
      ...proj,
      highlights: this.parseJsonArray<string>(proj.highlights),
      techStack: this.parseJsonArray<string>(proj.techStack),
    }));
    const parsedCertificates = this.parseJsonArray<string>(resume.contentCertificates);

    const title = `${profile.name || 'Resume'} - 简历`;
    const target = jobTarget?.parsedJobTitle
      ? `求职意向：${jobTarget.parsedJobTitle}${jobTarget.parsedCompanyName ? ` @ ${jobTarget.parsedCompanyName}` : ''}`
      : '';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escape(title)}</title>
  <style>${this.styles(selected)}</style>
</head>
<body class="template-${selected}">
  <main class="resume">
    <header class="resume-header">
      <div>
        <h1>${this.escape(profile.name || '未命名')}</h1>
        ${target ? `<p class="target">${this.escape(target)}</p>` : ''}
      </div>
      <div class="contact">
        ${this.contactLine(profile.email)}
        ${this.contactLine(profile.phone)}
        ${this.contactLine(profile.location)}
      </div>
    </header>

    ${this.section('个人简介', contentSummary || profile.summary)}
    ${this.skillsSection(parsedSkills)}
    ${this.itemsSection('工作经历', parsedWorkExperiences, 'work')}
    ${this.itemsSection('项目经历', parsedProjectExperiences, 'project')}
    ${this.certificatesSection(parsedCertificates)}
    ${this.section('自我评价', contentSelfEvaluation)}
  </main>
</body>
</html>`;
  }

  private parseJsonArray<T>(value: unknown): T[] {
    if (!value) return [];
    if (Array.isArray(value)) return value as T[];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed as T[];
      } catch {
        return trimmed
          .split(/\r?\n|、|,|，/)
          .map((item) => item.trim())
          .filter(Boolean) as T[];
      }
    }
    return [];
  }

  private contactLine(value?: string) {
    return value ? `<span>${this.escape(value)}</span>` : '';
  }

  private section(title: string, text?: string) {
    if (!text?.trim()) return '';
    return `<section><h2>${this.escape(title)}</h2><p class="paragraph">${this.escape(text)}</p></section>`;
  }

  private skillsSection(skills: string[]) {
    if (!skills.length) return '';
    return `<section><h2>技能特长</h2><div class="skills">${skills.map((skill) => `<span>${this.escape(skill)}</span>`).join('')}</div></section>`;
  }

  private certificatesSection(certificates: string[]) {
    if (!certificates.length) return '';
    return `<section><h2>证书/奖项</h2><ul class="plain-list">${certificates.map((cert) => `<li>${this.escape(cert)}</li>`).join('')}</ul></section>`;
  }

  private itemsSection(title: string, items: ResumeItem[], type: 'work' | 'project') {
    if (!items.length) return '';
    return `<section><h2>${this.escape(title)}</h2>${items.map((item) => this.resumeItem(item, type)).join('')}</section>`;
  }

  private resumeItem(item: ResumeItem, type: 'work' | 'project') {
    const heading = type === 'work'
      ? (item.title || item.company || item.companyName || '工作经历')
      : (item.name || item.projectName || item.title || '项目经历');
    const sub = type === 'work'
      ? item.company || item.companyName
      : item.role;
    const date = [item.startDate, item.endDate || (item.startDate ? '至今' : '')].filter(Boolean).join(' - ');
    const highlights = this.parseJsonArray<string>(item.highlights);
    const techStack = this.parseJsonArray<string>(item.techStack);

    return `<article class="item">
      <div class="item-head">
        <div>
          <h3>${this.escape(heading)}</h3>
          ${sub ? `<p class="sub">${this.escape(sub)}</p>` : ''}
        </div>
        ${date ? `<span class="date">${this.escape(date)}</span>` : ''}
      </div>
      ${item.description ? `<p class="paragraph">${this.escape(item.description)}</p>` : ''}
      ${highlights.length ? `<ul>${highlights.map((line) => `<li>${this.escape(line)}</li>`).join('')}</ul>` : ''}
      ${techStack.length ? `<div class="tech">${techStack.map((tech) => `<span>${this.escape(tech)}</span>`).join('')}</div>` : ''}
    </article>`;
  }

  private escape(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private styles(template: ResumeTemplate) {
    const base = `
      * { box-sizing: border-box; }
      body { margin: 0; background: #f5f7fb; color: #172033; font-family: "Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif; font-size: 10.5pt; line-height: 1.55; }
      .resume { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 18mm; }
      .resume-header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 14px; margin-bottom: 16px; border-bottom: 2px solid var(--accent); }
      h1 { margin: 0; font-size: 25pt; line-height: 1.1; color: var(--heading); letter-spacing: 0; }
      .target { margin: 8px 0 0; color: var(--accent); font-weight: 600; }
      .contact { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; color: #526071; font-size: 9.5pt; white-space: nowrap; }
      section { margin-top: 14px; break-inside: avoid; }
      h2 { margin: 0 0 8px; padding-bottom: 4px; color: var(--heading); border-bottom: 1px solid #d8dee9; font-size: 13pt; }
      h3 { margin: 0; color: #172033; font-size: 11.5pt; }
      .paragraph { margin: 6px 0 0; white-space: pre-wrap; }
      .skills, .tech { display: flex; flex-wrap: wrap; gap: 6px; }
      .skills span, .tech span { border: 1px solid var(--tag-border); background: var(--tag-bg); color: var(--tag-text); padding: 3px 8px; border-radius: 4px; font-size: 9.5pt; }
      .item { margin-bottom: 11px; break-inside: avoid; }
      .item-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
      .sub { margin: 2px 0 0; color: var(--accent); font-weight: 600; }
      .date { color: #687589; font-size: 9.5pt; white-space: nowrap; }
      ul { margin: 6px 0 0 18px; padding: 0; }
      li { margin: 2px 0; }
      .plain-list { display: flex; flex-wrap: wrap; gap: 8px 18px; list-style: none; margin-left: 0; }
      @page { size: A4; margin: 0; }
      @media print { body { background: #fff; } .resume { margin: 0; box-shadow: none; } }
    `;

    const themes: Record<ResumeTemplate, string> = {
      modern: `:root { --accent: #2563eb; --heading: #1e3a5f; --tag-bg: #eef4ff; --tag-border: #bfdbfe; --tag-text: #1d4ed8; } .resume { box-shadow: 0 14px 40px rgba(15, 23, 42, .12); }`,
      classic: `:root { --accent: #334155; --heading: #111827; --tag-bg: #f8fafc; --tag-border: #cbd5e1; --tag-text: #334155; } body { color: #1f2937; } h1 { font-family: Georgia, "Times New Roman", serif; } .resume-header { border-bottom-width: 1px; }`,
      compact: `:root { --accent: #0f766e; --heading: #134e4a; --tag-bg: #ecfdf5; --tag-border: #99f6e4; --tag-text: #0f766e; } body { font-size: 9.8pt; line-height: 1.45; } .resume { padding: 13mm 15mm; } section { margin-top: 10px; } h1 { font-size: 22pt; } h2 { font-size: 11.8pt; margin-bottom: 6px; } .item { margin-bottom: 8px; }`,
    };

    return `${base}\n${themes[template]}`;
  }
}
