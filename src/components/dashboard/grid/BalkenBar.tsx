/**
 * BalkenBar — shared bar primitive for the Daten-Explorer's Balken
 * views (Mythen + Quellen). v2 redesign (2026-05-26).
 *
 * Visual contract:
 *   - dotted axis guides at 0/25/50/75/100 % behind the bar
 *   - translucent wash from 0 → value % at `--carm-balken-wash-opacity`
 *   - shared `ValueCircle` marker (22 px solid circle centered at
 *     value %, with the rounded number inside in white) capping the
 *     wash — the wash terminates at the circle's center, so the
 *     circle's left half overlaps the end of the wash and the right
 *     half extends past as a soft cap
 *
 * `value === null` → italic "k. A." centered in the cell.
 * `value === 0`     → just the axis ticks (no wash, no circle).
 *
 * Headless: returns a single `.carm-balken__plot` div containing all
 * the layered pieces. The consumer renders the outer
 * `.carm-spannweite__cell--plot` wrapper.
 */
import ValueCircle from "./ValueCircle";

interface Props {
  /** Value to plot (0–100). `null` → italic "k. A." placeholder. */
  value: number | null;
  /** CSS color for the wash + circle. Verdict color (Mythen) or
   *  source-category color (Quellen). */
  accent: string;
}

export default function BalkenBar({ value, accent }: Props) {
  if (value === null) {
    return (
      <div className="carm-balken__plot">
        <BalkenAxis />
        <span className="carm-spannweite__no-data" aria-hidden="true">
          k. A.
        </span>
      </div>
    );
  }

  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="carm-balken__plot">
      <BalkenAxis />
      {clamped > 0 && (
        <div
          className="carm-balken__wash"
          style={{ width: `${clamped}%`, background: accent }}
          aria-hidden="true"
        />
      )}
      <ValueCircle value={value} accent={accent} />
    </div>
  );
}

/** Dotted vertical guides at 0 / 25 / 50 / 75 / 100 %. Layered behind
 *  the wash via the `.carm-balken__axis` CSS rule. Static element. */
function BalkenAxis() {
  return (
    <div className="carm-balken__axis" aria-hidden="true">
      <span className="carm-balken__axis-tick" data-pos="0" />
      <span className="carm-balken__axis-tick" data-pos="25" />
      <span
        className="carm-balken__axis-tick"
        data-pos="50"
        data-emphasis="mid"
      />
      <span className="carm-balken__axis-tick" data-pos="75" />
      <span className="carm-balken__axis-tick" data-pos="100" />
    </div>
  );
}
