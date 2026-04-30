import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

export type ResumeTemplate =
  | 'azurill'
  | 'bronzor'
  | 'chikorita'
  | 'ditto'
  | 'gengar'
  | 'onyx'
  | 'pikachu'
  | 'rhyhorn'
  | 'ditgar'
  | 'meowth';

interface ResumeData {
  profile: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  educationRecords?: EducationItem[];
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

interface EducationItem {
  school?: string;
  degree?: string;
  major?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  description?: string;
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

interface ParsedResume extends ResumeData {
  educationRecords: EducationItem[];
  contentSkills: string[];
  contentWorkExperiences: ResumeItem[];
  contentProjectExperiences: ResumeItem[];
  contentCertificates: string[];
}

const validTemplates: ResumeTemplate[] = [
  'azurill',
  'bronzor',
  'chikorita',
  'ditto',
  'gengar',
  'onyx',
  'pikachu',
  'rhyhorn',
  'ditgar',
  'meowth',
];

const templateAliases: Record<string, ResumeTemplate> = {
  modern: 'azurill',
  classic: 'bronzor',
  compact: 'meowth',
  deedy: 'azurill',
  orbit: 'gengar',
  markdown: 'onyx',
  academic: 'bronzor',
  elegant: 'chikorita',
  typst: 'onyx',
  ats: 'meowth',
  executive: 'ditgar',
  creative: 'ditto',
  sidebar: 'gengar',
  minimal: 'onyx',
  mono: 'meowth',
  tech: 'azurill',
  professional: 'bronzor',
  simple: 'onyx',
};

@Injectable()
export class PdfService {
  normalizeTemplate(value?: string): ResumeTemplate {
    if (value && templateAliases[value]) return templateAliases[value];
    return validTemplates.includes(value as ResumeTemplate) ? (value as ResumeTemplate) : 'azurill';
  }

