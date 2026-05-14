/**
 * spannweite-svg — parallel SVG renderer for PNG/SVG export of the
 * Spannweite view.
 *
 * The on-page Spannweite view is built from HTML + CSS Grid + many
 * tiny SVGs (one verdict-arrow glyph per cell + per row label). That
 * structure can't be serialised as a single `<svg>` for export, so
 * this module re-renders the same data into ONE self-contained
 * `<svg>` element on demand. The element is returned to the
 * `ChartHandle = ECharts | SVGElement` export pipeline.
 *
 * Visual fidelity targets the live view: verdict-tinted bar from 0 →
 * value, verdict-arrow glyph at value position, numeric label after
 * the glyph, one shared bottom axis. No interactive trim
 * (hide / sort / info buttons are omitted — they're not data).
 */

import type {
  Myth, Metric, Group, GroupId, Indicator, StripsMode, Lang,
  CorrectnessClass,
} from './types';
import { getMythMetric, getIndicatorValue, getMythShortText } from './data';

interface RenderOpts {
  myths: Myth[];                  // filtered + sorted
  metrics: Metric[];
  groups: Group[];
  mode: StripsMode;
  pickedGroup: GroupId;
  pickedIndicator: Indicator;
  /** Visible column IDs (already in their original column order,
   *  hidden columns excluded). */
  visibleColumns: { id: string; label: string }[];
  lang: Lang;
}

// Verdict colours mirror src/lib/dashboard/colors.ts.
const VERDICT_FG: Record<CorrectnessClass, string> = {
  richtig: '#047857',
  eher_richtig: '#4d7c0f',
  eher_falsch: '#b45309',
  falsch: '#be123c',
  no_classification: '#6b7280',
};
const VERDICT_SHADOW: Record<CorrectnessClass, string> = {
  richtig: '#a7d3c5',
  eher_richtig: '#c2d3a3',
  eher_falsch: '#e0b58d',
  falsch: '#e9a8b9',
  no_classification: '#94a3b8',
};
// Per-verdict y-shift (px) so the chevron tip lands on the bar
// midline, matching the on-page CSS `--y-shift`.
const VERDICT_Y_SHIFT: Record<CorrectnessClass, number> = {
  richtig: 2.67,
  eher_richtig: 1.89,
  eher_falsch: -1.89,
  falsch: -2.67,
  no_classification: 0,
};

const TOTAL_W = 1000;
const LABEL_COL_W = 240;
const HEADER_H = 56;
const ROW_H = 32;
const AXIS_H = 26;
const BAR_H = 8;
const GLYPH_SIZE = 16;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Inline <symbol> defs for the 5 verdict arrows, identical geometry
 *  to verdictArrowSymbols.tsx. */
function symbolDefs(): string {
  const sym = (id: string, transform: string, body: string) =>
    `<symbol id="${id}" viewBox="0 0 24 24" overflow="visible"><g fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"${transform ? ` transform="${transform}"` : ''}>${body}</g></symbol>`;
  const full = (fg: string, shadow: string) =>
    `<path d="M2 16h20" stroke="${shadow}"/><path d="M12 2v14" stroke="${fg}"/><path d="m5 9 7 7 7-7" stroke="${fg}"/>`;
  const lineOnly = (shadow: string) =>
    `<path d="M2 16h20" stroke="${shadow}"/>`;
  return [
    sym('strips-arrow-richtig', 'rotate(180 12 12)', full(VERDICT_FG.richtig, VERDICT_SHADOW.richtig)),
    sym('strips-arrow-eher_richtig', 'rotate(-135 12 12)', full(VERDICT_FG.eher_richtig, VERDICT_SHADOW.eher_richtig)),
    sym('strips-arrow-eher_falsch', 'rotate(45 12 12)', full(VERDICT_FG.eher_falsch, VERDICT_SHADOW.eher_falsch)),
    sym('strips-arrow-falsch', '', full(VERDICT_FG.falsch, VERDICT_SHADOW.falsch)),
    sym('strips-arrow-no_classification', '', lineOnly(VERDICT_SHADOW.no_classification)),
  ].join('');
}

