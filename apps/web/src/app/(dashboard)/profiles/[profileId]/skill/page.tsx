'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/language';

interface Skill {
  id: string;
  name: string;
  category?: string;
  level?: string;
  sortOrder: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://113.44.50.108:3001';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<{ data?: T; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options, headers: { 'Content-Type': 'application/json', ...options.headers }, credentials: 'include',
    });
    const data = await response.json();
    return { data: response.ok ? data.data || data : undefined, message: data.message };
  } catch { return { message: 'Network error' }; }
}

const copy = {
  en: {
    breadcrumb: 'Profile Management',
    title: 'Skills',
    add: 'Add Skill',
    edit: 'Edit',
    create: 'Create',
    formTitleAdd: 'Add Skill',
    formTitleEdit: 'Edit Skill',
    skillName: 'Skill Name',
    category: 'Category',
    categoryPlaceholder: 'e.g. Frontend, Backend, Database',
    level: 'Level',
    selectLevel: 'Select Level',
    levels: {
      beginner: 'Beginner',
      familiar: 'Familiar',
      skilled: 'Skilled',
      expert: 'Expert',
    },
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this skill?',
    loading: 'Loading...',
    empty: 'No skills',
    other: 'Other',
  },
  zh: {
    breadcrumb: '档案管理',
    title: '技能列表',
    add: '添加技能',
    edit: '编辑',
    create: '添加',
    formTitleAdd: '添加技能',
    formTitleEdit: '编辑技能',
    skillName: '技能名称',
    category: '分类',
    categoryPlaceholder: '如: 前端、后端、数据库',
    level: '熟练度',
    selectLevel: '选择熟练度',
    levels: {
      beginner: '了解',
      familiar: '熟悉',
      skilled: '熟练',
      expert: '精通',
    },
    cancel: '取消',
    save: '保存',
    delete: '删除',
    deleteConfirm: '确定要删除这个技能吗？',
    loading: '加载中...',
    empty: '暂无技能',
    other: '其他',
  },
};

export default function SkillPage() {
  const { language } = useLanguage();
  const t = copy[language];
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
    if (confirm(t.deleteConfirm)) { await apiFetch(`/profiles/${profileId}/skill/${id}`, { method: 'DELETE' }); loadData(); }
  };

  if (loading) return <div className="text-center py-8">{t.loading}</div>;

  const groupedSkills = skills.reduce((acc, skill) => {
    const cat = skill.category || t.other;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="px-4 sm:px-0">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/profiles" className="text-gray-500 hover:text-gray-700">{t.breadcrumb}</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">{t.title}</span>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); }} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{t.add}</button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">{editingId ? t.formTitleEdit : t.formTitleAdd}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.skillName}</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.category}</label>
                <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder={t.categoryPlaceholder} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.level}</label>
                <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">{t.selectLevel}</option>
                  <option value={language === 'en' ? 'Beginner' : '了解'}>{t.levels.beginner}</option>
                  <option value={language === 'en' ? 'Familiar' : '熟悉'}>{t.levels.familiar}</option>
                  <option value={language === 'en' ? 'Skilled' : '熟练'}>{t.levels.skilled}</option>
                  <option value={language === 'en' ? 'Expert' : '精通'}>{t.levels.expert}</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700">{t.cancel}</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">{editingId ? t.save : t.create}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {skills.length === 0 ? <div className="text-center py-8 text-gray-500">{t.empty}</div> : (
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
                        <button onClick={() => handleEdit(skill)} className="text-xs text-indigo-600 hover:text-indigo-800">{t.edit}</button>
                        <button onClick={() => handleDelete(skill.id)} className="text-xs text-red-600 hover:text-red-800">{t.delete}</button>
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
