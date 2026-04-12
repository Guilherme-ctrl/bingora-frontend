import { ApiRequestError, parseErrorResponse } from '@/services/apiError';
import { getApiBaseUrl } from '@/services/config';
import { getStoredAccessToken, setStoredAccessToken } from '@/services/tokenStorage';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
};

function dispatchUnauthorized(): void {
  setStoredAccessToken(null);
  window.dispatchEvent(new CustomEvent('bingo:auth-unauthorized'));
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.auth !== false) {
    const token = getStoredAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body:
      options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (res.status === 401) {
    dispatchUnauthorized();
  }

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

/** Upload multipart (ex.: logo); não define Content-Type (boundary automático). */
export async function apiRequestFormData<T>(
  path: string,
  formData: FormData,
  options: { method?: 'POST' | 'PATCH'; signal?: AbortSignal } = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const token = getStoredAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: options.method ?? 'POST',
    headers,
    body: formData,
    signal: options.signal,
  });
  if (res.status === 401) {
    dispatchUnauthorized();
  }
  if (!res.ok) {
    throw await parseErrorResponse(res);
  }
  return (await res.json()) as T;
}

/** Plain text or CSV responses (e.g. card export). */
export async function apiRequestText(
  path: string,
  options: { signal?: AbortSignal } = {},
): Promise<string> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getStoredAccessToken();
  const headers: Record<string, string> = {
    Accept: 'text/csv, text/plain, */*',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'GET',
    headers,
    signal: options.signal,
  });

  if (res.status === 401) {
    dispatchUnauthorized();
  }

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  return res.text();
}

export function isApiRequestError(e: unknown): e is ApiRequestError {
  return e instanceof ApiRequestError;
}
