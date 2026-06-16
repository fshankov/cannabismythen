/**
 * Server-only: tint the value cells of FAQ answer tables like the Daten-Explorer
 * "Tabelle" heatmap. For each <table>, every cell whose entire content is "NN %"
 * gets a band class (faq-hm--band-0..6) computed from the value via the same
 * bandIndex/thresholds the dashboard uses (blue → coral, low → high). The bold
 * MW (mean, no %) and N (count, no %) rows and the long statement column never
 * match, so only the group percentage cells are tinted. A low→high colour legend
 * is appended after any table that got at least one tinted cell.
 *
 * Pure string transform (no React) — runs in the FaqQuestion.astro render chain
 * after resolveTitlesInHtml / wrapVerdictCellsWithPills.
 */
import { bandIndex } from "./dashboard/lesebeispiel-bands";

const LEGEND_HTML =
  '<div class="faq-hm-legend" aria-hidden="true">' +
  '<span class="faq-hm-legend__label">Korrekte Antwort: Niedriger Anteil</span>' +
  '<span class="faq-hm-legend__bar">' +
  '<span class="faq-hm--band-1"></span>' +
  '<span class="faq-hm--band-2"></span>' +
  '<span class="faq-hm--band-3"></span>' +
  '<span class="faq-hm--band-4"></span>' +
  '<span class="faq-hm--band-5"></span>' +
  '<span class="faq-hm--band-6"></span>' +
  "</span>" +
  '<span class="faq-hm-legend__label">Korrekte Antwort: Hoher Anteil</span>' +
  "</div>";

/** Column widths matching the layout we previously enforced via th:nth-child
 *  rules — moved into a <colgroup> so `table-layout: fixed` reads widths from
 *  columns, NOT from the first row's cells. This lets the spanning suphead row
 *  (colspan=2 + colspan=5) sit ABOVE the regular header row without breaking
 *  the per-column widths. Sum = 30 + 11 + 5×11.8 = 100 %. */
const COLGROUP_HTML =
  "<colgroup>" +
  '<col style="width:30%">' +
  '<col style="width:11%">' +
  '<col style="width:11.8%">' +
  '<col style="width:11.8%">' +
  '<col style="width:11.8%">' +
  '<col style="width:11.8%">' +
  '<col style="width:11.8%">' +
  "</colgroup>";

/** Sub-header row that groups the 5 Zielgruppen columns under one label, matching
 *  the Abschlussbericht Tab. 4.11 structure ("korrekte Antwort, Anteil" above
 *  the group columns; first two columns stay un-grouped). */
const SUPHEAD_HTML =
  '<tr class="faq-hm-suphead">' +
  '<th class="faq-hm-suphead__spacer" colspan="2"></th>' +
  '<th class="faq-hm-suphead__group" colspan="5">Korrekte Antwort, Anteil</th>' +
  "</tr>";

/** A <td> whose entire content is a "NN %" value (the group percentage cells).
 *  Statement cells (long text), MW (decimals, no %) and N (counts) never match. */
const PERCENT_CELL_RE = /<td([^>]*)>\s*(\d+)\s*%\s*<\/td>/g;

export function applyHeatmapBands(html: string): string {
  if (!html.includes("<table")) return html;
  return html.replace(/<table\b[\s\S]*?<\/table>/g, (table) => {
    let tinted = false;
    const out = table.replace(PERCENT_CELL_RE, (_full, attrs: string, num: string) => {
      tinted = true;
      const band = bandIndex(parseInt(num, 10));
      return `<td${attrs} class="faq-hm faq-hm--band-${band}">${num} %</td>`;
    });
    if (!tinted) return table;
    // Heatmap-only layout: tag the table, inject the colgroup (column widths)
    // and the spanning sub-header row, wrap the table in a horizontal-scroll
    // container so `table-layout: fixed` keeps equal-width columns on narrow
    // viewports, then append the legend below the wrap.
    let tagged = out.replace(
      /^<table\b[^>]*>/,
      '<table class="faq-hm-table">' + COLGROUP_HTML,
    );
    tagged = tagged.replace(/<thead>\s*<tr>/, "<thead>" + SUPHEAD_HTML + "<tr>");
    return `<div class="faq-hm-wrap">${tagged}</div>${LEGEND_HTML}`;
  });
}
