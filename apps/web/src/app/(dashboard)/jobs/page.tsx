'use client';

import { useState, useEffect } from 'react';
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
  createdAt: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    sourceUrl: '',
    rawJdText: '',
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const result = await api.jobs.list();
    if (result.data) {
      setJobs(result.data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.jobs.create(form);
    setShowForm(false);
    setForm({ sourceUrl: '', rawJdText: '' });
    loadJobs();
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个求职目标吗？')) {
      await api.jobs.delete(id);
      loadJobs();
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      INIT: { text: '待处理', color: 'bg-slate-100 text-slate-600' },
      FETCHING: { text: '抓取中', color: 'bg-yellow-100 text-yellow-600' },
      FETCH_SUCCESS: { text: '抓取成功', color: 'bg-blue-100 text-blue-600' },
      FETCH_FAILED: { text: '抓取失败', color: 'bg-red-100 text-red-600' },
      PARSING: { text: '解析中', color: 'bg-yellow-100 text-yellow-600' },
      PARSE_SUCCESS: { text: '解析成功', color: 'bg-emerald-100 text-emerald-600' },
      PARSE_FAILED: { text: '解析失败', color: 'bg-red-100 text-red-600' },
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">求职目标</h1>
          <p className="text-slate-500 mt-1">管理你想要申请的岗位</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + 新建目标
        </button>
      </div>

      {/* 新建表单 */}
      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">新建求职目标</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">职位来源URL</label>
              <input
                type="url"
                value={form.sourceUrl}
                onChange={e => setForm({ ...form, sourceUrl: e.target.value })}
                placeholder="https://..."
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">或直接粘贴JD文本</label>
              <textarea
                value={form.rawJdText}
                onChange={e => setForm({ ...form, rawJdText: e.target.value })}
                rows={6}
                placeholder="粘贴职位描述..."
                className="input"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                取消
              </button>
              <button type="submit" className="btn-primary">
                创建并解析
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 岗位列表 */}
      {jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <p className="text-slate-600 mb-2">暂无求职目标</p>
          <p className="text-slate-500 text-sm">点击"新建目标"添加你想申请的岗位</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map(job => {
            const statusInfo = getStatusInfo(job.status);
            return (
              <Link key={job.id} href={`/jobs/${job.id}`} className="card p-6 hover:shadow-lg cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-800">{job.parsedJobTitle || '待解析'}</h3>
                  <span className={`tag ${statusInfo.color}`}>{statusInfo.text}</span>
                </div>
                {job.parsedCompanyName && (
                  <p className="text-slate-600 mb-1">🏢 {job.parsedCompanyName}</p>
                )}
                <p className="text-sm text-slate-500 mb-3">
                  📍 {job.parsedLocation || '地点未知'}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={e => {
                      e.preventDefault();
                      handleDelete(job.id);
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    删除
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}