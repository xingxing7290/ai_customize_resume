'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/lib/language';
import { api } from '@/lib/api';

const copy = {
  zh: {
    title: '登录',
    subtitle: '进入 AI 岗位定制简历平台',
    email: '邮箱',
    password: '密码',
    submit: '登录',
    submitting: '登录中...',
    noAccount: '还没有账号？',
    register: '注册',
    failed: '登录失败，请检查邮箱和密码',
  },
  en: {
    title: 'Sign In',
    subtitle: 'Access the AI resume customization platform',
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
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LanguageSelector language={language} onChange={setLanguage} />
      </div>

      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="gradient-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
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
