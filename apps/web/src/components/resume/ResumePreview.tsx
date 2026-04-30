import type { ReactNode } from 'react';
import { resolveAssetUrl } from '@/lib/api';

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

export interface ResumePreviewData {
  profile: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    avatarUrl?: string;
    summary?: string;
  };
  jobTarget?: {
    parsedJobTitle?: string;
    parsedCompanyName?: string;
  };
  contentSummary?: string;
  educationRecords?: ResumeEducation[];
  contentSkills?: string[];
  contentWorkExperiences?: ResumeItem[];
  contentProjectExperiences?: ResumeItem[];
  contentCertificates?: string[];
  contentSelfEvaluation?: string;
}

export interface ResumeItem {
  company?: string;
  companyName?: string;
  title?: string;
  name?: string;
  projectName?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  highlights?: string[];
  techStack?: string[];
}

export interface ResumeEducation {
  school?: string;
  degree?: string;
  major?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  description?: string;
}

export interface ResumeTemplateMeta {
  id: ResumeTemplate;
  label: string;
  source: string;
  description: string;
}

export const resumeTemplates: ResumeTemplateMeta[] = [
  { id: 'azurill', label: 'Azurill', source: 'Reactive Resume', description: '居中页眉、左侧资料栏和右侧时间线经历。' },
  { id: 'bronzor', label: 'Bronzor', source: 'Reactive Resume', description: '五栏网格标题区，信息密度高且清晰。' },
  { id: 'chikorita', label: 'Chikorita', source: 'Reactive Resume', description: '右侧强调色栏，适合突出技能与证书。' },
  { id: 'ditto', label: 'Ditto', source: 'Reactive Resume', description: '大面积顶部色块，视觉识别度强。' },
  { id: 'gengar', label: 'Gengar', source: 'Reactive Resume', description: '深色左栏搭配高亮简介，适合资深候选人。' },
  { id: 'onyx', label: 'Onyx', source: 'Reactive Resume', description: '克制单栏布局，打印和 ATS 都友好。' },
  { id: 'pikachu', label: 'Pikachu', source: 'Reactive Resume', description: '侧栏资料区与主栏彩色名片式页眉。' },
  { id: 'rhyhorn', label: 'Rhyhorn', source: 'Reactive Resume', description: '横向页眉、边框联系信息和紧凑内容。' },
  { id: 'ditgar', label: 'Ditgar', source: 'Reactive Resume', description: 'Ditto 与 Gengar 混合风格，左栏更醒目。' },
  { id: 'meowth', label: 'Meowth', source: 'Reactive Resume', description: '中文友好的简洁单栏，适合正式投递。' },
];

const validTemplateIds = resumeTemplates.map((template) => template.id);
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

const templateStyles: Record<ResumeTemplate, string> = {
  azurill: 'border-slate-200 bg-white text-slate-800 [--accent:#2563eb] [--accent-soft:#dbeafe] [--accent-ink:#1e3a8a] [--heading:#111827] [--muted:#64748b] [--panel:#f8fafc]',
  bronzor: 'border-stone-200 bg-white text-stone-800 [--accent:#525252] [--accent-soft:#e7e5e4] [--accent-ink:#292524] [--heading:#1c1917] [--muted:#78716c] [--panel:#fafaf9]',
  chikorita: 'border-emerald-200 bg-white text-slate-800 [--accent:#059669] [--accent-soft:#d1fae5] [--accent-ink:#065f46] [--heading:#064e3b] [--muted:#64748b] [--panel:#ecfdf5]',
  ditto: 'border-violet-200 bg-white text-slate-800 [--accent:#7c3aed] [--accent-soft:#ede9fe] [--accent-ink:#4c1d95] [--heading:#111827] [--muted:#64748b] [--panel:#f5f3ff]',
  gengar: 'border-slate-300 bg-white text-slate-800 [--accent:#334155] [--accent-soft:#e2e8f0] [--accent-ink:#0f172a] [--heading:#0f172a] [--muted:#64748b] [--panel:#f8fafc]',
  onyx: 'border-zinc-200 bg-white text-zinc-900 [--accent:#18181b] [--accent-soft:#e4e4e7] [--accent-ink:#09090b] [--heading:#09090b] [--muted:#52525b] [--panel:#fafafa]',
  pikachu: 'border-amber-200 bg-white text-slate-800 [--accent:#d97706] [--accent-soft:#fef3c7] [--accent-ink:#92400e] [--heading:#111827] [--muted:#64748b] [--panel:#fffbeb]',
  rhyhorn: 'border-cyan-200 bg-white text-slate-800 [--accent:#0891b2] [--accent-soft:#cffafe] [--accent-ink:#155e75] [--heading:#164e63] [--muted:#64748b] [--panel:#ecfeff]',
  ditgar: 'border-rose-200 bg-white text-slate-800 [--accent:#be123c] [--accent-soft:#ffe4e6] [--accent-ink:#881337] [--heading:#111827] [--muted:#64748b] [--panel:#fff1f2]',
  meowth: 'border-neutral-300 bg-white text-neutral-900 [--accent:#111827] [--accent-soft:#e5e5e5] [--accent-ink:#111827] [--heading:#111827] [--muted:#525252] [--panel:#fafafa]',
};