  async generatePdf(resume: ResumeData, template?: string): Promise<Buffer> {
    const html = this.generateHtml(resume, template);
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluateHandle('document.fonts.ready').catch(() => undefined);
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  generateHtml(resume: ResumeData, template?: string): string {
    const selected = this.normalizeTemplate(template);
    const parsed = this.parseResume(resume);
    const title = `${parsed.profile.name || 'Resume'} - 简历`;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escape(title)}</title>
  <style>${this.styles(selected)}</style>
</head>
<body class="template-${selected}">
  ${this.renderTemplate(parsed, selected)}
</body>
</html>`;
  }

  private parseResume(resume: ResumeData): ParsedResume {
    return {
      ...resume,
      educationRecords: resume.educationRecords || [],
      contentSkills: this.parseJsonArray<string>(resume.contentSkills),
      contentWorkExperiences: this.parseJsonArray<ResumeItem>(resume.contentWorkExperiences).map((exp) => ({
        ...exp,
        highlights: this.parseJsonArray<string>(exp.highlights),
        techStack: this.parseJsonArray<string>(exp.techStack),
      })),
      contentProjectExperiences: this.parseJsonArray<ResumeItem>(resume.contentProjectExperiences).map((proj) => ({
        ...proj,
        highlights: this.parseJsonArray<string>(proj.highlights),
        techStack: this.parseJsonArray<string>(proj.techStack),
      })),
      contentCertificates: this.parseJsonArray<string>(resume.contentCertificates),
    };
  }

  private renderTemplate(resume: ParsedResume, template: ResumeTemplate) {
    const summary = resume.contentSummary || resume.profile.summary;
    const target = this.target(resume);

    if (template === 'bronzor') {
      return `<main class="resume bronzor">
        ${this.header(resume, target, 'center')}
        ${this.gridSection('个人简介', this.paragraph(summary))}
        ${this.gridSection('技能特长', this.skillTags(resume.contentSkills))}
        ${this.gridSection('工作经历', this.items(resume.contentWorkExperiences, 'work', 'compact'))}
        ${this.gridSection('项目经历', this.items(resume.contentProjectExperiences, 'project', 'compact'))}
        ${this.gridSection('证书/奖项', this.plainList(resume.contentCertificates))}
        ${this.gridSection('自我评价', this.paragraph(resume.contentSelfEvaluation))}
      </main>`;
    }

    if (template === 'chikorita') {
      return `<main class="resume split right-rail">
        <section class="main">
          ${this.header(resume, target)}
          ${this.section('个人简介', this.paragraph(summary))}
          ${this.section('工作经历', this.items(resume.contentWorkExperiences, 'work'))}
          ${this.section('项目经历', this.items(resume.contentProjectExperiences, 'project'))}
          ${this.section('自我评价', this.paragraph(resume.contentSelfEvaluation))}
        </section>
        <aside class="rail">
          ${this.avatar(resume)}
          ${this.contact(resume, true)}
          ${this.section('技能特长', this.skillTags(resume.contentSkills, true))}
          ${this.section('证书/奖项', this.plainList(resume.contentCertificates))}
        </aside>
      </main>`;
    }

    if (template === 'ditto') {
      return `<main class="resume no-pad">
        <header class="banner"><h1>${this.escape(resume.profile.name || '未命名')}</h1>${target ? `<p>${this.escape(`求职意向：${target}`)}</p>` : ''}</header>
        <div class="contact-strip">${this.contactInline(resume)}</div>
        <div class="columns">
          <aside>${this.section('个人简介', this.paragraph(summary))}${this.section('技能特长', this.skillTags(resume.contentSkills))}${this.section('证书/奖项', this.plainList(resume.contentCertificates))}</aside>
          <section>${this.section('工作经历', this.items(resume.contentWorkExperiences, 'work'))}${this.section('项目经历', this.items(resume.contentProjectExperiences, 'project'))}${this.section('自我评价', this.paragraph(resume.contentSelfEvaluation))}</section>
        </div>
      </main>`;
    }

    if (template === 'gengar' || template === 'ditgar') {
      return `<main class="resume split left-rail ${template}">
        <aside class="rail">
          ${this.avatar(resume)}
          <h1>${this.escape(resume.profile.name || '未命名')}</h1>
          ${target ? `<p class="target-light">${this.escape(`求职意向：${target}`)}</p>` : ''}
          ${this.contact(resume, true)}
          ${this.section('技能特长', this.skillTags(resume.contentSkills, true))}
          ${this.section('证书/奖项', this.plainList(resume.contentCertificates))}
        </aside>
        <section class="main">
          ${summary ? `<div class="summary-card">${this.section('个人简介', this.paragraph(summary))}</div>` : ''}
          ${this.section('工作经历', this.items(resume.contentWorkExperiences, 'work', template === 'ditgar' ? 'bordered' : undefined))}
          ${this.section('项目经历', this.items(resume.contentProjectExperiences, 'project', template === 'ditgar' ? 'bordered' : undefined))}
          ${this.section('自我评价', this.paragraph(resume.contentSelfEvaluation))}
        </section>
      </main>`;
    }

    if (template === 'pikachu') {
      return `<main class="resume split soft-rail">
        <aside class="soft">${this.avatar(resume)}${this.contact(resume)}${this.section('技能特长', this.skillTags(resume.contentSkills))}${this.section('证书/奖项', this.plainList(resume.contentCertificates))}</aside>
        <section class="main">
          <header class="name-card"><h1>${this.escape(resume.profile.name || '未命名')}</h1>${target ? `<p>${this.escape(`求职意向：${target}`)}</p>` : ''}</header>
          ${this.section('个人简介', this.paragraph(summary))}
          ${this.section('工作经历', this.items(resume.contentWorkExperiences, 'work'))}
          ${this.section('项目经历', this.items(resume.contentProjectExperiences, 'project'))}
          ${this.section('自我评价', this.paragraph(resume.contentSelfEvaluation))}
        </section>
      </main>`;
    }

    if (template === 'meowth') {
      return `<main class="resume meowth">
        <header class="meowth-head"><h1>${this.escape(resume.profile.name || '未命名')}</h1>${target ? `<p>${this.escape(`求职意向：${target}`)}</p>` : ''}<div>${this.contactInline(resume)}</div></header>
        ${this.section('个人简介', this.paragraph(summary))}
        ${this.section('技能特长', this.skillTags(resume.contentSkills))}
        ${this.section('工作经历', this.items(resume.contentWorkExperiences, 'work', 'compact'))}
        ${this.section('项目经历', this.items(resume.contentProjectExperiences, 'project', 'compact'))}
        ${this.section('证书/奖项', this.plainList(resume.contentCertificates))}
        ${this.section('自我评价', this.paragraph(resume.contentSelfEvaluation))}
      </main>`;
    }

    if (template === 'rhyhorn') {
      return `<main class="resume rhyhorn">
        <header class="rhyhorn-head"><div><h1>${this.escape(resume.profile.name || '未命名')}</h1>${target ? `<p>${this.escape(`求职意向：${target}`)}</p>` : ''}</div>${this.avatar(resume)}</header>
        <div class="contact-bordered">${this.contactInline(resume)}</div>
        ${this.standardSections(resume, summary)}
      </main>`;
    }

    if (template === 'onyx') {
      return `<main class="resume onyx">
        ${this.header(resume, target)}
        ${this.standardSections(resume, summary)}
      </main>`;
    }

    return `<main class="resume azurill">
      ${this.header(resume, target, 'center')}
      <div class="columns">
        <aside>${this.avatar(resume)}${this.section('个人简介', this.paragraph(summary))}${this.section('技能特长', this.skillTags(resume.contentSkills))}${this.section('证书/奖项', this.plainList(resume.contentCertificates))}</aside>
        <section class="timeline">${this.section('工作经历', this.items(resume.contentWorkExperiences, 'work', 'timeline'))}${this.section('项目经历', this.items(resume.contentProjectExperiences, 'project', 'timeline'))}${this.section('自我评价', this.paragraph(resume.contentSelfEvaluation))}</section>
      </div>
    </main>`;
  }

  private standardSections(resume: ParsedResume, summary?: string) {
    return `${this.section('个人简介', this.paragraph(summary))}
      ${this.section('技能特长', this.skillTags(resume.contentSkills))}
      ${this.section('工作经历', this.items(resume.contentWorkExperiences, 'work'))}
      ${this.section('项目经历', this.items(resume.contentProjectExperiences, 'project'))}
      ${this.section('证书/奖项', this.plainList(resume.contentCertificates))}
      ${this.section('自我评价', this.paragraph(resume.contentSelfEvaluation))}`;
  }

  private header(resume: ParsedResume, target?: string, align?: 'center') {
    return `<header class="resume-header ${align === 'center' ? 'center' : ''}">
      <h1>${this.escape(resume.profile.name || '未命名')}</h1>
      ${target ? `<p class="target">${this.escape(`求职意向：${target}`)}</p>` : ''}
      ${this.contactInline(resume)}
    </header>`;
  }

  private target(resume: ParsedResume) {
    return resume.jobTarget?.parsedJobTitle
      ? `${resume.jobTarget.parsedJobTitle}${resume.jobTarget.parsedCompanyName ? ` @ ${resume.jobTarget.parsedCompanyName}` : ''}`
      : '';
  }

  private gridSection(title: string, html: string) {
    if (!html) return '';
    return `<section class="grid-section"><h2>${this.escape(title)}</h2><div>${html}</div></section>`;
  }

  private section(title: string, html: string) {
    if (!html) return '';
    return `<section><h2>${this.escape(title)}</h2>${html}</section>`;
  }

  private paragraph(text?: string) {
    if (!text?.trim()) return '';
    return `<p class="paragraph">${this.escape(text)}</p>`;
  }

  private contactInline(resume: ParsedResume) {
    return `<div class="contact-inline">${[resume.profile.email, resume.profile.phone, resume.profile.location]
      .filter(Boolean)
      .map((value) => `<span>${this.escape(value)}</span>`)
      .join('')}</div>`;
  }

  private contact(resume: ParsedResume, inverted = false) {
    const items = [resume.profile.email, resume.profile.phone, resume.profile.location].filter(Boolean);
    if (!items.length) return '';
    return `<div class="contact ${inverted ? 'inverted' : ''}">${items.map((value) => `<p>${this.escape(value)}</p>`).join('')}</div>`;
  }

  private avatar(resume: ParsedResume) {
    return `<div class="avatar">${this.escape((resume.profile.name || '简历').slice(0, 2))}</div>`;
  }

  private skillTags(skills: string[], inverted = false) {
    if (!skills.length) return '';
    return `<div class="skills ${inverted ? 'inverted' : ''}">${skills.map((skill) => `<span>${this.escape(skill)}</span>`).join('')}</div>`;
  }

  private plainList(items: string[]) {
    if (!items.length) return '';
    return `<ul class="plain-list">${items.map((item) => `<li>${this.escape(item)}</li>`).join('')}</ul>`;
  }

  private items(items: ResumeItem[], type: 'work' | 'project', variant?: 'compact' | 'timeline' | 'bordered') {
    if (!items.length) return '';
    return `<div class="items ${variant || ''}">${items.map((item) => this.resumeItem(item, type)).join('')}</div>`;
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

  private escape(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private styles(template: ResumeTemplate) {
    const theme = {
      azurill: ['#2563eb', '#dbeafe', '#1e3a8a', '#f8fafc'],
      bronzor: ['#525252', '#e7e5e4', '#292524', '#fafaf9'],
      chikorita: ['#059669', '#d1fae5', '#065f46', '#ecfdf5'],
      ditto: ['#7c3aed', '#ede9fe', '#4c1d95', '#f5f3ff'],
      gengar: ['#334155', '#e2e8f0', '#0f172a', '#f8fafc'],
      onyx: ['#18181b', '#e4e4e7', '#09090b', '#fafafa'],
      pikachu: ['#d97706', '#fef3c7', '#92400e', '#fffbeb'],
      rhyhorn: ['#0891b2', '#cffafe', '#155e75', '#ecfeff'],
      ditgar: ['#be123c', '#ffe4e6', '#881337', '#fff1f2'],
      meowth: ['#111827', '#e5e5e5', '#111827', '#fafafa'],
    }[template];

    return `
      :root { --accent: ${theme[0]}; --accent-soft: ${theme[1]}; --accent-ink: ${theme[2]}; --panel: ${theme[3]}; --muted: #64748b; --heading: #111827; }
      * { box-sizing: border-box; }
      html, body { width: 210mm; min-height: 297mm; }
      body { margin: 0; background: #fff; color: #172033; font-family: "Noto Sans CJK SC", "Noto Sans CJK", "Source Han Sans SC", "WenQuanYi Micro Hei", "Microsoft YaHei", Arial, sans-serif; font-size: 10.5pt; line-height: 1.55; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .resume { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 18mm; }
      .no-pad { padding: 0; }
      h1 { margin: 0; color: var(--heading); font-size: 27pt; line-height: 1.1; letter-spacing: 0; }
      h2 { margin: 0 0 7px; padding-bottom: 4px; border-bottom: 1px solid var(--accent-soft); color: var(--heading); font-size: 12.5pt; }
      h3 { margin: 0; color: #111827; font-size: 11.2pt; }
      section { margin-top: 14px; break-inside: avoid; }
      .paragraph { margin: 5px 0 0; white-space: pre-wrap; color: #334155; }
      .resume-header { padding-bottom: 14px; border-bottom: 2px solid var(--accent); }
      .resume-header.center { text-align: center; }
      .target { margin: 7px 0 0; color: var(--accent); font-weight: 600; }
      .target-light { margin: 7px 0 0; color: rgba(255,255,255,.85); font-weight: 600; }
      .contact-inline { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 8px; color: var(--muted); font-size: 9.5pt; }
      .center .contact-inline { justify-content: center; }
      .contact { margin-top: 12px; color: var(--muted); font-size: 9.5pt; }
      .contact p { margin: 3px 0; }
      .contact.inverted { color: rgba(255,255,255,.86); }
      .columns { display: grid; grid-template-columns: 58mm 1fr; gap: 10mm; padding-top: 14px; }
      .timeline { border-left: 1px solid var(--accent-soft); padding-left: 8mm; }
      .timeline .item { position: relative; }
      .timeline .item:before { content: ""; position: absolute; left: -10.5mm; top: 4px; width: 8px; height: 8px; border-radius: 99px; background: var(--accent); border: 2px solid #fff; }
      .split { display: grid; grid-template-columns: 62mm 1fr; padding: 0; }
      .right-rail { grid-template-columns: 1fr 62mm; }
      .main { padding: 18mm; }
      .rail { min-height: 297mm; padding: 18mm 8mm; background: var(--accent); color: #fff; }
      .left-rail .rail { background: var(--accent-ink); }
      .ditgar .rail { background: var(--accent); }
      .rail h1, .rail h2, .rail p, .rail li { color: #fff; }
      .rail h2 { border-bottom-color: rgba(255,255,255,.28); }
      .soft { min-height: 297mm; padding: 18mm 8mm; background: var(--panel); }
      .summary-card { background: var(--panel); padding: 12px 16px; }
      .banner { background: var(--accent); color: #fff; padding: 20mm 18mm 12mm; }
      .banner h1, .banner p { color: #fff; }
      .banner p { margin: 8px 0 0; font-weight: 600; }
      .contact-strip { padding: 4mm 18mm; border-bottom: 1px solid var(--accent-soft); }
      .name-card { margin-bottom: 14px; padding: 14px 18px; border-radius: 6px; background: var(--accent); color: #fff; }
      .name-card h1, .name-card p { color: #fff; }
      .rhyhorn-head { display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: center; padding-bottom: 14px; border-bottom: 1px solid var(--accent-soft); }
      .contact-bordered .contact-inline span { padding: 0 12px; border-left: 1px solid var(--accent-soft); }
      .contact-bordered .contact-inline span:first-child { padding-left: 0; border-left: 0; }
      .meowth { font-size: 9.7pt; line-height: 1.42; padding: 14mm 16mm; box-shadow: none; }
      .meowth-head { text-align: center; padding-bottom: 10px; border-bottom: 1px solid #111827; }
      .meowth h1 { font-size: 23pt; }
      .meowth h2 { text-transform: uppercase; font-size: 10.5pt; border-bottom-color: #111827; }
      .grid-section { display: grid; grid-template-columns: 34mm 1fr; gap: 8mm; margin-top: 0; padding: 12px 0; border-top: 1px solid var(--accent-soft); }
      .grid-section h2 { border: 0; color: var(--accent); font-size: 10pt; text-transform: uppercase; }
      .avatar { display: flex; align-items: center; justify-content: center; width: 21mm; height: 21mm; margin-bottom: 12px; border-radius: 999px; border: 1px solid var(--accent-soft); background: var(--panel); color: var(--accent); font-size: 16pt; font-weight: 700; }
      .rail .avatar { border-color: rgba(255,255,255,.35); background: rgba(255,255,255,.14); color: #fff; }
      .skills, .tech { display: flex; flex-wrap: wrap; gap: 6px; }
      .skills span, .tech span { border: 1px solid var(--accent-soft); background: var(--panel); color: var(--accent-ink); padding: 3px 8px; font-size: 9pt; }
      .skills.inverted span { border-color: rgba(255,255,255,.30); background: rgba(255,255,255,.14); color: #fff; }
      .item { margin-bottom: 11px; break-inside: avoid; }
      .items.compact .item { margin-bottom: 8px; }
      .items.bordered .item { padding-left: 10px; border-left: 4px solid var(--accent-soft); }
      .item-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
      .sub { margin: 2px 0 0; color: var(--accent); font-weight: 600; }
      .date { color: var(--muted); font-size: 9pt; white-space: nowrap; }
      ul { margin: 5px 0 0 18px; padding: 0; }
      li { margin: 2px 0; }
      .plain-list { display: flex; flex-wrap: wrap; gap: 6px 16px; list-style: none; margin-left: 0; }
      @page { size: A4; margin: 0; }
      @media print { body { background: #fff; } .resume { margin: 0; } }
    `;
  }
}
