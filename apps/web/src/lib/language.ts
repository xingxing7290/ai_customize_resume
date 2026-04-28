'use client';

import { useEffect, useState } from 'react';

export type AppLanguage = 'zh' | 'en';

const STORAGE_KEY = 'appLanguage';
const CHANGE_EVENT = 'app-language-change';

export function getInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'zh';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'en' ? 'en' : 'zh';
}

export function setAppLanguage(language: AppLanguage) {
  window.localStorage.setItem(STORAGE_KEY, language);
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
