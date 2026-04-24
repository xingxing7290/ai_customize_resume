'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  highlights: string[];
  techStack: string[];
  sortOrder: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<{ data?: T; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      credentials: 'include',
    });
    const data = await response.json();
    return { data: response.ok ? data.data || data : undefined, message: data.message };
  } catch { return { message: 'Network error' }; }
}

export default function WorkPage() {
  const params = useParams();
  const profileId = params.profileId as string;

  const [works, setWorks] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    company: '', title: '', location: '', startDate: '', endDate: '', isCurrent: false,
    description: '', highlights: '', techStack: '',
  });

  useEffect(() => { loadData(); }, [profileId]);

  const loadData = async () => {
    const res = await apiFetch<WorkExperience[]>(`/profiles/${profileId}/work`);
    if (res.data) setWorks(res.data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      highlights: form.highlights.split('\n').filter(h => h.trim()),
      techStack: form.techStack.split(',').map(t => t.trim()).filter(t => t),
    };
    if (editingId) {
      await apiFetch(`/profiles/${profileId}/work/${editingId}`, { method: 'PUT', body: JSON.stringify(data) });
    } else {
      await apiFetch(`/profiles/${profileId}/work`, { method: 'POST', body: JSON.stringify({ ...data, sortOrder: works.length }) });
    }
    setShowForm(false); setEditingId(null);
    setForm({ company: '', title: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '', highlights: '', techStack: '' });
    loadData();
  };

  const handleEdit = (work: WorkExperience) => {
    setForm({
      company: work.company, title: work.title, location: work.location || '', startDate: work.startDate,
      endDate: work.endDate || '', isCurrent: work.isCurrent, description: work.description || '',
      highlights: work.highlights.join('\n'), techStack: work.techStack.join(', '),
    });
    setEditingId(work.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条工作经历吗？')) {
      await apiFetch(`/profiles/${profileId}/work/${id}`, { method: 'DELETE' });
      loadData();
    }
  };

  if (loading) return <div className="text-center py-8">加载中...</div>;

  return (
    <div className="px-4 sm:px-0">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/profiles" className="text-gray-500 hover:text-gray-700">档案管理</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">工作经历</span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">工作经历</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); }} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">添加工作经历</button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">{editingId ? '编辑' : '添加'}工作经历</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">公司</label>
                <input type="text" required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">职位</label>
                <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">地点</label>
                <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div className="flex items-center mt-6">
                <input type="checkbox" id="isCurrent" checked={form.isCurrent} onChange={e => setForm({ ...form, isCurrent: e.target.checked })} className="h-4 w-4 text-indigo-600 rounded" />
                <label htmlFor="isCurrent" className="ml-2 text-sm text-gray-700">目前在职</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">开始时间</label>
                <input type="text" required placeholder="如: 2020-03" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">结束时间</label>
                <input type="text" placeholder="如: 2023-05" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} disabled={form.isCurrent} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">工作描述</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">主要成就 (每行一条)</label>
              <textarea value={form.highlights} onChange={e => setForm({ ...form, highlights: e.target.value })} rows={3} placeholder="负责核心模块开发&#10;优化系统性能50%" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">技术栈 (逗号分隔)</label>
              <input type="text" value={form.techStack} onChange={e => setForm({ ...form, techStack: e.target.value })} placeholder="React, TypeScript, Node.js" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700">取消</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">{editingId ? '保存' : '添加'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {works.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无工作经历</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {works.map(work => (
              <li key={work.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{work.title}</p>
                    <p className="text-sm text-indigo-600">{work.company}</p>
                    <p className="text-sm text-gray-500">{work.startDate} - {work.isCurrent ? '至今' : work.endDate}</p>
                    {work.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {work.techStack.map(t => <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{t}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(work)} className="text-sm text-indigo-600 hover:text-indigo-800">编辑</button>
                    <button onClick={() => handleDelete(work.id)} className="text-sm text-red-600 hover:text-red-800">删除</button>
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