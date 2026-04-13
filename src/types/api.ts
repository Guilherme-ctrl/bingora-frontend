/** Mirrors `06-api-contract.md` and backend response DTOs. */

export type EventStatus =
  | 'draft'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type BingoCardStatus = 'available' | 'assigned' | 'voided';

export type PaymentStatus = 'unpaid' | 'paid';

export type SaleStatus = 'active' | 'voided';

export type DrawSessionStatus = 'open' | 'closed';
export type DrawCallStatus = 'active' | 'invalidated';
export type RoundStatus =
  | 'CRIADA'
  | 'EM_VENDA'
  | 'AGUARDANDO_CONFERENCIA'
  | 'EM_SORTEIO'
  | 'FINALIZADA';
export type RoundType = 'binguinho' | 'roda_da_fortuna' | 'bingao';
export type SellerReconciliationStatus = 'CONFERIDO' | 'DIVERGENTE';

/** Alinhado ao enum Prisma `OrganizerRole`. */
export type OrganizerRole = 'admin' | 'member' | 'seller';

export type OrganizerProfile = {
  id: string;
  email: string;
  role: OrganizerRole;
  created_at: string;
  /** Preenchido para `seller`: eventos em que pode operar. */
  seller_event_ids?: string[];
};

export type AuthSuccessResponse = {
  organizer: OrganizerProfile;
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type EventSummary = {
  id: string;
  /** Dono do evento (útil na visão do admin). */
  organizer_id: string;
  /** E-mail do organizador (nome legível no UI). */
  organizer_email: string;
  title: string;
  starts_at: string;
  timezone: string;
  venue_notes: string | null;
  /** Centavos; usado para pré-preencher vendas. */
  default_unit_price_cents: number | null;
  default_currency: string;
  /** URL pública da logo (`/uploads/...`) ou null. */
  logo_url: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ListEventsParams = {
  status?: EventStatus;
  sort?: 'starts_at' | 'created_at';
  order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
};

export type CreateEventBody = {
  title: string;
  starts_at: string;
  timezone: string;
  venue_notes?: string | null;
  status?: EventStatus;
  default_unit_price_cents?: number | null;
  default_currency?: string;
};

export type UpdateEventBody = Partial<CreateEventBody>;

export type Prize = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PrizeListResponse = {
  items: Prize[];
};

export type CreatePrizeBody = {
  name: string;
  description?: string | null;
  sort_order?: number;
};

export type UpdatePrizeBody = Partial<CreatePrizeBody>;

export type BingoGrid = {
  rows: (number | null)[][];
};

export type BingoCard = {
  id: string;
  event_id: string;
  serial_number: number;
  status: BingoCardStatus;
  grid: BingoGrid;
  created_at: string;
};

export type GenerateCardsBody = {
  count: number;
  ruleset: 'us_75_ball_5x5';
};

export type GenerateCardsResponse = {
  generated_count: number;
  event_id: string;
};

export type ListCardsParams = {
  page?: number;
  page_size?: number;
  status?: BingoCardStatus;
  serial_number?: number;
};

export type Participant = {
  id: string;
  event_id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateParticipantBody = {
  display_name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
};

export type UpdateParticipantBody = Partial<CreateParticipantBody>;

export type SaleCardLine = {
  bingo_card_id: string;
  serial_number: number;
};

export type Sale = {
  id: string;
  event_id: string;
  round_id: string | null;
  seller_organizer_id: string | null;
  participant_id: string | null;
  quantity: number;
  payment_status: PaymentStatus;
  unit_price_cents: number | null;
  currency: string;
  notes: string | null;
  status: SaleStatus;
  cards: SaleCardLine[];
  created_at: string;
  updated_at: string;
};

export type SaleSummary = Omit<Sale, 'cards'>;

export type CreateSaleBody = {
  participant_id?: string | null;
  quantity: number;
  payment_status: PaymentStatus;
  unit_price_cents?: number | null;
  currency?: string;
  notes?: string | null;
  /** Números de série no evento; um por cartela vendida. Omita para o servidor escolher cartelas disponíveis. */
  serial_numbers?: number[];
};

export type UpdateSaleBody = {
  payment_status?: PaymentStatus;
  unit_price_cents?: number | null;
  currency?: string;
  notes?: string | null;
};

export type ListSalesParams = {
  page?: number;
  page_size?: number;
  payment_status?: PaymentStatus;
  status?: SaleStatus;
};

export type EventFinanceCurrencyBreakdown = {
  currency: string;
  paid_cents: number;
  unpaid_cents: number;
};

export type EventFinancialSummary = {
  event_id: string;
  cartelas_vendidas: number;
  vendas_ativas: number;
  vendas_anuladas: number;
  vendas_sem_preco: number;
  cartelas_em_vendas_sem_preco: number;
  by_currency: EventFinanceCurrencyBreakdown[];
};

export type DrawSession = {
  id: string;
  event_id: string;
  status: DrawSessionStatus;
  started_at: string;
  closed_at: string | null;
};

export type DrawCall = {
  id: string;
  draw_session_id: string;
  sequence: number;
  ball_number: number;
  called_at: string;
  note: string | null;
  status?: DrawCallStatus;
  invalidated_at?: string | null;
  invalidation_reason?: string | null;
};

export type DrawCallSummary = {
  id?: string;
  sequence: number;
  ball_number: number;
  called_at: string;
  status?: DrawCallStatus;
  invalidated_at?: string | null;
  invalidation_reason?: string | null;
};

export type DrawState = {
  session: DrawSession | null;
  calls: DrawCallSummary[];
  remaining_numbers?: number[];
};

export type PostCallBody = {
  ball_number: number;
  note?: string | null;
};

export type Round = {
  id: string;
  eventId: string;
  code: string;
  type: RoundType;
  status: RoundStatus;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
};

export type CreateRoundBody = {
  code: string;
  type: RoundType;
};

export type SellerReconciliationRow = {
  seller_organizer_id: string;
  seller_email: string;
  status: SellerReconciliationStatus | null;
  justification: string | null;
  updated_at: string | null;
};

export type SellerReconciliationList = {
  round_id: string;
  items: SellerReconciliationRow[];
};

export type Winner = {
  id: string;
  event_id: string;
  prize_id: string;
  participant_id: string;
  bingo_card_id: string | null;
  notes: string | null;
  recorded_at: string;
  revoked_at: string | null;
};

export type WinnerListResponse = {
  items: Winner[];
};

export type CreateWinnerBody = {
  prize_id: string;
  participant_id: string;
  bingo_card_id?: string | null;
  notes?: string | null;
};
