import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

export type ResumeTemplate =
  | 'modern'
  | 'classic'
  | 'compact'
  | 'deedy'
  | 'orbit'
  | 'markdown'
  | 'academic'
  | 'elegant'
  | 'typst'
  | 'ats'
  | 'executive'
  | 'creative';

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

const validTemplates: ResumeTemplate[] = [
  'modern',
  'classic',
  'compact',
  'deedy',
  'orbit',
  'markdown',
  'academic',
  'elegant',
  'typst',
  'ats',
  'executive',
  'creative',
];
const templateAliases: Record<string, ResumeTemplate> = {
  sidebar: 'orbit',
  minimal: 'markdown',
  mono: 'ats',
  tech: 'deedy',
  professional: 'classic',
  simple: 'markdown',
};

@Injectable()
export class PdfService {
  normalizeTemplate(value?: string): ResumeTemplate {
    if (value && templateAliases[value]) return templateAliases[value];
    return validTemplates.includes(value as ResumeTemplate) ? (value as ResumeTemplate) : 'modern';
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

    <div class="resume-body">
      ${selected === 'deedy' || selected === 'orbit'
        ? `
          <aside>
            ${this.section('个人简介', contentSummary || profile.summary)}
            ${this.skillsSection(parsedSkills)}
            ${this.certificatesSection(parsedCertificates)}
          </aside>
          <div class="main-column">
            ${this.itemsSection('工作经历', parsedWorkExperiences, 'work')}
            ${this.itemsSection('项目经历', parsedProjectExperiences, 'project')}
            ${this.section('自我评价', contentSelfEvaluation)}
          </div>
        `
        : `
          ${this.section('个人简介', contentSummary || profile.summary)}
          ${this.skillsSection(parsedSkills)}
          ${this.itemsSection('工作经历', parsedWorkExperiences, 'work')}
          ${this.itemsSection('项目经历', parsedProjectExperiences, 'project')}
          ${this.certificatesSection(parsedCertificates)}
          ${this.section('自我评价', contentSelfEvaluation)}
        `}
    </div>
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
      ? item.title || item.company || item.companyName || '工作经历'
      : item.name || item.projectName || item.title || '项目经历';
    const sub = type === 'work' ? item.company || item.companyName : item.role;
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
      .contact { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; color: var(--muted); font-size: 9.5pt; white-space: nowrap; }
      .resume-body { display: block; }
      section { margin-top: 14px; break-inside: avoid; }
      h2 { margin: 0 0 8px; padding-bottom: 4px; color: var(--heading); border-bottom: 1px solid #d8dee9; font-size: 13pt; }
      h3 { margin: 0; color: #172033; font-size: 11.5pt; }
      .paragraph { margin: 6px 0 0; white-space: pre-wrap; }
      .skills, .tech { display: flex; flex-wrap: wrap; gap: 6px; }
      .skills span, .tech span { border: 1px solid var(--tag-border); background: var(--tag-bg); color: var(--tag-text); padding: 3px 8px; border-radius: 4px; font-size: 9.5pt; }
      .item { margin-bottom: 11px; break-inside: avoid; }
      .item-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
      .sub { margin: 2px 0 0; color: var(--accent); font-weight: 600; }
      .date { color: var(--muted); font-size: 9.5pt; white-space: nowrap; }
      ul { margin: 6px 0 0 18px; padding: 0; }
      li { margin: 2px 0; }
      .plain-list { display: flex; flex-wrap: wrap; gap: 8px 18px; list-style: none; margin-left: 0; }
      @page { size: A4; margin: 0; }
      @media print { body { background: #fff; } .resume { margin: 0; box-shadow: none; } }
    `;

    const themes: Record<ResumeTemplate, string> = {
      modern: `:root { --accent: #2563eb; --heading: #1e3a5f; --muted: #64748b; --tag-bg: #eef4ff; --tag-border: #bfdbfe; --tag-text: #1d4ed8; } .resume { box-shadow: 0 14px 40px rgba(15, 23, 42, .12); }`,
      classic: `:root { --accent: #334155; --heading: #111827; --muted: #6b7280; --tag-bg: #f8fafc; --tag-border: #cbd5e1; --tag-text: #334155; } h1 { font-family: Georgia, "Times New Roman", serif; } .resume-header { border-bottom-width: 1px; }`,
      compact: `:root { --accent: #0f766e; --heading: #134e4a; --muted: #64748b; --tag-bg: #ecfdf5; --tag-border: #99f6e4; --tag-text: #0f766e; } body { font-size: 9.8pt; line-height: 1.45; } .resume { padding: 13mm 15mm; } section { margin-top: 10px; } h1 { font-size: 22pt; } h2 { font-size: 11.8pt; } .item { margin-bottom: 8px; }`,
      deedy: `:root { --accent: #0284c7; --heading: #0f172a; --muted: #64748b; --tag-bg: #e0f2fe; --tag-border: #7dd3fc; --tag-text: #0369a1; } .resume-body { display: grid; grid-template-columns: 58mm 1fr; gap: 10mm; } aside { border-right: 1px solid #dbeafe; padding-right: 8mm; }`,
      orbit: `:root { --accent: #334155; --heading: #0f172a; --muted: #64748b; --tag-bg: #e2e8f0; --tag-border: #94a3b8; --tag-text: #1e293b; } .resume { padding: 0; display: grid; grid-template-columns: 62mm 1fr; } .resume-header { grid-column: 1 / 3; padding: 14mm 16mm 8mm; margin: 0; } .resume-body { grid-column: 1 / 3; display: grid; grid-template-columns: 62mm 1fr; } aside { background: #1e293b; color: #e2e8f0; padding: 8mm; } aside h2, aside p, aside li { color: #e2e8f0; } aside h2 { border-bottom-color: #64748b; } .main-column { padding: 8mm 14mm 14mm; }`,
      markdown: `:root { --accent: #18181b; --heading: #09090b; --muted: #52525b; --tag-bg: #fafafa; --tag-border: #d4d4d8; --tag-text: #18181b; } body { background: #fff; } .resume { box-shadow: none; } h2 { border-bottom: 1px dashed #d4d4d8; }`,
      academic: `:root { --accent: #4f46e5; --heading: #312e81; --muted: #64748b; --tag-bg: #eef2ff; --tag-border: #a5b4fc; --tag-text: #4338ca; } .resume-header { border-bottom: 3px double #a5b4fc; }`,
      elegant: `:root { --accent: #be123c; --heading: #881337; --muted: #64748b; --tag-bg: #fff1f2; --tag-border: #fecdd3; --tag-text: #be123c; } .resume { box-shadow: 0 14px 40px rgba(190, 18, 60, .10); } h1 { font-family: Georgia, "Times New Roman", serif; }`,
      typst: `:root { --accent: #0891b2; --heading: #164e63; --muted: #64748b; --tag-bg: #ecfeff; --tag-border: #67e8f9; --tag-text: #0e7490; } .resume { border-top: 6px solid #0891b2; } h2 { border-bottom-color: #a5f3fc; }`,
      ats: `:root { --accent: #111827; --heading: #111827; --muted: #4b5563; --tag-bg: #f5f5f5; --tag-border: #d4d4d4; --tag-text: #111827; } body { background: #fff; color: #111827; } .resume { box-shadow: none; padding: 14mm; } .skills span, .tech span { border-radius: 0; }`,
      executive: `:root { --accent: #b45309; --heading: #78350f; --muted: #64748b; --tag-bg: #fffbeb; --tag-border: #fcd34d; --tag-text: #b45309; } .resume { box-shadow: 0 14px 40px rgba(120, 53, 15, .10); }`,
      creative: `:root { --accent: #7e22ce; --heading: #581c87; --muted: #64748b; --tag-bg: #faf5ff; --tag-border: #d8b4fe; --tag-text: #7e22ce; } .resume-header { border-bottom: 2px solid #7e22ce; }`,
    };

    return `${base}\n${themes[template]}`;
  }
}
