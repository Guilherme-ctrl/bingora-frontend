import { UI_LOCALE } from '@/constants/locale';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { EventStatusBadge } from '@/components/ui/Badge';
import { PageContainer, PageHeader } from '@/components/ui/PageContainer';
import { formatEventStartDisplay } from '@/utils/datetime';
import { resolveUploadUrl } from '@/utils/resolveUploadUrl';
import * as eventsService from '@/services/eventsService';
import type { EventSummary, Paginated } from '@/types/api';
import { ApiRequestError } from '@/services/apiError';
import { useAuth } from '@/hooks/useAuth';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function truncateText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

export function EventsDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Paginated<EventSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await eventsService.listEvents({
        sort: 'starts_at',
        order: 'desc',
      });
      setData(res);
    } catch (e) {
      if (e instanceof ApiRequestError) {
        setError(e.message);
      } else {
        setError(
          'Não foi possível carregar os eventos. Verifique a conexão e tente de novo.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageContainer>
      <PageHeader
        title="Eventos"
        description={
          user?.role === 'seller'
            ? 'Estes são os eventos em que você pode registrar vendas.'
            : 'Crie e gerencie eventos de bingo. Abra um evento para configurar prêmios, cartelas, vendas e sorteio.'
        }
        actions={
          user?.role === 'seller' ? null : (
            <Link to="/events/new">
              <Button type="button" variant="primary">
                Novo evento
              </Button>
            </Link>
          )
        }
      />

      {error ? (
        <Callout tone="error" title="Não foi possível carregar">
          <p>{error}</p>
          <Button type="button" variant="secondary" onClick={() => void load()}>
            Tentar de novo
          </Button>
        </Callout>
      ) : null}

      {loading ? (
        <div className="events-board-skeleton" aria-busy aria-label="Carregando eventos">
          {[0, 1, 2].map((i) => (
            <div key={i} className="events-board-skeleton__card" />
          ))}
        </div>
      ) : null}

      {!loading && !error && data && data.total === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state__title">Nenhum evento ainda</h2>
          <p className="empty-state__text">
            {user?.role === 'seller'
              ? 'Peça ao organizador do evento para adicionar o seu e-mail como vendedor.'
              : 'Ao criar um evento, ele aparece aqui com data e status. Depois você adiciona prêmios, gera cartelas e registra vendas antes da sessão.'}
          </p>
          {user?.role === 'seller' ? null : (
            <Link to="/events/new">
              <Button type="button" variant="primary">
                Criar primeiro evento
              </Button>
            </Link>
          )}
        </div>
      ) : null}

      {!loading && !error && data && data.total > 0 ? (
        <ul className="events-board" role="list">
          {data.items.map((ev) => {
            const logoSrc = resolveUploadUrl(ev.logo_url ?? null);
            const initial =
              ev.title.trim().charAt(0).toLocaleUpperCase(UI_LOCALE) || '?';
            return (
              <li key={ev.id} className="events-board__item">
                <div className="events-board__thumb" aria-hidden>
                  {logoSrc ? (
                    <img
                      className="events-board__thumb-img"
                      src={logoSrc}
                      alt=""
                    />
                  ) : (
                    <span className="events-board__thumb-fallback">{initial}</span>
                  )}
                </div>

                <div className="events-board__body">
                  <h2 className="events-board__title">
                    <Link to={`/events/${ev.id}`} className="events-board__title-link">
                      {ev.title}
                    </Link>
                  </h2>
                  <p className="events-board__when">
                    <time dateTime={ev.starts_at}>
                      {formatEventStartDisplay(ev.starts_at, ev.timezone)}
                    </time>
                    <span className="events-board__tz" title={ev.timezone}>
                      {' '}
                      · {ev.timezone}
                    </span>
                  </p>
                  {ev.venue_notes ? (
                    <p className="events-board__venue" title={ev.venue_notes}>
                      {truncateText(ev.venue_notes, 120)}
                    </p>
                  ) : null}
                  {ev.default_unit_price_cents != null ? (
                    <p className="events-board__price">
                      Referência cartela:{' '}
                      <strong>
                        {(ev.default_unit_price_cents / 100).toFixed(2)}{' '}
                        {ev.default_currency}
                      </strong>
                    </p>
                  ) : null}
                  {user?.role === 'admin' ? (
                    <p className="events-board__org" title={ev.organizer_id}>
                      {ev.organizer_email}
                    </p>
                  ) : null}
                </div>

                <div className="events-board__aside">
                  <EventStatusBadge status={ev.status} />
                  <Link
                    to={`/events/${ev.id}`}
                    className="btn btn--secondary events-board__cta"
                  >
                    Abrir
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </PageContainer>
  );
}
