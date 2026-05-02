/**
 * Helpers for working with the 42 myth entries from the
 * `zahlenUndFakten` collection.
 *
 * The hero block on the homepage scatters all myth statements across
 * a dark canvas. The full Keystatic title is "Mythos N: <statement>." —
 * we don't want the "Mythos N: " prefix or the trailing period in the
 * scattered field; just the bare statement. The (a)/(b) markers used in
 * dual-myth titles (e.g. "Mythos 31/32") are also visual noise on the
 * hero, so we strip them too.
 *
 * Some real titles run very long (>90 chars). On the hero these would
 * shrink to ~9px and become illegible. We handle that by truncating at
 * the first natural clause break (comma, " und ") or at a word boundary
 * within ~58 chars — never paraphrasing, only trimming. The full
 * statement is still authoritative on the myth detail page.
 *
 * Keeping this transform in one place means the homepage shows the same
 * statement copy that lives in the .mdoc — no editorial paraphrasing,
 * no drift from source of truth.
 */

const HERO_LABEL_SOFT_LIMIT = 58; // soft target before we look for a clause break
const HERO_LABEL_HARD_LIMIT = 72; // beyond this we always shorten

/**
 * Strip the "Mythos N: " prefix, "(a)/(b)" markers, and trailing period
 * from a raw .mdoc title. Returns the bare statement.
 */
function stripTitleChrome(title: string): string {
  let text = title.trim();

  // Strip "Mythos N: " or "Mythos N/M: " prefix.
  text = text.replace(/^Mythos\s+\d+(?:\/\d+)?\s*:\s*/i, "");

  // Strip "(a)" / "(b)" / "(c)" parenthetical markers used in dual-myth titles.
  text = text.replace(/\s*\([a-z]\)/gi, "");

  // Strip trailing period (titles in the .mdoc are inconsistent — some end in ".",
  // some don't; the hero treats them as labels not sentences, so drop the period).
  text = text.replace(/[.\s]+$/, "");

  // Collapse any double spaces left by the parenthetical strip.
  text = text.replace(/\s{2,}/g, " ");

  return text.trim();
}

/**
 * Truncate at the last word boundary that fits inside `limit`. Adds a
 * Unicode ellipsis if the result is shorter than the input.
 */
function truncateAtWord(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const slice = text.slice(0, limit);
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed = (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).replace(/[.,;:\s]+$/, "");
  return `${trimmed}…`;
}

/**
 * Turn a raw .mdoc title into the bare statement we want to display
 * on the hero canvas.
 *
 * Examples:
 *   "Mythos 1: Cannabis ist ein Allheilmittel."
 *     → "Cannabis ist ein Allheilmittel"
 *   "Mythos 11: Cannabiskonsum bewirkt Übelkeit und Erbrechen"
 *     → "Cannabiskonsum bewirkt Übelkeit und Erbrechen"
 *   "Mythos 31/32: Cannabiskonsum entspannt (a) und macht nicht aggressiv (b)"
 *     → "Cannabiskonsum entspannt und macht nicht aggressiv"
 *   "Mythos 41/42: Neues Gesetz wird Anstieg des Cannabiskonsums bewirken (a),
 *                  insbesondere bei Minderjährigen (b)"
 *     → "Neues Gesetz wird Anstieg des Cannabiskonsums bewirken"
 *   "Mythos 3: Cannabiskonsum durch Heranwachsende führt in stärkerem Maße als
 *              bei Erwachsenen zu gesundheitlichen Schäden."
 *     → "Cannabiskonsum durch Heranwachsende führt in stärkerem Maße…"
 */
export function deriveHeroLabel(title: string): string {
  const text = stripTitleChrome(title);

  // Short enough — return verbatim.
  if (text.length <= HERO_LABEL_SOFT_LIMIT) return text;

  // 1. Try first comma (cleanest natural break in German prose).
  const commaIdx = text.indexOf(",");
  if (commaIdx > 12 && commaIdx <= HERO_LABEL_HARD_LIMIT) {
    return text.slice(0, commaIdx).trim();
  }

  // 2. Try first " und " (also a natural clause join in German).
  const undIdx = text.toLowerCase().indexOf(" und ");
  if (undIdx > 12 && undIdx <= HERO_LABEL_HARD_LIMIT) {
    return text.slice(0, undIdx).trim();
  }

  // 3. Hard fallback: truncate at last word boundary inside the soft limit.
  return truncateAtWord(text, HERO_LABEL_SOFT_LIMIT);
}
