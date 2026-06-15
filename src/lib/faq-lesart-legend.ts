/**
 * Server-only: polish the FAQ Lesart legend line.
 *
 * Targets any paragraph rendered from `**Lesart:** blau = … lila = …` and:
 *   1. Tags the <p> with `faq-lesart` (smaller font, secondary colour).
 *   2. Wraps the words "blau" / "lila" in coloured spans that carry a leading
 *      dot in the matching colour (the same blue/purple as the table membership
 *      dots in global.css), so the legend's swatch and the cells line up
 *      visually without the editor having to write HTML.
 *
 * Pure string transform — runs in the FaqQuestion.astro render chain after
 * resolveTitlesInHtml / wrapVerdictCellsWithPills.
 */

/** Match a paragraph whose content starts with the bold "Lesart:" label.
 *  Non-greedy body so we never swallow subsequent paragraphs. */
const LESART_RE = /<p>(\s*<strong>Lesart:<\/strong>[\s\S]*?)<\/p>/g;

export function applyLesartLegend(html: string): string {
  if (!html.includes("<strong>Lesart:</strong>")) return html;
  return html.replace(LESART_RE, (_full, inner: string) => {
    const styled = inner
      .replace(/\bblau\b/g, '<span class="faq-lesart-shared">blau</span>')
      .replace(/\blila\b/g, '<span class="faq-lesart-diff">lila</span>');
    return `<p class="faq-lesart">${styled}</p>`;
  });
}
