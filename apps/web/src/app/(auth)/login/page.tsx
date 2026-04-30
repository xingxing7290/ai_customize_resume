'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/lib/language';
import { api } from '@/lib/api';

const copy = {
  zh: {
    brand: 'AI 简历定制',
    title: '登录',
    subtitle: '进入 AI 岗位定制简历平台',
    introTitle: '让简历围绕岗位说话',
    introText: '维护主档案、解析岗位要求，再用 AI 生成更匹配招聘筛选逻辑的简历版本。',
    points: ['岗位 JD 结构化解析', '项目与工作经历适配', '公开链接与 PDF 输出'],
    email: '邮箱',
    password: '密码',
    submit: '登录',
    submitting: '登录中...',
    noAccount: '还没有账号？',
    register: '注册',
    failed: '登录失败，请检查邮箱和密码',
  },
  en: {
    brand: 'AI Resume Studio',
    title: 'Sign In',
    subtitle: 'Access the AI resume customization platform',
    introTitle: 'Make every resume role-specific',
    introText: 'Maintain one profile, parse job requirements, and generate targeted resume versions with AI.',
    points: ['Structured JD parsing', 'Role-aware experience rewriting', 'Public links and PDF export'],
    email: 'Email',
    password: 'Password',
    submit: 'Sign In',
    submitting: 'Signing in...',
    noAccount: 'No account yet?',
    register: 'Create one',
    failed: 'Sign in failed. Please check your email and password.',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const t = copy[language];
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('test123');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const result = await api.auth.login({ email, password });
    setLoading(false);

    if (result.data?.accessToken) {
      router.push('/profiles');
      return;
    }

    setMessage(result.message || t.failed);
  };

  return (
    <div className="app-shell relative grid min-h-screen items-center px-4 py-10 lg:grid-cols-[1fr_470px] lg:px-12">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LanguageSelector language={language} onChange={setLanguage} />
      </div>

      <section className="mx-auto hidden max-w-2xl pr-12 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="brand-mark h-11 w-11 text-sm font-bold">AI</div>
          <span className="text-xl font-bold text-slate-900">{t.brand}</span>
        </div>
        <h1 className="max-w-xl text-5xl font-semibold leading-tight tracking-normal text-slate-950">{t.introTitle}</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">{t.introText}</p>
        <div className="mt-10 grid max-w-xl gap-3">
          {t.points.map((point, index) => (
            <div key={point} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-sm font-bold text-blue-700">{index + 1}</span>
              <span className="font-medium text-slate-700">{point}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="auth-panel mx-auto w-full max-w-md rounded-lg p-8">
        <div className="mb-8 text-center">
          <div className="brand-mark mx-auto mb-4 h-12 w-12">
            <span className="font-bold text-white">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{t.email}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{t.password}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input"
            />
          </div>

          {message && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{message}</div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
            {loading ? t.submitting : t.submit}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t.noAccount}{' '}
          <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
            {t.register}
          </Link>
        </p>
      </div>
    </div>
  );
}
