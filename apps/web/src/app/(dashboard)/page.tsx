'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language';

interface Profile {
  id: string;
  name: string;
  email: string;
  isDefault: boolean;
}

interface Job {
  id: string;
  status: string;
  parsedJobTitle?: string;
  parsedCompanyName?: string;
  createdAt: string;
}

interface Resume {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

const copy = {
  zh: {
    title: '工作台',
    subtitle: '管理你的简历和求职目标',
    profiles: '主档案',
    current: (name: string) => `当前: ${name}`,
    noProfile: '暂无档案',
    manageProfiles: '管理档案',
    jobs: '求职目标',
    parsedCount: (n: number) => `${n} 个已解析`,
    manageJobs: '管理岗位',
    resumes: '简历版本',
    publishedCount: (n: number) => `${n} 份已发布`,
    manageResumes: '管理简历',
    recentJobs: '最近岗位',
    noJobs: '暂无求职目标',
    addJob: '添加岗位',
    pendingParse: '待解析',
    unknownCompany: '未知公司',
    recentResumes: '最近简历',
    noResumes: '暂无简历版本',
    createResume: '创建简历',
    edit: '编辑',
    quickStart: '快速开始',
    quickHint: '创建一份针对特定岗位的定制简历',
    step1: '1. 创建主档案',
    step2: '2. 添加求职目标',
    step3: '3. 生成简历',
  },
  en: {
    title: 'Dashboard',
    subtitle: 'Manage your resumes and job targets',
    profiles: 'Profiles',
    current: (name: string) => `Current: ${name}`,
    noProfile: 'No profile yet',
    manageProfiles: 'Manage Profiles',
    jobs: 'Job Targets',
    parsedCount: (n: number) => `${n} parsed`,
    manageJobs: 'Manage Jobs',
    resumes: 'Resume Versions',
    publishedCount: (n: number) => `${n} published`,
    manageResumes: 'Manage Resumes',
    recentJobs: 'Recent Jobs',
    noJobs: 'No job targets yet',
    addJob: 'Add Job',
    pendingParse: 'Pending',
    unknownCompany: 'Unknown company',
    recentResumes: 'Recent Resumes',
    noResumes: 'No resume versions yet',
    createResume: 'Create Resume',
    edit: 'Edit',
    quickStart: 'Quick Start',
    quickHint: 'Create a tailored resume for a target role',
    step1: '1. Create Profile',
    step2: '2. Add Job Target',
    step3: '3. Generate Resume',
  },
} as const;

export default function DashboardPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const [profilesRes, jobsRes, resumesRes] = await Promise.all([
      api.profiles.list(),
      api.jobs.list(),
      api.resumes.list(),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (jobsRes.data) setJobs(jobsRes.data);
    if (resumesRes.data) setResumes(resumesRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="rounded-lg border border-slate-200 bg-white/78 px-6 py-5 shadow-sm">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">AI Resume Workspace</p>
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-slate-500">{t.subtitle}</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{t.profiles}</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{profiles.length}</p>
            </div>
            <div className="metric-icon">
              <span>Profile</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            {defaultProfile ? t.current(defaultProfile.name) : t.noProfile}
          </p>
          <Link
            href="/profiles"
            className="mt-4 inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            {t.manageProfiles} →
          </Link>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{t.jobs}</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{jobs.length}</p>
            </div>
            <div className="metric-icon border-teal-100 text-teal-700">
              <span>Job</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            {t.parsedCount(jobs.filter(j => j.status === 'PARSE_SUCCESS').length)}
          </p>
          <Link
            href="/jobs"
            className="mt-4 inline-flex items-center text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            {t.manageJobs} →
          </Link>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{t.resumes}</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{resumes.length}</p>
            </div>
            <div className="metric-icon border-slate-200 text-slate-800">
              <span>CV</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            {t.publishedCount(resumes.filter(r => r.status === 'PUBLISHED').length)}
          </p>
          <Link
            href="/resumes"
            className="mt-4 inline-flex items-center text-sm font-semibold text-slate-800 hover:text-blue-700"
          >
            {t.manageResumes} →
          </Link>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{t.recentJobs}</h2>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>{t.noJobs}</p>
              <Link href="/jobs" className="mt-2 inline-flex items-center text-sm text-blue-700">
                {t.addJob} →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map(job => (
                <div key={job.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                  <div>
                    <p className="font-medium text-slate-800">{job.parsedJobTitle || t.pendingParse}</p>
                    <p className="text-sm text-slate-500">{job.parsedCompanyName || t.unknownCompany}</p>
                  </div>
                  <span className={`tag ${job.status === 'PARSE_SUCCESS' ? 'tag-success' : ''}`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{t.recentResumes}</h2>
          {resumes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>{t.noResumes}</p>
              <Link href="/resumes" className="mt-2 inline-flex items-center text-sm text-blue-700">
                {t.createResume} →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.slice(0, 5).map(resume => (
                <div key={resume.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                  <div>
                    <p className="font-medium text-slate-800">{resume.name}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(resume.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/resumes/${resume.id}`}
                    className="text-sm font-medium text-blue-700 hover:text-blue-800"
                  >
                    {t.edit}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 快速开始 */}
      <div className="card theme-band p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{t.quickStart}</h2>
            <p className="mt-2 opacity-90">{t.quickHint}</p>
          </div>
          <div className="flex gap-3">
            {!defaultProfile && (
              <Link href="/profiles" className="btn-secondary bg-white/20 text-white border-white/30 hover:bg-white/30">
                {t.step1}
              </Link>
            )}
            {defaultProfile && jobs.length === 0 && (
              <Link href="/jobs" className="btn-secondary bg-white/20 text-white border-white/30 hover:bg-white/30">
                {t.step2}
              </Link>
            )}
            {defaultProfile && jobs.length > 0 && (
              <Link href="/resumes" className="btn-secondary bg-white text-blue-700 hover:bg-white/90">
                {t.step3}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
