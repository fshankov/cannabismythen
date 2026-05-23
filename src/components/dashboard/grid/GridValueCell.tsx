/**
 * GridValueCell — shared data-cell visual for the lollipop idiom used
 * by Spannweite + Balken. (Informationsquellen 2 uses the same CSS
 * primitives but renders them inline because its cell needs extra
 * chevron / child-row affordances; the visual contract is mirrored
 * there manually.)
 *
 * Renders three pieces (2026-05-23 Polish v7 "V3a-dot + V3b-num" hybrid):
 *   - a 2 px verdict-colored stem from 0 → value %
 *   - a plain solid filled circle at value % (size from the
 *     `--carm-spannweite-dot-size` token, mid-saturation verdict
 *     color via `getCorrectnessFillColor`)
 *   - a small monospace number floating ABOVE the dot at the same
 *     horizontal anchor, sized from `--carm-spannweite-num-size`,
 *     colored verdict-700 via `getCorrectnessColor`, with a white
 *     halo background so the digits stay legible over the stem
 *
 * The dot no longer hosts text inside — the floating number does.
 * This separation lets the dot stay prominent without growing huge
 * enough to fit a 2-digit number, and lets the number scale and
 * reposition independently of the dot via CSS custom properties.
 *
 * `value === null` renders the italic "k. A." span centered in the
 * cell — same styling Spannweite has used for missing data.
 *
 * Headless: returns a fragment for the cell's INNER (`.plot`) wrapper.
 * Consumer provides the outer `<div class="carm-spannweite__cell
 * carm-spannweite__cell--plot">` wrapper + the inner `.carm-spannweite
 * __plot` div, so this component can be slotted into both grid and
 * table consumers without div-soup.
 */
import type { CorrectnessClass } from '../../../lib/dashboard/types';
import {
  getCorrectnessColor,
  getCorrectnessFillColor,
} from '../../../lib/dashboard/colors';

interface Props {
  verdict: CorrectnessClass;
  value: number | null;
}

export default function GridValueCell({ verdict, value }: Props) {
  if (value === null) {
    return (
      <span className="carm-spannweite__no-data" aria-hidden="true">
        k. A.
      </span>
    );
  }
  // 2 px stem keeps the saturated -700 verdict color so the line
  // still reads at a glance. The dot uses the slightly lighter -600
  // (so a future revival of in-dot text would still hit WCAG-AA);
  // today the dot is empty and the number floats above in -700 so
  // the dot+number cluster reads as one verdict-themed mark.
  const stemColor = getCorrectnessColor(verdict);
  const dotColor = getCorrectnessFillColor(verdict);
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <>
      <div
        className="carm-spannweite__bar"
        style={{
          width: `${clamped}%`,
          background: stemColor,
        }}
        aria-hidden="true"
      />
      <div
        className="carm-spannweite__dot"
        style={{
          left: `${clamped}%`,
          background: dotColor,
        }}
        aria-hidden="true"
      />
      <div
        className="carm-spannweite__num"
        style={{
          left: `${clamped}%`,
          color: stemColor,
        }}
        aria-hidden="true"
      >
        {Math.round(value)}
      </div>
    </>
  );
}
