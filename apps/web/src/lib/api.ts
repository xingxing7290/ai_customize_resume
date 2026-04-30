export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://113.44.50.108:3001';

interface ApiResponse<T> {
  data?: T;
  code?: number;
  message?: string;
}

const JSON_ARRAY_FIELDS = new Set([
  'contentSkills',
  'contentWorkExperiences',
  'contentProjectExperiences',
  'contentCertificates',
  'aiOptimizationNotes',
  'aiGapAnalysis',
  'parsedResponsibilities',
  'parsedRequirements',
  'parsedTechStack',
  'parsedBenefits',
]);

function normalizePayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizePayload(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const source = value as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(source)) {
    if (JSON_ARRAY_FIELDS.has(key) && typeof item === 'string') {
      try {
        normalized[key] = JSON.parse(item);
      } catch {
        normalized[key] = [];
      }
      continue;
    }

    normalized[key] = normalizePayload(item);
  }

  return normalized;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // 添加认证 token
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);
    const payload = await response.json();

    if (!response.ok) {
      return { code: response.status, message: payload.message || 'Request failed' };
    }

    const data = Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
    return { data: normalizePayload(data) as T };
  } catch {
    return { code: 500, message: 'Network error' };
  }
}

export function resolveAssetUrl(value?: string | null) {
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

async function apiUpload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {};

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });
    const payload = await response.json();

    if (!response.ok) {
      return { code: response.status, message: payload.message || 'Upload failed' };
    }

    const data = Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
    return { data: normalizePayload(data) as T };
  } catch {
    return { code: 500, message: 'Network error' };
  }
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; name?: string }) =>
      apiFetch<{ accessToken: string; user: { id: string; email: string; name: string } }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then((result) => {
        if (result.data?.accessToken && typeof window !== 'undefined') {
          localStorage.setItem('accessToken', result.data.accessToken);
        }
        return result;
      }),

    login: (data: { email: string; password: string }) =>
      apiFetch<{ accessToken: string; user: { id: string; email: string; name: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then((result) => {
        if (result.data?.accessToken && typeof window !== 'undefined') {
          localStorage.setItem('accessToken', result.data.accessToken);
        }
        return result;
      }),

    logout: () =>
      apiFetch<void>('/auth/logout', { method: 'POST' }).finally(() => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
      }),

    me: () =>
      apiFetch<{ id: string; email: string; name: string; avatar?: string }>('/auth/me'),
  },

  profiles: {
    list: () => apiFetch<any[]>('/profiles'),
    get: (id: string) => apiFetch<any>(`/profiles/${id}`),
    create: (data: any) => apiFetch<any>('/profiles', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch<any>(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    uploadAvatar: (id: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiUpload<any>(`/profiles/${id}/avatar`, formData);
    },
    delete: (id: string) => apiFetch<void>(`/profiles/${id}`, { method: 'DELETE' }),
  },

  jobs: {
    list: () => apiFetch<any[]>('/jobs'),
    get: (id: string) => apiFetch<any>(`/jobs/${id}`),
    create: (data: any) => apiFetch<any>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch<any>(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    reparse: (id: string) => apiFetch<any>(`/jobs/${id}/reparse`, { method: 'POST' }),
    delete: (id: string) => apiFetch<void>(`/jobs/${id}`, { method: 'DELETE' }),
  },

  resumes: {
    list: (jobTargetId?: string) => apiFetch<any[]>(jobTargetId ? `/resumes?jobTargetId=${jobTargetId}` : '/resumes'),
    get: (id: string) => apiFetch<any>(`/resumes/${id}`),
    create: (data: any) => apiFetch<any>('/resumes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch<any>(`/resumes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateContent: (id: string, data: any) => apiFetch<any>(`/resumes/${id}/content`, { method: 'PUT', body: JSON.stringify(data) }),
    copy: (id: string, data: any = {}) => apiFetch<any>(`/resumes/${id}/copy`, { method: 'POST', body: JSON.stringify(data) }),
    regenerate: (id: string) => apiFetch<any>(`/resumes/${id}/regenerate`, { method: 'POST' }),
    delete: (id: string) => apiFetch<void>(`/resumes/${id}`, { method: 'DELETE' }),
  },

  publish: {
    publish: (versionId: string) =>
      apiFetch<any>(`/publish/${versionId}`, { method: 'POST', body: JSON.stringify({ isPublic: true }) }),
    regenerate: (versionId: string) => apiFetch<any>(`/publish/${versionId}/regenerate`, { method: 'POST' }),
    get: (versionId: string) => apiFetch<any>(`/publish/${versionId}`),
    unpublish: (versionId: string) => apiFetch<any>(`/publish/${versionId}`, { method: 'DELETE' }),
  },

  settings: {
    getAi: () => apiFetch<any>('/settings/ai'),
    updateAi: (data: any) => apiFetch<any>('/settings/ai', { method: 'PUT', body: JSON.stringify(data) }),
    testAi: (data: any) => apiFetch<any>('/settings/ai/test', { method: 'POST', body: JSON.stringify(data) }),
  },
};
