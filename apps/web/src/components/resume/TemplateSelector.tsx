import { ResumeTemplate, resumeTemplates } from './ResumePreview';

interface TemplateSelectorProps {
  selected: ResumeTemplate;
  onSelect: (template: ResumeTemplate) => void;
}

const swatches: Record<ResumeTemplate, { accent: string; bg: string; rail?: string; dark?: boolean; twoColumn?: boolean }> = {
  modern: { accent: '#2563eb', bg: '#ffffff' },
  classic: { accent: '#334155', bg: '#ffffff' },
  compact: { accent: '#0f766e', bg: '#ffffff' },
  deedy: { accent: '#0284c7', bg: '#ffffff', twoColumn: true },
  orbit: { accent: '#334155', bg: '#ffffff', rail: '#1e293b', twoColumn: true },
  markdown: { accent: '#18181b', bg: '#ffffff' },
  academic: { accent: '#4f46e5', bg: '#ffffff' },
  elegant: { accent: '#be123c', bg: '#fff7f8' },
  typst: { accent: '#0891b2', bg: '#ffffff' },
  ats: { accent: '#111827', bg: '#ffffff' },
  executive: { accent: '#b45309', bg: '#fffaf0' },
  creative: { accent: '#7e22ce', bg: '#faf5ff' },
};

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {resumeTemplates.map((template) => {
        const swatch = swatches[template.id];
        const active = selected === template.id;

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={`group overflow-hidden rounded-md border bg-white text-left transition hover:border-slate-400 ${active ? 'border-indigo-600 ring-2 ring-indigo-600 ring-offset-2' : 'border-slate-200'}`}
          >
            <div className="aspect-[4/5] p-3" style={{ background: swatch.bg }}>
              <div className="h-full overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
                {swatch.rail && <div className="h-full w-1/4 float-left" style={{ background: swatch.rail }} />}
                <div className={swatch.twoColumn ? 'grid h-full grid-cols-[34%_1fr]' : 'h-full'}>
                  {template.id === 'deedy' && (
                    <div className="border-r border-slate-200 p-2">
                      <TinyLine width="70%" color={swatch.accent} />
                      <TinyBlock rows={5} />
                    </div>
                  )}
                  <div className="p-2">
                    <div className="mb-2 h-1 w-10 rounded" style={{ background: swatch.accent }} />
                    <TinyLine width="70%" color="#0f172a" thick />
                    <TinyLine width="45%" />
                    <div className="my-2 h-px" style={{ background: swatch.accent }} />
                    <TinyBlock rows={template.id === 'compact' || template.id === 'ats' ? 7 : 5} />
                    <div className="mt-2 flex gap-1">
                      <span className="h-2 w-6 rounded-full" style={{ background: swatch.accent, opacity: 0.18 }} />
                      <span className="h-2 w-5 rounded-full" style={{ background: swatch.accent, opacity: 0.18 }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-900">{template.label}</span>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: swatch.accent }} />
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{template.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TinyLine({ width, color = '#cbd5e1', thick = false }: { width: string; color?: string; thick?: boolean }) {
  return <div className={`mb-1 rounded ${thick ? 'h-2' : 'h-1.5'}`} style={{ width, background: color }} />;
}

function TinyBlock({ rows }: { rows: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, index) => (
        <TinyLine key={index} width={`${92 - (index % 3) * 14}%`} />
      ))}
    </div>
  );
}
