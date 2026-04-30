'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language';

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

const statusText = {
  zh: {
    DRAFT: '草稿',
    GENERATING: '生成中',
    GENERATE_FAILED: '生成失败',
    READY_EDIT: '可编辑',
    PUBLISHED: '已发布',
    ARCHIVED: '已归档',
  },
  en: {
    DRAFT: 'Draft',
    GENERATING: 'Generating',
    GENERATE_FAILED: 'Failed',
    READY_EDIT: 'Editable',
    PUBLISHED: 'Published',
    ARCHIVED: 'Archived',
  },
} as const;

const copy = {
  zh: {
    title: '简历生成与版本',
    subtitle: '从主档案和岗位目标生成定制简历，继续编辑、发布公开链接并导出 PDF。',
    newResume: '生成新简历',
    steps: [
      { title: '1. 主档案', text: '维护完整经历', href: '/profiles' },
      { title: '2. 岗位输入', text: '网址或 JD', href: '/jobs' },
      { title: '3. 岗位解析', text: '结构化要求', href: '/jobs' },
      { title: '4. AI 生成', text: '定制简历草稿' },
      { title: '5. 发布导出', text: '公开链接和 PDF' },
    ],
    createTitle: '生成岗位定制简历',
    createHint: '必须选择一份主档案和一个已输入的岗位目标。',
    cancel: '取消',
    resumeName: '简历名称',
    resumeNamePlaceholder: '例如：前端工程师 - 字节',
    profile: '主档案',
    selectProfile: '选择主档案',
    job: '目标岗位',
    selectJob: '选择岗位目标',
    unnamedJob: '未命名岗位',
    createProfileFirst: '先创建主档案',
    createJobFirst: '先输入岗位要求',
    generating: '生成中...',
    startGenerate: '开始生成',
    needSelect: '请选择主档案和目标岗位后再生成。',
    defaultResumeName: '岗位定制简历',
    createFailed: '生成简历失败',
    loading: '加载中...',
    emptyTitle: '还没有简历版本',
    emptyHint: '按流程先维护主档案，再输入岗位要求，然后生成定制简历。',
    maintainProfile: '维护主档案',
    inputJob: '输入岗位',
    profileLine: '主档案：',
    jobLine: '目标岗位：',
    companyLine: '公司：',
    editPublish: '编辑/发布',
    delete: '删除',
    deleteConfirm: '确定删除这个简历版本吗？',
  },
  en: {
    title: 'Resume Generation and Versions',
    subtitle: 'Generate tailored resumes from your profile and job targets. Edit, publish a public link, and export PDF.',
    newResume: 'Generate Resume',
    steps: [
      { title: '1. Profile', text: 'Maintain full experience', href: '/profiles' },
      { title: '2. Job Input', text: 'URL or JD', href: '/jobs' },
      { title: '3. Job Parsing', text: 'Structured requirements', href: '/jobs' },
      { title: '4. AI Generate', text: 'Tailored draft' },
      { title: '5. Publish & Export', text: 'Public link and PDF' },
    ],
    createTitle: 'Generate Tailored Resume',
    createHint: 'You must select a profile and a job target.',
    cancel: 'Cancel',
    resumeName: 'Resume Name',
    resumeNamePlaceholder: 'e.g. Frontend Engineer - ByteDance',
    profile: 'Profile',
    selectProfile: 'Select profile',
    job: 'Job Target',
    selectJob: 'Select job target',
    unnamedJob: 'Untitled job',
    createProfileFirst: 'Create a profile first',
    createJobFirst: 'Add a job target first',
    generating: 'Generating...',
    startGenerate: 'Start',
    needSelect: 'Please select a profile and job target.',
    defaultResumeName: 'Tailored Resume',
    createFailed: 'Failed to generate resume',
    loading: 'Loading...',
    emptyTitle: 'No resume versions yet',
    emptyHint: 'Maintain a profile, add a job target, then generate a tailored resume.',
    maintainProfile: 'Profiles',
    inputJob: 'Jobs',
    profileLine: 'Profile: ',
    jobLine: 'Job: ',
    companyLine: 'Company: ',
    editPublish: 'Edit / Publish',
    delete: 'Delete',
    deleteConfirm: 'Delete this resume version?',
  },
} as const;

