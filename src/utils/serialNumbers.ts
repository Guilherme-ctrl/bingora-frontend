/**
 * Interpreta números de cartela separados por vírgula, espaço ou ponto e vírgula.
 * Vazio = sem escolha explícita (servidor atribui automaticamente).
 */
export function parseSaleSerialNumbersInput(
  raw: string,
  quantity: number,
):
  | { ok: true; serial_numbers: number[] | undefined }
  | { ok: false; message: string } {
  const t = raw.trim();
  if (t === '') {
    return { ok: true, serial_numbers: undefined };
  }
  const parts = t
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const nums = parts.map((p) => Number.parseInt(p, 10));
  for (const n of nums) {
    if (!Number.isFinite(n) || n < 1) {
      return {
        ok: false,
        message:
          'Números de cartela inválidos. Use apenas inteiros positivos (ex.: 12 ou 5, 8, 12).',
      };
    }
  }
  if (nums.length !== quantity) {
    return {
      ok: false,
      message: `Informe exatamente ${quantity} número(s) de cartela, ou deixe em branco para o sistema escolher cartelas disponíveis automaticamente.`,
    };
  }
  const set = new Set(nums);
  if (set.size !== nums.length) {
    return {
      ok: false,
      message: 'Não repita o mesmo número de cartela.',
    };
  }
  return { ok: true, serial_numbers: nums };
}
