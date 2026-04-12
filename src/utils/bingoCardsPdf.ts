import { getStoredAccessToken } from '@/services/tokenStorage';
import type { BingoCard } from '@/types/api';
import { jsPDF } from 'jspdf';

/** Tokens Bingora (design system) — RGB 0–255 */
const DS = {
  text: [26, 29, 35] as [number, number, number],
  muted: [92, 99, 112] as [number, number, number],
  border: [216, 221, 230] as [number, number, number],
  headerBg: [243, 245, 248] as [number, number, number],
  stripe: [238, 241, 246] as [number, number, number],
  accentStrong: [154, 33, 79] as [number, number, number],
  accentSubtleBg: [252, 236, 243] as [number, number, number],
  surface: [255, 255, 255] as [number, number, number],
};

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'] as const;

/** Tamanho nominal de referência (cartela física típica 13 × 11 cm). */
export const BINGO_CARD_NOMINAL_MM = { w: 130, h: 110 } as const;

const NW = BINGO_CARD_NOMINAL_MM.w;
const NH = BINGO_CARD_NOMINAL_MM.h;

const PAGE_MARGIN_MM = 7;
const GUTTER_MM = 3.5;
/** Escala mínima para ainda ser legível em grade densa. */
const MIN_SCALE = 0.38;

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Falha ao ler imagem'));
    r.readAsDataURL(blob);
  });
}

async function fetchLogoAsDataUrl(absoluteUrl: string): Promise<string | null> {
  try {
    const token = getStoredAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(absoluteUrl, { headers });
    if (!res.ok) {
      return null;
    }
    const blob = await res.blob();
    return await blobToDataURL(blob);
  } catch {
    return null;
  }
}

function inferImageFormat(
  dataUrl: string,
): 'PNG' | 'JPEG' | 'WEBP' | 'GIF' {
  if (dataUrl.startsWith('data:image/jpeg')) {
    return 'JPEG';
  }
  if (dataUrl.startsWith('data:image/webp')) {
    return 'WEBP';
  }
  if (dataUrl.startsWith('data:image/gif')) {
    return 'GIF';
  }
  return 'PNG';
}

function loadImageDimensions(
  dataUrl: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Imagem inválida'));
    img.src = dataUrl;
  });
}

/**
 * Maximiza cartelas por página (proporção 130×110 mm), com escala ≤ 1.
 * Prefere mais cartelas por folha; em empate, maior escala (mais legível).
 */
function bestLayout(
  usableW: number,
  usableH: number,
): {
  cols: number;
  rows: number;
  slotW: number;
  slotH: number;
  scale: number;
} {
  let bestCount = 0;
  let bestScale = 0;
  let best: {
    cols: number;
    rows: number;
    slotW: number;
    slotH: number;
    scale: number;
  } | null = null;

  for (let cols = 1; cols <= 4; cols++) {
    for (let rows = 1; rows <= 5; rows++) {
      const slotW = (usableW - (cols - 1) * GUTTER_MM) / cols;
      const slotH = (usableH - (rows - 1) * GUTTER_MM) / rows;
      if (slotW < 24 || slotH < 22) {
        continue;
      }
      const rawScale = Math.min(slotW / NW, slotH / NH);
      const scale = Math.min(rawScale, 1);
      if (scale < MIN_SCALE) {
        continue;
      }
      const count = cols * rows;
      if (
        count > bestCount ||
        (count === bestCount && scale > bestScale)
      ) {
        bestCount = count;
        bestScale = scale;
        best = { cols, rows, slotW, slotH, scale };
      }
    }
  }

  if (!best) {
    const scale = Math.max(
      MIN_SCALE,
      Math.min(usableW / NW, usableH / NH, 1),
    );
    return {
      cols: 1,
      rows: 1,
      slotW: usableW,
      slotH: usableH,
      scale,
    };
  }

  return best;
}

export type BuildBingoCardsPdfParams = {
  eventTitle: string;
  logoAbsoluteUrl: string | null;
  cards: BingoCard[];
};

/**
 * PDF A4 — várias cartelas por folha (até o máximo possível, referência 13×11 cm cada).
 */
