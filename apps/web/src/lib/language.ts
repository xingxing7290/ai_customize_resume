'use client';

import { useEffect, useState } from 'react';

export type AppLanguage = 'zh' | 'en';

const COOKIE_KEY = 'appLanguage';
const CHANGE_EVENT = 'app-language-change';

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const parts = document.cookie.split(';').map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.slice(name.length + 1));
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  const encoded = encodeURIComponent(value);
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encoded}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

export function getInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'zh';
  const cookieValue = readCookie(COOKIE_KEY);
  if (cookieValue === 'en') return 'en';
  if (cookieValue === 'zh') return 'zh';
  return 'zh';
}

export function setAppLanguage(language: AppLanguage) {
  writeCookie(COOKIE_KEY, language);
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: language }));
}

export function useLanguage() {
  const [language, setLanguage] = useState<AppLanguage>('zh');

  useEffect(() => {
    const initial = getInitialLanguage();
    setLanguage(initial);
    document.documentElement.lang = initial === 'en' ? 'en' : 'zh-CN';

    const handleChange = (event: Event) => {
      const next = (event as CustomEvent<AppLanguage>).detail;
      setLanguage(next === 'en' ? 'en' : 'zh');
    };

    window.addEventListener(CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(CHANGE_EVENT, handleChange);
  }, []);

  const updateLanguage = (next: AppLanguage) => {
    setAppLanguage(next);
    setLanguage(next);
  };

  return { language, setLanguage: updateLanguage };
}
