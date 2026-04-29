'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language';

const copy = {
  zh: {
    title: 'AI 设置',
    subtitle: '配置 DeepSeek API，用于岗位定制简历生成和重新生成。',
    provider: '模型服务商',
    apiKey: 'DeepSeek API Key',
    apiKeyHelp: '保存后只显示掩码；留空保存时会保留已有 Key。',
    baseUrl: 'API Base URL',
    model: '模型',
    enabled: '启用 DeepSeek 生成',
    save: '保存设置',
    saving: '保存中...',
    saved: '设置已保存',
    loadFailed: '加载设置失败',
    saveFailed: '保存设置失败',
    currentKey: '当前 Key',
    noKey: '未配置',
  },
  en: {
    title: 'AI Settings',
    subtitle: 'Configure DeepSeek API for tailored resume generation and regeneration.',
    provider: 'Provider',
    apiKey: 'DeepSeek API Key',
    apiKeyHelp: 'Only a masked key is shown after saving. Leave it blank to keep the existing key.',
    baseUrl: 'API Base URL',
    model: 'Model',
    enabled: 'Enable DeepSeek generation',
    save: 'Save Settings',
    saving: 'Saving...',
    saved: 'Settings saved',
    loadFailed: 'Failed to load settings',
    saveFailed: 'Failed to save settings',
    currentKey: 'Current Key',
    noKey: 'Not configured',
  },
} as const;

export default function SettingsPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [maskedApiKey, setMaskedApiKey] = useState('');
  const [form, setForm] = useState({
    provider: 'deepseek',
    apiKey: '',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-v4-flash',
    enabled: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const result = await api.settings.getAi();
    if (result.data) {
      setForm({
        provider: result.data.provider || 'deepseek',
        apiKey: '',
        baseUrl: result.data.baseUrl || 'https://api.deepseek.com',
        model: result.data.model || 'deepseek-v4-flash',
        enabled: Boolean(result.data.enabled),
      });
      setMaskedApiKey(result.data.maskedApiKey || '');
    } else if (result.message) {
      setMessage(result.message || t.loadFailed);
    }
    setLoading(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const payload = {
      provider: form.provider,
      baseUrl: form.baseUrl,
      model: form.model,
      enabled: form.enabled,
      ...(form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}),
    };
    const result = await api.settings.updateAi(payload);
    setSaving(false);
    if (result.data) {
      setMaskedApiKey(result.data.maskedApiKey || '');
      setForm((current) => ({ ...current, apiKey: '' }));
      setMessage(t.saved);
      return;
    }
    setMessage(result.message || t.saveFailed);
  }

  if (loading) {
    return <div className="py-12 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-slate-500">{t.subtitle}</p>
      </div>

      {message && <div className="card px-4 py-3 text-sm text-slate-700">{message}</div>}

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">{t.provider}</label>
          <select className="input" value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })}>
            <option value="deepseek">DeepSeek</option>
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-slate-700">{t.apiKey}</label>
            <span className="text-xs text-slate-500">{t.currentKey}: {maskedApiKey || t.noKey}</span>
          </div>
          <input
            type="password"
            className="input"
            value={form.apiKey}
            onChange={(event) => setForm({ ...form, apiKey: event.target.value })}
            placeholder="sk-..."
            autoComplete="off"
          />
          <p className="mt-2 text-xs text-slate-500">{t.apiKeyHelp}</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">{t.baseUrl}</label>
          <input className="input" value={form.baseUrl} onChange={(event) => setForm({ ...form, baseUrl: event.target.value })} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">{t.model}</label>
          <select className="input" value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })}>
            <option value="deepseek-v4-flash">deepseek-v4-flash</option>
            <option value="deepseek-v4-pro">deepseek-v4-pro</option>
            <option value="deepseek-chat">deepseek-chat (legacy)</option>
            <option value="deepseek-reasoner">deepseek-reasoner (legacy)</option>
          </select>
        </div>

        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          {t.enabled}
        </label>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? t.saving : t.save}
          </button>
        </div>
      </form>
    </div>
  );
}
