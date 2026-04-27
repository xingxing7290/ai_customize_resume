'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Certificate {
  id: string;
  name: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
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

export default function CertificatePage() {
  const params = useParams();
  const profileId = params.profileId as string;
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '' });

  useEffect(() => { loadData(); }, [profileId]);
  const loadData = async () => {
    const res = await apiFetch<Certificate[]>(`/profiles/${profileId}/certificate`);
    if (res.data) setCertificates(res.data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await apiFetch(`/profiles/${profileId}/certificate/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await apiFetch(`/profiles/${profileId}/certificate`, { method: 'POST', body: JSON.stringify({ ...form, sortOrder: certificates.length }) });
    }
    setShowForm(false); setEditingId(null);
    setForm({ name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '' });
    loadData();
  };

  const handleEdit = (cert: Certificate) => {
    setForm({
      name: cert.name, issuer: cert.issuer || '', issueDate: cert.issueDate || '',
      expiryDate: cert.expiryDate || '', credentialId: cert.credentialId || '', credentialUrl: cert.credentialUrl || ''
    });
    setEditingId(cert.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个证书吗？')) { await apiFetch(`/profiles/${profileId}/certificate/${id}`, { method: 'DELETE' }); loadData(); }
  };

  if (loading) return <div className="text-center py-8">加载中...</div>;

  return (
    <div className="px-4 sm:px-0">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/profiles" className="text-gray-500 hover:text-gray-700">档案管理</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">证书列表</span>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">证书列表</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); }} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">添加证书</button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">{editingId ? '编辑' : '添加'}证书</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">证书名称</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">颁发机构</label>
                <input type="text" value={form.issuer} onChange={e => setForm({ ...form, issuer: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">获得日期</label>
                <input type="text" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} placeholder="如: 2023-06" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">过期日期</label>
                <input type="text" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} placeholder="如: 2026-06 或 永久" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">证书编号</label>
                <input type="text" value={form.credentialId} onChange={e => setForm({ ...form, credentialId: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">证书链接</label>
                <input type="text" value={form.credentialUrl} onChange={e => setForm({ ...form, credentialUrl: e.target.value })} placeholder="https://" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
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
        {certificates.length === 0 ? <div className="text-center py-8 text-gray-500">暂无证书</div> : (
          <ul className="divide-y divide-gray-200">
            {certificates.map(cert => (
              <li key={cert.id} className="px-6 py-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{cert.name}</p>
                    {cert.issuer && <p className="text-sm text-gray-600">{cert.issuer}</p>}
                    <p className="text-sm text-gray-500">
                      {cert.issueDate}
                      {cert.expiryDate && ` - ${cert.expiryDate}`}
                    </p>
                    {cert.credentialId && <p className="text-xs text-gray-400 mt-1">证书编号: {cert.credentialId}</p>}
                    {cert.credentialUrl && (
                      <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800">查看证书</a>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(cert)} className="text-sm text-indigo-600 hover:text-indigo-800">编辑</button>
                    <button onClick={() => handleDelete(cert.id)} className="text-sm text-red-600 hover:text-red-800">删除</button>
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
