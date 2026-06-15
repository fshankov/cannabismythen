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
 * after resolveTitlesInHtml / wrapVerdictCellsWithPills / injectMythPriorityGrid.
 */
import { bandIndex } from "./dashboard/lesebeispiel-bands";

const LEGEND_HTML =
  '<div class="faq-hm-legend" aria-hidden="true">' +
  '<span class="faq-hm-legend__label">weniger bekannt</span>' +
  '<span class="faq-hm-legend__bar">' +
  '<span class="faq-hm--band-1"></span>' +
  '<span class="faq-hm--band-2"></span>' +
  '<span class="faq-hm--band-3"></span>' +
  '<span class="faq-hm--band-4"></span>' +
  '<span class="faq-hm--band-5"></span>' +
  '<span class="faq-hm--band-6"></span>' +
  "</span>" +
  '<span class="faq-hm-legend__label">bekannter</span>' +
  "</div>";

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
    // Mark the table so heatmap-only layout rules apply just here, wrap it in a
    // horizontal-scroll container so `table-layout: fixed` keeps equal-width
    // columns at narrow viewports, then append the legend below the wrap.
    const tagged = out.replace(/^<table\b[^>]*>/, '<table class="faq-hm-table">');
    return `<div class="faq-hm-wrap">${tagged}</div>${LEGEND_HTML}`;
  });
}
