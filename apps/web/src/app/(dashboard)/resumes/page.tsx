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

const STATUS_TEXT: Record<string, string> = {
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
  const [form, setForm] = useState({ name: '', profileId: '', jobTargetId: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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
    if (!form.profileId) return;

    setCreating(true);
    const result = await api.resumes.create({
      name: form.name || '岗位定制简历',
      profileId: form.profileId,
      jobTargetId: form.jobTargetId || undefined,
    });
    setCreating(false);

    if (result.data?.id) {
      window.location.href = `/resumes/${result.data.id}`;
      return;
    }

    await loadData();
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这个简历版本吗？')) return;
    await api.resumes.delete(id);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">简历版本</h1>
          <p className="text-slate-500 mt-1">为不同岗位生成、编辑、发布简历</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>
          + 新建简历
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">新建岗位定制简历</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">名称</label>
              <input
                className="input"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="例如：前端工程师-字节"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">主档案</label>
              <select
                required
                className="input"
                value={form.profileId}
                onChange={(event) => setForm({ ...form, profileId: event.target.value })}
              >
                <option value="">选择档案</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">目标岗位</label>
              <select
                className="input"
                value={form.jobTargetId}
                onChange={(event) => setForm({ ...form, jobTargetId: event.target.value })}
              >
                <option value="">不关联岗位</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.parsedJobTitle || job.rawJdText?.slice(0, 24) || '未命名岗位'}
                    {job.parsedCompanyName ? ` @ ${job.parsedCompanyName}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>取消</button>
            <button type="submit" disabled={creating || profiles.length === 0} className="btn-primary disabled:opacity-60">
              {creating ? '生成中...' : '创建并生成'}
            </button>
          </div>
        </form>
      )}

      {resumes.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-600 mb-2">暂无简历版本</p>
          <p className="text-slate-500 text-sm">先创建主档案和目标岗位，再生成岗位定制简历。</p>
          <div className="flex justify-center gap-4 mt-6">
            <Link href="/profiles" className="btn-secondary">创建档案</Link>
            <Link href="/jobs" className="btn-primary">添加岗位</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume) => (
            <div key={resume.id} className="card p-6 hover:shadow-lg">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-slate-800">{resume.name}</h3>
                <span className="tag bg-slate-100 text-slate-600">{STATUS_TEXT[resume.status] || resume.status}</span>
              </div>
              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <p>档案：{resume.profile?.name || '未知'}</p>
                {resume.jobTarget && (
                  <p>
                    目标：{resume.jobTarget.parsedJobTitle || '未命名岗位'}
                    {resume.jobTarget.parsedCompanyName && ` @ ${resume.jobTarget.parsedCompanyName}`}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">{new Date(resume.createdAt).toLocaleDateString()}</span>
                <div className="flex gap-3">
                  <Link href={`/resumes/${resume.id}`} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    编辑
                  </Link>
                  <button type="button" onClick={() => handleDelete(resume.id)} className="text-sm text-red-500 hover:text-red-700">
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
