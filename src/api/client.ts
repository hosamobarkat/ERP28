import { handleLocalMockRequest } from './mockFallback';

/**
 * API Client with Bearer token authentication and automatic offline/Vercel static fallback
 */

const getAuthToken = (): string | null => localStorage.getItem('weaving_erp_token');

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
      localStorage.removeItem('weaving_erp_token');
      localStorage.removeItem('weaving_erp_user');
    }

    const contentType = response.headers.get('content-type') || '';

    // If server returned valid JSON
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      return data as T;
    }

    // If the server returned an error with JSON
    if (!response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      throw new Error(data.error || 'حدث خطأ في النظام');
    }

    // If response is HTML (Vercel static SPA rewrite returning index.html) or 404/500 without JSON:
    return (await handleLocalMockRequest(endpoint, options)) as T;
  } catch (err: any) {
    // If fetch failed completely (network error, CORS, or static Vercel host)
    try {
      return (await handleLocalMockRequest(endpoint, options)) as T;
    } catch (fallbackErr: any) {
      throw new Error(fallbackErr.message || err.message || 'حدث خطأ أثناء معالجة الطلب');
    }
  }
}

