/**
 * GridValueCell — shared data-cell visual for the lollipop idiom used
 * by Spannweite, Balken, and Informationsquellen 2.
 *
 * Renders (2026-05-22 v5 solid-dot redesign):
 *   - a 2px verdict-colored stem from 0 → value%
 *   - an 18px filled circle at value% in the mid-saturation verdict
 *     color (-600 family), with the rounded value rendered in white
 *     11px tabular-nums monospace inside the circle — no border.
 *
 * When `value === null`, renders the italic "k. A." span centered in
 * the cell — same styling Spannweite has used for missing data.
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
  // 2px stem keeps the saturated -700 verdict color so the line
  // still reads at a glance; the dot uses the slightly lighter -600
  // so white 11px text inside passes WCAG-AA contrast.
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
          color: '#ffffff',
        }}
        aria-hidden="true"
      >
        {Math.round(value)}
      </div>
    </>
  );
}
