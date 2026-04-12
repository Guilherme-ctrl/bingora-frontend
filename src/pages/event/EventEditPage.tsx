import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PageContainer, PageHeader } from '@/components/ui/PageContainer';
import { SelectField } from '@/components/ui/SelectField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { COMMON_TIMEZONES } from '@/constants/timezones';
import { useEventWorkspace } from '@/hooks/useEventWorkspace';
import * as eventsService from '@/services/eventsService';
import { resolveUploadUrl } from '@/utils/resolveUploadUrl';
import { ApiRequestError } from '@/services/apiError';
import { venueStartToUtcIso } from '@/utils/datetime';
import { parseReaisInputToCents } from '@/utils/money';
import { editEventSchema } from '@/validation/authAndEvents';
import { DateTime } from 'luxon';
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const STATUS_PT: Record<
  'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
  string
> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

function toDatetimeLocalValue(isoUtc: string, zone: string): string {
  const dt = DateTime.fromISO(isoUtc, { zone: 'utc' }).setZone(zone);
  if (!dt.isValid) {
    return '';
  }
  return dt.toFormat("yyyy-LL-dd'T'HH:mm");
}

export function EventEditPage() {
  const { event, reloadEvent } = useEventWorkspace();
  const [title, setTitle] = useState(event.title);
  const [startsAtLocal, setStartsAtLocal] = useState(() =>
    toDatetimeLocalValue(event.starts_at, event.timezone),
  );
  const [timezone, setTimezone] = useState(event.timezone);
  const [venueNotes, setVenueNotes] = useState(event.venue_notes ?? '');
  const [cardPriceReais, setCardPriceReais] = useState(() =>
    event.default_unit_price_cents != null
      ? (event.default_unit_price_cents / 100).toFixed(2)
      : '',
  );
  const [status, setStatus] = useState<
    'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  >(event.status);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoErr, setLogoErr] = useState<string | null>(null);
  const logoFileRef = useRef<HTMLInputElement | null>(null);

  const statusOptions = useMemo(
    () =>
      (
        [
          'draft',
          'scheduled',
          'in_progress',
          'completed',
          'cancelled',
        ] as const
      ).map((s) => ({ value: s, label: STATUS_PT[s] })),
    [],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = editEventSchema.safeParse({
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
      setFormError('Não foi possível interpretar a data e hora de início.');
      return;
    }

    const price = parseReaisInputToCents(parsed.data.cardPriceReais);
    if (!price.ok) {
      setFieldErrors({ cardPriceReais: price.message });
      return;
    }

    setLoading(true);
    try {
      await eventsService.updateEvent(event.id, {
        title: parsed.data.title,
        starts_at: startsAtUtc,
        timezone: parsed.data.timezone,
        venue_notes: parsed.data.venue_notes,
        status: parsed.data.status,
        default_unit_price_cents: price.cents,
        default_currency: 'BRL',
      });
      await reloadEvent();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.message);
      } else {
        setFormError('Não foi possível salvar as alterações.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Editar evento"
        description="As alterações seguem as mesmas regras da API (transições de status, eventos bloqueados)."
        actions={
          <Link to={`/events/${event.id}`}>
            <Button type="button" variant="secondary">
              Voltar
            </Button>
          </Link>
        }
      />

      {formError ? (
        <Callout tone="error" title="Não foi possível salvar">
          {formError}
        </Callout>
      ) : null}

      <section className="event-logo-panel" aria-labelledby="event-logo-heading">
        <h2 id="event-logo-heading" className="event-logo-panel__title">
          Logo do evento
        </h2>
        <p className="event-logo-panel__desc">
          Aparece no topo ao abrir o evento. PNG, JPEG, WebP ou GIF, até 2 MB.
        </p>
        {logoErr ? (
          <Callout tone="error" title="Logo">
            {logoErr}
          </Callout>
        ) : null}
        <div className="event-logo-panel__row">
          {event.logo_url ? (
            <img
              className="event-logo-panel__preview"
              src={resolveUploadUrl(event.logo_url) ?? undefined}
              alt="Logo atual"
              width={120}
              height={120}
            />
          ) : (
            <div className="event-logo-panel__placeholder">Sem logo</div>
          )}
          <div className="event-logo-panel__actions">
            <input
              ref={logoFileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              tabIndex={-1}
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                ev.target.value = '';
                if (!f) {
                  return;
                }
                setLogoErr(null);
                setLogoBusy(true);
                eventsService
                  .uploadEventLogo(event.id, f)
                  .then(() => reloadEvent())
                  .catch((err: unknown) => {
                    setLogoErr(
                      err instanceof ApiRequestError
                        ? err.message
                        : 'Falha ao enviar a logo.',
                    );
                  })
                  .finally(() => setLogoBusy(false));
              }}
            />
            <Button
              type="button"
              variant="secondary"
              loading={logoBusy}
              disabled={logoBusy}
              onClick={() => logoFileRef.current?.click()}
            >
              Escolher imagem
            </Button>
            {event.logo_url ? (
              <Button
                type="button"
                variant="ghost"
                loading={logoBusy}
                disabled={logoBusy}
                onClick={() => {
                  setLogoErr(null);
                  setLogoBusy(true);
                  eventsService
                    .deleteEventLogo(event.id)
                    .then(() => reloadEvent())
                    .catch((err: unknown) => {
                      setLogoErr(
                        err instanceof ApiRequestError
                          ? err.message
                          : 'Falha ao remover a logo.',
                      );
                    })
                    .finally(() => setLogoBusy(false));
                }}
              >
                Remover logo
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <form className="form-stack" onSubmit={onSubmit} noValidate>
        <TextField
          name="title"
          label="Título"
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          error={fieldErrors.title}
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
        />
        <TextAreaField
          name="venue_notes"
          label="Local e observações"
          value={venueNotes}
          onChange={(ev) => setVenueNotes(ev.target.value)}
          error={fieldErrors.venue_notes}
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
          hint="Opcional. Pré-preenche o valor nas novas vendas."
          autoComplete="off"
        />
        <SelectField
          name="status"
          label="Status"
          value={status}
          onChange={(ev) => setStatus(ev.target.value as typeof status)}
          options={statusOptions}
        />
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={loading}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
