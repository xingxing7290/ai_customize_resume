'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

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
  parseError?: string;
  createdAt: string;
}

interface ProfileOption {
  id: string;
  name: string;
  email: string;
}

const statusText: Record<string, string> = {
  INIT: '待处理',
  PARSING: '解析中',
  PARSE_SUCCESS: '已解析',
  PARSE_FAILED: '解析失败',
};

export default function JobDetailPage() {
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

  useEffect(() => { loadData(); }, [jobId]);

  const loadData = async () => {
    setLoading(true);
    const [jobResult, profileResult] = await Promise.all([
      api.jobs.get(jobId),
      api.profiles.list(),
    ]);

    if (jobResult.data) {
      setJob(jobResult.data);
      setJdText(jobResult.data.rawJdText || '');
      const defaultName = [
        jobResult.data.parsedJobTitle || '岗位定制简历',
        jobResult.data.parsedCompanyName,
      ].filter(Boolean).join(' - ');
      setResumeName(defaultName);
    }
    if (profileResult.data) {
      setProfiles(profileResult.data);
      if (!profileId && profileResult.data[0]) setProfileId(profileResult.data[0].id);
    }
    setLoading(false);
  };

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
      setMessage('岗位已重新解析。');
      await loadData();
      return;
    }
    setMessage(result.message || '重新解析失败');
  };

  const handleGenerateResume = async () => {
    if (!job || !profileId) {
      setMessage('请先选择一个主档案。');
      return;
    }
    setBusy(true);
    setMessage('');
    const result = await api.resumes.create({
      name: resumeName.trim() || `${job.parsedJobTitle || '岗位'}定制简历`,
      profileId,
      jobTargetId: job.id,
    });
    setBusy(false);

    if (result.data?.id) {
      router.push(`/resumes/${result.data.id}`);
      return;
    }

    setMessage(result.message || '生成简历失败');
  };

  const handleDelete = async () => {
    if (!job || !confirm('确定删除这个岗位目标吗？')) return;
    await api.jobs.delete(job.id);
    router.push('/jobs');
  };

  if (loading) return <div className="text-center py-12 text-slate-500">加载中...</div>;
  if (!job) return <div className="text-center py-12 text-red-500">岗位目标不存在</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/jobs" className="text-slate-500 hover:text-slate-700">岗位输入</Link>
        <span className="text-slate-400">/</span>
        <span className="font-medium text-slate-900">{job.parsedJobTitle || '岗位详情'}</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{job.parsedJobTitle || '未命名岗位'}</h1>
          <p className="text-slate-500 mt-1">
            {job.parsedCompanyName || '公司未识别'}{job.parsedLocation ? ` / ${job.parsedLocation}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="tag">{statusText[job.status] || job.status}</span>
          <button type="button" className="btn-secondary" onClick={handleSaveAndReparse} disabled={busy}>保存并重新解析</button>
          <button type="button" className="btn-secondary text-red-600" onClick={handleDelete}>删除</button>
        </div>
      </div>

      {message && <div className="card px-4 py-3 text-sm text-slate-700">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <section className="card p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">岗位原始输入</h2>
              <p className="text-sm text-slate-500 mt-1">可在这里补充或修正 JD 文本，然后重新解析。</p>
            </div>
            {job.sourceUrl && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">岗位网址</label>
                <a href={job.sourceUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 break-all">{job.sourceUrl}</a>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">岗位 JD / 要求</label>
              <textarea className="input" rows={14} value={jdText} onChange={(event) => setJdText(event.target.value)} />
            </div>
          </section>

          <section className="card p-6 space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">解析结果</h2>
            {job.parseError && <div className="text-sm text-red-600">{job.parseError}</div>}
            <InfoGrid job={job} />
            <List title="岗位职责" items={job.parsedResponsibilities || []} />
            <List title="任职要求" items={job.parsedRequirements || []} />
            <List title="技术关键词" items={job.parsedTechStack || []} compact />
          </section>
        </div>

        <aside className="card p-6 h-fit space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">生成定制简历</h2>
            <p className="text-sm text-slate-500 mt-1">选择一份主档案，系统会基于该岗位要求生成一份可编辑的简历版本。</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">主档案</label>
            <select className="input" value={profileId} onChange={(event) => setProfileId(event.target.value)}>
              <option value="">选择主档案</option>
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} / {profile.email}</option>)}
            </select>
            {profiles.length === 0 && (
              <Link href="/profiles" className="text-sm text-indigo-600 inline-block mt-2">先创建主档案</Link>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">简历版本名称</label>
            <input className="input" value={resumeName} onChange={(event) => setResumeName(event.target.value)} />
          </div>

          <button type="button" className="btn-primary w-full disabled:opacity-60" onClick={handleGenerateResume} disabled={busy || !profileId}>
            {busy ? '处理中...' : '生成定制简历'}
          </button>
        </aside>
      </div>
    </div>
  );
}

function InfoGrid({ job }: { job: JobTarget }) {
  const rows = [
    ['岗位名称', job.parsedJobTitle],
    ['公司名称', job.parsedCompanyName],
    ['工作地点', job.parsedLocation],
    ['薪资信息', job.parsedSalary],
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

function List({ title, items, compact }: { title: string; items: string[]; compact?: boolean }) {
  return (
    <div>
      <h3 className="font-medium text-slate-900 mb-2">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">暂无内容</p>
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
