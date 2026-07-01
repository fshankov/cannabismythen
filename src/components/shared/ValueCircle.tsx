/**
 * ValueCircle — 22 px solid disc with the rounded integer in white,
 * centered horizontally at `left: value%`.
 *
 * Ported verbatim from `cannabismythen/.../grid/ValueCircle.tsx` so the
 * scrolly's Daten-Explorer dark replica uses the same primitive a 1:1
 * port-back will inherit. Class name `.carm-value-circle` is shared
 * with cannabismythen; the dark surface tokens override the same vars
 * inside `:root`.
 */
import type { CSSProperties } from "react";

interface Props {
  /** 0–100 numeric. Rendered as the rounded integer inside the disc. */
  value: number;
  /** Background colour (verdict colour for Mythen, source-category
   *  colour for Quellen). White text passes contrast on every fill
   *  used today. */
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
