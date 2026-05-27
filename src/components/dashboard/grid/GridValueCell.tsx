/**
 * GridValueCell — Spannweite lollipop cell (v2, 2026-05-26).
 *
 * Renders two pieces:
 *   - a 2 px verdict-colored stem from 0 → value % (`.carm-spannweite__bar`)
 *   - the shared `ValueCircle` (22 px solid circle centered at value %,
 *     with the rounded number inside in white)
 *
 * The v0/v1 hybrid (12 px dot + floating number above) was retired in
 * v2 — both Balken and Spannweite now share the same `ValueCircle`
 * marker. Spannweite keeps the thin 2 px stem; Balken keeps its
 * translucent wash. Two distinct backgrounds, one shared end-cap.
 *
 * `value === null` renders the italic "k. A." span as before.
 *
 * Headless: returns a fragment for the cell's INNER `.plot` wrapper.
 * Consumer provides the outer cell `<div>` + the inner
 * `.carm-spannweite__plot` div.
 */
import type { CorrectnessClass } from '../../../lib/dashboard/types';
import { getCorrectnessColor } from '../../../lib/dashboard/colors';
import ValueCircle from './ValueCircle';

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
  const accent = getCorrectnessColor(verdict);
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <>
      <div
        className="carm-spannweite__bar"
        style={{ width: `${clamped}%`, background: accent }}
        aria-hidden="true"
      />
      <ValueCircle value={value} accent={accent} />
    </>
  );
}