export default function ResumesPage() {
  const { language } = useLanguage();
  const t = copy[language];
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
      setMessage(t.needSelect);
      return;
    }

    setCreating(true);
    const result = await api.resumes.create({
      name: form.name.trim() || t.defaultResumeName,
      profileId: form.profileId,
      jobTargetId: form.jobTargetId,
    });
    setCreating(false);

    if (result.data?.id) {
      window.location.href = `/resumes/${result.data.id}`;
      return;
    }

    setMessage(result.message || t.createFailed);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    await api.resumes.delete(id);
    await loadData();
  };

  if (loading) return <div className="text-center py-12 text-slate-500">{t.loading}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
          <p className="text-slate-500 mt-1">{t.subtitle}</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>
          {t.newResume}
        </button>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
          {t.steps.map((step) => (
            <FlowStep key={step.title} title={step.title} text={step.text} href={'href' in step ? (step as { href?: string }).href : undefined} />
          ))}
        </div>
      </div>

      {message && <div className="card px-4 py-3 text-sm text-red-600">{message}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t.createTitle}</h2>
              <p className="text-sm text-slate-500 mt-1">{t.createHint}</p>
            </div>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>{t.cancel}</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.resumeName}</label>
              <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={t.resumeNamePlaceholder} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.profile}</label>
              <select required className="input" value={form.profileId} onChange={(event) => setForm({ ...form, profileId: event.target.value })}>
                <option value="">{t.selectProfile}</option>
                {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.job}</label>
              <select required className="input" value={form.jobTargetId} onChange={(event) => setForm({ ...form, jobTargetId: event.target.value })}>
                <option value="">{t.selectJob}</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.parsedJobTitle || job.rawJdText?.slice(0, 24) || t.unnamedJob}
                    {job.parsedCompanyName ? ` @ ${job.parsedCompanyName}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-3">
              {profiles.length === 0 && <Link href="/profiles" className="text-sm text-blue-700">{t.createProfileFirst}</Link>}
              {jobs.length === 0 && <Link href="/jobs" className="text-sm text-blue-700">{t.createJobFirst}</Link>}
            </div>
            <button type="submit" disabled={creating || profiles.length === 0 || jobs.length === 0} className="btn-primary disabled:opacity-60">
              {creating ? t.generating : t.startGenerate}
            </button>
          </div>
        </form>
      )}

      {resumes.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-700 font-medium">{t.emptyTitle}</p>
          <p className="text-slate-500 text-sm mt-2">{t.emptyHint}</p>
          <div className="flex justify-center gap-3 mt-6">
            <Link href="/profiles" className="btn-secondary">{t.maintainProfile}</Link>
            <Link href="/jobs" className="btn-primary">{t.inputJob}</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {resumes.map((resume) => (
            <div key={resume.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-slate-900">{resume.name}</h3>
                <span className="tag">{statusText[language][resume.status as keyof typeof statusText.zh] || resume.status}</span>
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <p>{t.profileLine}{resume.profile?.name || '-'}</p>
                <p>{t.jobLine}{resume.jobTarget?.parsedJobTitle || '-'}</p>
                {resume.jobTarget?.parsedCompanyName && <p>{t.companyLine}{resume.jobTarget.parsedCompanyName}</p>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">{new Date(resume.createdAt).toLocaleString()}</span>
                <div className="flex gap-3">
                  <Link href={`/resumes/${resume.id}`} className="text-sm text-blue-700 font-medium">{t.editPublish}</Link>
                  <button type="button" onClick={() => handleDelete(resume.id)} className="text-sm text-red-500">{t.delete}</button>
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
