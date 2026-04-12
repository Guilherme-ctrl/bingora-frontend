import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PageContainer, PageHeader } from '@/components/ui/PageContainer';
import { useEventWorkspace } from '@/hooks/useEventWorkspace';
import * as financeService from '@/services/financeService';
import { ApiRequestError } from '@/services/apiError';
import type { EventFinancialSummary } from '@/types/api';
import { formatMoneyFromCents } from '@/utils/money';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export function EventFinancePage() {
  const { event } = useEventWorkspace();
  const base = `/events/${event.id}`;
  const [data, setData] = useState<EventFinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await financeService.getEventFinanceSummary(event.id);
      setData(s);
    } catch (e) {
      setData(null);
      setError(
        e instanceof ApiRequestError
          ? e.message
          : 'Não foi possível carregar o resumo financeiro.',
      );
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageContainer>
      <PageHeader
        title="Financeiro"
        description="Valores com base nas vendas ativas e preços registrados por venda. Vendas anuladas não entram no total."
        actions={
          <Link to={`${base}/sales`}>
            <Button type="button" variant="secondary">
              Ver vendas
            </Button>
          </Link>
        }
      />

      {error ? (
        <Callout tone="error" title="Erro">
          {error}
        </Callout>
      ) : null}

      {loading ? (
        <div className="app-loading">
          <div className="app-loading__spinner" aria-hidden />
          <p className="app-loading__text">Carregando…</p>
        </div>
      ) : null}

      {!loading && data ? (
        <>
          {data.vendas_sem_preco > 0 ? (
            <Callout tone="info" title="Preço incompleto">
              Existem {data.vendas_sem_preco} venda(s) ativa(s) sem preço unitário
              registrado ({data.cartelas_em_vendas_sem_preco} cartelas). Essas
              linhas não entram nos totais em dinheiro até você editar a venda ou
              usar preço nas novas vendas.
            </Callout>
          ) : null}

          <div className="finance-stats">
            <div className="finance-stat">
              <p className="finance-stat__label">Cartelas vendidas (ativas)</p>
              <p className="finance-stat__value">{data.cartelas_vendidas}</p>
            </div>
            <div className="finance-stat">
              <p className="finance-stat__label">Vendas ativas</p>
              <p className="finance-stat__value">{data.vendas_ativas}</p>
            </div>
            <div className="finance-stat">
              <p className="finance-stat__label">Vendas anuladas</p>
              <p className="finance-stat__value">{data.vendas_anuladas}</p>
            </div>
          </div>

          <h2 className="section-heading">Arrecadação por moeda</h2>
          {data.by_currency.length === 0 ? (
            <p className="muted-cell">
              Nenhum valor monetário registrado nas vendas ativas (preço unitário
              vazio em todas ou ainda não há vendas).
            </p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Moeda</th>
                    <th scope="col">Pago</th>
                    <th scope="col">A receber</th>
                    <th scope="col">Total (com preço)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_currency.map((row) => {
                    const total = row.paid_cents + row.unpaid_cents;
                    return (
                      <tr key={row.currency}>
                        <td>{row.currency}</td>
                        <td>
                          {formatMoneyFromCents(row.paid_cents, row.currency)}
                        </td>
                        <td>
                          {formatMoneyFromCents(row.unpaid_cents, row.currency)}
                        </td>
                        <td>
                          <strong>
                            {formatMoneyFromCents(total, row.currency)}
                          </strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="finance-footnote">
            O valor de cada venda é calculado como{' '}
            <strong>preço unitário × quantidade de cartelas</strong>, conforme
            lançado em Vendas.
          </p>
        </>
      ) : null}
    </PageContainer>
  );
}
