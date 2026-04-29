'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language';

interface JobTarget {
  id: string;
  sourceUrl?: string;
  rawJdText?: string;
  status: string;
  parsedJobTitle?: string;
  parsedCompanyName?: string;
  parsedLocation?: string;
  parsedResponsibilities?: string[];
  parsedRequirements?: string[];
  parsedTechStack?: string[];
  parsedSalary?: string;
  parsedBenefits?: string[];
  parsedExperienceRequirement?: string;
  parsedEducationRequirement?: string;
  parseError?: string;
  createdAt: string;
}

interface ProfileOption {
  id: string;
  name: string;
  email: string;
}

const statusText = {
  zh: {
    INIT: '待处理',
    PARSING: '解析中',
    PARSE_SUCCESS: '已解析',
    PARSE_FAILED: '解析失败',
  },
  en: {
    INIT: 'Pending',
    PARSING: 'Parsing',
    PARSE_SUCCESS: 'Parsed',
    PARSE_FAILED: 'Parse Failed',
  },
} as const;

const copy = {
  zh: {
    resumeDefaultTitle: '岗位定制简历',
    reparseDone: '岗位已重新解析。',
    reparseFailed: '重新解析失败',
    pickProfileFirst: '请先选择一个主档案。',
    resumeNameFallback: (jobTitle: string) => `${jobTitle}定制简历`,
    generateFailed: '生成简历失败',
    deleteConfirm: '确定删除这个岗位目标吗？',
    loading: '加载中...',
    notFound: '岗位目标不存在',
    breadcrumbJobs: '岗位输入',
    breadcrumbDetail: '岗位详情',
    unnamedJob: '未命名岗位',
    unknownCompany: '公司未识别',
    saveAndReparse: '保存并重新解析',
    delete: '删除',
    rawInput: '岗位原始输入',
    rawHint: '可在这里补充或修正 JD 文本，然后重新解析。',
    jobUrl: '岗位网址',
    jd: '岗位 JD / 要求',
    parsedResult: '解析结果',
    responsibilities: '岗位职责',
    requirements: '任职要求',
    tech: '技术关键词',
    generateTitle: '生成定制简历',
    generateHint: '选择一份主档案，系统会基于该岗位要求生成一份可编辑的简历版本。',
    profile: '主档案',
    selectProfile: '选择主档案',
    createProfileFirst: '先创建主档案',
    resumeName: '简历版本名称',
    processing: '处理中...',
    generate: '生成定制简历',
    empty: '暂无内容',
    grid: {
      jobTitle: '岗位名称',
      company: '公司名称',
      location: '工作地点',
      salary: '薪资信息',
      experience: '经验要求',
      education: '学历要求',
    },
  },
  en: {
    resumeDefaultTitle: 'Tailored Resume',
    reparseDone: 'Job has been reparsed.',
    reparseFailed: 'Reparse failed',
    pickProfileFirst: 'Please select a profile first.',
    resumeNameFallback: (jobTitle: string) => `Tailored Resume - ${jobTitle}`,
    generateFailed: 'Failed to generate resume',
    deleteConfirm: 'Delete this job target?',
    loading: 'Loading...',
    notFound: 'Job target not found',
    breadcrumbJobs: 'Jobs',
    breadcrumbDetail: 'Job Detail',
    unnamedJob: 'Untitled Job',
    unknownCompany: 'Company not recognized',
    saveAndReparse: 'Save and Reparse',
    delete: 'Delete',
    rawInput: 'Raw Input',
    rawHint: 'You can paste or refine the JD here, then reparse.',
    jobUrl: 'Job URL',
    jd: 'Job JD / Requirements',
    parsedResult: 'Parsed Result',
    responsibilities: 'Responsibilities',
    requirements: 'Requirements',
    tech: 'Tech Keywords',
    generateTitle: 'Generate Tailored Resume',
    generateHint: 'Pick a profile and we will generate an editable resume version based on this job.',
    profile: 'Profile',
    selectProfile: 'Select profile',
    createProfileFirst: 'Create a profile first',
    resumeName: 'Resume Name',
    processing: 'Processing...',
    generate: 'Generate Resume',
    empty: 'No content',
    grid: {
      jobTitle: 'Job Title',
      company: 'Company',
      location: 'Location',
      salary: 'Salary',
      experience: 'Experience',
      education: 'Education',
    },
  },
} as const;

