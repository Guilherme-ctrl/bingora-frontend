import { BingoCardMiniPreview } from '@/components/bingo/BingoCardMiniPreview';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PageContainer, PageHeader } from '@/components/ui/PageContainer';
import { TextField } from '@/components/ui/TextField';
import { useEventWorkspace } from '@/hooks/useEventWorkspace';
import * as cardsService from '@/services/cardsService';
import type { BingoCard, BingoCardStatus } from '@/types/api';
import { ApiRequestError } from '@/services/apiError';
import { downloadTextFile } from '@/utils/download';
import { resolveUploadUrl } from '@/utils/resolveUploadUrl';
import { useCallback, useEffect, useState } from 'react';

const STATUS_PT: Record<BingoCardStatus, string> = {
  available: 'Disponível',
  assigned: 'Atribuída',
  voided: 'Anulada',
};

export function EventCardsPage() {
  const { event } = useEventWorkspace();
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<BingoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState('100');
  const [generating, setGenerating] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cardsService.listCards(event.id, {
        page,
        page_size: pageSize,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.message
          : 'Não foi possível carregar as cartelas.',
      );
    } finally {
      setLoading(false);
    }
  }, [event.id, page]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    const n = Number.parseInt(count, 10);
    if (!Number.isFinite(n) || n < 1 || n > 10_000) {
      return;
    }
    setGenerating(true);
    try {
      await cardsService.generateCards(event.id, {
        count: n,
        ruleset: 'us_75_ball_5x5',
      });
      setPage(1);
      await loadPage();
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível gerar as cartelas.',
      );
    } finally {
      setGenerating(false);
    }
  }

  async function downloadJson() {
    try {
      const data = await cardsService.exportCardsJson(event.id);
      downloadTextFile(
        `cartelas-bingo-${event.id}.json`,
        JSON.stringify(data, null, 2),
        'application/json',
      );
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError ? err.message : 'Falha na exportação.',
      );
    }
  }

  async function downloadCsv() {
    try {
      const csv = await cardsService.exportCardsCsv(event.id);
      downloadTextFile(`cartelas-bingo-${event.id}.csv`, csv, 'text/csv');
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError ? err.message : 'Falha na exportação.',
      );
    }
  }

  async function downloadPdf() {
    setPdfExporting(true);
    try {
      const [{ downloadBingoCardsPdf }, cards] = await Promise.all([
        import('@/utils/bingoCardsPdf'),
        cardsService.exportCardsJson(event.id),
      ]);
      await downloadBingoCardsPdf(`cartelas-bingo-${event.id}.pdf`, {
        eventTitle: event.title,
        logoAbsoluteUrl: eventLogoUrl,
        cards,
      });
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível gerar o PDF. Tente de novo.',
      );
    } finally {
      setPdfExporting(false);
    }
  }

  const hasCards = total > 0;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const eventLogoUrl = resolveUploadUrl(event.logo_url);

  return (
    <PageContainer>
      <PageHeader
        title="Cartelas"
        description="Cada evento gera cartelas uma única vez. A prévia mostra a grade; a logo do evento aparece na casa livre quando houver imagem cadastrada. O PDF agrupa várias cartelas por folha A4 (cerca de 13×11 cm cada), ajustando a escala automaticamente."
      />

      {error ? (
        <Callout tone="error" title="Erro">
          {error}
        </Callout>
      ) : null}

      {!hasCards && loading ? (
        <div className="table-skeleton" aria-busy>
          <div className="table-skeleton__row" />
        </div>
      ) : null}

      {!hasCards && !loading ? (
        <form className="form-stack" onSubmit={generate}>
          <Callout tone="info" title="Gerar cartelas">
            <p>
              Informe quantas cartelas 75 bolas únicas deseja criar. Depois que
              existirem cartelas, não é possível gerar de novo neste evento.
            </p>
          </Callout>
          <TextField
            name="count"
            type="number"
            label="Quantidade"
            min={1}
            max={10_000}
            value={count}
            onChange={(ev) => setCount(ev.target.value)}
          />
          <div className="form-actions">
            <Button type="submit" variant="primary" loading={generating}>
              Gerar cartelas
            </Button>
          </div>
        </form>
      ) : null}

      {hasCards ? (
        <div className="toolbar">
          <Button
            type="button"
            variant="primary"
            loading={pdfExporting}
            onClick={() => void downloadPdf()}
          >
            Exportar PDF
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void downloadJson()}
          >
            Exportar JSON
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void downloadCsv()}
          >
            Exportar CSV
          </Button>
        </div>
      ) : null}

      {hasCards && loading ? (
        <div className="table-skeleton" aria-busy>
          <div className="table-skeleton__row" />
        </div>
      ) : null}

      {hasCards && !loading ? (
        <>
          <div
            className="bingo-cards-grid"
            role="list"
            aria-label="Prévia das cartelas desta página"
          >
            {items.map((c) => (
              <article key={c.id} className="bingo-cards-tile" role="listitem">
                <div className="bingo-cards-tile__meta">
                  <span className="bingo-cards-meta__num">
                    nº {c.serial_number}
                  </span>
                  <span className="bingo-cards-meta__status">
                    {STATUS_PT[c.status]}
                  </span>
                </div>
                <div className="bingo-cards-tile__preview">
                  <BingoCardMiniPreview
                    grid={c.grid}
                    eventTitle={event.title}
                    serialNumber={c.serial_number}
                    logoUrl={eventLogoUrl}
                    ariaLabel={`${event.title}, cartela número ${c.serial_number}, grade cinco por cinco`}
                  />
                </div>
              </article>
            ))}
          </div>
          <div className="pager">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="pager__status">
              Página {page} de {maxPage} ({total} cartelas)
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= maxPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </>
      ) : null}
    </PageContainer>
  );
}
