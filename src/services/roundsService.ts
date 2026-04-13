import { apiRequest } from '@/services/httpClient';
import type {
  CreateRoundBody,
  Round,
  SellerReconciliationList,
  SellerReconciliationStatus,
} from '@/types/api';

export async function getActiveRound(eventId: string): Promise<Round | null> {
  const data = await apiRequest<Round | null | undefined>(
    `/events/${eventId}/rounds/active`,
  );
  return data ?? null;
}

export async function createRound(
  eventId: string,
  body: CreateRoundBody,
): Promise<Round> {
  return apiRequest<Round>(`/events/${eventId}/rounds`, {
    method: 'POST',
    body,
  });
}

export async function openSales(roundId: string): Promise<Round> {
  return apiRequest<Round>(`/rounds/${roundId}/open-sales`, { method: 'POST' });
}

export async function closeSales(roundId: string): Promise<Round> {
  return apiRequest<Round>(`/rounds/${roundId}/close-sales`, { method: 'POST' });
}

export async function startDraw(roundId: string): Promise<Round> {
  return apiRequest<Round>(`/rounds/${roundId}/start-draw`, { method: 'POST' });
}

export async function finishRound(roundId: string): Promise<Round> {
  return apiRequest<Round>(`/rounds/${roundId}/finish`, { method: 'POST' });
}

export async function listSellerReconciliation(
  roundId: string,
): Promise<SellerReconciliationList> {
  return apiRequest<SellerReconciliationList>(
    `/rounds/${roundId}/seller-reconciliation`,
  );
}

export async function reconcileSeller(
  roundId: string,
  sellerOrganizerId: string,
  status: SellerReconciliationStatus,
  justification?: string | null,
) {
  return apiRequest(`/rounds/${roundId}/seller-reconciliation/${sellerOrganizerId}`, {
    method: 'POST',
    body: {
      status,
      justification: justification ?? null,
    },
  });
}
