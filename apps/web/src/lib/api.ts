const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  data?: T;
  code?: number;
  message?: string;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

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
    const data = await response.json();

    if (!response.ok) {
      return { code: response.status, message: data.message || 'Request failed' };
    }

    return { data };
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
      }),

    login: (data: { email: string; password: string }) =>
      apiFetch<{ accessToken: string; user: { id: string; email: string; name: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: () =>
      apiFetch<void>('/auth/logout', { method: 'POST' }),

    me: () =>
      apiFetch<{ id: string; email: string; name: string; avatar?: string }>('/auth/me'),
  },

  profiles: {
    list: () => apiFetch<any[]>('/profiles'),
    get: (id: string) => apiFetch<any>(`/profiles/${id}`),
    create: (data: any) => apiFetch<any>('/profiles', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch<any>(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<void>(`/profiles/${id}`, { method: 'DELETE' }),
  },

  jobs: {
    list: () => apiFetch<any[]>('/jobs'),
    get: (id: string) => apiFetch<any>(`/jobs/${id}`),
    create: (data: any) => apiFetch<any>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch<any>(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<void>(`/jobs/${id}`, { method: 'DELETE' }),
  },

  resumes: {
    list: (jobTargetId?: string) => apiFetch<any[]>(jobTargetId ? `/resumes?jobTargetId=${jobTargetId}` : '/resumes'),
    get: (id: string) => apiFetch<any>(`/resumes/${id}`),
    create: (data: any) => apiFetch<any>('/resumes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch<any>(`/resumes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<void>(`/resumes/${id}`, { method: 'DELETE' }),
  },
};
