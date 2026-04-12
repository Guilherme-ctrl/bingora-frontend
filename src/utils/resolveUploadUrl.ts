import { getApiBaseUrl } from '@/services/config';

/**
 * Converte caminho `/uploads/...` devolvido pela API num URL absoluto para `<img src>`.
 * Em dev (proxy), usa o mesmo origin do browser.
 */
export function resolveUploadUrl(
  pathOrNull: string | null | undefined,
): string | null {
  if (pathOrNull == null || pathOrNull === '') {
    return null;
  }
  if (pathOrNull.startsWith('http://') || pathOrNull.startsWith('https://')) {
    return pathOrNull;
  }
  const base = getApiBaseUrl();
  if (base.startsWith('http://') || base.startsWith('https://')) {
    try {
      const origin = new URL(base).origin;
      return `${origin}${pathOrNull.startsWith('/') ? pathOrNull : `/${pathOrNull}`}`;
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${pathOrNull.startsWith('/') ? pathOrNull : `/${pathOrNull}`}`;
  }
  return pathOrNull;
}
