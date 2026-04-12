import type { EventSummary, OrganizerProfile, Paginated } from '@/types/api';

const MOCK_ORGANIZER: OrganizerProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'organizer@example.com',
  role: 'member',
  created_at: new Date().toISOString(),
};

const STORAGE_EVENTS = 'bingo_mock_events';

function normalizeEvent(e: EventSummary): EventSummary {
  return {
    ...e,
    organizer_id: e.organizer_id ?? MOCK_ORGANIZER.id,
    organizer_email: e.organizer_email ?? MOCK_ORGANIZER.email,
    default_unit_price_cents: e.default_unit_price_cents ?? null,
    default_currency: e.default_currency ?? 'BRL',
    logo_url: e.logo_url ?? null,
  };
}

function loadEvents(): EventSummary[] {
  try {
    const raw = localStorage.getItem(STORAGE_EVENTS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as EventSummary[];
    return parsed.map(normalizeEvent);
  } catch {
    return [];
  }
}

function saveEvents(items: EventSummary[]): void {
  try {
    localStorage.setItem(STORAGE_EVENTS, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function nextId(): string {
  return crypto.randomUUID();
}

export const mockStore = {
  organizer: MOCK_ORGANIZER,

  listEvents(params: {
    page: number;
    page_size: number;
  }): Paginated<EventSummary> {
    const all = loadEvents().sort(
      (a, b) =>
        new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
    );
    const start = (params.page - 1) * params.page_size;
    const items = all.slice(start, start + params.page_size);
    return {
      items,
      page: params.page,
      page_size: params.page_size,
      total: all.length,
    };
  },

  createEvent(input: {
    title: string;
    starts_at: string;
    timezone: string;
    venue_notes: string | null;
    status: EventSummary['status'];
    default_unit_price_cents?: number | null;
    default_currency?: string;
  }): EventSummary {
    const now = new Date().toISOString();
    const row: EventSummary = {
      id: nextId(),
      organizer_id: MOCK_ORGANIZER.id,
      organizer_email: MOCK_ORGANIZER.email,
      title: input.title,
      starts_at: input.starts_at,
      timezone: input.timezone,
      venue_notes: input.venue_notes,
      default_unit_price_cents: input.default_unit_price_cents ?? null,
      default_currency: input.default_currency ?? 'BRL',
      logo_url: null,
      status: input.status,
      created_at: now,
      updated_at: now,
    };
    const all = loadEvents();
    all.push(row);
    saveEvents(all);
    return row;
  },

  getEvent(id: string): EventSummary | undefined {
    return loadEvents().find((e) => e.id === id);
  },

  updateEvent(
    id: string,
    patch: Partial<EventSummary>,
  ): EventSummary {
    const all = loadEvents();
    const i = all.findIndex((e) => e.id === id);
    if (i === -1) {
      throw new Error('Event not found');
    }
    const now = new Date().toISOString();
    const next: EventSummary = {
      ...all[i],
      ...patch,
      updated_at: now,
    };
    all[i] = next;
    saveEvents(all);
    return next;
  },
};

/** Mock-only: login fails for this email to exercise invalid-credentials UI. */
export const MOCK_INVALID_EMAIL = 'invalid@example.com';
