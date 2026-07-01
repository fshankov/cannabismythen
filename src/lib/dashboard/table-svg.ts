/**
 * table-svg — parallel SVG renderer for the two Tabelle views
 * (Mythen-Tabelle and Quellen-Tabelle) so they export as PNG/SVG like the
 * Balken / Übersicht views.
 *
 * A plain data table: row-label column + value columns of pre-formatted
 * display strings. No bars, no value-circles, no bottom axis.
 *
 * Like the circle renderers, it consumes the **display strings the view
 * already computed** (never re-derives values), and reuses the shared
 * `wrapLabel` / `renderLabelLines` helpers for 1–2 line labels with
 * variable row height. Myth rows show the verdict arrow glyph (reused from
 * spannweite-svg); source rows show a small category-colour marker.
 */

import type { Lang, CorrectnessClass } from "./types";
import { wrapLabel, renderLabelLines } from "./text-wrap";
import {
  symbolDefs,
  VERDICT_FG,
  VERDICT_Y_SHIFT,
  GLYPH_SIZE,
} from "./spannweite-svg";

export interface TableSvgRow {
  /** Raw row-label text (myth short text / source name). */
  label: string;
  /** Myths: drives the leading verdict arrow glyph. */
  verdict?: CorrectnessClass;
  /** Sources: category accent colour for the leading marker dot. */
  accent?: string;
  /** Sources: child rows dim + indent. */
  isChild?: boolean;
  /** Pre-formatted display strings, one per column (e.g. "85 %" / "42"). */
  cells: string[];
  /** Per-cell: true → render "k. A." instead of `cells[i]`. */
  naMask: boolean[];
}

export interface TableSvgColumn {
  label: string;
}

export interface TableRenderOpts {
  rows: TableSvgRow[];
  columns: TableSvgColumn[];
  /** Label-column header, e.g. "MYTHEN" / "INFORMATIONSWEGE". */
  labelHeader: string;
  lang: Lang;
}

