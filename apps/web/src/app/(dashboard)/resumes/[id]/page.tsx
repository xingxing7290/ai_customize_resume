'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ResumePreview, normalizeTemplate, resumeTemplates, ResumePreviewData, ResumeTemplate, ResumeItem } from '@/components/resume/ResumePreview';
import { TemplateSelector } from '@/components/resume/TemplateSelector';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language';

interface ResumeVersion extends ResumePreviewData {
  id: string;
  name: string;
  status: string;
  aiOptimizationNotes?: string[];
  aiGapAnalysis?: string[];
  jobTarget?: ResumePreviewData['jobTarget'] & {
    parsedTechStack?: string[];
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://113.44.50.108:3001';
const WEB_BASE_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://113.44.50.108:3000';

const copy = {
  zh: {
    loadFailed: '简历加载失败',
    draftSaved: '草稿已保存',
    saveFailed: '保存失败',
    confirmRegenerate: '确定重新生成吗？当前编辑内容会被生成结果覆盖。',
    regenerated: '已重新生成',
    regenerateFailed: '重新生成失败',
    published: (url: string) => `已发布公开链接：${url}`,
    publishFailed: '发布失败',
    confirmRegenerateLink: '确定重新生成公开链接吗？旧链接将失效。',
    linkRegenerated: (url: string) => `已重新生成公开链接：${url}`,
    regenerateLinkFailed: '重新生成链接失败',
    sessionExpiredForPdf: '登录已失效，请重新登录后下载 PDF',
    pdfDownloadFailed: (template: string) => `PDF 下载失败，当前样式：${template}`,
    pdfEmpty: (template: string) => `PDF 生成为空文件，当前样式：${template}`,
    pdfGenericFailed: 'PDF 下载失败',
    pdfStarted: 'PDF 已生成并开始下载',
    pdfServiceError: 'PDF 下载失败，请检查服务是否可访问',
    processing: '处理中...',
    saveDraft: '保存草稿',
    regenerate: '重新生成',
    duplicate: '复制版本',
    publish: '发布',
    regenerateLink: '重新生成链接',
    downloadPdf: '下载 PDF',
    style: '简历样式',
    styleHint: '参考 awesome-resume-for-chinese 中常见中文简历排版方向，点击缩略图即可在右侧预览和 PDF 中同步生效。',
    editor: '在线编辑',
    preview: '简历预览',
    currentStyle: '当前样式：',
    aiNotes: 'AI 优化说明',
    aiGaps: '待补充差距',
    fields: {
      summary: '个人简介',
      skills: '技能标签（每行一个）',
      work: '工作经历（每段用空行分隔，第一行为职位/标题）',
      project: '项目经历（每段用空行分隔，第一行为项目名）',
      certificates: '证书/奖项（每行一个）',
      evaluation: '自我评价',
    },
  },
  en: {
    loadFailed: 'Failed to load resume',
    draftSaved: 'Draft saved',
    saveFailed: 'Save failed',
    confirmRegenerate: 'Regenerate now? Your current edits will be overwritten by the new result.',
    regenerated: 'Regenerated',
    regenerateFailed: 'Regeneration failed',
    published: (url: string) => `Published public link: ${url}`,
    publishFailed: 'Publish failed',
    confirmRegenerateLink: 'Regenerate the public link? The old link will stop working.',
    linkRegenerated: (url: string) => `Regenerated public link: ${url}`,
    regenerateLinkFailed: 'Failed to regenerate link',
    sessionExpiredForPdf: 'Session expired. Please sign in again to download PDF.',
    pdfDownloadFailed: (template: string) => `PDF download failed. Current style: ${template}`,
    pdfEmpty: (template: string) => `PDF is empty. Current style: ${template}`,
    pdfGenericFailed: 'PDF download failed',
    pdfStarted: 'PDF generated. Download started.',
    pdfServiceError: 'PDF download failed. Please check service connectivity.',
    processing: 'Processing...',
    saveDraft: 'Save Draft',
    regenerate: 'Regenerate',
    duplicate: 'Duplicate',
    publish: 'Publish',
    regenerateLink: 'Regenerate Link',
    downloadPdf: 'Download PDF',
    style: 'Resume Style',
    styleHint: 'Click a thumbnail to apply it to both the right-side preview and the exported PDF.',
    editor: 'Editor',
    preview: 'Resume Preview',
    currentStyle: 'Current style: ',
    aiNotes: 'AI Notes',
    aiGaps: 'Gaps to Fill',
    fields: {
      summary: 'Summary',
      skills: 'Skills (one per line)',
      work: 'Work Experience (separate entries with a blank line; first line is title)',
      project: 'Project Experience (separate entries with a blank line; first line is project name)',
      certificates: 'Certificates / Awards (one per line)',
      evaluation: 'Self Evaluation',
    },
  },
} as const;

export default function ResumeEditPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [resume, setResume] = useState<ResumeVersion | null>(null);
  const [template, setTemplate] = useState<ResumeTemplate>('azurill');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [publicToken, setPublicToken] = useState('');
  const [publicUrl, setPublicUrl] = useState('');
  const [editForm, setEditForm] = useState({
    summary: '',
    skillsText: '',
    workText: '',
    projectText: '',
    certificatesText: '',
    selfEvaluation: '',
  });

  useEffect(() => {
    setTemplate(normalizeTemplate(localStorage.getItem('resumeTemplate')));
    loadResume();
  }, [id]);

  useEffect(() => {
    localStorage.setItem('resumeTemplate', template);
    if (publicToken) {
      setPublicUrl(`${WEB_BASE_URL}/r/${publicToken}?style=${template}`);
    }
  }, [template, publicToken]);

  const skills = useMemo(() => lines(editForm.skillsText), [editForm.skillsText]);
  const certificates = useMemo(() => lines(editForm.certificatesText), [editForm.certificatesText]);
  const workExperiences = useMemo(() => textToItems(editForm.workText, 'work'), [editForm.workText]);
  const projectExperiences = useMemo(() => textToItems(editForm.projectText, 'project'), [editForm.projectText]);

  const previewResume = useMemo<ResumePreviewData | null>(() => {
    if (!resume) return null;
    return {
      ...resume,
      contentSummary: editForm.summary,
      contentSkills: skills,
      contentWorkExperiences: workExperiences,
      contentProjectExperiences: projectExperiences,
      contentCertificates: certificates,
      contentSelfEvaluation: editForm.selfEvaluation,
    };
  }, [resume, editForm, skills, workExperiences, projectExperiences, certificates]);

  const loadResume = async () => {
    setLoading(true);
    const result = await api.resumes.get(id);
    if (result.data) {
      const data = result.data as ResumeVersion;
      setResume(data);
      setEditForm({
        summary: data.contentSummary || '',
        skillsText: (data.contentSkills || []).join('\n'),
        workText: itemsToText(data.contentWorkExperiences || []),
        projectText: itemsToText(data.contentProjectExperiences || []),
        certificatesText: (data.contentCertificates || []).join('\n'),
        selfEvaluation: data.contentSelfEvaluation || '',
      });
      const publishRecord = await api.publish.get(id);
      if (publishRecord.data?.publicToken && publishRecord.data?.isPublic) {
        setPublicToken(publishRecord.data.publicToken);
      } else {
        setPublicToken('');
        setPublicUrl('');
      }
    } else {
      setMessage(result.message || t.loadFailed);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    const result = await api.resumes.updateContent(id, {
      summary: editForm.summary,
      skills,
      workExperiences,
      projectExperiences,
      certificates,
      selfEvaluation: editForm.selfEvaluation,
    });
    setSaving(false);

    if (result.data) {
      setResume(result.data as ResumeVersion);
      setMessage(t.draftSaved);
      return;
    }
    setMessage(result.message || t.saveFailed);
  };

  const handleRegenerate = async () => {
    if (!confirm(t.confirmRegenerate)) return;
    setSaving(true);
    setMessage('');
    const result = await api.resumes.regenerate(id);
    setSaving(false);
    if (result.data) {
      setMessage(t.regenerated);
      await loadResume();
      return;
    }
    setMessage(result.message || t.regenerateFailed);
  };

  const handleCopy = async () => {
    const fallbackName = language === 'en' ? 'Resume' : '简历';
    const suffix = language === 'en' ? 'Copy' : '副本';
    const result = await api.resumes.copy(id, { name: `${resume?.name || fallbackName} ${suffix}` });
    if (result.data?.id) router.push(`/resumes/${result.data.id}`);
  };

  const handlePublish = async () => {
    const result = await api.publish.publish(id);
    if (result.data?.publicToken) {
      setPublicToken(result.data.publicToken);
      const url = `${WEB_BASE_URL}/r/${result.data.publicToken}?style=${template}`;
      setPublicUrl(url);
      setMessage(t.published(url));
      await loadResume();
      return;
    }
    setMessage(result.message || t.publishFailed);
  };

  const handleRegeneratePublicUrl = async () => {
    if (!confirm(t.confirmRegenerateLink)) return;
    const result = await api.publish.regenerate(id);
    if (result.data?.publicToken) {
      setPublicToken(result.data.publicToken);
      const url = `${WEB_BASE_URL}/r/${result.data.publicToken}?style=${template}`;
      setPublicUrl(url);
      setMessage(t.linkRegenerated(url));
      return;
    }
    setMessage(result.message || t.regenerateLinkFailed);
  };

  const handleDownloadPdf = async () => {
    setMessage('');
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setMessage(t.sessionExpiredForPdf);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/pdf/${id}?style=${template}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.message || t.pdfGenericFailed);
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.message || t.pdfDownloadFailed(template));
        return;
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        setMessage(t.pdfEmpty(template));
        return;
      }
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `${resume?.profile.name || 'resume'}-${template}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
      setMessage(t.pdfStarted);
    } catch {
      setMessage(t.pdfServiceError);
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-500">{t.processing}</div>;
  if (!resume || !previewResume) return <div className="py-12 text-center text-red-500">{language === 'en' ? 'Resume not found' : '简历未找到'}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{resume.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {resume.profile.name}
            {resume.jobTarget?.parsedJobTitle ? ` / ${resume.jobTarget.parsedJobTitle}` : ''}
            {resume.jobTarget?.parsedCompanyName ? ` @ ${resume.jobTarget.parsedCompanyName}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? t.processing : t.saveDraft}</button>
          <button type="button" onClick={handleRegenerate} disabled={saving} className="btn-secondary">{t.regenerate}</button>
          <button type="button" onClick={handleCopy} className="btn-secondary">{t.duplicate}</button>
          <button type="button" onClick={handlePublish} className="btn-primary bg-emerald-600 hover:bg-emerald-700">{t.publish}</button>
          <button type="button" onClick={handleRegeneratePublicUrl} className="btn-secondary">{t.regenerateLink}</button>
          <button type="button" onClick={handleDownloadPdf} className="btn-secondary">{t.downloadPdf}</button>
        </div>
      </div>

      {message && <div className="card break-all px-4 py-3 text-sm text-slate-700">{message}</div>}
      {publicUrl && <a href={publicUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 break-all">{publicUrl}</a>}

      <section className="card p-4">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-900">{t.style}</h2>
          <p className="mt-1 text-sm text-slate-500">{t.styleHint}</p>
        </div>
        <TemplateSelector selected={template} onSelect={setTemplate} />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="card space-y-5 p-6">
          <h2 className="text-lg font-semibold text-slate-900">{t.editor}</h2>
          <TextArea label={t.fields.summary} rows={5} value={editForm.summary} onChange={(value) => setEditForm({ ...editForm, summary: value })} />
          <TextArea label={t.fields.skills} rows={5} value={editForm.skillsText} onChange={(value) => setEditForm({ ...editForm, skillsText: value })} />
          <TextArea label={t.fields.work} rows={8} value={editForm.workText} onChange={(value) => setEditForm({ ...editForm, workText: value })} />
          <TextArea label={t.fields.project} rows={8} value={editForm.projectText} onChange={(value) => setEditForm({ ...editForm, projectText: value })} />
          <TextArea label={t.fields.certificates} rows={4} value={editForm.certificatesText} onChange={(value) => setEditForm({ ...editForm, certificatesText: value })} />
          <TextArea label={t.fields.evaluation} rows={4} value={editForm.selfEvaluation} onChange={(value) => setEditForm({ ...editForm, selfEvaluation: value })} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{t.preview}</h2>
            <span className="text-sm text-slate-500">{t.currentStyle}{resumeTemplates.find((item) => item.id === template)?.label}</span>
          </div>
          <div className="overflow-auto rounded border border-slate-200 bg-slate-100 p-3">
            <ResumePreview resume={previewResume} template={template} />
          </div>
          {(resume.aiOptimizationNotes?.length || resume.aiGapAnalysis?.length) && (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <InlineList title={t.aiNotes} items={resume.aiOptimizationNotes || []} />
              <InlineList title={t.aiGaps} items={resume.aiGapAnalysis || []} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TextArea({ label, rows, value, onChange }: { label: string; rows: number; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <textarea className="input" rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function InlineList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-2">
      <p className="font-medium">{title}</p>
      <ul className="mt-1 list-disc pl-5">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function lines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function textToItems(value: string, type: 'work' | 'project'): ResumeItem[] {
  return value
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const [first, ...rest] = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      return type === 'work'
        ? { title: first, description: rest.join('\n'), highlights: rest }
        : { name: first, description: rest.join('\n'), highlights: rest };
    });
}

function itemsToText(items: ResumeItem[]) {
  return items
    .map((item) => [
      item.title || item.name || item.projectName || item.company || item.companyName,
      ...(item.highlights || []),
      item.description && !item.highlights?.length ? item.description : undefined,
    ].filter(Boolean).join('\n'))
    .join('\n\n');
}
