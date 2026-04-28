'use client';

import { AppLanguage } from '@/lib/language';

interface LanguageSelectorProps {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
  compact?: boolean;
}

export function LanguageSelector({ language, onChange, compact = false }: LanguageSelectorProps) {
  return (
    <div className="inline-flex rounded-md border border-slate-200 bg-white p-1 shadow-sm" aria-label="Language selector">
      <button
        type="button"
        onClick={() => onChange('zh')}
        className={buttonClass(language === 'zh', compact)}
      >
        中文
      </button>
      <button
        type="button"
        onClick={() => onChange('en')}
        className={buttonClass(language === 'en', compact)}
      >
        EN
      </button>
    </div>
  );
}

function buttonClass(active: boolean, compact: boolean) {
  return [
    'rounded px-3 py-1.5 text-sm font-medium transition',
    compact ? 'px-2 py-1 text-xs' : '',
    active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ');
}
