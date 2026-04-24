'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface ProjectExperience {
  id: string;
  name: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  highlights: string[];
  techStack: string[];
  link?: string;
  sortOrder: number;
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

export default function ProjectPage() {
  const params = useParams();
  const profileId = params.profileId as string;
  const [projects, setProjects] = useState<ProjectExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', role: '', startDate: '', endDate: '', description: '', highlights: '', techStack: '', link: '' });

  useEffect(() => { loadData(); }, [profileId]);
  const loadData = async () => {
    const res = await apiFetch<ProjectExperience[]>(`/profiles/${profileId}/project`);
    if (res.data) setProjects(res.data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, highlights: form.highlights.split('\n').filter(h => h.trim()), techStack: form.techStack.split(',').map(t => t.trim()).filter(t => t) };
    if (editingId) {
      await apiFetch(`/profiles/${profileId}/project/${editingId}`, { method: 'PUT', body: JSON.stringify(data) });
    } else {
      await apiFetch(`/profiles/${profileId}/project`, { method: 'POST', body: JSON.stringify({ ...data, sortOrder: projects.length }) });
    }
    setShowForm(false); setEditingId(null);
    setForm({ name: '', role: '', startDate: '', endDate: '', description: '', highlights: '', techStack: '', link: '' });
    loadData();
  };

  const handleEdit = (proj: ProjectExperience) => {
    setForm({ name: proj.name, role: proj.role || '', startDate: proj.startDate || '', endDate: proj.endDate || '', description: proj.description || '', highlights: proj.highlights.join('\n'), techStack: proj.techStack.join(', '), link: proj.link || '' });
    setEditingId(proj.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个项目经历吗？')) { await apiFetch(`/profiles/${profileId}/project/${id}`, { method: 'DELETE' }); loadData(); }
  };

  if (loading) return <div className="text-center py-8">加载中...</div>;

  return (
    <div className="px-4 sm:px-0">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/profiles" className="text-gray-500 hover:text-gray-700">档案管理</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">项目经历</span>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">项目经历</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); }} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">添加项目经历</button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">{editingId ? '编辑' : '添加'}项目经历</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">项目名称</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">角色</label>
                <input type="text" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">开始时间</label>
                <input type="text" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">结束时间</label>
                <input type="text" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">项目链接</label>
              <input type="text" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">项目描述</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">主要贡献 (每行一条)</label>
              <textarea value={form.highlights} onChange={e => setForm({ ...form, highlights: e.target.value })} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">技术栈 (逗号分隔)</label>
              <input type="text" value={form.techStack} onChange={e => setForm({ ...form, techStack: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700">取消</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">{editingId ? '保存' : '添加'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {projects.length === 0 ? <div className="text-center py-8 text-gray-500">暂无项目经历</div> : (
          <ul className="divide-y divide-gray-200">
            {projects.map(proj => (
              <li key={proj.id} className="px-6 py-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{proj.name}</p>
                    {proj.role && <p className="text-sm text-gray-600">{proj.role}</p>}
                    {proj.techStack.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{proj.techStack.map(t => <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{t}</span>)}</div>}
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(proj)} className="text-sm text-indigo-600 hover:text-indigo-800">编辑</button>
                    <button onClick={() => handleDelete(proj.id)} className="text-sm text-red-600 hover:text-red-800">删除</button>
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