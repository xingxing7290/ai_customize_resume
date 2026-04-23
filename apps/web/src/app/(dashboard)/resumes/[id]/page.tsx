'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';

interface ResumeVersion {
  id: string;
  name: string;
  status: string;
  contentSummary?: string;
  contentSkills?: string[];
  contentWorkExperiences?: any[];
  contentProjectExperiences?: any[];
  contentCertificates?: string[];
  contentSelfEvaluation?: string;
  profile: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
  };
  jobTarget?: {
    parsedJobTitle?: string;
    parsedCompanyName?: string;
  };
}

export default function ResumeEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [resume, setResume] = useState<ResumeVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    contentSummary: '',
    contentSkills: [] as string[],
    contentSelfEvaluation: '',
  });
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    loadResume();
  }, [id]);

  const loadResume = async () => {
    const result = await api.resumes.get(id);
    if (result.data) {
      setResume(result.data);
      setEditForm({
        name: result.data.name,
        contentSummary: result.data.contentSummary || '',
        contentSkills: result.data.contentSkills || [],
        contentSelfEvaluation: result.data.contentSelfEvaluation || '',
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await api.resumes.update(id, editForm);
    if (result.data) {
      setResume(result.data);
    }
    setSaving(false);
  };

  const handleAddSkill = () => {
    if (newSkill && !editForm.contentSkills.includes(newSkill)) {
      setEditForm({
        ...editForm,
        contentSkills: [...editForm.contentSkills, newSkill],
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setEditForm({
      ...editForm,
      contentSkills: editForm.contentSkills.filter(s => s !== skill),
    });
  };

  const handleCopy = async () => {
    const result = await apiFetch<{ id: string }>(`/resumes/${id}/copy`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (result.data) {
      router.push(`/resumes/${result.data.id}`);
    }
  };

  const handleRegenerate = async () => {
    if (confirm('确定要重新生成简历吗？当前内容将被覆盖。')) {
      const result = await apiFetch<{ id: string }>(`/resumes/${id}/regenerate`, {
        method: 'POST',
      });
      if (result.data) {
        loadResume();
      }
    }
  };

  const handlePublish = async () => {
    const result = await apiFetch<{ publicToken: string }>(`/publish/${id}`, {
      method: 'POST',
      body: JSON.stringify({ isPublic: true }),
    });
    if (result.data) {
      alert(`简历已发布！公开链接: /r/${result.data.publicToken}`);
      loadResume();
    }
  };

  const handleDownloadPdf = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/pdf/${id}`, '_blank');
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  if (!resume) {
    return <div className="text-center py-8 text-red-500">简历未找到</div>;
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">编辑简历</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            复制
          </button>
          <button
            onClick={handleRegenerate}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            重新生成
          </button>
          <button
            onClick={handlePublish}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            发布
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            下载PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">基本信息</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">简历名称</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">个人简介</label>
              <textarea
                value={editForm.contentSummary}
                onChange={(e) => setEditForm({ ...editForm, contentSummary: e.target.value })}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">技能标签</label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {editForm.contentSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm flex items-center"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 text-indigo-400 hover:text-indigo-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="添加技能"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                />
                <button
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  添加
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">自我评价</label>
              <textarea
                value={editForm.contentSelfEvaluation}
                onChange={(e) => setEditForm({ ...editForm, contentSelfEvaluation: e.target.value })}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存修改'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">简历预览</h2>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold">{resume.profile.name}</h3>
              <p className="text-gray-600">{resume.profile.email}</p>
              {resume.profile.phone && <p className="text-gray-600">{resume.profile.phone}</p>}
              {resume.profile.location && <p className="text-gray-600">{resume.profile.location}</p>}
            </div>

            {editForm.contentSummary && (
              <div className="mb-4">
                <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">个人简介</h4>
                <p className="text-sm text-gray-600">{editForm.contentSummary}</p>
              </div>
            )}

            {editForm.contentSkills.length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">技能特长</h4>
                <div className="flex flex-wrap gap-1">
                  {editForm.contentSkills.map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {resume.contentWorkExperiences && resume.contentWorkExperiences.length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">工作经历</h4>
                {resume.contentWorkExperiences.map((exp: any, idx: number) => (
                  <div key={idx} className="mb-2">
                    <p className="font-medium">{exp.title} - {exp.company}</p>
                    <p className="text-xs text-gray-500">{exp.startDate} - {exp.endDate || '至今'}</p>
                  </div>
                ))}
              </div>
            )}

            {editForm.contentSelfEvaluation && (
              <div className="mb-4">
                <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">自我评价</h4>
                <p className="text-sm text-gray-600">{editForm.contentSelfEvaluation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<{ data?: T; message?: string }> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
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