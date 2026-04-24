'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Skill {
  id: string;
  name: string;
  category?: string;
  level?: string;
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

export default function SkillPage() {
  const params = useParams();
  const profileId = params.profileId as string;
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', category: '', level: '' });

  useEffect(() => { loadData(); }, [profileId]);
  const loadData = async () => {
    const res = await apiFetch<Skill[]>(`/profiles/${profileId}/skill`);
    if (res.data) setSkills(res.data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await apiFetch(`/profiles/${profileId}/skill/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await apiFetch(`/profiles/${profileId}/skill`, { method: 'POST', body: JSON.stringify({ ...form, sortOrder: skills.length }) });
    }
    setShowForm(false); setEditingId(null);
    setForm({ name: '', category: '', level: '' });
    loadData();
  };

  const handleEdit = (skill: Skill) => {
    setForm({ name: skill.name, category: skill.category || '', level: skill.level || '' });
    setEditingId(skill.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个技能吗？')) { await apiFetch(`/profiles/${profileId}/skill/${id}`, { method: 'DELETE' }); loadData(); }
  };

  if (loading) return <div className="text-center py-8">加载中...</div>;

  const groupedSkills = skills.reduce((acc, skill) => {
    const cat = skill.category || '其他';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="px-4 sm:px-0">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/profiles" className="text-gray-500 hover:text-gray-700">档案管理</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">技能列表</span>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">技能列表</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); }} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">添加技能</button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">{editingId ? '编辑' : '添加'}技能</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">技能名称</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">分类</label>
                <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="如: 前端、后端、数据库" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">熟练度</label>
                <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">选择熟练度</option>
                  <option value="了解">了解</option>
                  <option value="熟悉">熟悉</option>
                  <option value="熟练">熟练</option>
                  <option value="精通">精通</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700">取消</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">{editingId ? '保存' : '添加'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {skills.length === 0 ? <div className="text-center py-8 text-gray-500">暂无技能</div> : (
          <div className="p-6">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-medium text-gray-500 mb-3">{category}</h3>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map(skill => (
                    <div key={skill.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg group">
                      <span className="font-medium text-gray-900">{skill.name}</span>
                      {skill.level && <span className="text-xs text-gray-500">({skill.level})</span>}
                      <div className="hidden group-hover:flex gap-1 ml-2">
                        <button onClick={() => handleEdit(skill)} className="text-xs text-indigo-600 hover:text-indigo-800">编辑</button>
                        <button onClick={() => handleDelete(skill.id)} className="text-xs text-red-600 hover:text-red-800">删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
