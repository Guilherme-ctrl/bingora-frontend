import { UI_LOCALE } from '@/constants/locale';

/** Formata centavos para moeda (ex.: BRL). */
export function formatMoneyFromCents(cents: number, currency: string): string {
  const code = currency.length === 3 ? currency.toUpperCase() : 'BRL';
  try {
    return new Intl.NumberFormat(UI_LOCALE, {
      style: 'currency',
      currency: code,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${code}`;
  }
}

/** Converte texto em reais (ex.: "5", "5,50") para centavos; vazio → null. */
export function parseReaisInputToCents(
  raw: string | undefined,
): { ok: true; cents: number | null } | { ok: false; message: string } {
  if (raw === undefined || raw.trim() === '') {
    return { ok: true, cents: null };
  }
  const n = Number.parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, message: 'Preço inválido.' };
  }
  return { ok: true, cents: Math.round(n * 100) };
}
