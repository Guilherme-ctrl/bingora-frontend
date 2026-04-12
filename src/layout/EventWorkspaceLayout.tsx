import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { EventStatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import * as eventsService from '@/services/eventsService';
import { ApiRequestError } from '@/services/apiError';
import type { EventWorkspaceOutlet } from '@/types/eventWorkspace';
import { resolveUploadUrl } from '@/utils/resolveUploadUrl';
import { formatEventStartDisplay } from '@/utils/datetime';
import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';

export function EventWorkspaceLayout() {
  const { user } = useAuth();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventWorkspaceOutlet['event'] | null>(
    null,
  );
  const [phase, setPhase] = useState<'loading' | 'missing' | 'err' | 'ok'>(
    'loading',
  );
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const reloadEvent = useCallback(async () => {
    if (!eventId) {
      return;
    }
    const data = await eventsService.getEvent(eventId);
    setEvent(data);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      return;
    }
    let cancelled = false;
    eventsService
      .getEvent(eventId)
      .then((e) => {
        if (!cancelled) {
          setEvent(e);
          setPhase('ok');
        }
      })
      .catch((e: unknown) => {
        if (cancelled) {
          return;
        }
        if (e instanceof ApiRequestError && e.status === 404) {
          setPhase('missing');
        } else {
          setPhase('err');
          setErrMsg(
            e instanceof ApiRequestError
              ? e.message
              : 'Falha ao carregar o evento.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (!eventId) {
    return (
      <Callout tone="error" title="Evento ausente">
        Rota inválida.
      </Callout>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" aria-hidden />
        <p className="app-loading__text">Carregando evento…</p>
      </div>
    );
  }

  if (phase === 'missing') {
    return (
      <div className="page-container">
        <Callout tone="error" title="Evento não encontrado">
          <p>Este evento não existe ou você não tem acesso.</p>
          <Link to="/events">
            <Button type="button" variant="secondary">
              Voltar aos eventos
            </Button>
          </Link>
        </Callout>
      </div>
    );
  }

  if (phase === 'err' || !event) {
    return (
      <div className="page-container">
        <Callout tone="error" title="Não foi possível carregar o evento">
          {errMsg ?? 'Erro desconhecido.'}
        </Callout>
      </div>
    );
  }

  const base = `/events/${eventId}`;
  const ctx: EventWorkspaceOutlet = { event, reloadEvent };
  const isSeller = user?.role === 'seller';
  const isOwner =
    user?.role === 'admin' || event.organizer_id === user?.id;

  const sub = (to: string, label: string, end?: boolean) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `event-subnav__link ${isActive ? 'is-active' : ''}`.trim()
      }
    >
      {label}
    </NavLink>
  );

  return (
    <div className="event-workspace">
      <div className="event-workspace__head">
        <div className="event-workspace__title-row">
          <div>
            <p className="event-workspace__crumb">
              <Link to="/events">Eventos</Link>
              <span aria-hidden> / </span>
              <span>{event.title}</span>
            </p>
            <div className="event-workspace__title-with-logo">
              {event.logo_url ? (
                <img
                  className="event-workspace__logo"
                  src={resolveUploadUrl(event.logo_url) ?? undefined}
                  alt="Logo do evento"
                  width={48}
                  height={48}
                />
              ) : null}
              <h1 className="event-workspace__title">{event.title}</h1>
            </div>
            <p className="event-workspace__meta">
              <EventStatusBadge status={event.status} />
              <span className="event-workspace__time">
                {formatEventStartDisplay(event.starts_at, event.timezone)}
              </span>
              {user?.role === 'admin' ? (
                <span className="event-workspace__organizer" title={event.organizer_id}>
                  · {event.organizer_email}
                </span>
              ) : null}
            </p>
          </div>
          {!isSeller ? (
            <Link to={`${base}/edit`}>
              <Button type="button" variant="secondary">
                Editar evento
              </Button>
            </Link>
          ) : (
            <span className="event-workspace__seller-pill" title="Conta de vendedor">
              Modo venda
            </span>
          )}
        </div>

        <nav className="event-subnav" aria-label="Seções do evento">
          {isSeller ? (
            <>
              {sub(`${base}/vender`, 'Balcão', true)}
              {sub(`${base}/sales`, 'Vendas')}
              {sub(`${base}/participants`, 'Participantes')}
            </>
          ) : (
            <>
              {sub(base, 'Visão geral', true)}
              {isOwner ? sub(`${base}/vendedores`, 'Vendedores') : null}
              {sub(`${base}/prizes`, 'Prêmios')}
              {sub(`${base}/cards`, 'Cartelas')}
              {sub(`${base}/participants`, 'Participantes')}
              {sub(`${base}/sales`, 'Vendas')}
              {sub(`${base}/finance`, 'Financeiro')}
              {sub(`${base}/draw`, 'Sorteio')}
              {sub(`${base}/winners`, 'Ganhadores')}
            </>
          )}
        </nav>
      </div>

      <Outlet context={ctx} />
    </div>
  );
}
