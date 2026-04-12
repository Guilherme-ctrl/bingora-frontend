import type { AuthSuccessResponse, OrganizerProfile } from '@/types/api';
import { isMockApiMode } from '@/services/config';
import { apiRequest, isApiRequestError } from '@/services/httpClient';
import { MOCK_INVALID_EMAIL, mockStore } from '@/services/mock/mockStore';
import { setStoredAccessToken } from '@/services/tokenStorage';
import { ApiRequestError } from '@/services/apiError';

export async function register(
  email: string,
  password: string,
): Promise<AuthSuccessResponse> {
  if (isMockApiMode()) {
    const res: AuthSuccessResponse = {
      organizer: { ...mockStore.organizer, email },
      access_token: `mock.${btoa(email)}.${Date.now()}`,
      token_type: 'Bearer',
      expires_in: 3600,
    };
    setStoredAccessToken(res.access_token);
    return res;
  }

  const data = await apiRequest<AuthSuccessResponse>('/auth/register', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  setStoredAccessToken(data.access_token);
  return data;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthSuccessResponse> {
  if (isMockApiMode()) {
    if (email === MOCK_INVALID_EMAIL) {
      throw new ApiRequestError('Invalid email or password.', 401, 'UNAUTHORIZED');
    }
    if (password.length < 8) {
      throw new ApiRequestError('Invalid email or password.', 401, 'UNAUTHORIZED');
    }
    const res: AuthSuccessResponse = {
      organizer: { ...mockStore.organizer, email },
      access_token: `mock.${btoa(email)}.${Date.now()}`,
      token_type: 'Bearer',
      expires_in: 3600,
    };
    setStoredAccessToken(res.access_token);
    return res;
  }

  const data = await apiRequest<AuthSuccessResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  setStoredAccessToken(data.access_token);
  return data;
}

export async function logout(): Promise<void> {
  if (isMockApiMode()) {
    setStoredAccessToken(null);
    return;
  }
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (e) {
    if (!isApiRequestError(e) || e.status !== 401) {
      throw e;
    }
  } finally {
    setStoredAccessToken(null);
  }
}

export async function fetchMe(signal?: AbortSignal): Promise<OrganizerProfile> {
  if (isMockApiMode()) {
    return mockStore.organizer;
  }
  return apiRequest<OrganizerProfile>('/me', { signal });
}
