'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  isDefault: boolean;
  createdAt: string;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const result = await api.profiles.list();
    if (result.data) {
      setProfiles(result.data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.profiles.update(editingId, form);
    } else {
      await api.profiles.create(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', email: '', phone: '', location: '', summary: '' });
    loadProfiles();
  };

  const handleEdit = (profile: Profile) => {
    setForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone || '',
      location: profile.location || '',
      summary: profile.summary || '',
    });
    setEditingId(profile.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个档案吗？')) {
      await api.profiles.delete(id);
      loadProfiles();
    }
  };

  const handleSetDefault = async (id: string) => {
    await api.profiles.update(id, { isDefault: true });
    loadProfiles();
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">主档案管理</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm({ name: '', email: '', phone: '', location: '', summary: '' });
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          新建档案
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">
            {editingId ? '编辑档案' : '新建档案'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">姓名</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">邮箱</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">电话</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">地点</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">个人简介</label>
              <textarea
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md"
              >
                {editingId ? '保存' : '创建'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {profiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无档案，点击"新建档案"创建
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {profiles.map((profile) => (
              <li key={profile.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">{profile.name}</span>
                    {profile.isDefault && (
                      <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-600 rounded">
                        默认
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {profile.email} {profile.phone && `· ${profile.phone}`}
                  </div>
                  {profile.location && (
                    <div className="text-sm text-gray-500">{profile.location}</div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {!profile.isDefault && (
                    <button
                      onClick={() => handleSetDefault(profile.id)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      设为默认
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(profile)}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}