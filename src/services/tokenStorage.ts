const KEY = 'bingo_access_token';

export function getStoredAccessToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setStoredAccessToken(token: string | null): void {
  try {
    if (token === null) {
      localStorage.removeItem(KEY);
    } else {
      localStorage.setItem(KEY, token);
    }
  } catch {
    /* ignore quota / private mode */
  }
}
