'use client';

import { useEffect, useState } from 'react';
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
  parsedRequirements?: string[];
  parsedTechStack?: string[];
  parseError?: string;
  createdAt: string;
}

const emptyForm = { sourceUrl: '', rawJdText: '' };

const statusText = {
  zh: {
    INIT: '待处理',
    FETCHING: '抓取中',
    FETCH_SUCCESS: '抓取成功',
    FETCH_FAILED: '抓取失败',
    PARSING: '解析中',
    PARSE_SUCCESS: '已解析',
    PARSE_FAILED: '解析失败',
  },
  en: {
    INIT: 'Pending',
    FETCHING: 'Fetching',
    FETCH_SUCCESS: 'Fetched',
    FETCH_FAILED: 'Fetch Failed',
    PARSING: 'Parsing',
    PARSE_SUCCESS: 'Parsed',
    PARSE_FAILED: 'Parse Failed',
  },
} as const;

const statusClass: Record<string, string> = {
  INIT: 'bg-slate-100 text-slate-600',
  PARSING: 'bg-amber-100 text-amber-700',
  PARSE_SUCCESS: 'bg-teal-100 text-teal-700',
  PARSE_FAILED: 'bg-red-100 text-red-700',
};

const copy = {
  zh: {
    title: '岗位输入与解析',
    subtitle: '输入招聘网址，或直接粘贴岗位 JD/任职要求，系统会解析成可用于生成简历的岗位目标。',
    newJob: '新建岗位目标',
    steps: [
      { title: '输入岗位', text: '网址或 JD 文本' },
      { title: '解析要求', text: '职责、技能、学历' },
      { title: '选择档案', text: '复用主档案资料' },
      { title: '生成简历', text: '编辑、发布、导出' },
    ],
    formTitle: '新建岗位目标',
    formHelp: '优先粘贴完整 JD。只填网址时，系统会尝试抓取页面，失败后可在详情页补充 JD 并重新解析。',
    cancel: '取消',
    jobUrl: '岗位网址',
    jd: '岗位 JD / 任职要求',
    jdPlaceholder: '粘贴职位描述、岗位职责、任职要求、技术栈、学历和经验要求...',
    submit: '创建并解析岗位',
    submitting: '解析中...',
    createFailed: '创建岗位失败',
    needInput: '请至少填写岗位网址或粘贴岗位 JD/要求。',
    deleteConfirm: '确定删除这个岗位目标吗？',
    loading: '加载中...',
    emptyTitle: '还没有岗位目标',
    emptyHint: '先新建一个岗位目标，再基于它生成定制简历。',
    unnamedJob: '未命名岗位',
    unknownCompany: '公司未识别',
    source: '来源：',
    viewAndGenerate: '查看并生成',
    delete: '删除',
    stepPrefix: '步骤',
  },
  en: {
    title: 'Job Input and Parsing',
    subtitle: 'Provide a job URL or paste the full JD. We will parse it into a Job Target for resume generation.',
    newJob: 'New Job Target',
    steps: [
      { title: 'Input Job', text: 'URL or JD text' },
      { title: 'Parse Needs', text: 'Responsibilities, skills, degree' },
      { title: 'Choose Profile', text: 'Reuse your profile data' },
      { title: 'Generate Resume', text: 'Edit, publish, export' },
    ],
    formTitle: 'New Job Target',
    formHelp: 'Pasting the full JD works best. If you only provide a URL, we will try to fetch the page. If it fails, paste the JD on the detail page and reparse.',
    cancel: 'Cancel',
    jobUrl: 'Job URL',
    jd: 'Job JD / Requirements',
    jdPlaceholder: 'Paste job description, responsibilities, requirements, tech stack, degree and experience...',
    submit: 'Create and Parse Job',
    submitting: 'Parsing...',
    createFailed: 'Failed to create job target',
    needInput: 'Please provide a job URL or paste the JD text.',
    deleteConfirm: 'Delete this job target?',
    loading: 'Loading...',
    emptyTitle: 'No job targets yet',
    emptyHint: 'Create a job target first, then generate a tailored resume from it.',
    unnamedJob: 'Untitled Job',
    unknownCompany: 'Company not recognized',
    source: 'Source: ',
    viewAndGenerate: 'View and Generate',
    delete: 'Delete',
    stepPrefix: 'Step',
  },
} as const;

