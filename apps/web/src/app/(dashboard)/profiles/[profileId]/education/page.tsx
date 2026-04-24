'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Education {
  id: string;
  school: string;
  degree: string;
  major?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  description?: string;
  sortOrder: number;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<{ data?: T; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });
    const data = await response.json();
    return { data: response.ok ? data.data || data : undefined, message: data.message };
  } catch {
    return { message: 'Network error' };
  }
}

export default function EducationPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.profileId as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [educations, setEducations] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    school: '',
    degree: '',
    major: '',
    startDate: '',
    endDate: '',
    gpa: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, [profileId]);

  const loadData = async () => {
    const [profileRes, educationRes] = await Promise.all([
      api.profiles.get(profileId),
      apiFetch<Education[]>(`/profiles/${profileId}/education`),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    if (educationRes.data) setEducations(educationRes.data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await apiFetch(`/profiles/${profileId}/education/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
    } else {
      await apiFetch(`/profiles/${profileId}/education`, {
        method: 'POST',
        body: JSON.stringify({ ...form, sortOrder: educations.length }),
      });
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ school: '', degree: '', major: '', startDate: '', endDate: '', gpa: '', description: '' });
    loadData();
  };

  const handleEdit = (edu: Education) => {
    setForm({
      school: edu.school,
      degree: edu.degree,
      major: edu.major || '',
      startDate: edu.startDate,
      endDate: edu.endDate || '',
      gpa: edu.gpa || '',
      description: edu.description || '',
    });
    setEditingId(edu.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条教育经历吗？')) {
      await apiFetch(`/profiles/${profileId}/education/${id}`, { method: 'DELETE' });
      loadData();
    }
  };

  if (loading) return <div className="text-center py-8">加载中...</div>;

  return (
    <div className="px-4 sm:px-0">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/profiles" className="text-gray-500 hover:text-gray-700">档案管理</Link>
        <span className="text-gray-400">/</span>
        <Link href={`/profiles/${profileId}`} className="text-gray-500 hover:text-gray-700">{profile?.name}</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">教育经历</span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">教育经历</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ school: '', degree: '', major: '', startDate: '', endDate: '', gpa: '', description: '' }); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          添加教育经历
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">{editingId ? '编辑' : '添加'}教育经历</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">学校</label>
                <input type="text" required value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">学位</label>
                <input type="text" required value={form.degree} onChange={e => setForm({ ...form, degree: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">专业</label>
                <input type="text" value={form.major} onChange={e => setForm({ ...form, major: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">GPA</label>
                <input type="text" value={form.gpa} onChange={e => setForm({ ...form, gpa: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">开始时间</label>
                <input type="text" required placeholder="如: 2018-09" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">结束时间</label>
                <input type="text" placeholder="如: 2022-06" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">描述</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700">取消</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">{editingId ? '保存' : '添加'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {educations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无教育经历</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {educations.map(edu => (
              <li key={edu.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{edu.school}</p>
                  <p className="text-sm text-gray-600">{edu.degree} {edu.major && `· ${edu.major}`}</p>
                  <p className="text-sm text-gray-500">{edu.startDate} - {edu.endDate || '至今'}</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(edu)} className="text-sm text-indigo-600 hover:text-indigo-800">编辑</button>
                  <button onClick={() => handleDelete(edu.id)} className="text-sm text-red-600 hover:text-red-800">删除</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}