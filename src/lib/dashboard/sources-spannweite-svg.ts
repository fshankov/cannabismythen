/**
 * sources-spannweite-svg — parallel SVG renderer for the
 * Informationsquellen-Spannweite view (sources2).
 *
 * Mirrors `spannweite-svg.ts` but:
 *   - No verdict-arrow `<symbol>` defs — cell marker is a filled
 *     `<circle>` in the row's source-category colour.
 *   - Header row carries no interactive trim (sort icon / hide button
 *     are stripped from exports — they're not data).
 *   - Body rows can include both parents and expanded children (the
 *     view component pushes the flattened resolved-row list into
 *     `renderDataRef.current` so the SVG matches what's on screen).
 *   - Child rows render at 0.62 opacity with a 16-px label indent.
 */

import type { Lang } from './types';

interface SourcesSpannweiteRow {
  sourceId: number;
  /** Display name for the row label. */
  name: string;
  /** Bar + circle colour for every cell in this row. */
  categoryColor: string;
  /** Child rows render dimmer and indented. */
  isChild: boolean;
}

interface SourcesSpannweiteColumn {
  id: string;
  label: string;
}

export interface SourcesSpannweiteRenderOpts {
  rows: SourcesSpannweiteRow[];
  columns: SourcesSpannweiteColumn[];
  /** Resolve the value for (sourceId, columnId). Returns `null` for
   *  missing data. */
  cellValue: (sourceId: number, colId: string) => number | null;
  lang: Lang;
}

const TOTAL_W = 1000;
const LABEL_COL_W = 240;
const HEADER_H = 56;
const ROW_H = 32;
const AXIS_H = 26;
const BAR_H = 6;
const CIRCLE_R = 11; // value-circle radius (22px ⌀, matches .carm-value-circle)

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export function renderSourcesSpannweiteSvg(opts: SourcesSpannweiteRenderOpts): SVGSVGElement {
  const { rows, columns, cellValue, lang } = opts;
  const colCount = columns.length;
  const colW = colCount > 0 ? (TOTAL_W - LABEL_COL_W) / colCount : 0;
  const bodyH = rows.length * ROW_H;
  const totalH = HEADER_H + bodyH + AXIS_H;

  // Per-column clip paths so a value circle at ≈0 / ≈100 is trimmed at
  // the column edge, mirroring the on-screen cell's `overflow:hidden`.
  const clipDefs = columns
    .map((_, i) => {
      const cx = LABEL_COL_W + i * colW;
      return `<clipPath id="src-clip-${i}"><rect x="${cx}" y="${HEADER_H}" width="${colW}" height="${bodyH}"/></clipPath>`;
    })
    .join('');

  const parts: string[] = [];

  // Outer frame.
  parts.push(
    `<rect x="0.5" y="0.5" width="${TOTAL_W - 1}" height="${totalH - 1}" fill="#ffffff" stroke="#e5e7eb"/>`,
  );

  // ── Header row ──────────────────────────────────────────────────
  parts.push(`<g class="header">`);
  parts.push(`<line x1="0" y1="${HEADER_H}" x2="${TOTAL_W}" y2="${HEADER_H}" stroke="#e5e7eb"/>`);
  parts.push(
    `<text x="${LABEL_COL_W / 2}" y="${HEADER_H / 2}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="11" font-weight="600" letter-spacing="0.04em" fill="#64748b">${escapeXml(lang === 'de' ? 'QUELLEN' : 'SOURCES')}</text>`,
  );
  for (let i = 0; i < colCount; i++) {
    const col = columns[i];
    const cx = LABEL_COL_W + i * colW + colW / 2;
    parts.push(
      `<text x="${cx}" y="${HEADER_H / 2}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="600" fill="#0f172a">${escapeXml(col.label)}</text>`,
    );
    const x = LABEL_COL_W + (i + 1) * colW;
    parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${HEADER_H}" stroke="#e5e7eb"/>`);
  }
  parts.push(`<line x1="${LABEL_COL_W}" y1="0" x2="${LABEL_COL_W}" y2="${HEADER_H}" stroke="#e5e7eb"/>`);
  parts.push(`</g>`);

  // ── Body rows ───────────────────────────────────────────────────
  parts.push(`<g class="body">`);
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const color = row.categoryColor;
    const yTop = HEADER_H + r * ROW_H;
    const yMid = yTop + ROW_H / 2;
    const rowOpacity = row.isChild ? 0.62 : 1;

    // Alternating row background.
    if (r % 2 === 1) {
      parts.push(`<rect x="0" y="${yTop}" width="${TOTAL_W}" height="${ROW_H}" fill="#fafbfc"/>`);
    }
    if (r > 0) {
      parts.push(`<line x1="0" y1="${yTop}" x2="${TOTAL_W}" y2="${yTop}" stroke="#f1f5f9"/>`);
    }

    // Row label: name (children indented).
    const labelX = row.isChild ? 30 : 14;
    parts.push(
      `<text x="${labelX}" y="${yMid}" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="${row.isChild ? 11 : 12}" font-weight="${row.isChild ? 400 : 500}" fill="#0f172a" opacity="${rowOpacity}">${escapeXml(truncate(row.name, 38))}</text>`,
    );
    parts.push(`<line x1="${LABEL_COL_W}" y1="${yTop}" x2="${LABEL_COL_W}" y2="${yTop + ROW_H}" stroke="#f1f5f9"/>`);

    // Data cells.
    for (let i = 0; i < colCount; i++) {
      const col = columns[i];
      const value = cellValue(row.sourceId, col.id);
      const cellX = LABEL_COL_W + i * colW;
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
      const innerW = colW - 16;
      const innerLeft = cellX + 8;
      const valueX = innerLeft + (innerW * v) / 100;
      // Bar.
      parts.push(
        `<rect x="${innerLeft}" y="${yMid - BAR_H / 2}" width="${valueX - innerLeft}" height="${BAR_H}" rx="3" fill="${color}" fill-opacity="${0.22 * rowOpacity}"/>`,
      );
      // Value circle (category colour) + centred white number, matching
      // the on-screen ValueCircle; clipped to the column.
      parts.push(`<g clip-path="url(#src-clip-${i})" opacity="${rowOpacity}">`);
      parts.push(
        `<circle cx="${valueX}" cy="${yMid}" r="${CIRCLE_R}" fill="${color}"/>`,
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

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${TOTAL_W}" height="${totalH}" viewBox="0 0 ${TOTAL_W} ${totalH}"><defs>${clipDefs}</defs>${parts.join('')}</svg>`;
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  return doc.documentElement as unknown as SVGSVGElement;
}
