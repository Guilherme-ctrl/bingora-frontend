import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PageContainer, PageHeader } from '@/components/ui/PageContainer';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import { useEventWorkspace } from '@/hooks/useEventWorkspace';
import { ApiRequestError } from '@/services/apiError';
import * as roundsService from '@/services/roundsService';
import type { Round, RoundType, SellerReconciliationStatus } from '@/types/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const ROUND_STATUS_LABEL: Record<Round['status'], string> = {
  CRIADA: 'Criada',
  EM_VENDA: 'Em venda',
  AGUARDANDO_CONFERENCIA: 'Aguardando conferência',
  EM_SORTEIO: 'Em sorteio',
  FINALIZADA: 'Finalizada',
};

const ROUND_TYPE_OPTIONS: Array<{ value: RoundType; label: string }> = [
  { value: 'binguinho', label: 'Binguinho' },
  { value: 'roda_da_fortuna', label: 'Roda da Fortuna' },
  { value: 'bingao', label: 'Bingão' },
];

const ROUND_FLOW: Array<Round['status']> = [
  'CRIADA',
  'EM_VENDA',
  'AGUARDANDO_CONFERENCIA',
  'EM_SORTEIO',
  'FINALIZADA',
];

export function EventRoundPage() {
  const { event } = useEventWorkspace();
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconciliationError, setReconciliationError] = useState<string | null>(null);
  const [code, setCode] = useState('R1');
  const [type, setType] = useState<RoundType>('binguinho');
  const [reconciliation, setReconciliation] = useState<
    Array<{
      seller_organizer_id: string;
      seller_email: string;
      status: SellerReconciliationStatus | null;
      justification: string | null;
      updated_at: string | null;
    }>
  >([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReconciliationError(null);
    try {
      const active = await roundsService.getActiveRound(event.id);
      setRound(active);
      if (active?.status === 'AGUARDANDO_CONFERENCIA') {
        try {
          const rec = await roundsService.listSellerReconciliation(active.id);
          setReconciliation(rec.items);
        } catch (e) {
          setReconciliation([]);
          if (e instanceof ApiRequestError) {
            setReconciliationError(e.message);
          } else if (e instanceof Error) {
            setReconciliationError(e.message);
          } else {
            setReconciliationError('Não foi possível carregar a conferência dos vendedores.');
          }
        }
      } else {
        setReconciliation([]);
      }
    } catch (e) {
      if (e instanceof ApiRequestError) {
        setError(e.message);
      } else if (e instanceof Error) {
        setError(e.message || 'Não foi possível carregar a rodada.');
      } else {
        setError('Não foi possível carregar a rodada.');
      }
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const canCreate = !round;
  const canOpenSales = round?.status === 'CRIADA';
  const canCloseSales = round?.status === 'EM_VENDA';
  const canStartDraw = round?.status === 'AGUARDANDO_CONFERENCIA';
  const canFinish = round?.status === 'EM_SORTEIO';

  const pendingReconciliation = useMemo(
    () => reconciliation.filter((r) => r.status !== 'CONFERIDO'),
    [reconciliation],
  );
  const flowIndex = round ? ROUND_FLOW.indexOf(round.status) : -1;

  async function handleCreateRound() {
    if (code.trim().length < 1) {
      setError('Informe um código de rodada.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await roundsService.createRound(event.id, { code: code.trim(), type });
      await load();
    } catch (e) {
      if (e instanceof ApiRequestError) {
        if (
          e.code === 'ROUND_ACTIVE_ALREADY_EXISTS' ||
          e.code === 'ROUND_CODE_CONFLICT' ||
          e.code === 'DATABASE_ERROR' ||
          e.code === 'UNIQUE_VIOLATION'
        ) {
          setError(
            'Já existe uma rodada ativa para este evento. Finalize a rodada atual antes de criar outra.',
          );
        } else {
          setError(e.message);
        }
      } else {
        setError('Falha ao criar rodada.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function transition(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Falha na transição.');
    } finally {
      setBusy(false);
    }
  }

  async function reconcile(
    sellerOrganizerId: string,
    status: SellerReconciliationStatus,
  ) {
    if (!round) return;
    let justification: string | null = null;
    if (status === 'DIVERGENTE') {
      const input = window.prompt('Justificativa da divergência:');
      if (!input || input.trim().length < 3) {
        return;
      }
      justification = input.trim();
    }
    await transition(() =>
      roundsService.reconcileSeller(
        round.id,
        sellerOrganizerId,
        status,
        justification,
      ),
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Rodada"
        description="Controle operacional do ciclo: criar, abrir vendas, conferir vendedores, iniciar sorteio e finalizar."
      />

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

      {!loading && canCreate ? (
        <div className="form-stack">
          <TextField
            label="Código da rodada"
            value={code}
            onChange={(ev) => setCode(ev.target.value)}
          />
          <SelectField
            label="Tipo"
            value={type}
            onChange={(ev) => setType(ev.target.value as RoundType)}
            options={ROUND_TYPE_OPTIONS}
          />
          <div className="form-actions">
            <Button type="button" variant="primary" loading={busy} onClick={handleCreateRound}>
              Criar rodada
            </Button>
          </div>
        </div>
      ) : null}

      {!loading && round ? (
        <>
          <div className="summary-panel">
            <h2 className="summary-panel__title">Etapas da rodada</h2>
            <p className="summary-panel__text">
              {ROUND_FLOW.map((status, idx) => {
                const label = ROUND_STATUS_LABEL[status];
                if (idx < flowIndex) return `✓ ${label}`;
                if (idx === flowIndex) return `→ ${label}`;
                return `○ ${label}`;
              }).join('  ·  ')}
            </p>
          </div>

          <div className="summary-panel">
            <h2 className="summary-panel__title">Rodada ativa</h2>
            <p className="summary-panel__text">
              <strong>Código:</strong> {round.code} · <strong>Tipo:</strong> {round.type}
            </p>
            <p className="summary-panel__text">
              <strong>Status:</strong> {ROUND_STATUS_LABEL[round.status]}
            </p>
          </div>

          {round.status === 'CRIADA' ? (
            <Callout tone="info" title="Próximo passo recomendado">
              Abra vendas para liberar o balcão e a criação de vendas.
            </Callout>
          ) : null}
          {round.status === 'EM_VENDA' ? (
            <Callout tone="info" title="Próximo passo recomendado">
              Registre vendas em <Link to={`/events/${event.id}/sales`}>Vendas</Link> e,
              quando encerrar, clique em <strong>Fechar vendas</strong>.
            </Callout>
          ) : null}
          {round.status === 'AGUARDANDO_CONFERENCIA' ? (
            <Callout tone="info" title="Próximo passo recomendado">
              Finalize a conferência de todos os vendedores e depois inicie o sorteio.
            </Callout>
          ) : null}
          {round.status === 'EM_SORTEIO' ? (
            <Callout tone="info" title="Próximo passo recomendado">
              Faça a roletagem em <Link to={`/events/${event.id}/draw`}>Sorteio</Link>. Ao terminar, finalize a rodada.
            </Callout>
          ) : null}
          {round.status === 'FINALIZADA' ? (
            <Callout tone="info" title="Rodada concluída">
              Vá para <Link to={`/events/${event.id}/winners`}>Ganhadores</Link> para registrar/validar resultados finais.
            </Callout>
          ) : null}

          <div className="toolbar">
            <Button
              type="button"
              variant="secondary"
              disabled={!canOpenSales || busy}
              onClick={() => void transition(() => roundsService.openSales(round.id))}
            >
              Abrir vendas
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!canCloseSales || busy}
              onClick={() => void transition(() => roundsService.closeSales(round.id))}
            >
              Fechar vendas
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!canStartDraw || busy}
              onClick={() => void transition(() => roundsService.startDraw(round.id))}
            >
              Iniciar sorteio
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!canFinish || busy}
              onClick={() => void transition(() => roundsService.finishRound(round.id))}
            >
              Finalizar rodada
            </Button>
          </div>

          {round.status === 'AGUARDANDO_CONFERENCIA' ? (
            <>
              <h2 className="section-heading">Conferência por vendedor</h2>
              {reconciliationError ? (
                <Callout tone="error" title="Erro ao carregar conferência">
                  {reconciliationError}
                </Callout>
              ) : null}
              {pendingReconciliation.length > 0 ? (
                <Callout tone="info" title="Pendências de conferência">
                  Ainda há vendedores pendentes de marcação como CONFERIDO.
                </Callout>
              ) : null}
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vendedor</th>
                      <th>Status</th>
                      <th>Justificativa</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {reconciliation.map((row) => (
                      <tr key={row.seller_organizer_id}>
                        <td>{row.seller_email}</td>
                        <td>{row.status ?? 'PENDENTE'}</td>
                        <td>{row.justification ?? '—'}</td>
                        <td className="data-table__action">
                          <div className="toolbar">
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={busy}
                              onClick={() =>
                                void reconcile(row.seller_organizer_id, 'CONFERIDO')
                              }
                            >
                              Conferido
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={busy}
                              onClick={() =>
                                void reconcile(row.seller_organizer_id, 'DIVERGENTE')
                              }
                            >
                              Divergente
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </PageContainer>
  );
}
