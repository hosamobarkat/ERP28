/**
 * API Client with Bearer token authentication and error handling
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

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
    localStorage.removeItem('weaving_erp_token');
    localStorage.removeItem('weaving_erp_user');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'حدث خطأ غير متوقع في النظام');
  }

  return data as T;
}
