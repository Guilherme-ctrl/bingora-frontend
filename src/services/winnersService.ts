import type {
  CreateWinnerBody,
  Winner,
  WinnerListResponse,
} from '@/types/api';
import { apiRequest } from '@/services/httpClient';

export async function listWinners(eventId: string): Promise<WinnerListResponse> {
  return apiRequest<WinnerListResponse>(`/events/${eventId}/winners`);
}

export async function createWinner(
  eventId: string,
  body: CreateWinnerBody,
): Promise<Winner> {
  return apiRequest<Winner>(`/events/${eventId}/winners`, {
    method: 'POST',
    body,
  });
}

export async function revokeWinner(
  winnerId: string,
  reason?: string | null,
): Promise<Winner> {
  return apiRequest<Winner>(`/winners/${winnerId}/revoke`, {
    method: 'POST',
    body: { reason: reason ?? null },
  });
}
