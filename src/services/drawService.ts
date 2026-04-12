import type { DrawSession, DrawCall, DrawState, PostCallBody } from '@/types/api';
import { apiRequest } from '@/services/httpClient';

export async function startOrGetSession(eventId: string): Promise<DrawSession> {
  return apiRequest<DrawSession>(`/events/${eventId}/draw/session`, {
    method: 'POST',
  });
}

export async function getDrawState(eventId: string): Promise<DrawState> {
  return apiRequest<DrawState>(`/events/${eventId}/draw`);
}

export async function postCall(
  eventId: string,
  body: PostCallBody,
): Promise<DrawCall> {
  return apiRequest<DrawCall>(`/events/${eventId}/draw/calls`, {
    method: 'POST',
    body,
  });
}

export async function deleteLastCall(eventId: string): Promise<void> {
  await apiRequest<void>(`/events/${eventId}/draw/calls/last`, {
    method: 'DELETE',
  });
}

export async function closeDrawSession(eventId: string): Promise<DrawSession> {
  return apiRequest<DrawSession>(`/events/${eventId}/draw/close`, {
    method: 'POST',
  });
}
