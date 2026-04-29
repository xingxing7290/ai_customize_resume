'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { normalizeTemplate, ResumePreview, ResumePreviewData, ResumeTemplate } from '@/components/resume/ResumePreview';
import { useLanguage } from '@/lib/language';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://113.44.50.108:3001';

const copy = {
  zh: {
    notFound: '简历未找到或未公开',
    cannotConnect: '无法连接简历服务，请稍后重试',
    loading: '加载中...',
    inaccessible: '简历无法访问',
    downloadPdf: '下载 PDF',
  },
  en: {
    notFound: 'Resume not found or not public',
    cannotConnect: 'Unable to reach resume service. Please try again later.',
    loading: 'Loading...',
    inaccessible: 'Resume Unavailable',
    downloadPdf: 'Download PDF',
  },
} as const;

export default function PublicResumePage() {
  const { language } = useLanguage();
  const t = copy[language];
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const initialTemplate = useMemo(() => normalizeTemplate(searchParams.get('style')), [searchParams]);

  const [resume, setResume] = useState<ResumePreviewData | null>(null);
  const [template, setTemplate] = useState<ResumeTemplate>(initialTemplate);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setTemplate(initialTemplate);
  }, [initialTemplate]);

  useEffect(() => {
    loadResume();
  }, [token]);

  const loadResume = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/public/r/${token}`, { cache: 'no-store' });
      const payload = await response.json();
      if (response.ok && payload.data) {
        setResume(payload.data);
      } else {
        setError(payload.message || t.notFound);
      }
    } catch {
      setError(t.cannotConnect);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    window.open(`${API_BASE_URL}/pdf/public/${token}?style=${template}`, '_blank');
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">{t.loading}</div>;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="text-center">
          <h1 className="mb-3 text-2xl font-bold text-slate-900">{t.inaccessible}</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!resume) return null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto mb-4 flex max-w-[820px] justify-end rounded border border-slate-200 bg-white p-3 print:hidden">
        <button type="button" onClick={handleDownloadPdf} className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          {t.downloadPdf}
        </button>
      </div>
      <ResumePreview resume={resume} template={template} />
    </main>
  );
}
