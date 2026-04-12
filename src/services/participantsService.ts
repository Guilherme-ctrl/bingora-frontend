import type {
  CreateParticipantBody,
  Paginated,
  Participant,
  UpdateParticipantBody,
} from '@/types/api';
import { apiRequest } from '@/services/httpClient';

export async function listParticipants(
  eventId: string,
  params: { page?: number; page_size?: number } = {},
): Promise<Paginated<Participant>> {
  const search = new URLSearchParams();
  if (params.page) {
    search.set('page', String(params.page));
  }
  if (params.page_size) {
    search.set('page_size', String(params.page_size));
  }
  const q = search.toString();
  return apiRequest<Paginated<Participant>>(
    `/events/${eventId}/participants${q ? `?${q}` : ''}`,
  );
}

export async function createParticipant(
  eventId: string,
  body: CreateParticipantBody,
): Promise<Participant> {
  return apiRequest<Participant>(`/events/${eventId}/participants`, {
    method: 'POST',
    body,
  });
}

export async function updateParticipant(
  participantId: string,
  body: UpdateParticipantBody,
): Promise<Participant> {
  return apiRequest<Participant>(`/participants/${participantId}`, {
    method: 'PATCH',
    body,
  });
}

export async function deleteParticipant(participantId: string): Promise<void> {
  await apiRequest<void>(`/participants/${participantId}`, {
    method: 'DELETE',
  });
}
