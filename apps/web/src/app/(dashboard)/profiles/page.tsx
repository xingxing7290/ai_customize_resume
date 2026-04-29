'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  isDefault: boolean;
}

const emptyForm = { name: '', email: '', phone: '', location: '', summary: '' };

const copy = {
  zh: {
    title: '主档案管理',
    subtitle: '维护基础信息、教育、工作、项目、技能和证书',
    newProfile: '+ 新建档案',
    editProfile: '编辑档案',
    createProfile: '新建档案',
    name: '姓名',
    email: '邮箱',
    phone: '电话',
    location: '地点',
    summary: '个人简介',
    cancel: '取消',
    save: '保存',
    create: '创建',
    emptyTitle: '暂无档案',
    emptyHint: '点击“新建档案”创建你的第一份主档案。',
    default: '默认',
    education: '教育',
    work: '工作',
    project: '项目',
    skill: '技能',
    certificate: '证书',
    setDefault: '设为默认',
    edit: '编辑',
    delete: '删除',
    deleteConfirm: '确定删除这个档案吗？',
  },
  en: {
    title: 'Profile Management',
    subtitle: 'Maintain basic info, education, work, projects, skills, and certificates',
    newProfile: '+ New Profile',
    editProfile: 'Edit Profile',
    createProfile: 'New Profile',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    location: 'Location',
    summary: 'Summary',
    cancel: 'Cancel',
    save: 'Save',
    create: 'Create',
    emptyTitle: 'No profiles yet',
    emptyHint: 'Click “New Profile” to create your first profile.',
    default: 'Default',
    education: 'Education',
    work: 'Work',
    project: 'Projects',
    skill: 'Skills',
    certificate: 'Certificates',
    setDefault: 'Set default',
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirm: 'Delete this profile?',
  },
} as const;

export default function ProfilesPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const result = await api.profiles.list();
    if (result.data) setProfiles(result.data);
    setLoading(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    setMessage('');
    const result = editingId
      ? await api.profiles.update(editingId, form)
      : await api.profiles.create(form);

    if (result.message) {
      setMessage(result.message);
      return;
    }

    resetForm();
    await loadProfiles();
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
    if (!confirm(t.deleteConfirm)) return;
    await api.profiles.delete(id);
    await loadProfiles();
  };

  const handleSetDefault = async (id: string) => {
    await api.profiles.update(id, { isDefault: true });
    await loadProfiles();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.title}</h1>
          <p className="text-slate-500 mt-1">{t.subtitle}</p>
        </div>
        <button type="button" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }} className="btn-primary">
          {t.newProfile}
        </button>
      </div>

      {message && <div className="card px-4 py-3 text-sm text-red-600">{message}</div>}

      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{editingId ? t.editProfile : t.createProfile}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t.name} value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
              <Field label={t.email} value={form.email} onChange={(value) => setForm({ ...form, email: value })} required type="email" />
              <Field label={t.phone} value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
              <Field label={t.location} value={form.location} onChange={(value) => setForm({ ...form, location: value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.summary}</label>
              <textarea className="input" rows={3} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="btn-secondary">{t.cancel}</button>
              <button type="button" onClick={handleSave} className="btn-primary">{editingId ? t.save : t.create}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-600 mb-2">{t.emptyTitle}</p>
          <p className="text-slate-500 text-sm">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="card p-6 hover:shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold">{profile.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{profile.name}</h3>
                    {profile.isDefault && <span className="tag tag-primary">{t.default}</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <p>{t.email}：{profile.email}</p>
                {profile.phone && <p>{t.phone}：{profile.phone}</p>}
                {profile.location && <p>{t.location}：{profile.location}</p>}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Link href={`/profiles/${profile.id}/education`} className="btn-secondary text-center text-xs py-2">{t.education}</Link>
                  <Link href={`/profiles/${profile.id}/work`} className="btn-secondary text-center text-xs py-2">{t.work}</Link>
                  <Link href={`/profiles/${profile.id}/project`} className="btn-secondary text-center text-xs py-2">{t.project}</Link>
                  <Link href={`/profiles/${profile.id}/skill`} className="btn-secondary text-center text-xs py-2">{t.skill}</Link>
                  <Link href={`/profiles/${profile.id}/certificate`} className="btn-secondary text-center text-xs py-2">{t.certificate}</Link>
                </div>
                <div className="flex justify-end gap-2">
                  {!profile.isDefault && (
                    <button type="button" onClick={() => handleSetDefault(profile.id)} className="text-xs text-slate-500 hover:text-slate-700">
                      {t.setDefault}
                    </button>
                  )}
                  <button type="button" onClick={() => handleEdit(profile)} className="text-xs text-indigo-600 hover:text-indigo-700">
                    {t.edit}
                  </button>
                  <button type="button" onClick={() => handleDelete(profile.id)} className="text-xs text-red-500 hover:text-red-700">
                    {t.delete}
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

function Field({ label, value, onChange, required, type = 'text' }: {
  label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <input type={type} required={required} className="input" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
