/**
 * VerdictArrowSymbols — shared `<symbol>` defs for the five verdict-arrow
 * markers used by Punktwolke (StripsView) and Spannweite (SpannweiteView).
 *
 * Drop `<VerdictArrowSymbols />` inside an SVG's `<defs>`; then reference
 * the markers via `<use href="#strips-arrow-{verdict}" />`. The IDs are
 * kept as `strips-arrow-…` for backwards compatibility — Punktwolke
 * already references them under those names.
 *
 * Geometry mirrors the canonical `VerdictArrow` glyph (vertical shaft +
 * chevron + horizontal shadow line, rotated per verdict around (12,12)).
 * Shadow stroke is the lighter verdict shade; shaft + chevron use
 * `currentColor` so the parent `<g style={{ color: ... }}>` drives the
 * main tint.
 */
export default function VerdictArrowSymbols() {
  return (
    <>
      <symbol id="strips-arrow-richtig" viewBox="0 0 24 24" overflow="visible">
        <g
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="rotate(180 12 12)"
        >
          <path d="M2 16h20" stroke="#a7d3c5" />
          <path d="M12 2v14" stroke="currentColor" />
          <path d="m5 9 7 7 7-7" stroke="currentColor" />
        </g>
      </symbol>
      <symbol id="strips-arrow-eher_richtig" viewBox="0 0 24 24" overflow="visible">
        <g
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="rotate(-135 12 12)"
        >
          <path d="M2 16h20" stroke="#c2d3a3" />
          <path d="M12 2v14" stroke="currentColor" />
          <path d="m5 9 7 7 7-7" stroke="currentColor" />
        </g>
      </symbol>
      <symbol id="strips-arrow-eher_falsch" viewBox="0 0 24 24" overflow="visible">
        <g
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="rotate(45 12 12)"
        >
          <path d="M2 16h20" stroke="#e0b58d" />
          <path d="M12 2v14" stroke="currentColor" />
          <path d="m5 9 7 7 7-7" stroke="currentColor" />
        </g>
      </symbol>
      <symbol id="strips-arrow-falsch" viewBox="0 0 24 24" overflow="visible">
        <g
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 16h20" stroke="#e9a8b9" />
          <path d="M12 2v14" stroke="currentColor" />
          <path d="m5 9 7 7 7-7" stroke="currentColor" />
        </g>
      </symbol>
      <symbol id="strips-arrow-keine_aussage_moeglich" viewBox="0 0 24 24" overflow="visible">
        <g
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 16h20" stroke="#94a3b8" />
        </g>
      </symbol>
    </>
  );
}
