import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PaymentStatusBadge } from '@/components/ui/PaymentStatusBadge';
import { PageContainer, PageHeader } from '@/components/ui/PageContainer';
import { useEventWorkspace } from '@/hooks/useEventWorkspace';
import * as participantsService from '@/services/participantsService';
import * as salesService from '@/services/salesService';
import type { Participant, SaleStatus, SaleSummary } from '@/types/api';
import { ApiRequestError } from '@/services/apiError';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const SALE_STATUS_PT: Record<SaleStatus, string> = {
  active: 'Ativa',
  voided: 'Anulada',
};

export function EventSalesPage() {
  const { event } = useEventWorkspace();
  const base = `/events/${event.id}`;
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of participants) {
      m.set(p.id, p.display_name);
    }
    return m;
  }, [participants]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, pRes] = await Promise.all([
        salesService.listSales(event.id, { page: 1, page_size: 100 }),
        participantsService.listParticipants(event.id, {
          page: 1,
          page_size: 100,
        }),
      ]);
      setSales(sRes.items);
      setParticipants(pRes.items);
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.message
          : 'Não foi possível carregar as vendas.',
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
        title="Vendas"
        description="Cada venda atribui números de cartela concretos a partir do estoque disponível."
        actions={
          <Link to={`${base}/sales/new`}>
            <Button type="button" variant="primary">
              Nova venda
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
        <div className="table-skeleton" aria-busy>
          <div className="table-skeleton__row" />
        </div>
      ) : null}

      {!loading && sales.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state__title">Nenhuma venda</h2>
          <p className="empty-state__text">
            Registre quem comprou cartelas e se já pagou.
          </p>
          <Link to={`${base}/sales/new`}>
            <Button type="button" variant="primary">
              Registrar venda
            </Button>
          </Link>
        </div>
      ) : null}

      {!loading && sales.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Participante</th>
                <th scope="col">Qtd.</th>
                <th scope="col">Pagamento</th>
                <th scope="col">Situação</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td>{nameById.get(s.participant_id) ?? s.participant_id}</td>
                  <td>{s.quantity}</td>
                  <td>
                    <PaymentStatusBadge status={s.payment_status} />
                  </td>
                  <td>{SALE_STATUS_PT[s.status]}</td>
                  <td className="data-table__action">
                    <Link to={`${base}/sales/${s.id}`} className="table-link">
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </PageContainer>
  );
}
