/**
 * Server-only: tag any FAQ-answer paragraph that starts with "Quelle:" (a
 * citation / source-line) with the `.faq-source-note` class so it can be
 * styled as a footnote — smaller, muted, with the link reading as dark
 * underlined inline text instead of the loud green accent.
 *
 * Pure string transform — runs in the FaqQuestion.astro render chain after
 * resolveTitlesInHtml / wrapVerdictCellsWithPills / applyHeatmapBands /
 * applyLesartLegend.
 */

/** Match a paragraph whose content starts with the literal "Quelle:" label.
 *  Non-greedy body so we never swallow subsequent paragraphs. */
const QUELLE_RE = /<p>(\s*Quelle:[\s\S]*?)<\/p>/g;

export function applySourceNote(html: string): string {
  if (!html.includes("Quelle:")) return html;
  return html.replace(QUELLE_RE, (_full, inner: string) => {
    return `<p class="faq-source-note">${inner}</p>`;
  });
}
