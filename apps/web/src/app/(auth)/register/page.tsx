'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/lib/language';
import { api } from '@/lib/api';

const copy = {
  zh: {
    brand: '简历定制',
    heroTitle: '开启求职新体验',
    heroText: '注册账户，使用 AI 驱动的智能简历定制服务。',
    points: ['免费创建个人档案', '按岗位生成定制简历', '一键分享公开链接'],
    title: '创建账户',
    subtitle: '填写以下信息开始使用',
    name: '姓名',
    namePlaceholder: '你的姓名',
    email: '邮箱',
    password: '密码',
    passwordPlaceholder: '至少 6 位字符',
    confirmPassword: '确认密码',
    confirmPlaceholder: '再次输入密码',
    submit: '注册',
    submitting: '注册中...',
    haveAccount: '已有账号？',
    login: '立即登录',
    mismatch: '两次输入的密码不一致',
    weakPassword: '密码长度至少 6 位',
    failed: '注册失败',
  },
  en: {
    brand: 'Resume Studio',
    heroTitle: 'Build a better job search flow',
    heroText: 'Create an account and tailor resumes with AI for each target role.',
    points: ['Create a profile for free', 'Generate role-specific resumes', 'Share public resume links'],
    title: 'Create Account',
    subtitle: 'Enter your details to get started',
    name: 'Name',
    namePlaceholder: 'Your name',
    email: 'Email',
    password: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    confirmPassword: 'Confirm Password',
    confirmPlaceholder: 'Enter your password again',
    submit: 'Create Account',
    submitting: 'Creating...',
    haveAccount: 'Already have an account?',
    login: 'Sign in',
    mismatch: 'The two passwords do not match',
    weakPassword: 'Password must be at least 6 characters',
    failed: 'Registration failed',
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const t = copy[language];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t.mismatch);
      return;
    }

    if (password.length < 6) {
      setError(t.weakPassword);
      return;
    }

    setLoading(true);
    const result = await api.auth.register({ email, password, name });
    setLoading(false);

    if (result.data) {
      router.push('/profiles');
      return;
    }

    setError(result.message || t.failed);
  };

  return (
    <div className="relative flex min-h-screen">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <LanguageSelector language={language} onChange={setLanguage} />
      </div>

      <div className="gradient-accent hidden items-center justify-center p-12 lg:flex lg:w-1/2">
        <div className="max-w-md text-white">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <span className="text-2xl font-bold">AI</span>
            </div>
            <span className="text-2xl font-bold">{t.brand}</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold">{t.heroTitle}</h1>
          <p className="mb-8 text-lg opacity-90">{t.heroText}</p>
          <div className="space-y-4">
            {t.points.map((point) => (
              <div key={point} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">✓</div>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
              <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-lg">
                <span className="font-bold text-white">AI</span>
              </div>
              <span className="text-xl font-bold text-slate-800">{t.brand}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{t.title}</h2>
            <p className="mt-2 text-slate-500">{t.subtitle}</p>
          </div>

          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
              )}
              <TextField label={t.name} value={name} onChange={setName} placeholder={t.namePlaceholder} />
              <TextField label={t.email} type="email" required value={email} onChange={setEmail} placeholder="your@email.com" />
              <TextField label={t.password} type="password" required value={password} onChange={setPassword} placeholder={t.passwordPlaceholder} />
              <TextField label={t.confirmPassword} type="password" required value={confirmPassword} onChange={setConfirmPassword} placeholder={t.confirmPlaceholder} />
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
                {loading ? t.submitting : t.submit}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-slate-500">
            {t.haveAccount}{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
              {t.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input"
        placeholder={placeholder}
      />
    </div>
  );
}
