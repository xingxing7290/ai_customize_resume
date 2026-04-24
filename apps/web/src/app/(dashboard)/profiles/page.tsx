'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
  });

  useEffect(() => {
    setMounted(true);
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const result = await api.profiles.list();
    if (result.data) {
      setProfiles(result.data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
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

  if (!mounted || loading) {
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
          <h1 className="text-2xl font-bold text-slate-800">主档案管理</h1>
          <p className="text-slate-500 mt-1">管理你的个人信息和经历</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm({ name: '', email: '', phone: '', location: '', summary: '' });
          }}
          className="btn-primary"
        >
          + 新建档案
        </button>
      </div>

      {/* 新建/编辑表单 */}
      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            {editingId ? '编辑档案' : '新建档案'}
          </h2>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">姓名</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">邮箱</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">电话</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">地点</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">个人简介</label>
              <textarea
                value={form.summary}
                onChange={e => setForm({ ...form, summary: e.target.value })}
                rows={3}
                className="input"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button type="button" onClick={handleSave} className="btn-primary">
                {editingId ? '保存' : '创建'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 档案列表 */}
      {profiles.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👤</span>
          </div>
          <p className="text-slate-600 mb-2">暂无档案</p>
          <p className="text-slate-500 text-sm">点击"新建档案"创建你的第一个个人档案</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(profile => (
            <div key={profile.id} className="card p-6 hover:shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold">{profile.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{profile.name}</h3>
                    {profile.isDefault && (
                      <span className="tag tag-primary">默认</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>📧 {profile.email}</p>
                {profile.phone && <p>📱 {profile.phone}</p>}
                {profile.location && <p>📍 {profile.location}</p>}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <Link
                  href={`/profiles/${profile.id}/education`}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  管理经历 →
                </Link>
                <div className="flex gap-2">
                  {!profile.isDefault && (
                    <button
                      onClick={() => handleSetDefault(profile.id)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      设为默认
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(profile)}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}