export function normalizeTemplate(value?: string | null): ResumeTemplate {
  if (value && templateAliases[value]) return templateAliases[value];
  return validTemplateIds.includes(value as ResumeTemplate) ? (value as ResumeTemplate) : 'azurill';
}

export function ResumePreview({ resume, template = 'azurill' }: { resume: ResumePreviewData; template?: ResumeTemplate | string }) {
  const selected = normalizeTemplate(template);
  const target = resume.jobTarget?.parsedJobTitle
    ? `${resume.jobTarget.parsedJobTitle}${resume.jobTarget.parsedCompanyName ? ` @ ${resume.jobTarget.parsedCompanyName}` : ''}`
    : '';
  const sections = buildSections(resume);

  if (selected === 'bronzor') return <Bronzor resume={resume} target={target} sections={sections} />;
  if (selected === 'chikorita') return <Chikorita resume={resume} target={target} sections={sections} />;
  if (selected === 'ditto') return <Ditto resume={resume} target={target} sections={sections} />;
  if (selected === 'gengar') return <Gengar resume={resume} target={target} sections={sections} />;
  if (selected === 'onyx') return <Onyx resume={resume} target={target} sections={sections} />;
  if (selected === 'pikachu') return <Pikachu resume={resume} target={target} sections={sections} />;
  if (selected === 'rhyhorn') return <Rhyhorn resume={resume} target={target} sections={sections} />;
  if (selected === 'ditgar') return <Ditgar resume={resume} target={target} sections={sections} />;
  if (selected === 'meowth') return <Meowth resume={resume} target={target} sections={sections} />;
  return <Azurill resume={resume} target={target} sections={sections} />;
}

interface BuiltSections {
  summary?: string;
  skills: string[];
  education: ResumeEducation[];
  work: ResumeItem[];
  projects: ResumeItem[];
  certificates: string[];
  evaluation?: string;
}

function buildSections(resume: ResumePreviewData): BuiltSections {
  return {
    summary: resume.contentSummary || resume.profile.summary,
    skills: resume.contentSkills || [],
    education: resume.educationRecords || [],
    work: resume.contentWorkExperiences || [],
    projects: resume.contentProjectExperiences || [],
    certificates: resume.contentCertificates || [],
    evaluation: resume.contentSelfEvaluation,
  };
}

function Frame({ template, children, className = '' }: { template: ResumeTemplate; children: ReactNode; className?: string }) {
  return (
    <article className={`resume-preview resume-${template} mx-auto w-full max-w-[820px] overflow-hidden border ${templateStyles[template]} text-sm leading-relaxed shadow-sm print:shadow-none ${className}`}>
      {children}
    </article>
  );
}

