export type ResumeTemplate = 'modern' | 'classic' | 'compact';

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

const templateStyles: Record<ResumeTemplate, string> = {
  modern: 'border-blue-200 bg-white text-slate-800 [--accent:#2563eb] [--heading:#1e3a5f] [--tag-bg:#eef4ff] [--tag-text:#1d4ed8]',
  classic: 'border-slate-300 bg-white text-gray-800 [--accent:#334155] [--heading:#111827] [--tag-bg:#f8fafc] [--tag-text:#334155]',
  compact: 'border-teal-200 bg-white text-slate-800 [--accent:#0f766e] [--heading:#134e4a] [--tag-bg:#ecfdf5] [--tag-text:#0f766e]',
};

export const resumeTemplates: Array<{ id: ResumeTemplate; label: string; description: string }> = [
  { id: 'modern', label: '现代', description: '清晰分区，适合技术岗投递' },
  { id: 'classic', label: '经典', description: '稳重排版，适合正式场景' },
  { id: 'compact', label: '紧凑', description: '信息密度高，适合经历较多' },
];

export function normalizeTemplate(value?: string | null): ResumeTemplate {
  return value === 'classic' || value === 'compact' ? value : 'modern';
}

export function ResumePreview({ resume, template = 'modern' }: { resume: ResumePreviewData; template?: ResumeTemplate }) {
  const compact = template === 'compact';
  const target = resume.jobTarget?.parsedJobTitle
    ? `${resume.jobTarget.parsedJobTitle}${resume.jobTarget.parsedCompanyName ? ` @ ${resume.jobTarget.parsedCompanyName}` : ''}`
    : '';

  return (
    <article className={`mx-auto w-full max-w-[820px] border ${templateStyles[template]} ${compact ? 'p-5 text-[13px]' : 'p-8 text-sm'} shadow-sm print:shadow-none`}>
      <header className={`flex flex-col gap-4 border-b-2 border-[var(--accent)] pb-4 sm:flex-row sm:items-start sm:justify-between ${template === 'classic' ? 'border-b' : ''}`}>
        <div>
          <h1 className={`font-bold text-[var(--heading)] ${compact ? 'text-2xl' : 'text-3xl'} ${template === 'classic' ? 'font-serif' : ''}`}>{resume.profile.name || '未命名'}</h1>
          {target && <p className="mt-2 font-medium text-[var(--accent)]">求职意向：{target}</p>}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-600 sm:max-w-[320px] sm:justify-end sm:text-right">
          <span>{resume.profile.email}</span>
          {resume.profile.phone && <span>{resume.profile.phone}</span>}
          {resume.profile.location && <span>{resume.profile.location}</span>}
        </div>
      </header>

      <div className={compact ? 'space-y-3 pt-3' : 'space-y-5 pt-5'}>
        <PreviewSection title="个人简介" text={resume.contentSummary || resume.profile.summary} />
        <SkillsSection skills={resume.contentSkills || []} />
        <ItemSection title="工作经历" items={resume.contentWorkExperiences || []} type="work" />
        <ItemSection title="项目经历" items={resume.contentProjectExperiences || []} type="project" />
        <ListSection title="证书/奖项" items={resume.contentCertificates || []} />
        <PreviewSection title="自我评价" text={resume.contentSelfEvaluation} />
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
          <span key={skill} className="rounded border border-[var(--accent)] bg-[var(--tag-bg)] px-2.5 py-1 text-xs font-medium text-[var(--tag-text)]">
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
                {date && <span className="text-xs text-slate-500">{date}</span>}
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
