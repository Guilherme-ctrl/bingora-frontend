import * as salesService from '@/services/salesService';
import { ApiRequestError } from '@/services/apiError';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  eventId: string;
  /** Identificador estável para acessibilidade (prefixo de ids). */
  fieldId?: string;
  selectedSerials: number[];
  onSelectedSerialsChange: (serials: number[]) => void;
  disabled?: boolean;
};

/**
 * Multiseleção das cartelas ainda disponíveis (checkboxes + filtro).
 * Vazio = o servidor escolhe cartelas conforme a quantidade.
 */
export function AvailableCardsMultiSelectField({
  eventId,
  fieldId = 'sale-available-cards',
  selectedSerials,
  onSelectedSerialsChange,
  disabled,
}: Props) {
  const [allSerials, setAllSerials] = useState<number[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    salesService
      .listAvailableSaleSerials(eventId)
      .then((res) => {
        if (!cancelled) {
          setAllSerials(res.serial_numbers);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setErr(
            e instanceof ApiRequestError
              ? e.message
              : 'Não foi possível carregar as cartelas disponíveis.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return allSerials;
    }
    return allSerials.filter((n) => String(n).includes(q));
  }, [allSerials, filter]);

  const selectedSet = useMemo(
    () => new Set(selectedSerials),
    [selectedSerials],
  );

  function toggle(serial: number) {
    const next = new Set(selectedSerials);
    if (next.has(serial)) {
      next.delete(serial);
    } else {
      next.add(serial);
    }
    onSelectedSerialsChange([...next].sort((a, b) => a - b));
  }

  function selectAllVisible() {
    const next = new Set(selectedSerials);
    for (const n of filtered) {
      next.add(n);
    }
    onSelectedSerialsChange([...next].sort((a, b) => a - b));
  }

  function clearSelection() {
    onSelectedSerialsChange([]);
  }

  return (
    <div className="field available-cards-ms">
      <span className="field__label" id={`${fieldId}-label`}>
        Cartelas (opcional)
      </span>
      <p id={`${fieldId}-hint`} className="field__hint">
        Marque os números a entregar ou deixe em branco para o sistema escolher
        cartelas livres conforme a quantidade.
      </p>

      {loading ? (
        <p className="field__hint" aria-live="polite">
          Carregando cartelas disponíveis…
        </p>
      ) : null}

      {err ? (
        <p className="field__error" role="alert">
          {err}
        </p>
      ) : null}

      {!loading && !err ? (
        <>
          <input
            id={`${fieldId}-filter`}
            className="field__input"
            type="search"
            placeholder="Filtrar por número…"
            value={filter}
            onChange={(ev) => setFilter(ev.target.value)}
            disabled={disabled}
            aria-labelledby={`${fieldId}-label`}
            autoComplete="off"
          />
          <div className="available-cards-ms__toolbar">
            <button
              type="button"
              className="available-cards-ms__btn"
              onClick={selectAllVisible}
              disabled={disabled || filtered.length === 0}
            >
              Marcar visíveis
            </button>
            <button
              type="button"
              className="available-cards-ms__btn"
              onClick={clearSelection}
              disabled={disabled || selectedSerials.length === 0}
            >
              Limpar seleção
            </button>
            <span className="available-cards-ms__count" aria-live="polite">
              {selectedSerials.length} selecionada(s)
              {allSerials.length > 0 ? ` · ${allSerials.length} disponível(is)` : ''}
            </span>
          </div>
          <div
            className="available-cards-ms__list"
            role="group"
            aria-labelledby={`${fieldId}-label`}
            aria-describedby={`${fieldId}-hint`}
          >
            {filtered.length === 0 && allSerials.length > 0 ? (
              <p className="field__hint">Nenhum número corresponde ao filtro.</p>
            ) : null}
            {allSerials.length === 0 ? (
              <p className="field__hint">Nenhuma cartela disponível no estoque.</p>
            ) : null}
            {filtered.map((serial) => (
              <label key={serial} className="available-cards-ms__row">
                <input
                  type="checkbox"
                  checked={selectedSet.has(serial)}
                  onChange={() => toggle(serial)}
                  disabled={disabled}
                />
                <span className="available-cards-ms__num">#{serial}</span>
              </label>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