function Azurill({ resume, target, sections }: TemplateProps) {
  return (
    <Frame template="azurill" className="p-8">
      <Header resume={resume} target={target} align="center" />
      <div className="mt-6 grid gap-7 md:grid-cols-[220px_1fr]">
        <aside className="space-y-5">
          <Avatar name={resume.profile.name} avatarUrl={resume.profile.avatarUrl} />
          <TextSection title="个人简介" text={sections.summary} />
          <EducationSection items={sections.education} />
          <SkillsSection skills={sections.skills} />
          <ListSection title="证书/奖项" items={sections.certificates} />
        </aside>
        <main className="space-y-6 border-l border-[var(--accent-soft)] pl-6">
          <ItemSection title="工作经历" items={sections.work} type="work" timeline />
          <ItemSection title="项目经历" items={sections.projects} type="project" timeline />
          <TextSection title="自我评价" text={sections.evaluation} />
        </main>
      </div>
    </Frame>
  );
}

function Bronzor({ resume, target, sections }: TemplateProps) {
  return (
    <Frame template="bronzor" className="p-8">
      <Header resume={resume} target={target} align="center" showAvatar />
      <main className="mt-6 space-y-0">
        <GridSection title="个人简介"><Paragraph text={sections.summary} /></GridSection>
        <GridSection title="教育经历"><EducationList items={sections.education} /></GridSection>
        <GridSection title="技能特长"><SkillTags skills={sections.skills} /></GridSection>
        <GridSection title="工作经历"><ItemList items={sections.work} type="work" compact /></GridSection>
        <GridSection title="项目经历"><ItemList items={sections.projects} type="project" compact /></GridSection>
        <GridSection title="证书/奖项"><PlainList items={sections.certificates} /></GridSection>
        <GridSection title="自我评价"><Paragraph text={sections.evaluation} /></GridSection>
      </main>
    </Frame>
  );
}

function Chikorita({ resume, target, sections }: TemplateProps) {
  return (
    <Frame template="chikorita" className="grid md:grid-cols-[1fr_235px]">
      <main className="space-y-6 p-8">
        <Header resume={resume} target={target} />
        <TextSection title="个人简介" text={sections.summary} />
        <EducationSection items={sections.education} />
        <ItemSection title="工作经历" items={sections.work} type="work" />
        <ItemSection title="项目经历" items={sections.projects} type="project" />
        <TextSection title="自我评价" text={sections.evaluation} />
      </main>
      <aside className="space-y-6 bg-[var(--accent)] p-7 text-white">
        <Avatar name={resume.profile.name} avatarUrl={resume.profile.avatarUrl} inverted />
        <ContactBlock resume={resume} inverted />
        <SidebarSection title="技能特长"><SkillTags skills={sections.skills} inverted /></SidebarSection>
        <SidebarSection title="证书/奖项"><PlainList items={sections.certificates} /></SidebarSection>
      </aside>
    </Frame>
  );
}

function Ditto({ resume, target, sections }: TemplateProps) {
  return (
    <Frame template="ditto">
      <header className="flex items-center justify-between gap-6 bg-[var(--accent)] px-8 py-8 text-white">
        <div>
          <h1 className="text-4xl font-bold">{resume.profile.name || '未命名'}</h1>
          {target && <p className="mt-3 text-base font-medium text-white/90">求职意向：{target}</p>}
        </div>
        <Avatar name={resume.profile.name} avatarUrl={resume.profile.avatarUrl} inverted />
      </header>
      <div className="border-b border-[var(--accent-soft)] px-8 py-3 text-[var(--muted)]">
        <ContactInline resume={resume} />
      </div>
      <div className="grid gap-7 p-8 md:grid-cols-[220px_1fr]">
        <aside className="space-y-5">
          <TextSection title="个人简介" text={sections.summary} />
          <EducationSection items={sections.education} />
          <SkillsSection skills={sections.skills} />
          <ListSection title="证书/奖项" items={sections.certificates} />
        </aside>
        <main className="space-y-6">
          <ItemSection title="工作经历" items={sections.work} type="work" />
          <ItemSection title="项目经历" items={sections.projects} type="project" />
          <TextSection title="自我评价" text={sections.evaluation} />
        </main>
      </div>
    </Frame>
  );
}

