'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, resolveAssetUrl } from '@/lib/api';
import { useLanguage } from '@/lib/language';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  avatarUrl?: string;
  isDefault: boolean;
}

const emptyForm = { name: '', email: '', phone: '', location: '', summary: '' };

const copy = {
  zh: {
    title: '档案管理',
    subtitle: '维护基础信息、照片、教育、工作、项目、技能和证书',
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
    uploadPhoto: '上传照片',
    changePhoto: '更换照片',
    uploadingPhoto: '上传中...',
    photoHelp: '支持 JPG、PNG、WEBP、SVG，最大 2MB。照片会同步用于简历链接和 PDF。',
    uploadFailed: '照片上传失败',
    deleteConfirm: '确定删除这个档案吗？',
  },
  en: {
    title: 'Profile Management',
    subtitle: 'Maintain basic info, photo, education, work, projects, skills, and certificates',
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
    uploadPhoto: 'Upload Photo',
    changePhoto: 'Change Photo',
    uploadingPhoto: 'Uploading...',
    photoHelp: 'JPG, PNG, WEBP, or SVG up to 2MB. The photo is used in public links and PDF output.',
    uploadFailed: 'Photo upload failed',
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
  const [uploadingId, setUploadingId] = useState<string | null>(null);
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

  const handleAvatarUpload = async (profileId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setMessage('');
    setUploadingId(profileId);
    const result = await api.profiles.uploadAvatar(profileId, file);
    setUploadingId(null);

    if (result.message) {
      setMessage(`${t.uploadFailed}: ${result.message}`);
      return;
    }

    await loadProfiles();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.title}</h1>
          <p className="mt-1 text-slate-500">{t.subtitle}</p>
        </div>
        <button type="button" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }} className="btn-primary">
          {t.newProfile}
        </button>
      </div>

      {message && <div className="card px-4 py-3 text-sm text-red-600">{message}</div>}

      {showForm && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">{editingId ? t.editProfile : t.createProfile}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label={t.name} value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
              <Field label={t.email} value={form.email} onChange={(value) => setForm({ ...form, email: value })} required type="email" />
              <Field label={t.phone} value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
              <Field label={t.location} value={form.location} onChange={(value) => setForm({ ...form, location: value })} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">{t.summary}</label>
              <textarea className="input" rows={3} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
            </div>
            <p className="text-xs text-slate-500">{t.photoHelp}</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="btn-secondary">{t.cancel}</button>
              <button type="button" onClick={handleSave} className="btn-primary">{editingId ? t.save : t.create}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="mb-2 text-slate-600">{t.emptyTitle}</p>
          <p className="text-sm text-slate-500">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <div key={profile.id} className="card p-6 hover:shadow-lg">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <ProfileAvatar profile={profile} />
                  <div>
                    <h3 className="font-semibold text-slate-800">{profile.name}</h3>
                    {profile.isDefault && <span className="tag tag-primary">{t.default}</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <p>{t.email}: {profile.email}</p>
                {profile.phone && <p>{t.phone}: {profile.phone}</p>}
                {profile.location && <p>{t.location}: {profile.location}</p>}
              </div>

              <div className="mt-4">
                <label className="btn-secondary inline-flex cursor-pointer items-center justify-center px-3 py-2 text-xs">
                  {uploadingId === profile.id ? t.uploadingPhoto : profile.avatarUrl ? t.changePhoto : t.uploadPhoto}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    className="hidden"
                    disabled={uploadingId === profile.id}
                    onChange={(event) => handleAvatarUpload(profile.id, event)}
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">{t.photoHelp}</p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="mb-4 grid grid-cols-3 gap-2">
                  <Link href={`/profiles/${profile.id}/education`} className="btn-secondary py-2 text-center text-xs">{t.education}</Link>
                  <Link href={`/profiles/${profile.id}/work`} className="btn-secondary py-2 text-center text-xs">{t.work}</Link>
                  <Link href={`/profiles/${profile.id}/project`} className="btn-secondary py-2 text-center text-xs">{t.project}</Link>
                  <Link href={`/profiles/${profile.id}/skill`} className="btn-secondary py-2 text-center text-xs">{t.skill}</Link>
                  <Link href={`/profiles/${profile.id}/certificate`} className="btn-secondary py-2 text-center text-xs">{t.certificate}</Link>
                </div>
                <div className="flex justify-end gap-2">
                  {!profile.isDefault && (
                    <button type="button" onClick={() => handleSetDefault(profile.id)} className="text-xs text-slate-500 hover:text-slate-700">
                      {t.setDefault}
                    </button>
                  )}
                  <button type="button" onClick={() => handleEdit(profile)} className="text-xs text-blue-700 hover:text-blue-800">
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

function ProfileAvatar({ profile }: { profile: Profile }) {
  if (profile.avatarUrl) {
    return (
      <img
        src={resolveAssetUrl(profile.avatarUrl)}
        alt={profile.name}
        className="h-12 w-12 rounded-full border border-slate-200 object-cover"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
      <span className="font-semibold text-blue-700">{profile.name.charAt(0)}</span>
    </div>
  );
}

function Field({ label, value, onChange, required, type = 'text' }: {
  label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input type={type} required={required} className="input" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
