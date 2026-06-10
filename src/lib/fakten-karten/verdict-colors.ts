/**
 * Fakten-Karten verdict visuals — single source of truth for the per-verdict
 * card chrome (gradient background, back-side title color, background arrow).
 *
 * Extracted from Figma node 427-2043 (card front) + 427-3899 (back-side
 * heading colors). Positioning values are percentages of the 320 × 500 card
 * frame (`aspect-ratio: 1 / 1.5625`), so the arrow stays in the same visual
 * position across responsive widths.
 *
 * Each verdict ships its own pre-oriented arrow SVG (↑ ↗ ↘-mirror ↓ —),
 * copied verbatim from the Figma "card-bg-arrow" vectors, so no runtime
 * rotation is needed. `arrowFrame` is the SVG's viewBox mapped onto the
 * 320 × 500 card; the card's `overflow: hidden` clips the strokes that
 * Figma also clips at the card edge. Frame values were verified against
 * pixel-measured Figma renders of all five states.
 */
import type { CorrectnessClass } from "../dashboard/types";

export interface VerdictArrowFrame {
  /** All four are CSS length values (e.g. "46.9%", "10%"). */
  top: string;
  left: string;
  width: string;
  height: string;
}

export interface VerdictVisual {
  /** Card-front background. Bind to `background-image`. */
  gradient: string;
  /** Card-back title text color. */
  headingColor: string;
  /** Background-arrow SVG path. Rendered as `<img>`. */
  arrowSrc: string;
  /** Position + size of the arrow as percentages of the 320 × 500 card. */
  arrowFrame: VerdictArrowFrame;
}

const VERDICT_VISUALS: Record<CorrectnessClass, VerdictVisual> = {
  // ↑ up arrow. SVG viewBox 181×186 → card (0, 234.5).
  richtig: {
    gradient:
      "linear-gradient(-16.44deg, #3D8653 30.5%, #CAE1D2 107.53%, #FFFFFF 123.41%)",
    headingColor: "#3D7360",
    arrowSrc: "/icons/fakten-karten/verdict-arrow-richtig.svg",
    arrowFrame: { top: "46.9%", left: "0%", width: "56.5625%", height: "37.2%" },
  },
  // ↗ diagonal arrow. SVG viewBox 190×280 → card (0, 200).
  eher_richtig: {
    gradient:
      "linear-gradient(-16.47deg, #92B59A 67.2%, #FFFFFF 117.94%, #FFFFFF 136.28%)",
    // Darkened from Figma #92B59A — 3:1 contrast on white (a11y audit
    // 2026-06-10). Keep in sync with --quiz-back-eher-richtig in global.css.
    headingColor: "#6E9A7D",
    arrowSrc: "/icons/fakten-karten/verdict-arrow-eher-richtig.svg",
    arrowFrame: { top: "40%", left: "0%", width: "59.375%", height: "56%" },
  },
  // ↙ diagonal arrow. SVG viewBox 188×280 → card (0, 157.7).
  eher_falsch: {
    gradient:
      "linear-gradient(-17.93deg, #FAAF35 24.93%, #EEA0AF 101.32%, #FFFFFF 125.67%)",
    // Darkened from Figma #FBAF35 — 3:1 contrast on white (a11y audit
    // 2026-06-10). Keep in sync with --quiz-back-eher-falsch in global.css.
    headingColor: "#C47C00",
    arrowSrc: "/icons/fakten-karten/verdict-arrow-eher-falsch.svg",
    arrowFrame: { top: "31.54%", left: "0%", width: "58.75%", height: "56%" },
  },
  // ↓ down arrow. SVG viewBox 181×186 → card (0, 211.5).
  falsch: {
    gradient:
      "linear-gradient(-18.37deg, #AA3B3D 20.1%, #EEA0AF 113.73%, #FFFFFF 131.03%)",
    headingColor: "#C86A7C",
    arrowSrc: "/icons/fakten-karten/verdict-arrow-falsch.svg",
    arrowFrame: { top: "42.3%", left: "0%", width: "56.5625%", height: "37.2%" },
  },
  // — horizontal line. SVG viewBox 186×32 → card (32, 277).
  keine_aussage_moeglich: {
    gradient: "linear-gradient(148.11deg, #CCC4CC 2.19%, #7B7B7B 100%)",
    headingColor: "#7B7B7B",
    arrowSrc: "/icons/fakten-karten/verdict-arrow-none.svg",
    arrowFrame: { top: "55.4%", left: "10%", width: "58.125%", height: "6.4%" },
  },
};

export function getVerdictVisual(verdict: CorrectnessClass): VerdictVisual {
  return VERDICT_VISUALS[verdict];
}
