import type {
  CreateEventBody,
  EventSummary,
  ListEventsParams,
  Paginated,
  UpdateEventBody,
} from '@/types/api';
import { ApiRequestError } from '@/services/apiError';
import { isMockApiMode } from '@/services/config';
import { apiRequest, apiRequestFormData } from '@/services/httpClient';
import { mockStore } from '@/services/mock/mockStore';

export async function listEvents(
  params: ListEventsParams = {},
  signal?: AbortSignal,
): Promise<Paginated<EventSummary>> {
  const page = params.page ?? 1;
  const page_size = params.page_size ?? 25;

  if (isMockApiMode()) {
    return mockStore.listEvents({ page, page_size });
  }

  const search = new URLSearchParams();
  if (params.status) {
    search.set('status', params.status);
  }
  if (params.sort) {
    search.set('sort', params.sort);
  }
  if (params.order) {
    search.set('order', params.order);
  }
  search.set('page', String(page));
  search.set('page_size', String(page_size));

  const q = search.toString();
  return apiRequest<Paginated<EventSummary>>(
    `/events${q ? `?${q}` : ''}`,
    { signal },
  );
}

export async function createEvent(body: CreateEventBody): Promise<EventSummary> {
  if (isMockApiMode()) {
    return mockStore.createEvent({
      title: body.title,
      starts_at: body.starts_at,
      timezone: body.timezone,
      venue_notes: body.venue_notes ?? null,
      status: body.status ?? 'draft',
    });
  }

  return apiRequest<EventSummary>('/events', {
    method: 'POST',
    body,
  });
}

export async function getEvent(eventId: string): Promise<EventSummary> {
  if (isMockApiMode()) {
    const row = mockStore.getEvent(eventId);
    if (!row) {
      throw new ApiRequestError('Event not found.', 404, 'NOT_FOUND');
    }
    return row;
  }
  return apiRequest<EventSummary>(`/events/${eventId}`);
}

export async function updateEvent(
  eventId: string,
  body: UpdateEventBody,
): Promise<EventSummary> {
  if (isMockApiMode()) {
    return mockStore.updateEvent(eventId, body);
  }
  return apiRequest<EventSummary>(`/events/${eventId}`, {
    method: 'PATCH',
    body,
  });
}

export async function uploadEventLogo(
  eventId: string,
  file: File,
): Promise<EventSummary> {
  if (isMockApiMode()) {
    return mockStore.updateEvent(eventId, {
      logo_url: `/uploads/event-logos/${eventId}.png`,
    });
  }
  const fd = new FormData();
  fd.append('file', file);
  return apiRequestFormData<EventSummary>(`/events/${eventId}/logo`, fd);
}

export async function deleteEventLogo(eventId: string): Promise<EventSummary> {
  if (isMockApiMode()) {
    return mockStore.updateEvent(eventId, { logo_url: null });
  }
  return apiRequest<EventSummary>(`/events/${eventId}/logo`, {
    method: 'DELETE',
  });
}
