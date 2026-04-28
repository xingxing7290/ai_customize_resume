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

export interface ResumePreviewData {
  profile: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  jobTarget?: {
    parsedJobTitle?: string;
    parsedCompanyName?: string;
  };
  contentSummary?: string;
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

export interface ResumeTemplateMeta {
  id: ResumeTemplate;
  label: string;
  source: string;
  description: string;
}

export const resumeTemplates: ResumeTemplateMeta[] = [
  { id: 'modern', label: '现代蓝', source: '通用中文简历', description: '清晰分区，适合技术岗和通用投递' },
  { id: 'classic', label: 'ModernCV', source: 'LaTeX ModernCV', description: '稳重正式，适合传统企业和管理岗位' },
  { id: 'compact', label: '紧凑一页', source: '中文一页简历', description: '信息密度高，适合经历较多的候选人' },
  { id: 'deedy', label: 'Deedy 双栏', source: 'Deedy Resume', description: '左侧能力信息，右侧经历叙事' },
  { id: 'orbit', label: 'Orbit 侧栏', source: 'Orbit Theme', description: '深色侧栏突出联系方式和技能' },
  { id: 'markdown', label: 'Markdown', source: 'Markdown Resume', description: '极简文档感，适合工程师和 ATS' },
  { id: 'academic', label: '学术简历', source: 'Chinese CV', description: '强调教育、项目和证书，适合校招/科研' },
  { id: 'elegant', label: 'BillRyan', source: 'billryan/resume', description: '优雅细线排版，适合中文正式简历' },
  { id: 'typst', label: 'Typst 简洁', source: 'Typst Resume', description: '干净现代，打印效果稳定' },
  { id: 'ats', label: 'ATS 黑白', source: 'ATS Friendly', description: '少装饰、强可读，适合系统筛选' },
  { id: 'executive', label: '商务金', source: 'Business CV', description: '暖色强调，适合运营、产品和管理' },
  { id: 'creative', label: '创意紫', source: 'Creative Resume', description: '视觉更强，适合设计和内容岗位' },
];

export const templateStyles: Record<ResumeTemplate, string> = {
  modern: 'border-blue-200 bg-white text-slate-800 [--accent:#2563eb] [--heading:#1e3a5f] [--muted:#64748b] [--tag-bg:#eef4ff] [--tag-border:#bfdbfe] [--tag-text:#1d4ed8]',
  classic: 'border-slate-300 bg-white text-gray-800 [--accent:#334155] [--heading:#111827] [--muted:#6b7280] [--tag-bg:#f8fafc] [--tag-border:#cbd5e1] [--tag-text:#334155]',
  compact: 'border-teal-200 bg-white text-slate-800 [--accent:#0f766e] [--heading:#134e4a] [--muted:#64748b] [--tag-bg:#ecfdf5] [--tag-border:#99f6e4] [--tag-text:#0f766e]',
  deedy: 'border-sky-200 bg-white text-slate-800 [--accent:#0284c7] [--heading:#0f172a] [--muted:#64748b] [--tag-bg:#e0f2fe] [--tag-border:#7dd3fc] [--tag-text:#0369a1]',
  orbit: 'border-slate-700 bg-white text-slate-800 [--accent:#334155] [--heading:#0f172a] [--muted:#64748b] [--tag-bg:#e2e8f0] [--tag-border:#94a3b8] [--tag-text:#1e293b]',
  markdown: 'border-zinc-200 bg-white text-zinc-900 [--accent:#18181b] [--heading:#09090b] [--muted:#52525b] [--tag-bg:#fafafa] [--tag-border:#d4d4d8] [--tag-text:#18181b]',
  academic: 'border-indigo-200 bg-white text-slate-800 [--accent:#4f46e5] [--heading:#312e81] [--muted:#64748b] [--tag-bg:#eef2ff] [--tag-border:#a5b4fc] [--tag-text:#4338ca]',
  elegant: 'border-rose-200 bg-white text-slate-800 [--accent:#be123c] [--heading:#881337] [--muted:#64748b] [--tag-bg:#fff1f2] [--tag-border:#fecdd3] [--tag-text:#be123c]',
  typst: 'border-cyan-200 bg-white text-slate-800 [--accent:#0891b2] [--heading:#164e63] [--muted:#64748b] [--tag-bg:#ecfeff] [--tag-border:#67e8f9] [--tag-text:#0e7490]',
  ats: 'border-neutral-300 bg-white text-neutral-900 [--accent:#111827] [--heading:#111827] [--muted:#4b5563] [--tag-bg:#f5f5f5] [--tag-border:#d4d4d4] [--tag-text:#111827]',
  executive: 'border-amber-200 bg-white text-slate-800 [--accent:#b45309] [--heading:#78350f] [--muted:#64748b] [--tag-bg:#fffbeb] [--tag-border:#fcd34d] [--tag-text:#b45309]',
  creative: 'border-purple-200 bg-white text-slate-800 [--accent:#7e22ce] [--heading:#581c87] [--muted:#64748b] [--tag-bg:#faf5ff] [--tag-border:#d8b4fe] [--tag-text:#7e22ce]',
};

const validTemplateIds = resumeTemplates.map((template) => template.id);
const templateAliases: Record<string, ResumeTemplate> = {
  sidebar: 'orbit',
  minimal: 'markdown',
  mono: 'ats',
  tech: 'deedy',
  professional: 'classic',
  simple: 'markdown',
};

export function normalizeTemplate(value?: string | null): ResumeTemplate {
  if (value && templateAliases[value]) return templateAliases[value];
  return validTemplateIds.includes(value as ResumeTemplate) ? (value as ResumeTemplate) : 'modern';
}

export function ResumePreview({ resume, template = 'modern' }: { resume: ResumePreviewData; template?: ResumeTemplate }) {
  const selected = normalizeTemplate(template);
  const compact = selected === 'compact' || selected === 'ats';
  const twoColumn = selected === 'deedy' || selected === 'orbit';
  const target = resume.jobTarget?.parsedJobTitle
    ? `${resume.jobTarget.parsedJobTitle}${resume.jobTarget.parsedCompanyName ? ` @ ${resume.jobTarget.parsedCompanyName}` : ''}`
    : '';

  return (
    <article className={`resume-preview resume-${selected} mx-auto w-full max-w-[820px] border ${templateStyles[selected]} ${compact ? 'p-5 text-[13px]' : 'p-8 text-sm'} shadow-sm print:shadow-none`}>
      <header className={`resume-header flex flex-col gap-4 border-b-2 border-[var(--accent)] pb-4 ${selected === 'classic' || selected === 'elegant' ? 'border-b' : ''}`}>
        <div>
          <h1 className={`font-bold text-[var(--heading)] ${compact ? 'text-2xl' : 'text-3xl'} ${selected === 'classic' || selected === 'elegant' ? 'font-serif' : ''}`}>{resume.profile.name || '未命名'}</h1>
          {target && <p className="mt-2 font-medium text-[var(--accent)]">求职意向：{target}</p>}
        </div>
        <div className="contact flex flex-wrap gap-x-3 gap-y-1 text-[var(--muted)]">
          <span>{resume.profile.email}</span>
          {resume.profile.phone && <span>{resume.profile.phone}</span>}
          {resume.profile.location && <span>{resume.profile.location}</span>}
        </div>
      </header>

      <div className={twoColumn ? 'resume-body grid gap-5 pt-5 md:grid-cols-[220px_1fr]' : compact ? 'resume-body space-y-3 pt-3' : 'resume-body space-y-5 pt-5'}>
        {twoColumn ? (
          <>
            <aside className="space-y-4">
              <PreviewSection title="个人简介" text={resume.contentSummary || resume.profile.summary} />
              <SkillsSection skills={resume.contentSkills || []} />
              <ListSection title="证书/奖项" items={resume.contentCertificates || []} />
            </aside>
            <div className="space-y-5">
              <ItemSection title="工作经历" items={resume.contentWorkExperiences || []} type="work" />
              <ItemSection title="项目经历" items={resume.contentProjectExperiences || []} type="project" />
              <PreviewSection title="自我评价" text={resume.contentSelfEvaluation} />
            </div>
          </>
        ) : (
          <>
            <PreviewSection title="个人简介" text={resume.contentSummary || resume.profile.summary} />
            <SkillsSection skills={resume.contentSkills || []} />
            <ItemSection title="工作经历" items={resume.contentWorkExperiences || []} type="work" />
            <ItemSection title="项目经历" items={resume.contentProjectExperiences || []} type="project" />
            <ListSection title="证书/奖项" items={resume.contentCertificates || []} />
            <PreviewSection title="自我评价" text={resume.contentSelfEvaluation} />
          </>
        )}
      </div>
    </article>
  );
}

function PreviewSection({ title, text }: { title: string; text?: string }) {
  if (!text?.trim()) return null;
  return (
    <section className="break-inside-avoid">
      <SectionTitle title={title} />
      <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{text}</p>
    </section>
  );
}

function SkillsSection({ skills }: { skills: string[] }) {
  if (!skills.length) return null;
  return (
    <section className="break-inside-avoid">
      <SectionTitle title="技能特长" />
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className="rounded border border-[var(--tag-border)] bg-[var(--tag-bg)] px-2.5 py-1 text-xs font-medium text-[var(--tag-text)]">
            {skill}
          </span>
        ))}
      </div>
    </section>
  );
}

