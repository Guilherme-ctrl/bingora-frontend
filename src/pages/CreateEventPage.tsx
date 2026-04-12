import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PageContainer, PageHeader } from '@/components/ui/PageContainer';
import { SelectField } from '@/components/ui/SelectField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { COMMON_TIMEZONES } from '@/constants/timezones';
import * as eventsService from '@/services/eventsService';
import { ApiRequestError } from '@/services/apiError';
import { venueStartToUtcIso } from '@/utils/datetime';
import { parseReaisInputToCents } from '@/utils/money';
import { createEventSchema } from '@/validation/authAndEvents';
import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function defaultStartsLocal(): string {
  return DateTime.now()
    .setZone('America/Sao_Paulo')
    .plus({ days: 1 })
    .set({ minute: 0, second: 0, millisecond: 0 })
    .toFormat("yyyy-LL-dd'T'HH:mm");
}

export function CreateEventPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [startsAtLocal, setStartsAtLocal] = useState(defaultStartsLocal);
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [venueNotes, setVenueNotes] = useState('');
  const [cardPriceReais, setCardPriceReais] = useState('');
  const [status, setStatus] = useState<'draft' | 'scheduled'>('draft');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const statusOptions = useMemo(
    () => [
      { value: 'draft', label: 'Rascunho' },
      { value: 'scheduled', label: 'Agendado' },
    ],
    [],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = createEventSchema.safeParse({
      title,
      startsAtLocal,
      timezone,
      venue_notes: venueNotes.trim() === '' ? null : venueNotes,
      status,
      cardPriceReais,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(flat)) {
        if (v?.[0]) {
          next[k] = v[0];
        }
      }
      setFieldErrors(next);
      return;
    }

    let startsAtUtc: string;
    try {
      startsAtUtc = venueStartToUtcIso(
        parsed.data.startsAtLocal,
        parsed.data.timezone,
      );
    } catch {
      setFormError(
        'Não foi possível interpretar a data e hora. Verifique data e fuso.',
      );
      return;
    }

    const price = parseReaisInputToCents(parsed.data.cardPriceReais);
    if (!price.ok) {
      setFieldErrors({ cardPriceReais: price.message });
      return;
    }

    setLoading(true);
    try {
      await eventsService.createEvent({
        title: parsed.data.title,
        starts_at: startsAtUtc,
        timezone: parsed.data.timezone,
        venue_notes: parsed.data.venue_notes,
        status: parsed.data.status,
        default_unit_price_cents: price.cents,
        default_currency: 'BRL',
      });
      navigate('/events', { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.message);
      } else {
        setFormError(
          'Não foi possível salvar o evento. Verifique a conexão e tente de novo.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Novo evento"
        description="O título, horário e notas do local aparecem nos materiais e no console."
        actions={
          <Link to="/events">
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
        }
      />

      {formError ? (
        <Callout tone="error" title="Não foi possível salvar">
          {formError}
        </Callout>
      ) : null}

      <form className="form-stack" onSubmit={onSubmit} noValidate>
        <TextField
          name="title"
          label="Título"
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          error={fieldErrors.title}
          autoComplete="off"
        />
        <TextField
          name="startsAtLocal"
          type="datetime-local"
          label="Data e hora de início"
          value={startsAtLocal}
          onChange={(ev) => setStartsAtLocal(ev.target.value)}
          error={fieldErrors.startsAtLocal}
        />
        <SelectField
          name="timezone"
          label="Fuso horário"
          value={timezone}
          onChange={(ev) => setTimezone(ev.target.value)}
          options={COMMON_TIMEZONES}
          error={fieldErrors.timezone}
          hint="Usado para exibir horários de acordo com o local do evento."
        />
        <TextAreaField
          name="venue_notes"
          label="Local e observações"
          value={venueNotes}
          onChange={(ev) => setVenueNotes(ev.target.value)}
          error={fieldErrors.venue_notes}
          hint="Salão, endereço, portas de acesso ou outras anotações (opcional)."
          rows={3}
        />
        <TextField
          name="cardPriceReais"
          type="text"
          inputMode="decimal"
          label="Preço da cartela (R$)"
          value={cardPriceReais}
          onChange={(ev) => setCardPriceReais(ev.target.value)}
          error={fieldErrors.cardPriceReais}
          hint="Opcional. Usado para pré-preencher vendas (ex.: 5 ou 5,50)."
          autoComplete="off"
        />
        <SelectField
          name="status"
          label="Status"
          value={status}
          onChange={(ev) =>
            setStatus(ev.target.value as 'draft' | 'scheduled')
          }
          options={statusOptions}
          error={fieldErrors.status}
        />
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={loading}>
            Salvar evento
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
