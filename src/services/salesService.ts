import type {
  CreateSaleBody,
  ListSalesParams,
  Paginated,
  Sale,
  SaleSummary,
  UpdateSaleBody,
} from '@/types/api';
import { apiRequest } from '@/services/httpClient';

export type AvailableSaleSerialsResponse = {
  serial_numbers: number[];
};

/** Cartelas ainda disponíveis no evento (só números; serve para venda/balcão). */
export async function listAvailableSaleSerials(
  eventId: string,
): Promise<AvailableSaleSerialsResponse> {
  return apiRequest<AvailableSaleSerialsResponse>(
    `/events/${eventId}/sales/available-serials`,
  );
}

export async function listSales(
  eventId: string,
  params: ListSalesParams = {},
): Promise<Paginated<SaleSummary>> {
  const search = new URLSearchParams();
  if (params.page) {
    search.set('page', String(params.page));
  }
  if (params.page_size) {
    search.set('page_size', String(params.page_size));
  }
  if (params.payment_status) {
    search.set('payment_status', params.payment_status);
  }
  if (params.status) {
    search.set('status', params.status);
  }
  const q = search.toString();
  return apiRequest<Paginated<SaleSummary>>(
    `/events/${eventId}/sales${q ? `?${q}` : ''}`,
  );
}

export async function getSale(saleId: string): Promise<Sale> {
  return apiRequest<Sale>(`/sales/${saleId}`);
}

export async function createSale(
  eventId: string,
  body: CreateSaleBody,
): Promise<Sale> {
  return apiRequest<Sale>(`/events/${eventId}/sales`, {
    method: 'POST',
    body,
  });
}

export async function updateSale(
  saleId: string,
  body: UpdateSaleBody,
): Promise<Sale> {
  return apiRequest<Sale>(`/sales/${saleId}`, {
    method: 'PATCH',
    body,
  });
}

export async function voidSale(
  saleId: string,
  reason?: string | null,
): Promise<Sale> {
  return apiRequest<Sale>(`/sales/${saleId}/void`, {
    method: 'POST',
    body: { reason: reason ?? null },
  });
}
