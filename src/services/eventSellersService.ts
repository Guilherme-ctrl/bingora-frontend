import { apiRequest } from '@/services/httpClient';

export type EventSellerAssignment = {
  seller_organizer_id: string;
  email: string;
  created_at: string;
};

export async function listEventSellers(eventId: string): Promise<{
  items: EventSellerAssignment[];
}> {
  return apiRequest<{ items: EventSellerAssignment[] }>(
    `/events/${eventId}/sellers`,
  );
}

export async function addEventSeller(
  eventId: string,
  body: { email: string; password?: string },
): Promise<EventSellerAssignment> {
  return apiRequest<EventSellerAssignment>(`/events/${eventId}/sellers`, {
    method: 'POST',
    body,
  });
}

export async function removeEventSeller(
  eventId: string,
  sellerOrganizerId: string,
): Promise<void> {
  await apiRequest<void>(
    `/events/${eventId}/sellers/${sellerOrganizerId}`,
    { method: 'DELETE' },
  );
}
