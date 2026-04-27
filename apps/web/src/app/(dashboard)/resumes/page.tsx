'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface ResumeVersion {
  id: string;
  name: string;
  status: string;
  profile?: { id: string; name: string };
  jobTarget?: { id: string; parsedJobTitle?: string; parsedCompanyName?: string };
  createdAt: string;
}

interface ProfileOption {
  id: string;
  name: string;
}

interface JobOption {
  id: string;
  parsedJobTitle?: string;
  parsedCompanyName?: string;
  rawJdText?: string;
}

const statusText: Record<string, string> = {
  DRAFT: '草稿',
  GENERATING: '生成中',
  GENERATE_FAILED: '生成失败',
  READY_EDIT: '可编辑',
  PUBLISHED: '已发布',
  ARCHIVED: '已归档',
};

export default function ResumesPage() {
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', profileId: '', jobTargetId: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [resumeResult, profileResult, jobResult] = await Promise.all([
      api.resumes.list(),
      api.profiles.list(),
      api.jobs.list(),
    ]);

    if (resumeResult.data) setResumes(resumeResult.data);
    if (profileResult.data) setProfiles(profileResult.data);
    if (jobResult.data) setJobs(jobResult.data);
    setLoading(false);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');

    if (!form.profileId || !form.jobTargetId) {
      setMessage('请选择主档案和目标岗位后再生成。');
      return;
    }

    setCreating(true);
    const result = await api.resumes.create({
      name: form.name.trim() || '岗位定制简历',
      profileId: form.profileId,
      jobTargetId: form.jobTargetId,
    });
    setCreating(false);

    if (result.data?.id) {
      window.location.href = `/resumes/${result.data.id}`;
      return;
    }

    setMessage(result.message || '生成简历失败');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这个简历版本吗？')) return;
    await api.resumes.delete(id);
    await loadData();
  };

  if (loading) return <div className="text-center py-12 text-slate-500">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">简历生成与版本</h1>
          <p className="text-slate-500 mt-1">从主档案和岗位目标生成定制简历，继续编辑、发布公开链接并导出 PDF。</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>
          生成新简历
        </button>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
          <FlowStep title="1. 主档案" text="维护完整经历" href="/profiles" />
          <FlowStep title="2. 岗位输入" text="网址或 JD" href="/jobs" />
          <FlowStep title="3. 岗位解析" text="结构化要求" href="/jobs" />
          <FlowStep title="4. AI 生成" text="定制简历草稿" />
          <FlowStep title="5. 发布导出" text="公开链接和 PDF" />
        </div>
      </div>

      {message && <div className="card px-4 py-3 text-sm text-red-600">{message}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">生成岗位定制简历</h2>
              <p className="text-sm text-slate-500 mt-1">必须选择一份主档案和一个已输入的岗位目标。</p>
            </div>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>取消</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">简历名称</label>
              <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如：前端工程师 - 字节" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">主档案</label>
              <select required className="input" value={form.profileId} onChange={(event) => setForm({ ...form, profileId: event.target.value })}>
                <option value="">选择主档案</option>
                {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">目标岗位</label>
              <select required className="input" value={form.jobTargetId} onChange={(event) => setForm({ ...form, jobTargetId: event.target.value })}>
                <option value="">选择岗位目标</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.parsedJobTitle || job.rawJdText?.slice(0, 24) || '未命名岗位'}
                    {job.parsedCompanyName ? ` @ ${job.parsedCompanyName}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-3">
              {profiles.length === 0 && <Link href="/profiles" className="text-sm text-indigo-600">先创建主档案</Link>}
              {jobs.length === 0 && <Link href="/jobs" className="text-sm text-indigo-600">先输入岗位要求</Link>}
            </div>
            <button type="submit" disabled={creating || profiles.length === 0 || jobs.length === 0} className="btn-primary disabled:opacity-60">
              {creating ? '生成中...' : '开始生成'}
            </button>
          </div>
        </form>
      )}

      {resumes.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-700 font-medium">还没有简历版本</p>
          <p className="text-slate-500 text-sm mt-2">按流程先维护主档案，再输入岗位要求，然后生成定制简历。</p>
          <div className="flex justify-center gap-3 mt-6">
            <Link href="/profiles" className="btn-secondary">维护主档案</Link>
            <Link href="/jobs" className="btn-primary">输入岗位</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {resumes.map((resume) => (
            <div key={resume.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-slate-900">{resume.name}</h3>
                <span className="tag">{statusText[resume.status] || resume.status}</span>
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <p>主档案：{resume.profile?.name || '-'}</p>
                <p>目标岗位：{resume.jobTarget?.parsedJobTitle || '-'}</p>
                {resume.jobTarget?.parsedCompanyName && <p>公司：{resume.jobTarget.parsedCompanyName}</p>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">{new Date(resume.createdAt).toLocaleString()}</span>
                <div className="flex gap-3">
                  <Link href={`/resumes/${resume.id}`} className="text-sm text-indigo-600 font-medium">编辑/发布</Link>
                  <button type="button" onClick={() => handleDelete(resume.id)} className="text-sm text-red-500">删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FlowStep({ title, text, href }: { title: string; text: string; href?: string }) {
  const content = (
    <div className="rounded border border-slate-200 p-3 h-full">
      <div className="font-medium text-slate-900">{title}</div>
      <div className="text-slate-500 mt-1">{text}</div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
