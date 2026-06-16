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

import type { Myth, Lang, CorrectnessClass } from './types';
import { getMythShortText } from './data';
import { wrapLabel, renderLabelLines } from './text-wrap';

interface RenderOpts {
  myths: Myth[];                  // filtered + sorted
  /** Resolve the value for (mythId, columnId). This is the SAME function
   *  the on-screen view uses, so the export always matches the screen —
   *  the renderer never re-derives values from mode/group/indicator (that
   *  drifted and broke: BalkenView and SpannweiteView use opposite
   *  mode↔column conventions). */
  cellValue: (mythId: number, colId: string) => number | null;
  /** Visible column IDs (already in their original column order,
   *  hidden columns excluded). */
  visibleColumns: { id: string; label: string }[];
  lang: Lang;
}

// Verdict colours mirror src/lib/dashboard/colors.ts.
export const VERDICT_FG: Record<CorrectnessClass, string> = {
  richtig: '#047857',
  eher_richtig: '#4d7c0f',
  eher_falsch: '#b45309',
  falsch: '#be123c',
  keine_aussage_moeglich: '#6b7280',
};
const VERDICT_SHADOW: Record<CorrectnessClass, string> = {
  richtig: '#a7d3c5',
  eher_richtig: '#c2d3a3',
  eher_falsch: '#e0b58d',
  falsch: '#e9a8b9',
  keine_aussage_moeglich: '#94a3b8',
};
// Per-verdict y-shift (px) so the chevron tip lands on the bar
// midline, matching the on-page CSS `--y-shift`.
export const VERDICT_Y_SHIFT: Record<CorrectnessClass, number> = {
  richtig: 2.67,
  eher_richtig: 1.89,
  eher_falsch: -1.89,
  falsch: -2.67,
  keine_aussage_moeglich: 0,
};

const TOTAL_W = 1000;
const LABEL_COL_W = 240;
const HEADER_H = 56;
const ROW_H = 32;
const ROW_H_2 = 48;          // taller row when a label wraps to 2 lines
const LABEL_MAX_CHARS = 30;  // chars that fit the 240px label column at 12px
const AXIS_H = 26;
const BAR_H = 8;
export const GLYPH_SIZE = 16;
const CIRCLE_R = 11; // value-circle radius (22px ⌀, matches .carm-value-circle)

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
export function symbolDefs(): string {
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
    sym('strips-arrow-keine_aussage_moeglich', '', lineOnly(VERDICT_SHADOW.keine_aussage_moeglich)),
  ].join('');
}

export function renderSpannweiteSvg(opts: RenderOpts): SVGSVGElement {
  const { myths, cellValue, visibleColumns, lang } = opts;
  const colCount = visibleColumns.length;
  const colW = colCount > 0 ? (TOTAL_W - LABEL_COL_W) / colCount : 0;

  // Per-row label wrapping → variable row heights, so long statements wrap
  // to a 2nd line instead of being cut / overflowing the label column.
  const rowLayouts = myths.map((myth) => {
    const lines = wrapLabel(getMythShortText(myth, lang), LABEL_MAX_CHARS, 2);
    return { lines, height: lines.length > 1 ? ROW_H_2 : ROW_H };
  });
  const rowTops: number[] = [];
  let accH = 0;
  for (const rl of rowLayouts) { rowTops.push(accH); accH += rl.height; }
  const bodyH = accH;
  const totalH = HEADER_H + bodyH + AXIS_H;

  // Per-column clip paths so a value circle at ≈0 / ≈100 is trimmed at
  // the column edge, mirroring the on-screen cell's `overflow:hidden`.
  const clipDefs = visibleColumns
    .map((_, i) => {
      const cx = LABEL_COL_W + i * colW;
      return `<clipPath id="sp-clip-${i}"><rect x="${cx}" y="${HEADER_H}" width="${colW}" height="${bodyH}"/></clipPath>`;
    })
    .join('');

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
    const { lines: labelLines, height: rowH } = rowLayouts[r];
    const yTop = HEADER_H + rowTops[r];
    const yMid = yTop + rowH / 2;
    // Alternating row background.
    if (r % 2 === 1) {
      parts.push(`<rect x="0" y="${yTop}" width="${TOTAL_W}" height="${rowH}" fill="#fafbfc"/>`);
    }
    // Row separator line at top.
    if (r > 0) {
      parts.push(`<line x1="0" y1="${yTop}" x2="${TOTAL_W}" y2="${yTop}" stroke="#f1f5f9"/>`);
    }
    // Row label: small verdict glyph + wrapped short text (1–2 lines).
    const labelGlyphX = 14;
    const labelGlyphY = yMid - GLYPH_SIZE / 2 + VERDICT_Y_SHIFT[verdict];
    parts.push(
      `<g style="color:${verdictColor}"><use href="#strips-arrow-${verdict}" x="${labelGlyphX - GLYPH_SIZE / 2}" y="${labelGlyphY}" width="${GLYPH_SIZE}" height="${GLYPH_SIZE}"/></g>`,
    );
    parts.push(
      renderLabelLines(labelLines, labelGlyphX + GLYPH_SIZE / 2 + 8, yMid, {
        fontSize: 12, fontWeight: 500, fill: '#0f172a',
      }),
    );
    // Right border of label column.
    parts.push(`<line x1="${LABEL_COL_W}" y1="${yTop}" x2="${LABEL_COL_W}" y2="${yTop + rowH}" stroke="#f1f5f9"/>`);
    // Data cells.
    for (let i = 0; i < colCount; i++) {
      const col = visibleColumns[i];
      const value = cellValue(myth.id, col.id);
      const cellX = LABEL_COL_W + i * colW;
      // Column right border (except last).
      if (i < colCount - 1) {
        parts.push(`<line x1="${cellX + colW}" y1="${yTop}" x2="${cellX + colW}" y2="${yTop + rowH}" stroke="#f1f5f9"/>`);
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
      // Bar (verdict-tinted, 22% opacity) from 0 → value.
      parts.push(
        `<rect x="${innerLeft}" y="${yMid - BAR_H / 2}" width="${valueX - innerLeft}" height="${BAR_H}" rx="4" fill="${verdictColor}" fill-opacity="0.22"/>`,
      );
      // Value circle (solid verdict colour) + centred white number,
      // matching the on-screen ValueCircle; clipped to the column.
      parts.push(`<g clip-path="url(#sp-clip-${i})">`);
      parts.push(
        `<circle cx="${valueX}" cy="${yMid}" r="${CIRCLE_R}" fill="${verdictColor}"/>`,
      );
      parts.push(
        `<text x="${valueX}" y="${yMid}" text-anchor="middle" dominant-baseline="central" font-family="ui-monospace,'SF Mono',Menlo,monospace" font-size="11" font-weight="600" fill="#ffffff">${Math.round(value)}</text>`,
      );
      parts.push(`</g>`);
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

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${TOTAL_W}" height="${totalH}" viewBox="0 0 ${TOTAL_W} ${totalH}"><defs>${symbolDefs()}${clipDefs}</defs>${parts.join('')}</svg>`;
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  return doc.documentElement as unknown as SVGSVGElement;
}
