/**
 * text-wrap — char-count word wrapping for the SVG export renderers.
 *
 * The export renderers build raw SVG strings (no DOM, no pixel
 * measurement), so wrapping uses a character-count budget — the same
 * heuristic the renderers already rely on for single-line `truncate()`.
 * Greedy word wrap into at most `maxLines` lines of ≤ `maxChars` chars;
 * a token longer than the budget, or content that needs more than
 * `maxLines`, is truncated with an ellipsis on the last allowed line.
 * Never returns an empty array (`['']` for empty input) so callers can
 * always render at least one baseline.
 */

function truncateChars(s: string, maxChars: number): string {
  return s.length > maxChars ? s.slice(0, Math.max(1, maxChars - 1)) + '…' : s;
}

export function wrapLabel(text: string, maxChars: number, maxLines = 2): string[] {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (!clean) return [''];

  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    // `candidate` overflows: flush the current line and open a new one.
    if (current) lines.push(current);
    // On the last allowed line, collapse every remaining word into it
    // (truncated with an ellipsis) so nothing silently drops.
    if (lines.length === maxLines - 1) {
      lines.push(truncateChars(words.slice(i).join(' '), maxChars));
      return lines;
    }
    current = word;
  }
  if (current) lines.push(current);
  // Safety: a single token longer than the budget gets ellipsised.
  return lines.slice(0, maxLines).map((l) => truncateChars(l, maxChars));
}

function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Render 1–2 label lines as SVG `<text>` elements, vertically centred on
 * `yMid` (single line → on `yMid`; two lines → stacked ±0.62·fontSize).
 * Shared by the three export renderers so the wrap geometry stays in one place.
 */
export function renderLabelLines(
  lines: string[],
  x: number,
  yMid: number,
  style: { fontSize: number; fontWeight: number; fill: string; opacity?: number; fontFamily?: string },
): string {
  const ff = style.fontFamily ?? 'system-ui,sans-serif';
  const op = style.opacity != null ? ` opacity="${style.opacity}"` : '';
  const attrs = `dominant-baseline="middle" font-family="${ff}" font-size="${style.fontSize}" font-weight="${style.fontWeight}" fill="${style.fill}"${op}`;
  if (lines.length <= 1) {
    return `<text x="${x}" y="${yMid}" ${attrs}>${escXml(lines[0] ?? '')}</text>`;
  }
  const dy = Math.round(style.fontSize * 0.62);
  return (
    `<text x="${x}" y="${yMid - dy}" ${attrs}>${escXml(lines[0])}</text>` +
    `<text x="${x}" y="${yMid + dy}" ${attrs}>${escXml(lines[1])}</text>`
  );
}