export default function JobDetailPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<JobTarget | null>(null);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [profileId, setProfileId] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function loadData() {
    setLoading(true);
    const [jobResult, profileResult] = await Promise.all([
      api.jobs.get(jobId),
      api.profiles.list(),
    ]);

    if (jobResult.data) {
      setJob(jobResult.data);
      setJdText(jobResult.data.rawJdText || '');
      const defaultName = [
        jobResult.data.parsedJobTitle || t.resumeDefaultTitle,
        jobResult.data.parsedCompanyName,
      ].filter(Boolean).join(' - ');
      setResumeName(defaultName);
    }
    if (profileResult.data) {
      setProfiles(profileResult.data);
      if (!profileId && profileResult.data[0]) setProfileId(profileResult.data[0].id);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [jobId]);

  const handleSaveAndReparse = async () => {
    if (!job) return;
    setBusy(true);
    setMessage('');
    const update = await api.jobs.update(job.id, { rawJdText: jdText.trim() || undefined, sourceUrl: job.sourceUrl });
    if (update.message) {
      setMessage(update.message);
      setBusy(false);
      return;
    }
    const result = await api.jobs.reparse(job.id);
    setBusy(false);
    if (result.data) {
      setMessage(t.reparseDone);
      await loadData();
      return;
    }
    setMessage(result.message || t.reparseFailed);
  };

  const handleGenerateResume = async () => {
    if (!job || !profileId) {
      setMessage(t.pickProfileFirst);
      return;
    }
    setBusy(true);
    setMessage('');
    const result = await api.resumes.create({
      name: resumeName.trim() || t.resumeNameFallback(job.parsedJobTitle || (language === 'en' ? 'Job' : '岗位')),
      profileId,
      jobTargetId: job.id,
    });
    setBusy(false);

    if (result.data?.id) {
      router.push(`/resumes/${result.data.id}`);
      return;
    }

    setMessage(result.message || t.generateFailed);
  };

  const handleDelete = async () => {
    if (!job || !confirm(t.deleteConfirm)) return;
    await api.jobs.delete(job.id);
    router.push('/jobs');
  };

  if (loading) return <div className="text-center py-12 text-slate-500">{t.loading}</div>;
  if (!job) return <div className="text-center py-12 text-red-500">{t.notFound}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/jobs" className="text-slate-500 hover:text-slate-700">{t.breadcrumbJobs}</Link>
        <span className="text-slate-400">/</span>
        <span className="font-medium text-slate-900">{job.parsedJobTitle || t.breadcrumbDetail}</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{job.parsedJobTitle || t.unnamedJob}</h1>
          <p className="text-slate-500 mt-1">
            {job.parsedCompanyName || t.unknownCompany}{job.parsedLocation ? ` / ${job.parsedLocation}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="tag">{statusText[language][job.status as keyof typeof statusText.zh] || job.status}</span>
          <button type="button" className="btn-secondary" onClick={handleSaveAndReparse} disabled={busy}>{t.saveAndReparse}</button>
          <button type="button" className="btn-secondary text-red-600" onClick={handleDelete}>{t.delete}</button>
        </div>
      </div>

      {message && <div className="card px-4 py-3 text-sm text-slate-700">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <section className="card p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t.rawInput}</h2>
              <p className="text-sm text-slate-500 mt-1">{t.rawHint}</p>
            </div>
            {job.sourceUrl && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.jobUrl}</label>
                <a href={job.sourceUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 break-all">{job.sourceUrl}</a>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.jd}</label>
              <textarea className="input" rows={14} value={jdText} onChange={(event) => setJdText(event.target.value)} />
            </div>
          </section>

          <section className="card p-6 space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">{t.parsedResult}</h2>
            {job.parseError && <div className="text-sm text-red-600">{job.parseError}</div>}
            <InfoGrid job={job} labels={t.grid} />
            <List title={t.responsibilities} items={job.parsedResponsibilities || []} emptyText={t.empty} />
            <List title={t.requirements} items={job.parsedRequirements || []} emptyText={t.empty} />
            <List title={t.tech} items={job.parsedTechStack || []} compact emptyText={t.empty} />
            <List title={language === 'en' ? 'Benefits' : '福利待遇'} items={job.parsedBenefits || []} compact emptyText={t.empty} />
          </section>
        </div>

        <aside className="card p-6 h-fit space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t.generateTitle}</h2>
            <p className="text-sm text-slate-500 mt-1">{t.generateHint}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t.profile}</label>
            <select className="input" value={profileId} onChange={(event) => setProfileId(event.target.value)}>
              <option value="">{t.selectProfile}</option>
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} / {profile.email}</option>)}
            </select>
            {profiles.length === 0 && (
              <Link href="/profiles" className="text-sm text-indigo-600 inline-block mt-2">{t.createProfileFirst}</Link>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t.resumeName}</label>
            <input className="input" value={resumeName} onChange={(event) => setResumeName(event.target.value)} />
          </div>

          <button type="button" className="btn-primary w-full disabled:opacity-60" onClick={handleGenerateResume} disabled={busy || !profileId}>
            {busy ? t.processing : t.generate}
          </button>
        </aside>
      </div>
    </div>
  );
}

function InfoGrid({ job, labels }: { job: JobTarget; labels: { jobTitle: string; company: string; location: string; salary: string; experience: string; education: string } }) {
  const rows = [
    [labels.jobTitle, job.parsedJobTitle],
    [labels.company, job.parsedCompanyName],
    [labels.location, job.parsedLocation],
    [labels.salary, job.parsedSalary],
    [labels.experience, job.parsedExperienceRequirement],
    [labels.education, job.parsedEducationRequirement],
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded border border-slate-200 p-3">
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-sm font-medium text-slate-900 mt-1">{value || '-'}</div>
        </div>
      ))}
    </div>
  );
}

function List({ title, items, compact, emptyText }: { title: string; items: string[]; compact?: boolean; emptyText: string }) {
  return (
    <div>
      <h3 className="font-medium text-slate-900 mb-2">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyText}</p>
      ) : compact ? (
        <div className="flex flex-wrap gap-2">{items.map((item) => <span key={item} className="tag tag-primary">{item}</span>)}</div>
      ) : (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </ul>
      )}
    </div>
  );
}
