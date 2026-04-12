/**
 * API base path per contract (`/api/v1`). In dev, Vite proxies `/api` to the Nest backend.
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (raw && raw.length > 0) {
    return raw.replace(/\/$/, '');
  }
  return '/api/v1';
}

export function isMockApiMode(): boolean {
  return import.meta.env.VITE_USE_MOCK_API === 'true';
}
