'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface ResumeVersion {
  id: string;
  name: string;
  status: string;
  contentSummary?: string;
  contentSkills?: string[];
  contentWorkExperiences?: any[];
  contentProjectExperiences?: any[];
  contentCertificates?: string[];
  contentSelfEvaluation?: string;
  profile: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
  };
  jobTarget?: {
    parsedJobTitle?: string;
    parsedCompanyName?: string;
  };
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
  const [editForm, setEditForm] = useState({
    summary: '',
    skills: [] as string[],
    selfEvaluation: '',
  });
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    loadResume();
  }, [id]);

  const loadResume = async () => {
    setLoading(true);
    const result = await api.resumes.get(id);
    if (result.data) {
      setResume(result.data);
      setEditForm({
        summary: result.data.contentSummary || '',
        skills: result.data.contentSkills || [],
        selfEvaluation: result.data.contentSelfEvaluation || '',
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    const result = await api.resumes.updateContent(id, editForm);
    setSaving(false);

    if (result.data) {
      setResume(result.data);
      setMessage('已保存');
    } else {
      setMessage(result.message || '保存失败');
    }
  };

  const handleAddSkill = () => {
    const value = newSkill.trim();
    if (!value || editForm.skills.includes(value)) return;
    setEditForm({ ...editForm, skills: [...editForm.skills, value] });
    setNewSkill('');
  };

  const handleCopy = async () => {
    const result = await api.resumes.copy(id);
    if (result.data?.id) {
      router.push(`/resumes/${result.data.id}`);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('确定重新生成简历吗？当前 AI 生成内容会被覆盖。')) return;
    const result = await api.resumes.regenerate(id);
    if (result.data) {
      await loadResume();
      setMessage('已重新生成');
    } else {
      setMessage(result.message || '重新生成失败');
    }
  };

  const handlePublish = async () => {
    const result = await api.publish.publish(id);
    if (result.data?.publicToken) {
      setMessage(`已发布：/r/${result.data.publicToken}`);
      await loadResume();
      return;
    }
    setMessage(result.message || '发布失败');
  };

  const handleDownloadPdf = () => {
    window.open(`${API_BASE_URL}/pdf/${id}`, '_blank');
  };

  if (loading) return <div className="text-center py-8">加载中...</div>;
  if (!resume) return <div className="text-center py-8 text-red-500">简历未找到</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{resume.name}</h1>
          <p className="text-sm text-slate-500">
            {resume.profile.name}
            {resume.jobTarget?.parsedJobTitle ? ` / ${resume.jobTarget.parsedJobTitle}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleCopy} className="btn-secondary">复制</button>
          <button type="button" onClick={handleRegenerate} className="btn-secondary">重新生成</button>
          <button type="button" onClick={handlePublish} className="btn-primary bg-emerald-600 hover:bg-emerald-700">发布</button>
          <button type="button" onClick={handleDownloadPdf} className="btn-primary">PDF</button>
        </div>
      </div>

      {message && <div className="card px-4 py-3 text-sm text-slate-700">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-800">编辑内容</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">个人简介</label>
            <textarea
              value={editForm.summary}
              onChange={(event) => setEditForm({ ...editForm, summary: event.target.value })}
              rows={5}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">技能标签</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {editForm.skills.map((skill) => (
                <span key={skill} className="tag tag-primary flex items-center gap-2">
                  {skill}
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, skills: editForm.skills.filter((item) => item !== skill) })}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newSkill}
                onChange={(event) => setNewSkill(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="input"
                placeholder="添加技能"
              />
              <button type="button" onClick={handleAddSkill} className="btn-secondary">添加</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">自我评价</label>
            <textarea
              value={editForm.selfEvaluation}
              onChange={(event) => setEditForm({ ...editForm, selfEvaluation: event.target.value })}
              rows={4}
              className="input"
            />
          </div>

          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary w-full disabled:opacity-60">
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">简历预览</h2>
          <div className="border border-slate-200 rounded-lg p-5 bg-slate-50 space-y-5">
            <header className="text-center border-b border-slate-200 pb-4">
              <h3 className="text-xl font-bold text-slate-900">{resume.profile.name}</h3>
              <p className="text-sm text-slate-600">{resume.profile.email}</p>
              <p className="text-sm text-slate-600">
                {[resume.profile.phone, resume.profile.location].filter(Boolean).join(' / ')}
              </p>
            </header>

            {editForm.summary && (
              <section>
                <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">个人简介</h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{editForm.summary}</p>
              </section>
            )}

            {editForm.skills.length > 0 && (
              <section>
                <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">技能</h4>
                <div className="flex flex-wrap gap-2">
                  {editForm.skills.map((skill) => <span key={skill} className="tag tag-primary">{skill}</span>)}
                </div>
              </section>
            )}

            {(resume.contentWorkExperiences || []).length > 0 && (
              <section>
                <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">工作经历</h4>
                {resume.contentWorkExperiences?.map((item, index) => (
                  <div key={index} className="mb-3 text-sm">
                    <p className="font-medium text-slate-900">{item.title || item.companyName} - {item.company || item.companyName}</p>
                    {item.description && <p className="text-slate-600">{item.description}</p>}
                  </div>
                ))}
              </section>
            )}

            {(resume.contentProjectExperiences || []).length > 0 && (
              <section>
                <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">项目经历</h4>
                {resume.contentProjectExperiences?.map((item, index) => (
                  <div key={index} className="mb-3 text-sm">
                    <p className="font-medium text-slate-900">{item.name || item.projectName}</p>
                    {item.description && <p className="text-slate-600">{item.description}</p>}
                  </div>
                ))}
              </section>
            )}

            {editForm.selfEvaluation && (
              <section>
                <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">自我评价</h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{editForm.selfEvaluation}</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