function ItemSection({ title, items, type }: { title: string; items: ResumeItem[]; type: 'work' | 'project' }) {
  if (!items.length) return null;
  return (
    <section className="break-inside-avoid">
      <SectionTitle title={title} />
      <div className="space-y-4">
        {items.map((item, index) => {
          const heading = type === 'work'
            ? item.title || item.company || item.companyName || '工作经历'
            : item.name || item.projectName || item.title || '项目经历';
          const sub = type === 'work' ? item.company || item.companyName : item.role;
          const date = [item.startDate, item.endDate || (item.startDate ? '至今' : '')].filter(Boolean).join(' - ');

          return (
            <div key={`${heading}-${index}`} className="break-inside-avoid">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950">{heading}</h3>
                  {sub && <p className="font-medium text-[var(--accent)]">{sub}</p>}
                </div>
                {date && <span className="text-xs text-[var(--muted)]">{date}</span>}
              </div>
              {item.description && <p className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-700">{item.description}</p>}
              {!!item.highlights?.length && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                  {item.highlights.map((line, idx) => <li key={`${line}-${idx}`}>{line}</li>)}
                </ul>
              )}
              {!!item.techStack?.length && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.techStack.map((tech) => <span key={tech} className="rounded bg-[var(--tag-bg)] px-2 py-0.5 text-xs text-[var(--tag-text)]">{tech}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="break-inside-avoid">
      <SectionTitle title={title} />
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-slate-700">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="mb-2 border-b border-slate-200 pb-1 text-base font-bold text-[var(--heading)]">{title}</h2>;
}
