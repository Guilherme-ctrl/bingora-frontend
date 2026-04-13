import { ApiRequestError, parseErrorResponse } from '@/services/apiError';
import { getApiBaseUrl } from '@/services/config';
import { Sentry, captureUnexpectedError } from '@/services/sentry';
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

  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    captureUnexpectedError(error, 'http_api_network_error');
    throw error;
  }

  if (res.status === 401) {
    dispatchUnauthorized();
  }

  if (!res.ok) {
    const parsedError = await parseErrorResponse(res);
    Sentry.addBreadcrumb({
      category: 'http',
      level: 'error',
      message: `${options.method ?? 'GET'} ${path} -> ${res.status}`,
      data: {
        path,
        status: res.status,
        request_id: res.headers.get('x-request-id') ?? undefined,
      },
    });
    if (res.status >= 500) {
      captureUnexpectedError(parsedError, 'http_api_request');
    }
    throw parsedError;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const raw = await res.text();
  if (raw.trim().length === 0) {
    return undefined as T;
  }

  Sentry.addBreadcrumb({
    category: 'http',
    level: 'info',
    message: `${options.method ?? 'GET'} ${path} -> ${res.status}`,
    data: {
      path,
      status: res.status,
      request_id: res.headers.get('x-request-id') ?? undefined,
    },
  });
  return JSON.parse(raw) as T;
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
  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? 'POST',
      headers,
      body: formData,
      signal: options.signal,
    });
  } catch (error) {
    captureUnexpectedError(error, 'http_form_data_network_error');
    throw error;
  }
  if (res.status === 401) {
    dispatchUnauthorized();
  }
  if (!res.ok) {
    const parsedError = await parseErrorResponse(res);
    if (res.status >= 500) {
      captureUnexpectedError(parsedError, 'http_api_request_form_data');
    }
    throw parsedError;
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

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers,
      signal: options.signal,
    });
  } catch (error) {
    captureUnexpectedError(error, 'http_text_network_error');
    throw error;
  }

  if (res.status === 401) {
    dispatchUnauthorized();
  }

  if (!res.ok) {
    const parsedError = await parseErrorResponse(res);
    if (res.status >= 500) {
      captureUnexpectedError(parsedError, 'http_api_request_text');
    }
    throw parsedError;
  }

  return res.text();
}

export function isApiRequestError(e: unknown): e is ApiRequestError {
  return e instanceof ApiRequestError;
}
