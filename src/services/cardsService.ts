import type {
  BingoCard,
  GenerateCardsBody,
  GenerateCardsResponse,
  ListCardsParams,
  Paginated,
} from '@/types/api';
import { apiRequest, apiRequestText } from '@/services/httpClient';

export async function generateCards(
  eventId: string,
  body: GenerateCardsBody,
): Promise<GenerateCardsResponse> {
  return apiRequest<GenerateCardsResponse>(
    `/events/${eventId}/cards/generate`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function listCards(
  eventId: string,
  params: ListCardsParams = {},
): Promise<Paginated<BingoCard>> {
  const search = new URLSearchParams();
  if (params.page) {
    search.set('page', String(params.page));
  }
  if (params.page_size) {
    search.set('page_size', String(params.page_size));
  }
  if (params.status) {
    search.set('status', params.status);
  }
  if (params.serial_number !== undefined) {
    search.set('serial_number', String(params.serial_number));
  }
  const q = search.toString();
  return apiRequest<Paginated<BingoCard>>(
    `/events/${eventId}/cards${q ? `?${q}` : ''}`,
  );
}

export async function exportCardsJson(eventId: string): Promise<BingoCard[]> {
  return apiRequest<BingoCard[]>(
    `/events/${eventId}/cards/export?format=json`,
  );
}

export async function exportCardsCsv(eventId: string): Promise<string> {
  return apiRequestText(`/events/${eventId}/cards/export?format=csv`);
}
