'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, apiFetch } from '@/lib/api';
import { useLanguage } from '@/lib/language';

interface Education {
  id: string;
  school: string;
  degree: string;
  major?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  description?: string;
}

const emptyForm = {
  school: '',
  degree: '',
  major: '',
  startDate: '',
  endDate: '',
  gpa: '',
  description: '',
};

const copy = {
  zh: {
    breadcrumbProfiles: '主档案',
    title: '教育经历',
    add: '+ 添加教育经历',
    edit: '编辑教育经历',
    create: '添加教育经历',
    school: '学校',
    degree: '学历/学位',
    major: '专业',
    gpa: 'GPA',
    startDate: '开始时间',
    endDate: '结束时间',
    startPlaceholder: '2018-09',
    endPlaceholder: '2022-06',
    description: '补充描述',
    cancel: '取消',
    save: '保存',
    submit: '添加',
    empty: '暂无教育经历',
    editBtn: '编辑',
    deleteBtn: '删除',
    deleteConfirm: '确定删除这条教育经历吗？',
    loading: '加载中...',
    present: '至今',
  },
  en: {
    breadcrumbProfiles: 'Profiles',
    title: 'Education',
    add: '+ Add education',
    edit: 'Edit education',
    create: 'Add education',
    school: 'School',
    degree: 'Degree',
    major: 'Major',
    gpa: 'GPA',
    startDate: 'Start date',
    endDate: 'End date',
    startPlaceholder: '2018-09',
    endPlaceholder: '2022-06',
    description: 'Description',
    cancel: 'Cancel',
    save: 'Save',
    submit: 'Add',
    empty: 'No education records yet',
    editBtn: 'Edit',
    deleteBtn: 'Delete',
    deleteConfirm: 'Delete this education record?',
    loading: 'Loading...',
    present: 'Present',
  },
} as const;

export default function EducationPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const params = useParams();
  const profileId = params.profileId as string;
  const [profileName, setProfileName] = useState('');
  const [items, setItems] = useState<Education[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [profileId]);

  const loadData = async () => {
    setLoading(true);
    const [profileRes, educationRes] = await Promise.all([
      api.profiles.get(profileId),
      apiFetch<Education[]>(`/profiles/${profileId}/education`),
    ]);
    if (profileRes.data) setProfileName(profileRes.data.name);
    if (educationRes.data) setItems(educationRes.data);
    setLoading(false);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    const payload = { ...form, sortOrder: editingId ? undefined : items.length };
    const result = editingId
      ? await apiFetch(`/profiles/${profileId}/education/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
      : await apiFetch(`/profiles/${profileId}/education`, { method: 'POST', body: JSON.stringify(payload) });

    if (result.message) {
      setMessage(result.message);
      return;
    }

    resetForm();
    await loadData();
  };

  const handleEdit = (item: Education) => {
    setForm({
      school: item.school,
      degree: item.degree,
      major: item.major || '',
      startDate: item.startDate,
      endDate: item.endDate || '',
      gpa: item.gpa || '',
      description: item.description || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    await apiFetch(`/profiles/${profileId}/education/${id}`, { method: 'DELETE' });
    await loadData();
  };

  if (loading) return <div className="text-center py-8">{t.loading}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/profiles" className="text-slate-500 hover:text-slate-700">{t.breadcrumbProfiles}</Link>
        <span className="text-slate-400">/</span>
        <span className="text-slate-700">{profileName}</span>
        <span className="text-slate-400">/</span>
        <span className="font-medium text-slate-900">{t.title}</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <button type="button" className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}>
          {t.add}
        </button>
      </div>

      {message && <div className="card px-4 py-3 text-sm text-red-600">{message}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? t.edit : t.create}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t.school} value={form.school} onChange={(value) => setForm({ ...form, school: value })} required />
            <Field label={t.degree} value={form.degree} onChange={(value) => setForm({ ...form, degree: value })} required />
            <Field label={t.major} value={form.major} onChange={(value) => setForm({ ...form, major: value })} />
            <Field label={t.gpa} value={form.gpa} onChange={(value) => setForm({ ...form, gpa: value })} />
            <Field label={t.startDate} value={form.startDate} onChange={(value) => setForm({ ...form, startDate: value })} required placeholder={t.startPlaceholder} />
            <Field label={t.endDate} value={form.endDate} onChange={(value) => setForm({ ...form, endDate: value })} placeholder={t.endPlaceholder} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t.description}</label>
            <textarea className="input" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={resetForm}>{t.cancel}</button>
            <button type="submit" className="btn-primary">{editingId ? t.save : t.submit}</button>
          </div>
        </form>
      )}

      <div className="card divide-y divide-slate-100">
        {items.length === 0 ? (
          <div className="p-10 text-center text-slate-500">{t.empty}</div>
        ) : items.map((item) => (
          <div key={item.id} className="p-5 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{item.school}</h3>
              <p className="text-sm text-slate-600">{item.degree}{item.major ? ` / ${item.major}` : ''}</p>
              <p className="text-sm text-slate-500">{item.startDate} - {item.endDate || t.present}</p>
              {item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}
            </div>
            <div className="flex gap-3 text-sm">
              <button type="button" onClick={() => handleEdit(item)} className="text-indigo-600">{t.editBtn}</button>
              <button type="button" onClick={() => handleDelete(item.id)} className="text-red-600">{t.deleteBtn}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <input required={required} placeholder={placeholder} className="input" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