function Gengar({ resume, target, sections }: TemplateProps) {
  return (
    <Frame template="gengar" className="grid md:grid-cols-[240px_1fr]">
      <aside className="space-y-6 bg-[var(--accent-ink)] p-7 text-white">
        <Avatar name={resume.profile.name} avatarUrl={resume.profile.avatarUrl} inverted />
        <h1 className="text-3xl font-bold">{resume.profile.name || '未命名'}</h1>
        {target && <p className="text-sm font-medium text-white/80">求职意向：{target}</p>}
        <ContactBlock resume={resume} inverted />
        <SidebarSection title="技能特长"><SkillTags skills={sections.skills} inverted /></SidebarSection>
        <SidebarSection title="证书/奖项"><PlainList items={sections.certificates} /></SidebarSection>
      </aside>
      <main className="space-y-6 p-8">
        {sections.summary && <div className="bg-[var(--panel)] p-5"><TextSection title="个人简介" text={sections.summary} /></div>}
        <EducationSection items={sections.education} />
        <ItemSection title="工作经历" items={sections.work} type="work" />
        <ItemSection title="项目经历" items={sections.projects} type="project" />
        <TextSection title="自我评价" text={sections.evaluation} />
      </main>
    </Frame>
  );
}

function Onyx({ resume, target, sections }: TemplateProps) {
  return (
    <Frame template="onyx" className="p-8">
      <header className="flex flex-col gap-4 border-b-2 border-[var(--accent)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={resume.profile.name} avatarUrl={resume.profile.avatarUrl} />
          <div>
            <h1 className="text-4xl font-semibold tracking-normal text-[var(--heading)]">{resume.profile.name || '未命名'}</h1>
            {target && <p className="mt-2 font-medium text-[var(--accent)]">求职意向：{target}</p>}
          </div>
        </div>
        <ContactBlock resume={resume} />
      </header>
      <main className="mt-6 space-y-5">
        <TextSection title="个人简介" text={sections.summary} />
        <EducationSection items={sections.education} />
        <SkillsSection skills={sections.skills} />
        <ItemSection title="工作经历" items={sections.work} type="work" />
        <ItemSection title="项目经历" items={sections.projects} type="project" />
        <ListSection title="证书/奖项" items={sections.certificates} />
        <TextSection title="自我评价" text={sections.evaluation} />
      </main>
    </Frame>
  );
}

function Pikachu({ resume, target, sections }: TemplateProps) {
  return (
    <Frame template="pikachu" className="grid gap-0 md:grid-cols-[225px_1fr]">
      <aside className="space-y-6 bg-[var(--panel)] p-7">
        <Avatar name={resume.profile.name} avatarUrl={resume.profile.avatarUrl} />
        <ContactBlock resume={resume} />
        <SkillsSection skills={sections.skills} />
        <ListSection title="证书/奖项" items={sections.certificates} />
      </aside>
      <main className="space-y-6 p-8">
        <div className="rounded-md bg-[var(--accent)] p-6 text-white">
          <h1 className="text-3xl font-bold">{resume.profile.name || '未命名'}</h1>
          {target && <p className="mt-2 font-medium text-white/90">求职意向：{target}</p>}
        </div>
        <TextSection title="个人简介" text={sections.summary} />
        <EducationSection items={sections.education} />
        <ItemSection title="工作经历" items={sections.work} type="work" />
        <ItemSection title="项目经历" items={sections.projects} type="project" />
        <TextSection title="自我评价" text={sections.evaluation} />
      </main>
    </Frame>
  );
}

function Rhyhorn({ resume, target, sections }: TemplateProps) {
  return (
    <Frame template="rhyhorn" className="p-8">
      <header className="grid gap-4 border-b border-[var(--accent-soft)] pb-5 md:grid-cols-[1fr_auto]">
        <div>
          <h1 className="text-4xl font-bold text-[var(--heading)]">{resume.profile.name || '未命名'}</h1>
          {target && <p className="mt-2 font-medium text-[var(--accent)]">求职意向：{target}</p>}
        </div>
        <Avatar name={resume.profile.name} avatarUrl={resume.profile.avatarUrl} />
      </header>
      <div className="mt-3 flex flex-wrap divide-x divide-[var(--accent-soft)] text-sm text-[var(--muted)]">
        {[resume.profile.email, resume.profile.phone, resume.profile.location].filter(Boolean).map((item) => (
          <span key={item} className="px-3 first:pl-0">{item}</span>
        ))}
      </div>
      <main className="mt-6 space-y-5">
        <TextSection title="个人简介" text={sections.summary} />
        <EducationSection items={sections.education} />
        <SkillsSection skills={sections.skills} />
        <ItemSection title="工作经历" items={sections.work} type="work" />
        <ItemSection title="项目经历" items={sections.projects} type="project" />
        <ListSection title="证书/奖项" items={sections.certificates} />
        <TextSection title="自我评价" text={sections.evaluation} />
      </main>
    </Frame>
  );
}