export default function JobsPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const [jobs, setJobs] = useState<JobTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(emptyForm);

  async function loadJobs() {
    setLoading(true);
    const result = await api.jobs.list();
    if (result.data) setJobs(result.data);
    setLoading(false);
  }

  useEffect(() => { loadJobs(); }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');

    if (!form.sourceUrl.trim() && !form.rawJdText.trim()) {
      setMessage(t.needInput);
      return;
    }

    setSubmitting(true);
    const result = await api.jobs.create({
      sourceUrl: form.sourceUrl.trim() || undefined,
      rawJdText: form.rawJdText.trim() || undefined,
    });
    setSubmitting(false);

    if (result.data?.id) {
      window.location.href = `/jobs/${result.data.id}`;
      return;
    }

    setMessage(result.message || t.createFailed);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    await api.jobs.delete(id);
    await loadJobs();
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500">{t.loading}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
          <p className="text-slate-500 mt-1">{t.subtitle}</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => { setShowForm(true); setForm(emptyForm); }}>
          {t.newJob}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Step index={1} title={t.steps[0].title} text={t.steps[0].text} prefix={t.stepPrefix} />
        <Step index={2} title={t.steps[1].title} text={t.steps[1].text} prefix={t.stepPrefix} />
        <Step index={3} title={t.steps[2].title} text={t.steps[2].text} prefix={t.stepPrefix} />
        <Step index={4} title={t.steps[3].title} text={t.steps[3].text} prefix={t.stepPrefix} />
      </div>

      {message && <div className="card px-4 py-3 text-sm text-red-600">{message}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t.formTitle}</h2>
              <p className="text-sm text-slate-500 mt-1">{t.formHelp}</p>
            </div>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>{t.cancel}</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t.jobUrl}</label>
            <input
              type="url"
              className="input"
              value={form.sourceUrl}
              onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })}
              placeholder="https://jobs.example.com/job/123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t.jd}</label>
            <textarea
              className="input"
              rows={10}
              value={form.rawJdText}
              onChange={(event) => setForm({ ...form, rawJdText: event.target.value })}
              placeholder={t.jdPlaceholder}
            />
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
              {submitting ? t.submitting : t.submit}
            </button>
          </div>
        </form>
      )}

      {jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-700 font-medium">{t.emptyTitle}</p>
          <p className="text-slate-500 text-sm mt-2">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{job.parsedJobTitle || t.unnamedJob}</h3>
                  <p className="text-sm text-slate-500 mt-1">{job.parsedCompanyName || t.unknownCompany}{job.parsedLocation ? ` / ${job.parsedLocation}` : ''}</p>
                </div>
                <span className={`tag ${statusClass[job.status] || 'bg-slate-100 text-slate-600'}`}>{statusText[language][job.status as keyof typeof statusText.zh] || job.status}</span>
              </div>

              {job.sourceUrl && <p className="text-xs text-slate-500 truncate">{t.source}{job.sourceUrl}</p>}
              {job.parsedTechStack && job.parsedTechStack.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {job.parsedTechStack.slice(0, 6).map((item) => <span key={item} className="tag tag-primary">{item}</span>)}
                </div>
              )}
              {job.parseError && <p className="text-sm text-red-600">{job.parseError}</p>}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">{new Date(job.createdAt).toLocaleString()}</span>
                <div className="flex gap-3">
                  <Link href={`/jobs/${job.id}`} className="text-sm text-blue-700 font-medium">{t.viewAndGenerate}</Link>
                  <button type="button" onClick={() => handleDelete(job.id)} className="text-sm text-red-500">{t.delete}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Step({ index, title, text, prefix }: { index: number; title: string; text: string; prefix: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold text-blue-700">{prefix} {index}</div>
      <div className="font-medium text-slate-900 mt-1">{title}</div>
      <div className="text-sm text-slate-500 mt-1">{text}</div>
    </div>
  );
}
