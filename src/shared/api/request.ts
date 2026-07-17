import { buildApiUrl, hasApiBaseUrl } from './config';
import { authFetch, clearAuth } from '../../auth/authClient';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function requestJson(path: string, init?: RequestInit) {
  if (!hasApiBaseUrl()) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL.');
  }

  const fullUrl = buildApiUrl(path);
  
  const response = await authFetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (response.status === 401) {
    await clearAuth();
    throw new ApiError(401, 'session_invalid');
  }

  if (response.status === 403) {
    throw new ApiError(403, 'forbidden');
  }

  if (response.status >= 500 && response.status < 600) {
    throw new ApiError(response.status, 'service_unavailable');
  }

  if (!response.ok) {
    throw new ApiError(response.status, `Request failed (${response.status}).`);
  }

  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  return JSON.parse(text) as unknown;
}