function Ditgar({ resume, target, sections }: TemplateProps) {
  return (
    <Frame template="ditgar" className="grid md:grid-cols-[235px_1fr]">
      <aside className="space-y-6 bg-[var(--accent)] p-7 text-white">
        <Avatar name={resume.profile.name} avatarUrl={resume.profile.avatarUrl} inverted />
        <h1 className="text-3xl font-bold">{resume.profile.name || '未命名'}</h1>
        {target && <p className="text-sm font-medium text-white/85">求职意向：{target}</p>}
        <ContactBlock resume={resume} inverted />
        <SidebarSection title="技能特长"><SkillTags skills={sections.skills} inverted /></SidebarSection>
        <SidebarSection title="证书/奖项"><PlainList items={sections.certificates} /></SidebarSection>
      </aside>
      <main className="space-y-6 p-8">
        <TextSection title="个人简介" text={sections.summary} />
        <EducationSection items={sections.education} />
        <ItemSection title="工作经历" items={sections.work} type="work" bordered />
        <ItemSection title="项目经历" items={sections.projects} type="project" bordered />
        <TextSection title="自我评价" text={sections.evaluation} />
      </main>
    </Frame>
  );
}

function Meowth({ resume, target, sections }: TemplateProps) {
  return (
    <Frame template="meowth" className="p-7 text-[13px] leading-normal shadow-none">
      <header className="border-b border-neutral-800 pb-3 text-center">
        {resume.profile.avatarUrl && <div className="mb-3 flex justify-center"><Avatar name={resume.profile.name} avatarUrl={resume.profile.avatarUrl} /></div>}
        <h1 className="text-3xl font-semibold tracking-normal">{resume.profile.name || '未命名'}</h1>
        {target && <p className="mt-1 font-medium">求职意向：{target}</p>}
        <div className="mt-2"><ContactInline resume={resume} /></div>
      </header>
      <main className="mt-4 space-y-4">
        <TextSection title="个人简介" text={sections.summary} dense />
        <EducationSection items={sections.education} dense />
        <SkillsSection skills={sections.skills} dense />
        <ItemSection title="工作经历" items={sections.work} type="work" compact />
        <ItemSection title="项目经历" items={sections.projects} type="project" compact />
        <ListSection title="证书/奖项" items={sections.certificates} dense />
        <TextSection title="自我评价" text={sections.evaluation} dense />
      </main>
    </Frame>
  );
}

interface TemplateProps {
  resume: ResumePreviewData;
  target: string;
  sections: BuiltSections;
}

function Header({ resume, target, align, showAvatar = false }: { resume: ResumePreviewData; target?: string; align?: 'center'; showAvatar?: boolean }) {
  return (
    <header className={`border-b-2 border-[var(--accent)] pb-5 ${align === 'center' ? 'text-center' : ''}`}>
      {showAvatar && resume.profile.avatarUrl && (
        <div className={`mb-3 flex ${align === 'center' ? 'justify-center' : ''}`}>
          <Avatar name={resume.profile.name} avatarUrl={resume.profile.avatarUrl} />
        </div>
      )}
      <h1 className="text-4xl font-bold tracking-normal text-[var(--heading)]">{resume.profile.name || '未命名'}</h1>
      {target && <p className="mt-2 font-semibold text-[var(--accent)]">求职意向：{target}</p>}
      <div className={`mt-3 ${align === 'center' ? 'justify-center' : ''}`}><ContactInline resume={resume} /></div>
    </header>
  );
}

