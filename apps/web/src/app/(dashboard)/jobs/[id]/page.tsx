'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Job {
  id: string;
  status: string;
  sourceType: string;
  sourceUrl?: string;
  sourceText?: string;
  parsedJobTitle?: string;
  parsedCompanyName?: string;
  parsedLocation?: string;
  parsedDescription?: string;
  parsedRequirements?: string[];
  parsedSalary?: string;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<{ data?: T; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options, headers: { 'Content-Type': 'application/json', ...options.headers }, credentials: 'include',
    });
    const data = await response.json();
    return { data: response.ok ? data.data || data : undefined, message: data.message };
  } catch { return { message: 'Network error' }; }
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [jobId]);
  const loadData = async () => {
    const res = await apiFetch<Job>(`/jobs/${jobId}`);
    if (res.data) setJob(res.data);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm('确定要删除这个岗位吗？')) {
      await apiFetch(`/jobs/${jobId}`, { method: 'DELETE' });
      router.push('/jobs');
    }
  };

  const handleReparse = async () => {
    await apiFetch(`/jobs/${jobId}/reparse`, { method: 'POST' });
    loadData();
  };

  if (loading) return <div className="text-center py-8">加载中...</div>;
  if (!job) return <div className="text-center py-8 text-gray-500">岗位不存在</div>;

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-600',
    PARSING: 'bg-blue-100 text-blue-600',
    PARSE_SUCCESS: 'bg-green-100 text-green-600',
    PARSE_FAILED: 'bg-red-100 text-red-600',
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/jobs" className="text-gray-500 hover:text-gray-700">岗位管理</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">{job.parsedJobTitle || '岗位详情'}</span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{job.parsedJobTitle || '待解析'}</h1>
          <span className={`px-2 py-1 text-xs rounded ${statusColors[job.status] || 'bg-gray-100 text-gray-600'}`}>
            {job.status}
          </span>
        </div>
        <div className="flex space-x-2">
          <button onClick={handleReparse} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">重新解析</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">删除</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">基本信息</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">公司</dt>
              <dd className="text-gray-900">{job.parsedCompanyName || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">地点</dt>
              <dd className="text-gray-900">{job.parsedLocation || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">薪资</dt>
              <dd className="text-gray-900">{job.parsedSalary || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">来源</dt>
              <dd className="text-gray-900">{job.sourceType}</dd>
            </div>
            {job.sourceUrl && (
              <div className="flex justify-between">
                <dt className="text-gray-500">链接</dt>
                <dd>
                  <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm">查看原链接</a>
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">创建时间</dt>
              <dd className="text-gray-900">{new Date(job.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">岗位要求</h2>
          {job.parsedRequirements && job.parsedRequirements.length > 0 ? (
            <ul className="list-disc list-inside space-y-2">
              {job.parsedRequirements.map((req, i) => (
                <li key={i} className="text-gray-700 text-sm">{req}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">暂无解析的要求信息</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">岗位描述</h2>
          {job.parsedDescription ? (
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{job.parsedDescription}</div>
          ) : (
            <p className="text-gray-500 text-sm">暂无解析的描述信息</p>
          )}
        </div>

        {job.sourceText && (
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h2 className="text-lg font-medium text-gray-900 mb-4">原始文本</h2>
            <pre className="bg-gray-50 p-4 rounded text-sm text-gray-700 overflow-x-auto whitespace-pre-wrap">{job.sourceText}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