const TOTAL_W = 1000;
const LABEL_COL_W = 240;
const HEADER_H = 56;
const ROW_H = 32;
const ROW_H_2 = 48; // taller row when a label wraps to 2 lines
const LABEL_MAX_CHARS = 28; // label shares the 240px column with a glyph/marker

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Build the table SVG as a string (no DOM — testable headlessly). */
export function buildTableSvgString(opts: TableRenderOpts): string {
  const { rows, columns, labelHeader } = opts;
  const colCount = columns.length;
  const colW = colCount > 0 ? (TOTAL_W - LABEL_COL_W) / colCount : 0;
  const hasVerdict = rows.some((r) => r.verdict != null);

  // Per-row label wrapping → variable row heights.
  const rowLayouts = rows.map((row) => {
    const lines = wrapLabel(row.label, LABEL_MAX_CHARS, 2);
    return { lines, height: lines.length > 1 ? ROW_H_2 : ROW_H };
  });
  const rowTops: number[] = [];
  let accH = 0;
  for (const rl of rowLayouts) {
    rowTops.push(accH);
    accH += rl.height;
  }
  const bodyH = accH;
  const totalH = HEADER_H + bodyH;

  const parts: string[] = [];

  // Outer frame.
  parts.push(
    `<rect x="0.5" y="0.5" width="${TOTAL_W - 1}" height="${totalH - 1}" fill="#ffffff" stroke="#e5e7eb"/>`,
  );

  // ── Header row ──────────────────────────────────────────────────
  parts.push(`<g class="header">`);
  parts.push(
    `<line x1="0" y1="${HEADER_H}" x2="${TOTAL_W}" y2="${HEADER_H}" stroke="#e5e7eb"/>`,
  );
  parts.push(
    `<text x="${LABEL_COL_W / 2}" y="${HEADER_H / 2}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="11" font-weight="600" letter-spacing="0.04em" fill="#64748b">${escapeXml(labelHeader)}</text>`,
  );
  for (let i = 0; i < colCount; i++) {
    const cx = LABEL_COL_W + i * colW + colW / 2;
    parts.push(
      `<text x="${cx}" y="${HEADER_H / 2}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="600" fill="#0f172a">${escapeXml(columns[i].label)}</text>`,
    );
    const x = LABEL_COL_W + (i + 1) * colW;
    parts.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${HEADER_H}" stroke="#e5e7eb"/>`,
    );
  }
  parts.push(
    `<line x1="${LABEL_COL_W}" y1="0" x2="${LABEL_COL_W}" y2="${HEADER_H}" stroke="#e5e7eb"/>`,
  );
  parts.push(`</g>`);

  // ── Body rows ───────────────────────────────────────────────────
  parts.push(`<g class="body">`);
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const { lines: labelLines, height: rowH } = rowLayouts[r];
    const yTop = HEADER_H + rowTops[r];
    const yMid = yTop + rowH / 2;
    const rowOpacity = row.isChild ? 0.62 : 1;

    if (r % 2 === 1) {
      parts.push(
        `<rect x="0" y="${yTop}" width="${TOTAL_W}" height="${rowH}" fill="#fafbfc"/>`,
      );
    }
    if (r > 0) {
      parts.push(
        `<line x1="0" y1="${yTop}" x2="${TOTAL_W}" y2="${yTop}" stroke="#f1f5f9"/>`,
      );
    }

    // Label cell: verdict glyph (myths) or category marker (sources) + text.
    let labelTextX: number;
    if (row.verdict) {
      const gx = 14;
      const gy = yMid - GLYPH_SIZE / 2 + VERDICT_Y_SHIFT[row.verdict];
      parts.push(
        `<g style="color:${VERDICT_FG[row.verdict]}"><use href="#strips-arrow-${row.verdict}" x="${gx - GLYPH_SIZE / 2}" y="${gy}" width="${GLYPH_SIZE}" height="${GLYPH_SIZE}"/></g>`,
      );
      labelTextX = gx + GLYPH_SIZE / 2 + 8;
    } else if (row.accent) {
      const mx = row.isChild ? 30 : 14;
      parts.push(
        `<circle cx="${mx}" cy="${yMid}" r="5" fill="${row.accent}" opacity="${rowOpacity}"/>`,
      );
      labelTextX = mx + 12;
    } else {
      labelTextX = row.isChild ? 30 : 14;
    }
    parts.push(
      renderLabelLines(labelLines, labelTextX, yMid, {
        fontSize: row.isChild ? 11 : 12,
        fontWeight: row.isChild ? 400 : 500,
        fill: "#0f172a",
        opacity: rowOpacity,
      }),
    );
    parts.push(
      `<line x1="${LABEL_COL_W}" y1="${yTop}" x2="${LABEL_COL_W}" y2="${yTop + rowH}" stroke="#f1f5f9"/>`,
    );

    // Value cells (centred display strings; italic muted "k. A." when null).
    for (let i = 0; i < colCount; i++) {
      const cellX = LABEL_COL_W + i * colW;
      if (i < colCount - 1) {
        parts.push(
          `<line x1="${cellX + colW}" y1="${yTop}" x2="${cellX + colW}" y2="${yTop + rowH}" stroke="#f1f5f9"/>`,
        );
      }
      if (row.naMask[i]) {
        parts.push(
          `<text x="${cellX + colW / 2}" y="${yMid}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="10" font-style="italic" fill="#94a3b8">k. A.</text>`,
        );
      } else {
        parts.push(
          `<text x="${cellX + colW / 2}" y="${yMid}" text-anchor="middle" dominant-baseline="middle" font-family="ui-monospace,'SF Mono',Menlo,monospace" font-size="12" fill="#0f172a" opacity="${rowOpacity}">${escapeXml(row.cells[i] ?? "")}</text>`,
        );
      }
    }
  }
  parts.push(`</g>`);

  const defs = hasVerdict ? `<defs>${symbolDefs()}</defs>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TOTAL_W}" height="${totalH}" viewBox="0 0 ${TOTAL_W} ${totalH}">${defs}${parts.join("")}</svg>`;
}

export function renderTableSvg(opts: TableRenderOpts): SVGSVGElement {
  const svgString = buildTableSvgString(opts);
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  return doc.documentElement as unknown as SVGSVGElement;
}
