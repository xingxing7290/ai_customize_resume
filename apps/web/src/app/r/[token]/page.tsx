'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface PublicResume {
  id: string;
  name: string;
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
    summary?: string;
  };
  jobTarget?: {
    parsedJobTitle?: string;
    parsedCompanyName?: string;
  };
}

export default function PublicResumePage() {
  const params = useParams();
  const token = params.token as string;

  const [resume, setResume] = useState<PublicResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadResume();
  }, [token]);

  const loadResume = async () => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://113.44.50.108:3001';
    try {
      const response = await fetch(`${API_BASE_URL}/public/r/${token}`);
      const data = await response.json();

      if (response.ok && data.data) {
        setResume(data.data);
      } else {
        setError(data.message || '简历未找到或未公开');
      }
    } catch {
      setError('网络错误');
    }
    setLoading(false);
  };

  const handleDownloadPdf = () => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://113.44.50.108:3001';
    window.open(`${API_BASE_URL}/pdf/public/${token}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">简历未找到</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!resume) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-900">{resume.profile.name}</h1>
            {resume.jobTarget?.parsedJobTitle && (
              <p className="text-indigo-600 mt-1">
                求职意向: {resume.jobTarget.parsedJobTitle}
                {resume.jobTarget.parsedCompanyName && ` @ ${resume.jobTarget.parsedCompanyName}`}
              </p>
            )}
            <div className="text-gray-600 mt-2">
              <span>{resume.profile.email}</span>
              {resume.profile.phone && <span className="mx-2">|</span>}
              {resume.profile.phone && <span>{resume.profile.phone}</span>}
              {resume.profile.location && <span className="mx-2">|</span>}
              {resume.profile.location && <span>{resume.profile.location}</span>}
            </div>
          </div>

          {resume.contentSummary && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-1 mb-3">个人简介</h2>
              <p className="text-gray-600 leading-relaxed">{resume.contentSummary}</p>
            </section>
          )}

          {resume.contentSkills && resume.contentSkills.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-1 mb-3">技能特长</h2>
              <div className="flex flex-wrap gap-2">
                {resume.contentSkills.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {resume.contentWorkExperiences && resume.contentWorkExperiences.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-1 mb-3">工作经历</h2>
              {resume.contentWorkExperiences.map((exp: any, idx: number) => (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">{exp.title}</span>
                    <span className="text-gray-500 text-sm">{exp.startDate} - {exp.endDate || '至今'}</span>
                  </div>
                  <p className="text-indigo-600">{exp.company}</p>
                  {exp.description && <p className="text-gray-600 mt-2 text-sm">{exp.description}</p>}
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                      {exp.highlights.map((h: string, i: number) => <li key={i}>{h}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {resume.contentProjectExperiences && resume.contentProjectExperiences.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-1 mb-3">项目经历</h2>
              {resume.contentProjectExperiences.map((proj: any, idx: number) => (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">{proj.name}</span>
                    {proj.role && <span className="text-gray-500 text-sm">{proj.role}</span>}
                  </div>
                  {proj.description && <p className="text-gray-600 mt-2 text-sm">{proj.description}</p>}
                  {proj.highlights && proj.highlights.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                      {proj.highlights.map((h: string, i: number) => <li key={i}>{h}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {resume.contentCertificates && resume.contentCertificates.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-1 mb-3">证书资质</h2>
              <div className="flex flex-wrap gap-3">
                {resume.contentCertificates.map((cert) => (
                  <span key={cert} className="text-gray-600">{cert}</span>
                ))}
              </div>
            </section>
          )}

          {resume.contentSelfEvaluation && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-1 mb-3">自我评价</h2>
              <p className="text-gray-600 leading-relaxed">{resume.contentSelfEvaluation}</p>
            </section>
          )}

          <div className="text-center mt-6 pt-4 border-t">
            <button
              onClick={handleDownloadPdf}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              下载PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
