'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface ResumeVersion {
  id: string;
  name: string;
  status: string;
  profile?: { name: string };
  jobTarget?: { parsedJobTitle?: string; parsedCompanyName?: string };
  createdAt: string;
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    const result = await api.resumes.list();
    if (result.data) {
      setResumes(result.data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个简历版本吗？')) {
      await api.resumes.delete(id);
      loadResumes();
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      DRAFT: '草稿',
      GENERATING: '生成中',
      GENERATE_FAILED: '生成失败',
      READY_EDIT: '可编辑',
      PUBLISHED: '已发布',
      ARCHIVED: '已归档',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    if (status === 'PUBLISHED') return 'text-green-600 bg-green-100';
    if (status === 'GENERATE_FAILED') return 'text-red-600 bg-red-100';
    if (status === 'GENERATING') return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">简历版本</h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {resumes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无简历版本，请先创建主档案和求职目标
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {resumes.map((resume) => (
              <li key={resume.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">{resume.name}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${getStatusColor(resume.status)}`}>
                        {getStatusText(resume.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      档案: {resume.profile?.name || '未知'}
                    </div>
                    {resume.jobTarget && (
                      <div className="text-sm text-gray-500">
                        目标: {resume.jobTarget.parsedJobTitle || '未知职位'}
                        {resume.jobTarget.parsedCompanyName && ` @ ${resume.jobTarget.parsedCompanyName}`}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      创建于 {new Date(resume.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      查看
                    </button>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      删除
                    </button>
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