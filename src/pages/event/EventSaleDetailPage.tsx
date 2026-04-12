import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PaymentStatusBadge } from '@/components/ui/PaymentStatusBadge';
import { PageContainer, PageHeader } from '@/components/ui/PageContainer';
import { SelectField } from '@/components/ui/SelectField';
import { useEventWorkspace } from '@/hooks/useEventWorkspace';
import * as participantsService from '@/services/participantsService';
import * as salesService from '@/services/salesService';
import type { Participant, Sale, SaleStatus } from '@/types/api';
import { ApiRequestError } from '@/services/apiError';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const SALE_STATUS_PT: Record<SaleStatus, string> = {
  active: 'Ativa',
  voided: 'Anulada',
};

export function EventSaleDetailPage() {
  const { saleId } = useParams<{ saleId: string }>();
  const { event } = useEventWorkspace();
  const base = `/events/${event.id}`;
  const [sale, setSale] = useState<Sale | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<'paid' | 'unpaid'>('unpaid');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!saleId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const s = await salesService.getSale(saleId);
      setSale(s);
      setPayment(s.payment_status);
      const pRes = await participantsService.listParticipants(event.id, {
        page: 1,
        page_size: 100,
      });
      setParticipant(
        pRes.items.find((p) => p.id === s.participant_id) ?? null,
      );
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.message
          : 'Não foi possível carregar a venda.',
      );
    } finally {
      setLoading(false);
    }
  }, [saleId, event.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function savePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!saleId) {
      return;
    }
    setSaving(true);
    try {
      const s = await salesService.updateSale(saleId, {
        payment_status: payment,
      });
      setSale(s);
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível atualizar.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function voidSale() {
    if (!saleId || !sale) {
      return;
    }
    if (
      !window.confirm(
        'Anular esta venda e devolver as cartelas ao estoque disponível?',
      )
    ) {
      return;
    }
    try {
      const s = await salesService.voidSale(saleId);
      setSale(s);
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível anular a venda.',
      );
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="app-loading">
          <div className="app-loading__spinner" aria-hidden />
          <p className="app-loading__text">Carregando venda…</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !sale) {
    return (
      <PageContainer>
        <Callout tone="error" title="Venda">
          {error ?? 'Não encontrada.'}
        </Callout>
        <Link to={`${base}/sales`}>Voltar às vendas</Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Venda · ${participant?.display_name ?? sale.participant_id}`}
        description={`Quantidade ${sale.quantity} · ${SALE_STATUS_PT[sale.status]}`}
        actions={
          <Link to={`${base}/sales`}>
            <Button type="button" variant="secondary">
              Todas as vendas
            </Button>
          </Link>
        }
      />

      <div className="summary-panel">
        <p>
          <strong>Pagamento:</strong>{' '}
          <PaymentStatusBadge status={sale.payment_status} />
        </p>
        {sale.unit_price_cents != null ? (
          <p>
            <strong>Preço:</strong>{' '}
            {(sale.unit_price_cents / 100).toFixed(2)} {sale.currency}
          </p>
        ) : null}
        {sale.notes ? (
          <p>
            <strong>Observações:</strong> {sale.notes}
          </p>
        ) : null}
      </div>

      {sale.status === 'active' ? (
        <form className="form-stack" onSubmit={savePayment}>
          <SelectField
            label="Atualizar situação do pagamento"
            value={payment}
            onChange={(ev) =>
              setPayment(ev.target.value as 'paid' | 'unpaid')
            }
            options={[
              { value: 'unpaid', label: 'Não pago' },
              { value: 'paid', label: 'Pago' },
            ]}
          />
          <div className="form-actions">
            <Button type="submit" variant="primary" loading={saving}>
              Salvar pagamento
            </Button>
            <Button type="button" variant="secondary" onClick={() => void voidSale()}>
              Anular venda
            </Button>
          </div>
        </form>
      ) : (
        <Callout tone="info" title="Venda anulada">
          Esta venda foi anulada; as cartelas voltaram para disponível.
        </Callout>
      )}

      <h2 className="section-heading">Cartelas atribuídas</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Número</th>
              <th scope="col">ID da cartela</th>
            </tr>
          </thead>
          <tbody>
            {sale.cards.map((c) => (
              <tr key={c.bingo_card_id}>
                <td>{c.serial_number}</td>
                <td className="mono-preview">{c.bingo_card_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
