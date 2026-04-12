import type {
  CreatePrizeBody,
  Prize,
  PrizeListResponse,
  UpdatePrizeBody,
} from '@/types/api';
import { apiRequest } from '@/services/httpClient';

export async function listPrizes(eventId: string): Promise<PrizeListResponse> {
  return apiRequest<PrizeListResponse>(`/events/${eventId}/prizes`);
}

export async function createPrize(
  eventId: string,
  body: CreatePrizeBody,
): Promise<Prize> {
  return apiRequest<Prize>(`/events/${eventId}/prizes`, {
    method: 'POST',
    body,
  });
}

export async function updatePrize(
  prizeId: string,
  body: UpdatePrizeBody,
): Promise<Prize> {
  return apiRequest<Prize>(`/prizes/${prizeId}`, {
    method: 'PATCH',
    body,
  });
}

export async function deletePrize(prizeId: string): Promise<void> {
  await apiRequest<void>(`/prizes/${prizeId}`, {
    method: 'DELETE',
  });
}
