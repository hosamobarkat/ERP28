import { handleLocalMockRequest } from './mockFallback';

/**
 * API Client with Bearer token authentication and automatic offline/Vercel fallback
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

    // If server returned 404 (e.g. on static Vercel deploy without serverless), use local mock fallback
    if (response.status === 404 && endpoint.startsWith('/api/')) {
      return (await handleLocalMockRequest(endpoint, options)) as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ في النظام');
      }
      return data as T;
    }

    if (!response.ok) {
      // Fallback if HTML response received instead of API
      return (await handleLocalMockRequest(endpoint, options)) as T;
    }

    return {} as T;
  } catch (err: any) {
    // If fetch failed completely (network / Vercel static), transparently use mock engine
    try {
      return (await handleLocalMockRequest(endpoint, options)) as T;
    } catch (fallbackErr: any) {
      throw new Error(fallbackErr.message || err.message || 'حدث خطأ أثناء معالجة الطلب');
    }
  }
}
