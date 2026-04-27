'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  highlights?: string;
  techStack?: string;
}

const emptyForm = {
  company: '',
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
  highlights: '',
  techStack: '',
};

export default function WorkPage() {
  const params = useParams();
  const profileId = params.profileId as string;
  const [items, setItems] = useState<WorkExperience[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => { loadData(); }, [profileId]);

  const loadData = async () => {
    setLoading(true);
    const res = await apiFetch<WorkExperience[]>(`/profiles/${profileId}/work`);
    if (res.data) setItems(res.data);
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
    const payload = { ...form, endDate: form.isCurrent ? '' : form.endDate, sortOrder: editingId ? undefined : items.length };
    const result = editingId
      ? await apiFetch(`/profiles/${profileId}/work/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
      : await apiFetch(`/profiles/${profileId}/work`, { method: 'POST', body: JSON.stringify(payload) });
    if (result.message) {
      setMessage(result.message);
      return;
    }
    resetForm();
    await loadData();
  };

  const handleEdit = (item: WorkExperience) => {
    setForm({
      company: item.company,
      title: item.title,
      location: item.location || '',
      startDate: item.startDate,
      endDate: item.endDate || '',
      isCurrent: item.isCurrent,
      description: item.description || '',
      highlights: item.highlights || '',
      techStack: item.techStack || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条工作经历吗？')) return;
    await apiFetch(`/profiles/${profileId}/work/${id}`, { method: 'DELETE' });
    await loadData();
  };

  if (loading) return <div className="text-center py-8">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/profiles" className="text-slate-500 hover:text-slate-700">主档案</Link>
        <span className="text-slate-400">/</span>
        <span className="font-medium text-slate-900">工作经历</span>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">工作经历</h1>
        <button type="button" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }} className="btn-primary">
          + 添加工作经历
        </button>
      </div>

      {message && <div className="card px-4 py-3 text-sm text-red-600">{message}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? '编辑工作经历' : '添加工作经历'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="公司" value={form.company} onChange={(value) => setForm({ ...form, company: value })} required />
            <Field label="职位" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
            <Field label="地点" value={form.location} onChange={(value) => setForm({ ...form, location: value })} />
            <Field label="开始时间" value={form.startDate} onChange={(value) => setForm({ ...form, startDate: value })} required placeholder="2020-03" />
            <Field label="结束时间" value={form.endDate} onChange={(value) => setForm({ ...form, endDate: value })} disabled={form.isCurrent} placeholder="2023-05" />
            <label className="flex items-center gap-2 mt-8 text-sm text-slate-700">
              <input type="checkbox" checked={form.isCurrent} onChange={(event) => setForm({ ...form, isCurrent: event.target.checked })} />
              目前在职
            </label>
          </div>
          <TextArea label="工作描述" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
          <TextArea label="主要成果（每行一条）" value={form.highlights} onChange={(value) => setForm({ ...form, highlights: value })} />
          <Field label="技术栈（逗号分隔）" value={form.techStack} onChange={(value) => setForm({ ...form, techStack: value })} placeholder="React, TypeScript, NestJS" />
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={resetForm}>取消</button>
            <button type="submit" className="btn-primary">{editingId ? '保存' : '添加'}</button>
          </div>
        </form>
      )}

      <div className="card divide-y divide-slate-100">
        {items.length === 0 ? (
          <div className="p-10 text-center text-slate-500">暂无工作经历</div>
        ) : items.map((item) => (
          <div key={item.id} className="p-5 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="text-sm text-indigo-600">{item.company}</p>
              <p className="text-sm text-slate-500">{item.startDate} - {item.isCurrent ? '至今' : item.endDate}</p>
              {item.techStack && <p className="mt-2 text-xs text-slate-500">{item.techStack}</p>}
            </div>
            <div className="flex gap-3 text-sm">
              <button type="button" onClick={() => handleEdit(item)} className="text-indigo-600">编辑</button>
              <button type="button" onClick={() => handleDelete(item.id)} className="text-red-600">删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder, disabled }: {
  label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <input disabled={disabled} required={required} placeholder={placeholder} className="input disabled:bg-slate-100" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <textarea className="input" rows={3} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