export function renderSpannweiteSvg(opts: RenderOpts): SVGSVGElement {
  const { myths, metrics, mode, pickedGroup, pickedIndicator, visibleColumns, lang } = opts;
  const colCount = visibleColumns.length;
  const colW = colCount > 0 ? (TOTAL_W - LABEL_COL_W) / colCount : 0;
  const bodyH = myths.length * ROW_H;
  const totalH = HEADER_H + bodyH + AXIS_H;

  const cellValue = (mythId: number, colId: string): number | null => {
    if (mode === 'indicator') {
      return getIndicatorValue(getMythMetric(metrics, mythId, pickedGroup), colId as Indicator);
    }
    return getIndicatorValue(getMythMetric(metrics, mythId, colId as GroupId), pickedIndicator);
  };

  const parts: string[] = [];

  // Outer frame.
  parts.push(`<rect x="0.5" y="0.5" width="${TOTAL_W - 1}" height="${totalH - 1}" fill="#ffffff" stroke="#e5e7eb"/>`);

  // ── Header row ──────────────────────────────────────────────────
  parts.push(`<g class="header">`);
  // Header bottom border.
  parts.push(`<line x1="0" y1="${HEADER_H}" x2="${TOTAL_W}" y2="${HEADER_H}" stroke="#e5e7eb"/>`);
  // "MYTHEN" label in label-column header.
  parts.push(
    `<text x="${LABEL_COL_W / 2}" y="${HEADER_H / 2}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="11" font-weight="600" letter-spacing="0.04em" fill="#64748b">${escapeXml(lang === 'de' ? 'MYTHEN' : 'MYTHS')}</text>`,
  );
  // Column headers — text label only (no interactive trim in export).
  for (let i = 0; i < colCount; i++) {
    const col = visibleColumns[i];
    const cx = LABEL_COL_W + i * colW + colW / 2;
    parts.push(
      `<text x="${cx}" y="${HEADER_H / 2}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="600" fill="#0f172a">${escapeXml(col.label)}</text>`,
    );
    // Column divider line on the right edge of each column.
    if (i < colCount) {
      const x = LABEL_COL_W + (i + 1) * colW;
      parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${HEADER_H}" stroke="#e5e7eb"/>`);
    }
  }
  // Left divider between MYTHEN column and data columns.
  parts.push(`<line x1="${LABEL_COL_W}" y1="0" x2="${LABEL_COL_W}" y2="${HEADER_H}" stroke="#e5e7eb"/>`);
  parts.push(`</g>`);

  // ── Body rows ───────────────────────────────────────────────────
  parts.push(`<g class="body">`);
  for (let r = 0; r < myths.length; r++) {
    const myth = myths[r];
    const verdict = myth.correctness_class;
    const verdictColor = VERDICT_FG[verdict];
    const yTop = HEADER_H + r * ROW_H;
    const yMid = yTop + ROW_H / 2;
    // Alternating row background.
    if (r % 2 === 1) {
      parts.push(`<rect x="0" y="${yTop}" width="${TOTAL_W}" height="${ROW_H}" fill="#fafbfc"/>`);
    }
    // Row separator line at top.
    if (r > 0) {
      parts.push(`<line x1="0" y1="${yTop}" x2="${TOTAL_W}" y2="${yTop}" stroke="#f1f5f9"/>`);
    }
    // Row label: small verdict glyph + short text.
    const labelGlyphX = 14;
    const labelGlyphY = yMid - GLYPH_SIZE / 2 + VERDICT_Y_SHIFT[verdict];
    parts.push(
      `<g style="color:${verdictColor}"><use href="#strips-arrow-${verdict}" x="${labelGlyphX - GLYPH_SIZE / 2}" y="${labelGlyphY}" width="${GLYPH_SIZE}" height="${GLYPH_SIZE}"/></g>`,
    );
    parts.push(
      `<text x="${labelGlyphX + GLYPH_SIZE / 2 + 8}" y="${yMid}" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="500" fill="#0f172a">${escapeXml(truncate(getMythShortText(myth, lang), 38))}</text>`,
    );
    // Right border of label column.
    parts.push(`<line x1="${LABEL_COL_W}" y1="${yTop}" x2="${LABEL_COL_W}" y2="${yTop + ROW_H}" stroke="#f1f5f9"/>`);
    // Data cells.
    for (let i = 0; i < colCount; i++) {
      const col = visibleColumns[i];
      const value = cellValue(myth.id, col.id);
      const cellX = LABEL_COL_W + i * colW;
      // Column right border (except last).
      if (i < colCount - 1) {
        parts.push(`<line x1="${cellX + colW}" y1="${yTop}" x2="${cellX + colW}" y2="${yTop + ROW_H}" stroke="#f1f5f9"/>`);
      }
      if (value === null) {
        parts.push(
          `<text x="${cellX + colW / 2}" y="${yMid}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="10" font-style="italic" fill="#94a3b8">k. A.</text>`,
        );
        continue;
      }
      const v = Math.max(0, Math.min(100, value));
      const innerW = colW - 16; // 8px padding each side
      const innerLeft = cellX + 8;
      const valueX = innerLeft + (innerW * v) / 100;
      const barRight = valueX; // bar's right edge = glyph centre
      // Bar (verdict-tinted, 22% opacity).
      parts.push(
        `<rect x="${innerLeft}" y="${yMid - BAR_H / 2}" width="${barRight - innerLeft}" height="${BAR_H}" rx="4" fill="${verdictColor}" fill-opacity="0.22"/>`,
      );
      // Verdict glyph at value position, with per-verdict y-shift.
      const gx = valueX - GLYPH_SIZE / 2;
      const gy = yMid - GLYPH_SIZE / 2 + VERDICT_Y_SHIFT[verdict];
      parts.push(
        `<g style="color:${verdictColor}"><use href="#strips-arrow-${verdict}" x="${gx}" y="${gy}" width="${GLYPH_SIZE}" height="${GLYPH_SIZE}"/></g>`,
      );
      // Numeric label.
      parts.push(
        `<text x="${valueX + GLYPH_SIZE / 2 + 4}" y="${yMid}" dominant-baseline="middle" font-family="ui-monospace,'SF Mono',Menlo,monospace" font-size="11" fill="#0f172a">${Math.round(value)}</text>`,
      );
    }
  }
  parts.push(`</g>`);

  // ── Bottom axis (0/50/100 per column) ───────────────────────────
  const axisY = HEADER_H + bodyH;
  parts.push(`<g class="axis">`);
  parts.push(`<line x1="0" y1="${axisY}" x2="${TOTAL_W}" y2="${axisY}" stroke="#f1f5f9"/>`);
  for (let i = 0; i < colCount; i++) {
    const cellX = LABEL_COL_W + i * colW;
    const tickY = axisY + AXIS_H / 2 + 4;
    parts.push(
      `<text x="${cellX + 8}" y="${tickY}" font-family="ui-monospace,'SF Mono',Menlo,monospace" font-size="10" fill="#94a3b8">0</text>`,
    );
    parts.push(
      `<text x="${cellX + colW / 2}" y="${tickY}" text-anchor="middle" font-family="ui-monospace,'SF Mono',Menlo,monospace" font-size="10" fill="#94a3b8">50</text>`,
    );
    parts.push(
      `<text x="${cellX + colW - 8}" y="${tickY}" text-anchor="end" font-family="ui-monospace,'SF Mono',Menlo,monospace" font-size="10" fill="#94a3b8">100</text>`,
    );
  }
  parts.push(`</g>`);

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${TOTAL_W}" height="${totalH}" viewBox="0 0 ${TOTAL_W} ${totalH}"><defs>${symbolDefs()}</defs>${parts.join('')}</svg>`;
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  return doc.documentElement as unknown as SVGSVGElement;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}
