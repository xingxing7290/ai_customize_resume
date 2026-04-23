'use client';

import { useState, useEffect } from 'react';
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

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      INIT: '初始化',
      FETCHING: '抓取中',
      FETCH_SUCCESS: '抓取成功',
      FETCH_FAILED: '抓取失败',
      PARSING: '解析中',
      PARSE_SUCCESS: '解析成功',
      PARSE_FAILED: '解析失败',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    if (status.includes('SUCCESS')) return 'text-green-600 bg-green-100';
    if (status.includes('FAILED')) return 'text-red-600 bg-red-100';
    if (status.includes('ING')) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">求职目标</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          新建目标
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">新建求职目标</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">职位来源URL</label>
              <input
                type="url"
                value={form.sourceUrl}
                onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                placeholder="https://..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">或直接粘贴JD文本</label>
              <textarea
                value={form.rawJdText}
                onChange={(e) => setForm({ ...form, rawJdText: e.target.value })}
                rows={6}
                placeholder="粘贴职位描述..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md"
              >
                创建
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无求职目标，点击"新建目标"创建
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <li key={job.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {job.parsedJobTitle || '待解析'}
                      </span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${getStatusColor(job.status)}`}>
                        {getStatusText(job.status)}
                      </span>
                    </div>
                    {job.parsedCompanyName && (
                      <div className="text-sm text-gray-600">{job.parsedCompanyName}</div>
                    )}
                    <div className="text-sm text-gray-500">
                      {job.parsedLocation || '地点未知'}
                    </div>
                    {job.sourceUrl && (
                      <a
                        href={job.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        查看原职位
                      </a>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}