import { AvailableCardsMultiSelectField } from '@/components/ui/AvailableCardsMultiSelectField';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PageContainer } from '@/components/ui/PageContainer';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import { useEventWorkspace } from '@/hooks/useEventWorkspace';
import * as participantsService from '@/services/participantsService';
import * as roundsService from '@/services/roundsService';
import * as salesService from '@/services/salesService';
import type { Participant, Round } from '@/types/api';
import { ApiRequestError } from '@/services/apiError';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type FlowMode = 'novo' | 'existente';

/**
 * Balcão de vendas: cadastro rápido + venda num fluxo contínuo (otimizado para fila).
 */
export function EventSellerDeskPage() {
  const { event } = useEventWorkspace();
  const base = `/events/${event.id}`;
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [activeRound, setActiveRound] = useState<Round | null>(null);

  const [mode, setMode] = useState<FlowMode>('novo');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [anonymousSale, setAnonymousSale] = useState(false);

  const [quantity, setQuantity] = useState('1');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid');
  const [unitPrice, setUnitPrice] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [selectedCardSerials, setSelectedCardSerials] = useState<number[]>([]);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const reloadParticipants = useCallback(async () => {
    try {
      const res = await participantsService.listParticipants(event.id, {
        page: 1,
        page_size: 100,
      });
      const round = await roundsService.getActiveRound(event.id);
      setParticipants(res.items);
      setActiveRound(round);
    } catch (e) {
      setLoadErr(
        e instanceof ApiRequestError
          ? e.message
          : 'Não foi possível carregar participantes.',
      );
    }
  }, [event.id]);

  useEffect(() => {
    void reloadParticipants();
  }, [reloadParticipants]);

  useEffect(() => {
    if (mode === 'existente' && participants.length > 0 && !participantId) {
      setParticipantId(participants[0].id);
    }
  }, [mode, participants, participantId]);

  useEffect(() => {
    if (selectedCardSerials.length > 0) {
      setQuantity(String(selectedCardSerials.length));
    }
  }, [selectedCardSerials]);

  useEffect(() => {
    if (event.default_unit_price_cents != null) {
      setUnitPrice((event.default_unit_price_cents / 100).toFixed(2));
    } else {
      setUnitPrice('');
    }
    setCurrency(event.default_currency || 'BRL');
  }, [event.id, event.default_unit_price_cents, event.default_currency]);

  const pOptions = useMemo(
    () =>
      participants.map((p) => ({
        value: p.id,
        label: p.display_name,
      })),
    [participants],
  );

  function resetForNextCustomer() {
    setDisplayName('');
    setPhone('');
    setParticipantId('');
    setSelectedCardSerials([]);
    setFormError(null);
    requestAnimationFrame(() =>
      document.getElementById('seller-desk-name')?.focus(),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const explicitSerials = selectedCardSerials;
    const q =
      explicitSerials.length > 0
        ? explicitSerials.length
        : Number.parseInt(quantity, 10);
    if (!Number.isFinite(q) || q < 1) {
      setFormError('Informe uma quantidade válida (mínimo 1) ou escolha cartelas.');
      return;
    }
    if (activeRound?.status !== 'EM_VENDA') {
      setFormError('A rodada precisa estar em EM_VENDA para registrar vendas.');
      return;
    }

    let pid: string | null = participantId;
    if (!anonymousSale && mode === 'novo') {
      const dn = displayName.trim();
      if (dn.length < 2) {
        setFormError('Informe o nome do comprador (pelo menos 2 caracteres).');
        return;
      }
    } else if (!anonymousSale && !participantId) {
      setFormError('Escolha um participante da lista.');
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
      if (!anonymousSale && mode === 'novo') {
        const created = await participantsService.createParticipant(event.id, {
          display_name: displayName.trim(),
          phone: phone.trim() === '' ? null : phone.trim(),
          email: null,
          notes: null,
        });
        pid = created.id;
        setParticipants((prev) => [created, ...prev]);
      }

      await salesService.createSale(event.id, {
        participant_id: anonymousSale ? null : pid,
        quantity: q,
        payment_status: paymentStatus,
        unit_price_cents: cents,
        currency,
        notes: null,
        ...(explicitSerials.length > 0
          ? { serial_numbers: explicitSerials }
          : {}),
      });

      setSuccessMsg('Venda registrada. Pronto para o próximo.');
      resetForNextCustomer();
      setAnonymousSale(false);
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível concluir a venda.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer className="seller-desk-page">
      <header className="seller-desk__hero">
        <p className="seller-desk__event-title">{event.title}</p>
        <h1 className="seller-desk__h1">Balcão de vendas</h1>
        <p className="seller-desk__sub">
          Um fluxo contínuo: nome → quantidade → pagamento → registrar. O
          formulário limpa após cada venda.
        </p>
        <div className="seller-desk__quick-links">
          <Link to={`${base}/sales`} className="seller-desk__link">
            Lista de vendas
          </Link>
          <Link to={`${base}/participants`} className="seller-desk__link">
            Participantes
          </Link>
        </div>
      </header>

      {loadErr ? (
        <Callout tone="error" title="Erro ao carregar">
          {loadErr}
        </Callout>
      ) : null}
      {activeRound?.status !== 'EM_VENDA' ? (
        <Callout tone="info" title="Vendas bloqueadas pela rodada">
          Vá em <strong>Rodada</strong> e coloque em <strong>EM_VENDA</strong>.
        </Callout>
      ) : null}

      {successMsg ? (
        <Callout tone="info" title="Ok">
          {successMsg}
        </Callout>
      ) : null}

      {formError ? (
        <Callout tone="error" title="Ajuste e tente de novo">
          {formError}
        </Callout>
      ) : null}

      <form className="seller-desk__form" onSubmit={onSubmit}>
        <label className="field-label" style={{ display: 'flex', gap: 8 }}>
          <input
            type="checkbox"
            checked={anonymousSale}
            onChange={(ev) => setAnonymousSale(ev.target.checked)}
          />
          Venda anônima (sem participante)
        </label>
        <div className="seller-desk__mode-toggle" role="group" aria-label="Modo">
          <button
            type="button"
            className={`seller-desk__mode-btn ${mode === 'novo' ? 'is-active' : ''}`}
            onClick={() => {
              setMode('novo');
              setFormError(null);
            }}
          >
            Novo comprador
          </button>
          <button
            type="button"
            className={`seller-desk__mode-btn ${mode === 'existente' ? 'is-active' : ''}`}
            onClick={() => {
              setMode('existente');
              setFormError(null);
            }}
          >
            Já cadastrado
          </button>
        </div>

        {!anonymousSale && mode === 'novo' ? (
          <div className="seller-desk__grid-2">
            <TextField
              id="seller-desk-name"
              label="Nome"
              name="display_name"
              value={displayName}
              onChange={(ev) => setDisplayName(ev.target.value)}
              autoComplete="name"
              hint="Nome como no bilhete ou comprovante."
            />
            <TextField
              label="Telefone (opcional)"
              name="phone"
              value={phone}
              onChange={(ev) => setPhone(ev.target.value)}
              autoComplete="tel"
            />
          </div>
        ) : !anonymousSale ? (
          <SelectField
            label="Participante"
            name="participant_id"
            value={participantId}
            onChange={(ev) => setParticipantId(ev.target.value)}
            options={pOptions}
            disabled={pOptions.length === 0}
            hint={
              pOptions.length === 0
                ? 'Nenhum participante ainda — use “Novo comprador”.'
                : undefined
            }
          />
        ) : null}

        <div className="seller-desk__grid-3">
          <TextField
            label="Quantidade"
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
                : 'Use quando não escolher números de cartela manualmente.'
            }
          />
          <SelectField
            label="Pagamento"
            name="payment_status"
            value={paymentStatus}
            onChange={(ev) =>
              setPaymentStatus(ev.target.value as 'paid' | 'unpaid')
            }
            options={[
              { value: 'unpaid', label: 'A receber' },
              { value: 'paid', label: 'Pago' },
            ]}
          />
          <TextField
            label="Preço unit. (opcional)"
            value={unitPrice}
            onChange={(ev) => setUnitPrice(ev.target.value)}
            hint="Em reais; vazio usa o padrão do evento."
          />
        </div>

        <AvailableCardsMultiSelectField
          eventId={event.id}
          fieldId="seller-desk-cards"
          selectedSerials={selectedCardSerials}
          onSelectedSerialsChange={setSelectedCardSerials}
          disabled={saving}
        />

        <TextField
          label="Moeda"
          value={currency}
          onChange={(ev) => setCurrency(ev.target.value.toUpperCase())}
          maxLength={3}
        />

        <div className="seller-desk__submit-wrap">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            className="seller-desk__submit"
            disabled={
              (mode === 'existente' && pOptions.length === 0) ||
              activeRound?.status !== 'EM_VENDA'
            }
          >
            Registrar venda
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