function Avatar({ name, avatarUrl, inverted = false }: { name?: string; avatarUrl?: string; inverted?: boolean }) {
  const initials = (name || '简历').trim().slice(0, 2);
  if (avatarUrl) {
    return (
      <img
        src={resolveAssetUrl(avatarUrl)}
        alt={name || 'Resume photo'}
        className={`h-20 w-20 rounded-full border object-cover ${inverted ? 'border-white/35' : 'border-[var(--accent-soft)]'}`}
      />
    );
  }

  return (
    <div className={`flex h-20 w-20 items-center justify-center rounded-full border text-xl font-bold ${inverted ? 'border-white/35 bg-white/15 text-white' : 'border-[var(--accent-soft)] bg-[var(--panel)] text-[var(--accent)]'}`}>
      {initials}
    </div>
  );
}

function ContactInline({ resume }: { resume: ResumePreviewData }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
      {[resume.profile.email, resume.profile.phone, resume.profile.location].filter(Boolean).map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function ContactBlock({ resume, inverted = false }: { resume: ResumePreviewData; inverted?: boolean }) {
  const items = [resume.profile.email, resume.profile.phone, resume.profile.location].filter(Boolean);
  if (!items.length) return null;
  return (
    <div className={`space-y-1 text-sm ${inverted ? 'text-white/85' : 'text-[var(--muted)]'}`}>
      {items.map((item) => <p key={item}>{item}</p>)}
    </div>
  );
}

function SectionTitle({ title, dense = false }: { title: string; dense?: boolean }) {
  return <h2 className={`${dense ? 'mb-1 text-[13px] uppercase' : 'mb-2 text-base'} border-b border-[var(--accent-soft)] pb-1 font-bold tracking-normal text-[var(--heading)]`}>{title}</h2>;
}

function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  if (!hasContent(children)) return null;
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-2 border-b border-white/25 pb-1 text-base font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

function GridSection({ title, children }: { title: string; children: ReactNode }) {
  if (!hasContent(children)) return null;
  return (
    <section className="grid break-inside-avoid border-t border-[var(--accent-soft)] py-4 md:grid-cols-5 md:gap-6">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-normal text-[var(--accent)] md:mb-0">{title}</h2>
      <div className="md:col-span-4">{children}</div>
    </section>
  );
}

function TextSection({ title, text, dense = false }: { title: string; text?: string; dense?: boolean }) {
  if (!text?.trim()) return null;
  return (
    <section className="break-inside-avoid">
      <SectionTitle title={title} dense={dense} />
      <Paragraph text={text} />
    </section>
  );
}

function Paragraph({ text }: { text?: string }) {
  if (!text?.trim()) return null;
  return <p className="whitespace-pre-wrap text-slate-700">{text}</p>;
}

function SkillsSection({ skills, dense = false }: { skills: string[]; dense?: boolean }) {
  if (!skills.length) return null;
  return (
    <section className="break-inside-avoid">
      <SectionTitle title="技能特长" dense={dense} />
      <SkillTags skills={skills} />
    </section>
  );
}

function EducationSection({ items, dense = false }: { items: ResumeEducation[]; dense?: boolean }) {
  if (!items.length) return null;
  return (
    <section className="break-inside-avoid">
      <SectionTitle title="教育经历" dense={dense} />
      <EducationList items={items} />
    </section>
  );
}

function EducationList({ items }: { items: ResumeEducation[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const title = [item.school, item.degree, item.major].filter(Boolean).join(' · ');
        const date = [item.startDate, item.endDate].filter(Boolean).join(' - ');
        return (
          <article key={`${title}-${index}`} className="break-inside-avoid">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="text-[15px] font-semibold text-slate-950">{title || '教育经历'}</h3>
              {date && <span className="text-xs text-[var(--muted)]">{date}</span>}
            </div>
            {item.gpa && <p className="mt-1 text-sm text-[var(--accent)]">GPA：{item.gpa}</p>}
            {item.description && <p className="mt-2 whitespace-pre-wrap text-slate-700">{item.description}</p>}
          </article>
        );
      })}
    </div>
  );
}

function SkillTags({ skills, inverted = false }: { skills: string[]; inverted?: boolean }) {
  if (!skills.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span key={skill} className={`border px-2.5 py-1 text-xs font-medium ${inverted ? 'border-white/30 bg-white/15 text-white' : 'border-[var(--accent-soft)] bg-[var(--panel)] text-[var(--accent-ink)]'}`}>
          {skill}
        </span>
      ))}
    </div>
  );
}

