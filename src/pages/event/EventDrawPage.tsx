import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PageContainer, PageHeader } from '@/components/ui/PageContainer';
import { TextField } from '@/components/ui/TextField';
import { useEventWorkspace } from '@/hooks/useEventWorkspace';
import * as drawService from '@/services/drawService';
import * as roundsService from '@/services/roundsService';
import type { DrawSessionStatus, DrawState, Round } from '@/types/api';
import { ApiRequestError } from '@/services/apiError';
import { useCallback, useEffect, useState } from 'react';

const SESSION_STATUS_PT: Record<DrawSessionStatus, string> = {
  open: 'Aberta',
  closed: 'Encerrada',
};

export function EventDrawPage() {
  const { event } = useEventWorkspace();
  const drawable =
    event.status === 'scheduled' || event.status === 'in_progress';

  const [state, setState] = useState<DrawState | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ballInput, setBallInput] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, activeRound] = await Promise.all([
        drawService.getDrawState(event.id),
        roundsService.getActiveRound(event.id),
      ]);
      setState(s);
      setRound(activeRound);
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.message
          : 'Não foi possível carregar o sorteio.',
      );
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const session = state?.session ?? null;
  const calls = state?.calls ?? [];
  const remaining = state?.remaining_numbers;
  const calledSet = new Set(
    calls
      .filter((c) => (c.status ?? 'active') === 'active')
      .map((c) => c.ball_number),
  );

  async function startSession() {
    setBusy(true);
    try {
      await drawService.startOrGetSession(event.id);
      await load();
    } catch (e) {
      window.alert(
        e instanceof ApiRequestError
          ? e.message
          : 'Não foi possível iniciar o sorteio.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitCall(e: React.FormEvent) {
    e.preventDefault();
    const n = Number.parseInt(ballInput, 10);
    if (!Number.isFinite(n) || n < 1 || n > 75) {
      return;
    }
    if (calledSet.has(n)) {
      window.alert('Esse número já foi chamado.');
      return;
    }
    setBusy(true);
    try {
      if (round?.status !== 'EM_SORTEIO') {
        window.alert('A rodada precisa estar em EM_SORTEIO para registrar chamadas.');
        return;
      }
      await drawService.postCallInRound(round.id, { ball_number: n });
      setBallInput('');
      await load();
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível registrar a chamada.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function undoLast() {
    if (!window.confirm('Invalidar a última chamada?')) {
      return;
    }
    if (!round) {
      return;
    }
    setBusy(true);
    try {
      const lastActive = [...calls]
        .reverse()
        .find((c) => (c.status ?? 'active') === 'active');
      if (!lastActive?.id) {
        window.alert('Não há chamada ativa para invalidar.');
        return;
      }
      await drawService.invalidateCallInRound(
        round.id,
        lastActive.id,
        'Correção operacional',
      );
      await load();
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível desfazer.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function closeDraw() {
    if (
      !window.confirm(
        'Encerrar o sorteio? Depois de encerrado, não é possível reabrir o sorteio neste evento.',
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await drawService.closeDrawSession(event.id);
      await load();
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível encerrar.',
      );
    } finally {
      setBusy(false);
    }
  }

  const lastCall = calls.length ? calls[calls.length - 1] : null;
  const open = session?.status === 'open';
  const roundInDraw = round?.status === 'EM_SORTEIO';

  return (
    <PageContainer>
      <PageHeader
        title="Sorteio"
        description="Registre números na rodada em EM_SORTEIO. Correções devem ser por invalidação auditável."
      />
      {round ? (
        <Callout
          tone={roundInDraw ? 'info' : 'error'}
          title={`Rodada ${round.code} (${round.status})`}
        >
          {roundInDraw
            ? 'Rodada liberada para roletagem.'
            : 'A rodada não está em EM_SORTEIO. Vá em Rodada para avançar o estado.'}
        </Callout>
      ) : (
        <Callout tone="error" title="Sem rodada ativa">
          Crie uma rodada e avance o fluxo operacional antes de sortear.
        </Callout>
      )}


      {!drawable ? (
        <Callout tone="error" title="Evento não pronto">
          Coloque o evento em Agendado ou Em andamento antes de rodar o
          sorteio.
        </Callout>
      ) : null}

      {error ? (
        <Callout tone="error" title="Erro">
          {error}
        </Callout>
      ) : null}

      {loading ? (
        <div className="app-loading">
          <div className="app-loading__spinner" aria-hidden />
        </div>
      ) : null}

      {!loading && drawable && !session ? (
        <div className="empty-state">
          <p className="empty-state__text">Ainda não há sessão de sorteio.</p>
          <Button type="button" variant="primary" loading={busy} onClick={startSession}>
            Iniciar sorteio
          </Button>
        </div>
      ) : null}

      {!loading && session && (
        <>
          <div className="draw-banner">
            <div>
              <p className="draw-banner__label">Sessão</p>
              <p className="draw-banner__value">
                {SESSION_STATUS_PT[session.status]}
              </p>
            </div>
            <div>
              <p className="draw-banner__label">Última chamada</p>
              <p className="draw-banner__value draw-banner__ball">
                {lastCall ? lastCall.ball_number : '—'}
              </p>
            </div>
          </div>

          {open && roundInDraw ? (
            <form className="form-stack draw-form" onSubmit={submitCall}>
              <TextField
                label="Próxima bola (1–75)"
                type="number"
                min={1}
                max={75}
                value={ballInput}
                onChange={(ev) => setBallInput(ev.target.value)}
              />
              <div className="toolbar">
                <Button type="submit" variant="primary" loading={busy}>
                  Registrar chamada
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={calls.length === 0 || busy}
                  onClick={() => void undoLast()}
                >
                  Invalidar última
                </Button>
                <Button type="button" variant="secondary" disabled={busy} onClick={closeDraw}>
                  Encerrar sorteio
                </Button>
              </div>
            </form>
          ) : (
            <Callout tone="info" title="Sorteio encerrado">
              O histórico abaixo é somente leitura ou a rodada ainda não foi liberada.
            </Callout>
          )}

          <h2 className="section-heading">
            Histórico de chamadas ({calls.length})
          </h2>
          <ol className="call-list">
            {[...calls].reverse().map((c) => (
              <li key={`${c.sequence}-${c.ball_number}`}>
                <span className="call-list__seq">#{c.sequence}</span>
                <span className="call-list__ball">{c.ball_number}</span>
                {(c.status ?? 'active') === 'invalidated' ? (
                  <span className="call-list__seq"> invalidada</span>
                ) : null}
              </li>
            ))}
          </ol>

          {remaining && remaining.length <= 40 ? (
            <details className="remaining-details">
              <summary>Números restantes ({remaining.length})</summary>
              <p className="remaining-grid">{remaining.join(', ')}</p>
            </details>
          ) : null}
        </>
      )}
    </PageContainer>
  );
}
