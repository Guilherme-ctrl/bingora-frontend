import type { BingoGrid } from '@/types/api';

const BINGO = ['B', 'I', 'N', 'G', 'O'] as const;

type BingoCardMiniPreviewProps = {
  grid: BingoGrid;
  eventTitle: string;
  serialNumber: number;
  /** URL absoluta da logo do evento — apenas na célula central. */
  logoUrl: string | null;
  /** Rótulo para leitores de tela. */
  ariaLabel: string;
};

/**
 * Prévia leve da grade 5×5 + cabeçalho BINGO, para listagens (não substitui export PDF).
 */
export function BingoCardMiniPreview({
  grid,
  eventTitle,
  serialNumber,
  logoUrl,
  ariaLabel,
}: BingoCardMiniPreviewProps) {
  const hasLogo = logoUrl != null && logoUrl !== '';

  return (
    <div className="bingo-mini" role="img" aria-label={ariaLabel}>
      <div className="bingo-mini__head">
        <div className="bingo-mini__title">{eventTitle}</div>
        <div className="bingo-mini__serial">Cartela nº {serialNumber}</div>
      </div>

      <div className="bingo-mini__letters" aria-hidden>
        {BINGO.map((letter) => (
          <span key={letter} className="bingo-mini__letter">
            {letter}
          </span>
        ))}
      </div>
      <div className="bingo-mini__grid" aria-hidden>
        {grid.rows.flatMap((row, r) =>
          row.map((cell, c) => {
            const isCenter = r === 2 && c === 2;
            const showLogo = isCenter && hasLogo;
            const stripe = !isCenter && (r + c) % 2 === 1;
            return (
              <div
                key={`${r}-${c}`}
                className={`bingo-mini__cell ${
                  isCenter
                    ? 'bingo-mini__cell--center'
                    : stripe
                      ? 'bingo-mini__cell--stripe'
                      : ''
                }`}
              >
                {cell !== null ? (
                  <span className="bingo-mini__num">{cell}</span>
                ) : showLogo ? (
                  <img
                    src={logoUrl!}
                    alt=""
                    className="bingo-mini__logo"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="bingo-mini__free">Livre</span>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
