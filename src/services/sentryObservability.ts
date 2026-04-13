import * as Sentry from '@sentry/react';

function toSpanAttributes(
  attrs: Record<string, string | number | boolean | null | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null) continue;
    out[k] = String(v);
  }
  return out;
}

/**
 * Mede um passo de fluxo crítico (venda, sorteio, etc.) como span filho da transação atual.
 * Compatível com plano free: use só em poucos pontos e mantenha tracesSampleRate baixo.
 */
export async function trackCriticalUiFlow(
  name: string,
  attrs: Record<string, string | number | boolean | null | undefined>,
  fn: () => Promise<void>,
): Promise<void> {
  await Sentry.startSpan(
    {
      name,
      op: 'ui.critical_flow',
      attributes: toSpanAttributes(attrs),
    },
    async () => {
      await fn();
    },
  );
}

/** Breadcrumb leve para jornada (não conta como métrica de produto; ajuda contexto antes de erros). */
export function addUiBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
): void {
  Sentry.addBreadcrumb({
    category: 'ui',
    type: 'user',
    message,
    level: 'info',
    data,
  });
}
