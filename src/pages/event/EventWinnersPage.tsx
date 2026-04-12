import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PageContainer, PageHeader } from '@/components/ui/PageContainer';
import { SelectField } from '@/components/ui/SelectField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { useEventWorkspace } from '@/hooks/useEventWorkspace';
import * as cardsService from '@/services/cardsService';
import * as participantsService from '@/services/participantsService';
import * as prizesService from '@/services/prizesService';
import * as winnersService from '@/services/winnersService';
import type { BingoCard, Participant, Prize, Winner } from '@/types/api';
import { UI_LOCALE } from '@/constants/locale';
import { ApiRequestError } from '@/services/apiError';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function EventWinnersPage() {
  const { event } = useEventWorkspace();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [cards, setCards] = useState<BingoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [prizeId, setPrizeId] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [cardId, setCardId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const prizeName = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of prizes) {
      m.set(p.id, p.name);
    }
    return m;
  }, [prizes]);

  const partName = useMemo(() => {
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
      const [w, pr, pa, ca] = await Promise.all([
        winnersService.listWinners(event.id),
        prizesService.listPrizes(event.id),
        participantsService.listParticipants(event.id, {
          page: 1,
          page_size: 100,
        }),
        cardsService.listCards(event.id, {
          status: 'assigned',
          page: 1,
          page_size: 100,
        }),
      ]);
      setWinners(w.items);
      setPrizes(pr.items);
      setParticipants(pa.items);
      setCards(ca.items);
      setPrizeId((prev) => prev || (pr.items[0]?.id ?? ''));
      setParticipantId((prev) => prev || (pa.items[0]?.id ?? ''));
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.message
          : 'Não foi possível carregar os dados.',
      );
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function recordWinner(e: React.FormEvent) {
    e.preventDefault();
    if (!prizeId || !participantId) {
      return;
    }
    setSaving(true);
    try {
      await winnersService.createWinner(event.id, {
        prize_id: prizeId,
        participant_id: participantId,
        bingo_card_id: cardId === '' ? null : cardId,
        notes: notes.trim() === '' ? null : notes,
      });
      setNotes('');
      await load();
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível salvar o ganhador.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function revoke(w: Winner) {
    if (!window.confirm('Revogar este registro de ganhador?')) {
      return;
    }
    try {
      await winnersService.revokeWinner(w.id);
      await load();
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível revogar.',
      );
    }
  }

  const active = winners.filter((w) => !w.revoked_at);

  const cardOptions = [
    { value: '', label: 'Nenhuma cartela específica' },
    ...cards.map((c) => ({
      value: c.id,
      label: `Nº ${c.serial_number} (${c.id.slice(0, 8)}…)`,
    })),
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Ganhadores"
        description="Um ganhador ativo por prêmio. Revogue para corrigir e registre de novo."
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

      <form className="form-stack" onSubmit={recordWinner}>
        <SelectField
          label="Prêmio"
          value={prizeId}
          onChange={(ev) => setPrizeId(ev.target.value)}
          options={prizes.map((p) => ({ value: p.id, label: p.name }))}
          disabled={prizes.length === 0}
        />
        <SelectField
          label="Participante"
          value={participantId}
          onChange={(ev) => setParticipantId(ev.target.value)}
          options={participants.map((p) => ({
            value: p.id,
            label: p.display_name,
          }))}
          disabled={participants.length === 0}
        />
        <SelectField
          label="Cartela vencedora (opcional)"
          value={cardId}
          onChange={(ev) => setCardId(ev.target.value)}
          options={cardOptions}
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
            disabled={!prizeId || !participantId}
          >
            Salvar ganhador
          </Button>
        </div>
      </form>

      <h2 className="section-heading">Registrados ({active.length})</h2>
      {!loading && active.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__text">Nenhum ganhador registrado ainda.</p>
        </div>
      ) : null}

      {!loading && active.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Prêmio</th>
                <th scope="col">Participante</th>
                <th scope="col">Cartela</th>
                <th scope="col">Horário</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {active.map((w) => (
                <tr key={w.id}>
                  <td>{prizeName.get(w.prize_id) ?? w.prize_id}</td>
                  <td>{partName.get(w.participant_id) ?? w.participant_id}</td>
                  <td className="mono-preview">
                    {w.bingo_card_id ?? '—'}
                  </td>
                  <td>
                    {new Date(w.recorded_at).toLocaleString(UI_LOCALE)}
                  </td>
                  <td className="data-table__action">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void revoke(w)}
                    >
                      Revogar
                    </Button>
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
