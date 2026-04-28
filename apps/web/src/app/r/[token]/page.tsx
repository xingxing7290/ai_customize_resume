'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { normalizeTemplate, ResumePreview, ResumePreviewData, ResumeTemplate } from '@/components/resume/ResumePreview';
import { TemplateSelector } from '@/components/resume/TemplateSelector';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://113.44.50.108:3001';

export default function PublicResumePage() {
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
        setError(payload.message || '简历未找到或未公开');
      }
    } catch {
      setError('无法连接简历服务，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    window.open(`${API_BASE_URL}/pdf/public/${token}?style=${template}`, '_blank');
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">加载中...</div>;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="text-center">
          <h1 className="mb-3 text-2xl font-bold text-slate-900">简历无法访问</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!resume) return null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto mb-4 max-w-[1100px] rounded border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-base font-semibold text-slate-900">选择简历样式</h1>
          <button type="button" onClick={handleDownloadPdf} className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            下载 PDF
          </button>
        </div>
        <TemplateSelector selected={template} onSelect={setTemplate} />
      </div>
      <ResumePreview resume={resume} template={template} />
    </main>
  );
}
