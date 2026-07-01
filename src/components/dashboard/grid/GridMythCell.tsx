/**
 * GridMythCell — shared "myth identity" cell content used as the
 * left-most cell of every myth row across Spannweite, Balken, and
 * Tabelle.
 *
 * Renders: a small verdict-colored arrow glyph (referencing the shared
 * `#strips-arrow-{verdict}` SVG symbol library) + the myth's short
 * text on a plain background.
 *
 * Headless: returns a fragment. Consumer wraps in <div> (grid views)
 * or <td> (table views) with `carm-spannweite__cell` +
 * `carm-spannweite__cell--label` on the wrapper.
 *
 * The shared SVG symbol library (`<VerdictArrowSymbols />`) must be
 * present somewhere on the page — Spannweite already mounts it once
 * inside the chart container; Balken and Tabelle should mount it too
 * so the `<use href>` references resolve.
 */
import type { CorrectnessClass } from "../../../lib/dashboard/types";
import { getCorrectnessColor } from "../../../lib/dashboard/colors";

interface Props {
  verdict: CorrectnessClass;
  shortText: string;
}

export default function GridMythCell({ verdict, shortText }: Props) {
  const verdictColor = getCorrectnessColor(verdict);
  return (
    <>
      <span
        className="carm-spannweite__row-glyph"
        style={{ color: verdictColor }}
        aria-hidden="true"
      >
        <svg width="14" height="14" viewBox="0 0 24 24">
          <use href={`#strips-arrow-${verdict}`} width="24" height="24" />
        </svg>
      </span>
      <span className="carm-spannweite__row-text">{shortText}</span>
    </>
  );
}
