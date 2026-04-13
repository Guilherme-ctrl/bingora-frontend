import { AvailableCardsMultiSelectField } from '@/components/ui/AvailableCardsMultiSelectField';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PageContainer, PageHeader } from '@/components/ui/PageContainer';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { useEventWorkspace } from '@/hooks/useEventWorkspace';
import * as participantsService from '@/services/participantsService';
import * as roundsService from '@/services/roundsService';
import * as salesService from '@/services/salesService';
import type { Participant, Round } from '@/types/api';
import { ApiRequestError } from '@/services/apiError';
import { trackCriticalUiFlow } from '@/services/sentryObservability';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function EventSaleNewPage() {
  const { event } = useEventWorkspace();
  const navigate = useNavigate();
  const base = `/events/${event.id}`;
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [participantId, setParticipantId] = useState('');
  const [anonymousSale, setAnonymousSale] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid');
  const [unitPrice, setUnitPrice] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [notes, setNotes] = useState('');
  const [selectedCardSerials, setSelectedCardSerials] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    Promise.all([
      participantsService.listParticipants(event.id, { page: 1, page_size: 100 }),
      roundsService.getActiveRound(event.id),
    ])
      .then(([res, round]) => {
        if (!c) {
          setParticipants(res.items);
          setActiveRound(round);
          if (res.items.length > 0) {
            setParticipantId(res.items[0].id);
          }
        }
      })
      .catch((e) => {
        if (!c) {
          setLoadErr(
            e instanceof ApiRequestError
              ? e.message
              : 'Não foi possível carregar os participantes.',
          );
        }
      });
    return () => {
      c = true;
    };
  }, [event.id]);

  useEffect(() => {
    if (event.default_unit_price_cents != null) {
      setUnitPrice((event.default_unit_price_cents / 100).toFixed(2));
    } else {
      setUnitPrice('');
    }
    setCurrency(event.default_currency || 'BRL');
  }, [event.id, event.default_unit_price_cents, event.default_currency]);

  useEffect(() => {
    if (selectedCardSerials.length > 0) {
      setQuantity(String(selectedCardSerials.length));
    }
  }, [selectedCardSerials]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const explicitSerials = selectedCardSerials;
    const q =
      explicitSerials.length > 0
        ? explicitSerials.length
        : Number.parseInt(quantity, 10);
    if ((!participantId && !anonymousSale) || !Number.isFinite(q) || q < 1) {
      setFormError(
        'Escolha um participante (ou marque venda anônima) e uma quantidade válida.',
      );
      return;
    }
    if (activeRound?.status !== 'EM_VENDA') {
      setFormError('A rodada precisa estar em EM_VENDA para registrar vendas.');
      return;
    }
    let cents: number | null;
    if (unitPrice.trim() === '') {
      cents =
        event.default_unit_price_cents != null
          ? event.default_unit_price_cents
          : null;
    } else {
      const parsed = Math.round(
        Number.parseFloat(unitPrice.replace(',', '.')) * 100,
      );
      if (!Number.isFinite(parsed)) {
        setFormError('Preço unitário inválido.');
        return;
      }
      cents = parsed;
    }
    setSaving(true);
    try {
      await trackCriticalUiFlow(
        'sale.create',
        {
          event_id: event.id,
          round_id: activeRound?.id ?? '',
          quantity: q,
          anonymous: anonymousSale,
        },
        async () => {
          const sale = await salesService.createSale(event.id, {
            ...(anonymousSale
              ? { participant_id: null }
              : { participant_id: participantId }),
            quantity: q,
            payment_status: paymentStatus,
            unit_price_cents: cents,
            currency,
            notes: notes.trim() === '' ? null : notes,
            ...(explicitSerials.length > 0
              ? { serial_numbers: explicitSerials }
              : {}),
          });
          navigate(`${base}/sales/${sale.id}`, { replace: true });
        },
      );
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível criar a venda.',
      );
    } finally {
      setSaving(false);
    }
  }

  const pOptions = participants.map((p) => ({
    value: p.id,
    label: p.display_name,
  }));

  return (
    <PageContainer>
      <PageHeader
        title="Nova venda"
        actions={
          <Link to={`${base}/sales`}>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
        }
      />

      {loadErr ? (
        <Callout tone="error" title="Erro">
          {loadErr}
        </Callout>
      ) : null}

      {formError ? (
        <Callout tone="error" title="Não foi possível salvar">
          {formError}
        </Callout>
      ) : null}
      {activeRound?.status !== 'EM_VENDA' ? (
        <Callout tone="info" title="Vendas bloqueadas pela rodada">
          Vá na tela <strong>Rodada</strong> e avance para <strong>EM_VENDA</strong>.
        </Callout>
      ) : null}

      {participants.length === 0 && !loadErr ? (
        <Callout tone="info" title="Cadastre participantes primeiro">
          <Link to={`${base}/participants`}>Ir a participantes</Link>
        </Callout>
      ) : null}

      <form className="form-stack" onSubmit={onSubmit}>
        <label className="field-label" style={{ display: 'flex', gap: 8 }}>
          <input
            type="checkbox"
            checked={anonymousSale}
            onChange={(ev) => setAnonymousSale(ev.target.checked)}
          />
          Venda anônima (sem participante)
        </label>
        <SelectField
          label="Participante"
          name="participant_id"
          value={participantId}
          onChange={(ev) => setParticipantId(ev.target.value)}
          options={pOptions}
          disabled={pOptions.length === 0 || anonymousSale}
        />
        <TextField
          label="Quantidade (cartelas)"
          type="number"
          min={1}
          value={quantity}
          onChange={(ev) => {
            setSelectedCardSerials([]);
            setQuantity(ev.target.value);
          }}
          disabled={selectedCardSerials.length > 0}
          hint={
            selectedCardSerials.length > 0
              ? 'Definida pelas cartelas selecionadas abaixo.'
              : 'Usada quando nenhuma cartela é marcada manualmente.'
          }
        />
        <AvailableCardsMultiSelectField
          eventId={event.id}
          fieldId="new-sale-cards"
          selectedSerials={selectedCardSerials}
          onSelectedSerialsChange={setSelectedCardSerials}
          disabled={saving}
        />
        <SelectField
          label="Situação do pagamento"
          name="payment_status"
          value={paymentStatus}
          onChange={(ev) =>
            setPaymentStatus(ev.target.value as 'paid' | 'unpaid')
          }
          options={[
            { value: 'unpaid', label: 'Não pago' },
            { value: 'paid', label: 'Pago' },
          ]}
        />
        <TextField
          label="Preço unitário (opcional, em reais)"
          value={unitPrice}
          onChange={(ev) => setUnitPrice(ev.target.value)}
          hint="Apenas registro; o valor é enviado em centavos ao servidor."
        />
        <TextField
          label="Moeda (código ISO)"
          value={currency}
          onChange={(ev) => setCurrency(ev.target.value.toUpperCase())}
          maxLength={3}
        />
        <TextAreaField
          label="Observações"
          value={notes}
          onChange={(ev) => setNotes(ev.target.value)}
          rows={2}
        />
        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={
              (pOptions.length === 0 && !anonymousSale) ||
              activeRound?.status !== 'EM_VENDA'
            }
          >
            Criar venda
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