function ItemSection({ title, items, type, compact = false, timeline = false, bordered = false }: { title: string; items: ResumeItem[]; type: 'work' | 'project'; compact?: boolean; timeline?: boolean; bordered?: boolean }) {
  if (!items.length) return null;
  return (
    <section className="break-inside-avoid">
      <SectionTitle title={title} dense={compact} />
      <ItemList items={items} type={type} compact={compact} timeline={timeline} bordered={bordered} />
    </section>
  );
}

function ItemList({ items, type, compact = false, timeline = false, bordered = false }: { items: ResumeItem[]; type: 'work' | 'project'; compact?: boolean; timeline?: boolean; bordered?: boolean }) {
  if (!items.length) return null;
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {items.map((item, index) => (
        <ResumeEntry key={`${entryHeading(item, type)}-${index}`} item={item} type={type} compact={compact} timeline={timeline} bordered={bordered} />
      ))}
    </div>
  );
}

function ResumeEntry({ item, type, compact, timeline, bordered }: { item: ResumeItem; type: 'work' | 'project'; compact?: boolean; timeline?: boolean; bordered?: boolean }) {
  const heading = entryHeading(item, type);
  const sub = type === 'work' ? item.company || item.companyName : item.role;
  const date = [item.startDate, item.endDate || (item.startDate ? '至今' : '')].filter(Boolean).join(' - ');

  return (
    <article className={`relative break-inside-avoid ${timeline ? 'pl-5 before:absolute before:left-[-30px] before:top-1.5 before:h-3 before:w-3 before:rounded-full before:border-2 before:border-white before:bg-[var(--accent)]' : ''} ${bordered ? 'border-l-4 border-[var(--accent-soft)] pl-4' : ''}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className={`${compact ? 'text-[13px]' : 'text-[15px]'} font-semibold text-slate-950`}>{heading}</h3>
          {sub && <p className="font-medium text-[var(--accent)]">{sub}</p>}
        </div>
        {date && <span className="text-xs text-[var(--muted)]">{date}</span>}
      </div>
      {item.description && <p className="mt-2 whitespace-pre-wrap text-slate-700">{item.description}</p>}
      {!!item.highlights?.length && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          {item.highlights.map((line, idx) => <li key={`${line}-${idx}`}>{line}</li>)}
        </ul>
      )}
      {!!item.techStack?.length && (
        <div className="mt-2 flex flex-wrap gap-2">
          {item.techStack.map((tech) => <span key={tech} className="bg-[var(--panel)] px-2 py-0.5 text-xs text-[var(--accent-ink)]">{tech}</span>)}
        </div>
      )}
    </article>
  );
}

function ListSection({ title, items, dense = false }: { title: string; items: string[]; dense?: boolean }) {
  if (!items.length) return null;
  return (
    <section className="break-inside-avoid">
      <SectionTitle title={title} dense={dense} />
      <PlainList items={items} />
    </section>
  );
}

function PlainList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-current">
      {items.map((item) => <li key={item}>{formatCertificate(item)}</li>)}
    </ul>
  );
}

function formatCertificate(value: unknown) {
  if (!value) return '';
  if (typeof value !== 'string') return String(value);
  const trimmed = value.trim();
  if (!trimmed.startsWith('{')) return trimmed;
  try {
    const item = JSON.parse(trimmed);
    const name = item.name || item.title || item.certificate || item.award || item.certName;
    const authority = item.authority || item.issuer || item.organization || item.org;
    const date = item.date || item.issueDate || item.time;
    const description = item.description || item.desc || item.detail;
    const link = item.link || item.url;
    const main = [name, authority, date].filter(Boolean).join(' · ');
    const detail = [description, link].filter(Boolean).join(' · ');
    if (main && detail) return `${main}：${detail}`;
    return main || detail || trimmed;
  } catch {
    return trimmed;
  }
}

function entryHeading(item: ResumeItem, type: 'work' | 'project') {
  return type === 'work'
    ? item.title || item.company || item.companyName || '工作经历'
    : item.name || item.projectName || item.title || '项目经历';
}

function hasContent(children: ReactNode) {
  return children !== null && children !== undefined && children !== false;
}
