/**
 * API base path per contract (`/api/v1`). In dev, Vite proxies `/api` to the Nest backend.
 * Remote URLs may omit `/api/v1`; we append it so requests hit `/api/v1/...` on the server.
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (raw && raw.length > 0) {
    const trimmed = raw.trim().replace(/\/$/, '');
    if (/^https?:\/\//i.test(trimmed) && !trimmed.endsWith('/api/v1')) {
      return `${trimmed}/api/v1`;
    }
    return trimmed;
  }
  return '/api/v1';
}

export function isMockApiMode(): boolean {
  return import.meta.env.VITE_USE_MOCK_API === 'true';
}