export async function buildBingoCardsPdfBlob(
  params: BuildBingoCardsPdfParams,
): Promise<Blob> {
  const { eventTitle, logoAbsoluteUrl, cards } = params;

  let logoDataUrl: string | null = null;
  let logoDims: { width: number; height: number } | null = null;
  if (logoAbsoluteUrl) {
    logoDataUrl = await fetchLogoAsDataUrl(logoAbsoluteUrl);
    if (logoDataUrl) {
      try {
        logoDims = await loadImageDimensions(logoDataUrl);
      } catch {
        logoDataUrl = null;
      }
    }
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const usableW = pageW - 2 * PAGE_MARGIN_MM;
  const usableH = pageH - 2 * PAGE_MARGIN_MM;

  const layout = bestLayout(usableW, usableH);
  const perPage = layout.cols * layout.rows;
  const cardDrawW = NW * layout.scale;
  const cardDrawH = NH * layout.scale;
  const logoFmt =
    logoDataUrl != null ? inferImageFormat(logoDataUrl) : 'PNG';

  let idx = 0;
  let pageNum = 0;

  while (idx < cards.length) {
    if (pageNum > 0) {
      doc.addPage();
    }

    for (let slot = 0; slot < perPage && idx < cards.length; slot++, idx++) {
      const row = Math.floor(slot / layout.cols);
      const col = slot % layout.cols;
      const slotX =
        PAGE_MARGIN_MM + col * (layout.slotW + GUTTER_MM);
      const slotY =
        PAGE_MARGIN_MM + row * (layout.slotH + GUTTER_MM);
      const ox = slotX + (layout.slotW - cardDrawW) / 2;
      const oy = slotY + (layout.slotH - cardDrawH) / 2;

      drawCardInNominalRect(
        doc,
        {
          ox,
          oy,
          cw: cardDrawW,
          ch: cardDrawH,
          scale: layout.scale,
        },
        {
          eventTitle,
          card: cards[idx]!,
          logoDataUrl,
          logoDims,
          logoFmt,
        },
      );
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...DS.muted);
    doc.text(
      `Bingora · ${eventTitle.slice(0, 48)}${eventTitle.length > 48 ? '…' : ''}`,
      pageW / 2,
      pageH - 4,
      { align: 'center' },
    );

    pageNum++;
  }

  const out = doc.output('arraybuffer');
  return new Blob([out], { type: 'application/pdf' });
}

function drawCardInNominalRect(
  doc: jsPDF,
  box: { ox: number; oy: number; cw: number; ch: number; scale: number },
  ctx: {
    eventTitle: string;
    card: BingoCard;
    logoDataUrl: string | null;
    logoDims: { width: number; height: number } | null;
    logoFmt: string;
  },
) {
  const { ox, oy, cw, ch, scale } = box;
  const { eventTitle, card, logoDataUrl, logoDims, logoFmt } = ctx;

  const sx = (nx: number) => ox + (nx / NW) * cw;
  const sy = (ny: number) => oy + (ny / NH) * ch;
  const sw = (nw: number) => (nw / NW) * cw;
  const sh = (nh: number) => (nh / NH) * ch;

  doc.setDrawColor(...DS.border);
  doc.setLineWidth(0.25);
  doc.rect(ox, oy, cw, ch, 'S');

  /** Margem interna uniforme (sem logo no topo — só na casa central). */
  const padN = 3;
  const centerXN = NW / 2;
  const centerX = sx(centerXN);

  const textMaxWN = NW - 2 * padN;
  const titleLines = doc
    .splitTextToSize(eventTitle, sw(textMaxWN))
    .slice(0, 4);
  const titleLineNom = Math.max(3.2, 3.6 * Math.max(scale, 0.5));

  let ynText = padN + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(Math.max(6.5, 9 * scale));
  doc.setTextColor(...DS.text);
  for (const line of titleLines) {
    doc.text(line, centerX, sy(ynText), { align: 'center' });
    ynText += titleLineNom;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(Math.max(6, 8 * scale));
  doc.setTextColor(...DS.muted);
  doc.text(`Cartela nº ${card.serial_number}`, centerX, sy(ynText), {
    align: 'center',
  });
  ynText += titleLineNom * 0.95;

  const yn = ynText + 1.4;

  const bottomPadN = 2;
  const gridAvailN = NH - yn - bottomPadN;
  const gridWN = Math.min(118, NW - 2 * padN);
  const x0n = (NW - gridWN) / 2;
  const headerHN = Math.max(4.2, 6 * Math.max(scale, 0.45));
  const cellHN = Math.max(5.5, (gridAvailN - headerHN) / 5);

  const x0 = sx(x0n);
  const y0 = sy(yn);
  const gw = sw(gridWN);
  const hh = sh(headerHN);
  const chCell = sh(cellHN);
  const colW = gw / 5;

  doc.setFillColor(...DS.headerBg);
  doc.rect(x0, y0, gw, hh, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(Math.max(6, 9 * scale));
  doc.setTextColor(...DS.accentStrong);
  for (let c = 0; c < 5; c++) {
    doc.text(
      BINGO_LETTERS[c],
      x0 + c * colW + colW / 2,
      y0 + hh / 2 + 1.1 * scale,
      { align: 'center' },
    );
  }

  let gy = y0 + hh;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const cx = x0 + c * colW;
      const raw = card.grid.rows[r]![c];
      const isFreeCell = r === 2 && c === 2;
      const fill = isFreeCell
        ? DS.accentSubtleBg
        : (r + c) % 2 === 0
          ? DS.surface
          : DS.stripe;
      doc.setFillColor(...fill);
      doc.setDrawColor(...DS.border);
      doc.rect(cx, gy, colW, chCell, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(Math.max(7, 11 * scale));

      if (raw === null) {
        if (logoDataUrl && logoDims) {
          const padC = 0.18 * Math.max(scale, 0.5);
          const maxW = colW - 2 * padC;
          const maxH = chCell - 2 * padC;
          const sc2 = Math.min(
            maxW / logoDims.width,
            maxH / logoDims.height,
          );
          const iw = logoDims.width * sc2;
          const ih = logoDims.height * sc2;
          const ix = cx + (colW - iw) / 2;
          const iy = gy + (chCell - ih) / 2;
          doc.addImage(logoDataUrl, logoFmt, ix, iy, iw, ih);
        } else {
          doc.setFontSize(Math.max(5, 7 * scale));
          doc.setTextColor(...DS.accentStrong);
          doc.text('Livre', cx + colW / 2, gy + chCell / 2 + 1 * scale, {
            align: 'center',
          });
        }
      } else {
        doc.setTextColor(...DS.text);
        doc.text(String(raw), cx + colW / 2, gy + chCell / 2 + 1.3 * scale, {
          align: 'center',
        });
      }
    }
    gy += chCell;
  }
}

export async function downloadBingoCardsPdf(
  filename: string,
  params: BuildBingoCardsPdfParams,
): Promise<void> {
  const blob = await buildBingoCardsPdfBlob(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
