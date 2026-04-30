'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/lib/language';
import { api } from '@/lib/api';

const copy = {
  zh: {
    brand: 'AI 简历定制',
    nav: [
      { href: '/profiles', label: '主档案', short: '档案' },
      { href: '/jobs', label: '岗位输入', short: '岗位' },
      { href: '/resumes', label: '简历生成', short: '简历' },
      { href: '/settings', label: '设置', short: '设置' },
    ],
    logout: '退出登录',
  },
  en: {
    brand: 'AI Resume Studio',
    nav: [
      { href: '/profiles', label: 'Profiles', short: 'Profiles' },
      { href: '/jobs', label: 'Jobs', short: 'Jobs' },
      { href: '/resumes', label: 'Resumes', short: 'Resumes' },
      { href: '/settings', label: 'Settings', short: 'Settings' },
    ],
    logout: 'Sign Out',
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const t = copy[language];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await api.auth.logout();
    router.push('/login');
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/profiles" className="flex items-center gap-2">
                  <div className="brand-mark h-8 w-8">
                    <span className="text-sm font-bold text-white">AI</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-800">{t.brand}</span>
                </Link>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
                {t.nav.map((item) => (
                  <NavLink key={item.href} href={item.href} active={pathname.startsWith(item.href)}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector language={language} onChange={setLanguage} compact />
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-800"
              >
                {t.logout}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 pb-3 sm:hidden">
            {t.nav.map((item) => (
              <NavLink key={item.href} href={item.href} active={pathname.startsWith(item.href)} mobile>
                {item.short}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}

function NavLink({ href, active, mobile = false, children }: { href: string; active: boolean; mobile?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={
        mobile
          ? `rounded-lg px-3 py-2 text-center text-sm font-semibold ${active ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 'bg-slate-50 text-slate-600'}`
          : `inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-all ${active ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
      }
    >
      {children}
    </Link>
  );
}
