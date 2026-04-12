import type { EventFinancialSummary } from '@/types/api';
import { apiRequest } from '@/services/httpClient';

export async function getEventFinanceSummary(
  eventId: string,
  signal?: AbortSignal,
): Promise<EventFinancialSummary> {
  return apiRequest<EventFinancialSummary>(
    `/events/${eventId}/finance/summary`,
    { signal },
  );
}
