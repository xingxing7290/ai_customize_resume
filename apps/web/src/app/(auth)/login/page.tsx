'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
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

    setMessage(result.message || '登录失败，请检查邮箱和密码');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-white font-bold">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">登录</h1>
          <p className="mt-2 text-sm text-slate-500">进入 AI 岗位定制简历平台</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">邮箱</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
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
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          还没有账号？{' '}
          <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
