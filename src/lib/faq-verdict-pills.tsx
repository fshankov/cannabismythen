/**
 * Server-only helper: turn plain-text verdict cells in FAQ answer tables into
 * the canonical <VerdictPill> (arrow glyph + colour + label) — the same element
 * the Daten-Explorer uses — so the scientific verdict reads by colour instead of
 * bare text (ISD feedback "this should be reflected in the table"). The pill is
 * rendered to a static HTML string (no client JS) and spliced into the already
 * server-rendered answer HTML by FaqQuestion.astro.
 *
 * Kept in its own module (not src/lib/faq.ts) so `react-dom/server` never has a
 * path into a client bundle.
 */

import { renderToStaticMarkup } from "react-dom/server";
import VerdictPill from "@components/shared/VerdictPill";

/** The four directional verdicts that can appear as a verdict-cell value. */
type TableVerdict = "richtig" | "eher_richtig" | "eher_falsch" | "falsch";

/** Cell text (lower-cased) → verdict key. */
const CELL_TEXT_TO_VERDICT: Record<string, TableVerdict> = {
  richtig: "richtig",
  "eher richtig": "eher_richtig",
  "eher falsch": "eher_falsch",
  falsch: "falsch",
};

/** Render each pill once — there are only four. */
const pillHtmlCache = new Map<TableVerdict, string>();
function verdictPillHtml(verdict: TableVerdict): string {
  let html = pillHtmlCache.get(verdict);
  if (html === undefined) {
    html = renderToStaticMarkup(<VerdictPill verdict={verdict} size="sm" />);
    pillHtmlCache.set(verdict, html);
  }
  return html;
}

/**
 * Match a <td> whose ENTIRE content is one verdict word (whitespace-padded ok).
 * Alternation is longest-first so "eher falsch" wins over "falsch". The cell's
 * existing attributes are preserved ($1). Case-insensitive.
 */
const VERDICT_CELL_RE =
  /<td([^>]*)>\s*(eher richtig|eher falsch|richtig|falsch)\s*<\/td>/gi;

/**
 * Replace verdict-only <td> cells with the verdict pill. Safe by whole-cell
 * exact match: numeric/percent cells, empty cells (the MW/N summary rows), and
 * the Mythos cells (which contain an <a>) never match; <th> headers are left
 * untouched; a verdict word in prose is never a whole-cell match.
 */
export function wrapVerdictCellsWithPills(html: string): string {
  return html.replace(VERDICT_CELL_RE, (full, attrs: string, word: string) => {
    const verdict = CELL_TEXT_TO_VERDICT[word.toLowerCase()];
    if (!verdict) return full;
    return `<td${attrs}>${verdictPillHtml(verdict)}</td>`;
  });
}
