import type { ReactNode } from 'react';
import { ResumeTemplate, resumeTemplates } from './ResumePreview';

interface TemplateSelectorProps {
  selected: ResumeTemplate;
  onSelect: (template: ResumeTemplate) => void;
}

const swatches: Record<ResumeTemplate, { accent: string; panel: string; pattern: 'timeline' | 'grid' | 'right' | 'banner' | 'left' | 'single' | 'card' | 'compact' }> = {
  azurill: { accent: '#2563eb', panel: '#eff6ff', pattern: 'timeline' },
  bronzor: { accent: '#525252', panel: '#fafaf9', pattern: 'grid' },
  chikorita: { accent: '#059669', panel: '#ecfdf5', pattern: 'right' },
  ditto: { accent: '#7c3aed', panel: '#f5f3ff', pattern: 'banner' },
  gengar: { accent: '#334155', panel: '#f8fafc', pattern: 'left' },
  onyx: { accent: '#18181b', panel: '#fafafa', pattern: 'single' },
  pikachu: { accent: '#d97706', panel: '#fffbeb', pattern: 'card' },
  rhyhorn: { accent: '#0891b2', panel: '#ecfeff', pattern: 'single' },
  ditgar: { accent: '#be123c', panel: '#fff1f2', pattern: 'left' },
  meowth: { accent: '#111827', panel: '#ffffff', pattern: 'compact' },
};

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
            <div className="aspect-[4/5] p-3" style={{ background: swatch.panel }}>
              <TemplateThumb accent={swatch.accent} pattern={swatch.pattern} />
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

function TemplateThumb({ accent, pattern }: { accent: string; pattern: string }) {
  if (pattern === 'grid') {
    return (
      <Paper>
        <div className="mb-2 text-center">
          <TinyLine width="48%" color="#111827" thick center />
          <TinyLine width="64%" center />
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="grid grid-cols-[32%_1fr] gap-2 border-t border-slate-200 py-1.5">
            <TinyLine width="75%" color={accent} />
            <TinyBlock rows={2} />
          </div>
        ))}
      </Paper>
    );
  }

  if (pattern === 'right') {
    return (
      <Paper className="grid grid-cols-[1fr_34%]">
        <div className="p-2">
          <TinyLine width="70%" color="#111827" thick />
          <TinyBlock rows={7} />
        </div>
        <div className="p-2" style={{ background: accent }}>
          <TinyCircle />
          <TinyBlock rows={5} light />
        </div>
      </Paper>
    );
  }

  if (pattern === 'banner') {
    return (
      <Paper>
        <div className="p-2" style={{ background: accent }}>
          <TinyLine width="62%" color="rgba(255,255,255,.9)" thick />
          <TinyLine width="44%" color="rgba(255,255,255,.7)" />
        </div>
        <div className="grid grid-cols-[34%_1fr] gap-2 p-2">
          <TinyBlock rows={5} />
          <TinyBlock rows={7} />
        </div>
      </Paper>
    );
  }

  if (pattern === 'left') {
    return (
      <Paper className="grid grid-cols-[34%_1fr]">
        <div className="p-2" style={{ background: accent }}>
          <TinyCircle light />
          <TinyBlock rows={6} light />
        </div>
        <div className="p-2">
          <TinyLine width="68%" color="#111827" thick />
          <TinyBlock rows={8} />
        </div>
      </Paper>
    );
  }

  if (pattern === 'card') {
    return (
      <Paper className="grid grid-cols-[34%_1fr]">
        <div className="bg-amber-50 p-2">
          <TinyCircle />
          <TinyBlock rows={5} />
        </div>
        <div className="p-2">
          <div className="mb-2 rounded-sm p-1.5" style={{ background: accent }}>
            <TinyLine width="70%" color="rgba(255,255,255,.9)" thick />
          </div>
          <TinyBlock rows={7} />
        </div>
      </Paper>
    );
  }

  if (pattern === 'compact') {
    return (
      <Paper>
        <div className="border-b border-slate-900 p-2 text-center">
          <TinyLine width="44%" color="#111827" thick center />
          <TinyLine width="66%" center />
        </div>
        <div className="p-2">
          <TinyBlock rows={11} tight />
        </div>
      </Paper>
    );
  }

  return (
    <Paper>
      <div className="border-b-2 p-2" style={{ borderColor: accent }}>
        <TinyLine width="62%" color="#111827" thick />
        <TinyLine width="46%" color={accent} />
      </div>
      <div className="p-2">
        <TinyBlock rows={8} />
      </div>
    </Paper>
  );
}

function Paper({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`h-full overflow-hidden rounded border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function TinyLine({ width, color = '#cbd5e1', thick = false, center = false }: { width: string; color?: string; thick?: boolean; center?: boolean }) {
  return <div className={`${center ? 'mx-auto' : ''} mb-1 rounded ${thick ? 'h-2' : 'h-1.5'}`} style={{ width, background: color }} />;
}

function TinyBlock({ rows, light = false, tight = false }: { rows: number; light?: boolean; tight?: boolean }) {
  return (
    <div className={tight ? 'space-y-0.5' : 'space-y-1'}>
      {Array.from({ length: rows }).map((_, index) => (
        <TinyLine key={index} width={`${92 - (index % 3) * 14}%`} color={light ? 'rgba(255,255,255,.58)' : '#cbd5e1'} />
      ))}
    </div>
  );
}

function TinyCircle({ light = false }: { light?: boolean }) {
  return <div className="mb-2 h-7 w-7 rounded-full" style={{ background: light ? 'rgba(255,255,255,.35)' : '#e2e8f0' }} />;
}
