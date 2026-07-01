/**
 * ValueCircle — shared value-marker for the Daten-Explorer's bar / lollipop
 * views (2026-05-26 v2). A solid circle centered on the value position,
 * with the rounded value rendered inside in white.
 *
 * Used by:
 *   - BalkenBar — sits at the right edge of the translucent wash
 *   - GridValueCell — sits at the end of the 2 px Spannweite stem
 *   - SourcesSpannweiteView — same as GridValueCell, for the Quellen
 *     side
 *
 * Visual contract: the circle's CENTER is at `left: <value>%`, so the
 * left half overlaps the end of any bar/stem and the right half extends
 * past — giving the "soft cap" Fedor wanted in v2. The cell wrapper's
 * `overflow: hidden` naturally clips the circle at the column edges
 * when `value` is very small or very close to 100 %.
 *
 * Headless: returns one absolute-positioned `<div>`. The consumer
 * provides the relatively-positioned parent (the cell or `.plot`
 * wrapper). No `null` handling — the caller decides what to render for
 * `value === null` or `value === 0` (typically "k. A." or "0").
 */
import type { CSSProperties } from "react";

interface Props {
  /** Value to render inside the circle (0–100). Rounded to integer. */
  value: number;
  /** Background color. Verdict color for Mythen, source-category color
   *  for Quellen. White text always passes contrast at full opacity
   *  against all 5 verdict + 6 source-category colors in use. */
  accent: string;
}

export default function ValueCircle({ value, accent }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const style: CSSProperties = {
    left: `${clamped}%`,
    background: accent,
  };
  return (
    <div className="carm-value-circle" style={style} aria-hidden="true">
      {Math.round(value)}
    </div>
  );
}
