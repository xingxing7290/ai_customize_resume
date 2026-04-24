'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface ResumeVersion {
  id: string;
  name: string;
  status: string;
  profile?: { name: string };
  jobTarget?: { parsedJobTitle?: string; parsedCompanyName?: string };
  createdAt: string;
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    const result = await api.resumes.list();
    if (result.data) {
      setResumes(result.data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个简历版本吗？')) {
      await api.resumes.delete(id);
      loadResumes();
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      DRAFT: { text: '草稿', color: 'bg-slate-100 text-slate-600' },
      GENERATING: { text: '生成中', color: 'bg-yellow-100 text-yellow-600' },
      GENERATE_FAILED: { text: '生成失败', color: 'bg-red-100 text-red-600' },
      READY_EDIT: { text: '可编辑', color: 'bg-blue-100 text-blue-600' },
      PUBLISHED: { text: '已发布', color: 'bg-emerald-100 text-emerald-600' },
      ARCHIVED: { text: '已归档', color: 'bg-gray-100 text-gray-500' },
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">简历版本</h1>
        <p className="text-slate-500 mt-1">管理你的定制简历</p>
      </div>

      {resumes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📄</span>
          </div>
          <p className="text-slate-600 mb-2">暂无简历版本</p>
          <p className="text-slate-500 text-sm">请先创建主档案和求职目标，然后生成定制简历</p>
          <div className="flex justify-center gap-4 mt-6">
            <Link href="/profiles" className="btn-secondary">
              创建档案
            </Link>
            <Link href="/jobs" className="btn-primary">
              添加岗位
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map(resume => {
            const statusInfo = getStatusInfo(resume.status);
            return (
              <div key={resume.id} className="card p-6 hover:shadow-lg">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-800">{resume.name}</h3>
                  <span className={`tag ${statusInfo.color}`}>{statusInfo.text}</span>
                </div>
                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <p>👤 档案: {resume.profile?.name || '未知'}</p>
                  {resume.jobTarget && (
                    <p>
                      🎯 目标: {resume.jobTarget.parsedJobTitle || '未知职位'}
                      {resume.jobTarget.parsedCompanyName && ` @ ${resume.jobTarget.parsedCompanyName}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    {new Date(resume.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-3">
                    <Link
                      href={`/resumes/${resume.id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}