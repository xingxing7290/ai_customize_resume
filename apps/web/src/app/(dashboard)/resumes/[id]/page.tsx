'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface ResumeVersion {
  id: string;
  name: string;
  status: string;
  contentSummary?: string;
  contentSkills?: string[];
  contentWorkExperiences?: ResumeItem[];
  contentProjectExperiences?: ResumeItem[];
  contentCertificates?: string[];
  contentSelfEvaluation?: string;
  aiOptimizationNotes?: string[];
  aiGapAnalysis?: string[];
  profile: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
  };
  jobTarget?: {
    parsedJobTitle?: string;
    parsedCompanyName?: string;
    parsedTechStack?: string[];
  };
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
  highlights?: string[];
  techStack?: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://113.44.50.108:3001';

export default function ResumeEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [resume, setResume] = useState<ResumeVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [publicUrl, setPublicUrl] = useState('');
  const [editForm, setEditForm] = useState({
    summary: '',
    skillsText: '',
    workText: '',
    projectText: '',
    certificatesText: '',
    selfEvaluation: '',
  });

  useEffect(() => { loadResume(); }, [id]);

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
    }
    setLoading(false);
  };

  const skills = useMemo(() => lines(editForm.skillsText), [editForm.skillsText]);
  const certificates = useMemo(() => lines(editForm.certificatesText), [editForm.certificatesText]);
  const workExperiences = useMemo(() => textToItems(editForm.workText, 'work'), [editForm.workText]);
  const projectExperiences = useMemo(() => textToItems(editForm.projectText, 'project'), [editForm.projectText]);

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
      setResume(result.data);
      setMessage('草稿已保存。');
      return;
    }
    setMessage(result.message || '保存失败');
  };

  const handleRegenerate = async () => {
    if (!confirm('确定重新生成吗？当前编辑内容会被生成结果覆盖。')) return;
    setSaving(true);
    setMessage('');
    const result = await api.resumes.regenerate(id);
    setSaving(false);
    if (result.data) {
      setMessage('已重新生成。');
      await loadResume();
      return;
    }
    setMessage(result.message || '重新生成失败');
  };

  const handleCopy = async () => {
    const result = await api.resumes.copy(id, { name: `${resume?.name || '简历'} 副本` });
    if (result.data?.id) router.push(`/resumes/${result.data.id}`);
  };

  const handlePublish = async () => {
    const result = await api.publish.publish(id);
    if (result.data?.publicToken) {
      const url = `http://113.44.50.108:3000/r/${result.data.publicToken}`;
      setPublicUrl(url);
      setMessage(`已发布公开链接：${url}`);
      await loadResume();
      return;
    }
    setMessage(result.message || '发布失败');
  };

  const handleDownloadPdf = () => {
    window.open(`${API_BASE_URL}/pdf/${id}`, '_blank');
  };

  if (loading) return <div className="text-center py-12 text-slate-500">加载中...</div>;
  if (!resume) return <div className="text-center py-12 text-red-500">简历未找到</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{resume.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {resume.profile.name}
            {resume.jobTarget?.parsedJobTitle ? ` / ${resume.jobTarget.parsedJobTitle}` : ''}
            {resume.jobTarget?.parsedCompanyName ? ` @ ${resume.jobTarget.parsedCompanyName}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? '处理中...' : '保存草稿'}</button>
          <button type="button" onClick={handleRegenerate} disabled={saving} className="btn-secondary">重新生成</button>
          <button type="button" onClick={handleCopy} className="btn-secondary">复制版本</button>
          <button type="button" onClick={handlePublish} className="btn-primary bg-emerald-600 hover:bg-emerald-700">发布</button>
          <button type="button" onClick={handleDownloadPdf} className="btn-secondary">下载 PDF</button>
        </div>
      </div>

      {message && <div className="card px-4 py-3 text-sm text-slate-700 break-all">{message}</div>}
      {publicUrl && <a href={publicUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 break-all">{publicUrl}</a>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-900">在线编辑</h2>
          <TextArea label="个人简介" rows={5} value={editForm.summary} onChange={(value) => setEditForm({ ...editForm, summary: value })} />
          <TextArea label="技能标签（每行一个）" rows={5} value={editForm.skillsText} onChange={(value) => setEditForm({ ...editForm, skillsText: value })} />
          <TextArea label="工作经历（每段用空行分隔，第一行为标题）" rows={8} value={editForm.workText} onChange={(value) => setEditForm({ ...editForm, workText: value })} />
          <TextArea label="项目经历（每段用空行分隔，第一行为项目名）" rows={8} value={editForm.projectText} onChange={(value) => setEditForm({ ...editForm, projectText: value })} />
          <TextArea label="证书/奖项（每行一个）" rows={4} value={editForm.certificatesText} onChange={(value) => setEditForm({ ...editForm, certificatesText: value })} />
          <TextArea label="自我评价" rows={4} value={editForm.selfEvaluation} onChange={(value) => setEditForm({ ...editForm, selfEvaluation: value })} />
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">简历预览</h2>
          <div className="rounded border border-slate-200 bg-slate-50 p-6 space-y-5">
            <header className="text-center border-b border-slate-200 pb-4">
              <h3 className="text-2xl font-bold text-slate-900">{resume.profile.name}</h3>
              <p className="text-sm text-slate-600">{resume.profile.email}</p>
              <p className="text-sm text-slate-600">{[resume.profile.phone, resume.profile.location].filter(Boolean).join(' / ')}</p>
            </header>

            <PreviewSection title="个人简介" text={editForm.summary} />
            {skills.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 border-b border-slate-200 pb-1 mb-2">技能</h4>
                <div className="flex flex-wrap gap-2">{skills.map((skill) => <span key={skill} className="tag tag-primary">{skill}</span>)}</div>
              </div>
            )}
            <ItemSection title="工作经历" items={workExperiences} />
            <ItemSection title="项目经历" items={projectExperiences} />
            {certificates.length > 0 && <PreviewList title="证书/奖项" items={certificates} />}
            <PreviewSection title="自我评价" text={editForm.selfEvaluation} />

            {(resume.aiOptimizationNotes || resume.aiGapAnalysis) && (
              <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 space-y-2">
                <PreviewList title="AI 优化说明" items={resume.aiOptimizationNotes || []} />
                <PreviewList title="待补充差距" items={resume.aiGapAnalysis || []} />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function TextArea({ label, rows, value, onChange }: { label: string; rows: number; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <textarea className="input" rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function PreviewSection({ title, text }: { title: string; text?: string }) {
  if (!text?.trim()) return null;
  return (
    <section>
      <h4 className="font-semibold text-slate-900 border-b border-slate-200 pb-1 mb-2">{title}</h4>
      <p className="text-sm text-slate-700 whitespace-pre-wrap">{text}</p>
    </section>
  );
}

function PreviewList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h4 className="font-semibold text-slate-900 border-b border-slate-200 pb-1 mb-2">{title}</h4>
      <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  );
}

function ItemSection({ title, items }: { title: string; items: ResumeItem[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h4 className="font-semibold text-slate-900 border-b border-slate-200 pb-1 mb-2">{title}</h4>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="text-sm">
            <p className="font-medium text-slate-900">{item.title || item.name || item.projectName || item.company || item.companyName}</p>
            {item.description && <p className="text-slate-700 whitespace-pre-wrap">{item.description}</p>}
            {item.highlights && item.highlights.length > 0 && (
              <ul className="list-disc pl-5 text-slate-700 mt-1">{item.highlights.map((line) => <li key={line}>{line}</li>)}</ul>
            )}
          </div>
        ))}
      </div>
    </section>
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
    .map((item) => [item.title || item.name || item.projectName || item.company || item.companyName, ...(item.highlights || []), item.description && !item.highlights?.length ? item.description : undefined].filter(Boolean).join('\n'))
    .join('\n\n');
}
