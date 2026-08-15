import { handleLocalMockRequest } from './mockFallback';

/**
 * API Client with Bearer token authentication and automatic offline/Vercel static fallback
 */

const getAuthToken = (): string | null => {
  try {
    return sessionStorage.getItem('weaving_erp_token') || localStorage.getItem('weaving_erp_token');
  } catch {
    return null;
  }
};

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(endpoint, mergedOptions);

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // If server returned valid JSON
    if (response.ok && isJson) {
      const data = await response.json();
      return data as T;
    }

    // If the server returned an explicit JSON error (like 401 Unauthorized or 400 Bad Request)
    if (!response.ok && isJson) {
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
        sessionStorage.removeItem('weaving_erp_token');
        sessionStorage.removeItem('weaving_erp_user');
        localStorage.removeItem('weaving_erp_token');
        localStorage.removeItem('weaving_erp_user');
      }
      throw new Error(data.error || 'حدث خطأ في النظام');
    }

    // If response is HTML (e.g. Vercel static SPA rewrite returning index.html) or 404/405 without JSON:
    return (await handleLocalMockRequest(endpoint, mergedOptions)) as T;
  } catch (err: any) {
    // If fetch failed completely (network error, CORS, or static Vercel host without backend)
    try {
      return (await handleLocalMockRequest(endpoint, mergedOptions)) as T;
    } catch (fallbackErr: any) {
      throw new Error(fallbackErr.message || err.message || 'حدث خطأ أثناء معالجة الطلب');
    }
  }
}

