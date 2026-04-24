'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

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

export default function DashboardPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [profilesRes, jobsRes, resumesRes] = await Promise.all([
      api.profiles.list(),
      api.jobs.list(),
      api.resumes.list(),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (jobsRes.data) setJobs(jobsRes.data);
    if (resumesRes.data) setResumes(resumesRes.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">工作台</h1>
        <p className="text-slate-500 mt-1">管理你的简历和求职目标</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">主档案</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{profiles.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            {defaultProfile ? `当前: ${defaultProfile.name}` : '暂无档案'}
          </p>
          <Link
            href="/profiles"
            className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            管理档案 →
          </Link>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">求职目标</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{jobs.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            {jobs.filter(j => j.status === 'PARSE_SUCCESS').length} 个已解析
          </p>
          <Link
            href="/jobs"
            className="mt-4 inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            管理岗位 →
          </Link>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">简历版本</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{resumes.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            {resumes.filter(r => r.status === 'PUBLISHED').length} 份已发布
          </p>
          <Link
            href="/resumes"
            className="mt-4 inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            管理简历 →
          </Link>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">最近岗位</h2>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>暂无求职目标</p>
              <Link href="/jobs" className="mt-2 inline-flex items-center text-sm text-indigo-600">
                添加岗位 →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-800">{job.parsedJobTitle || '待解析'}</p>
                    <p className="text-sm text-slate-500">{job.parsedCompanyName || '未知公司'}</p>
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
          <h2 className="text-lg font-semibold text-slate-800 mb-4">最近简历</h2>
          {resumes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>暂无简历版本</p>
              <Link href="/resumes" className="mt-2 inline-flex items-center text-sm text-indigo-600">
                创建简历 →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.slice(0, 5).map(resume => (
                <div key={resume.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-800">{resume.name}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(resume.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/resumes/${resume.id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    编辑
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 快速开始 */}
      <div className="card p-8 gradient-primary text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">快速开始</h2>
            <p className="mt-2 opacity-90">创建一份针对特定岗位的定制简历</p>
          </div>
          <div className="flex gap-3">
            {!defaultProfile && (
              <Link href="/profiles" className="btn-secondary bg-white/20 text-white border-white/30 hover:bg-white/30">
                1. 创建主档案
              </Link>
            )}
            {defaultProfile && jobs.length === 0 && (
              <Link href="/jobs" className="btn-secondary bg-white/20 text-white border-white/30 hover:bg-white/30">
                2. 添加求职目标
              </Link>
            )}
            {defaultProfile && jobs.length > 0 && (
              <Link href="/resumes" className="btn-secondary bg-white text-indigo-600 hover:bg-white/90">
                3. 生成简历
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}