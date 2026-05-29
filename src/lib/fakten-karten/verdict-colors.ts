/**
 * Fakten-Karten verdict visuals — single source of truth for the per-verdict
 * card chrome (gradient background, back-side title color, background arrow).
 *
 * Extracted from Figma node 427-2043 (card front) + 427-3899 (back-side
 * heading colors). Positioning values are percentages of the 320 × 500 card
 * frame (`aspect-ratio: 1 / 1.5625`), so the arrow stays in the same visual
 * position across responsive widths.
 */
import type { CorrectnessClass } from "../dashboard/types";

const ARROW_MAIN = "/icons/fakten-karten/verdict-arrow.svg";
const ARROW_LINE = "/icons/fakten-karten/verdict-line.svg";

export interface VerdictArrowFrame {
  /** All four are CSS length values (e.g. "29.2%", "-28.6%"). */
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
  /**
   * Combined transform applied to the arrow wrapper. The Figma source
   * splits this into outer + inner (rotate 180), but the matrix composes
   * cleanly so we ship it as one string.
   */
  arrowTransform: string;
  /** Position + size of the arrow wrapper as percentages of the card. */
  arrowFrame: VerdictArrowFrame;
}

const VERDICT_VISUALS: Record<CorrectnessClass, VerdictVisual> = {
  richtig: {
    gradient:
      "linear-gradient(-16.44deg, #3D8653 30.5%, #CAE1D2 107.53%, #FFFFFF 123.41%)",
    headingColor: "#3D7360",
    arrowSrc: ARROW_MAIN,
    arrowTransform: "rotate(180deg)",
    arrowFrame: { top: "29.2%", left: "-32.2%", width: "144.4%", height: "37.2%" },
  },
  eher_richtig: {
    gradient:
      "linear-gradient(-16.47deg, #92B59A 67.2%, #FFFFFF 117.94%, #FFFFFF 136.28%)",
    headingColor: "#92B59A",
    arrowSrc: ARROW_MAIN,
    arrowTransform: "rotate(-135deg) scaleY(-1) rotate(180deg)",
    arrowFrame: { top: "38.2%", left: "-35.9%", width: "97.2%", height: "62.2%" },
  },
  eher_falsch: {
    gradient:
      "linear-gradient(-17.93deg, #FAAF35 24.93%, #EEA0AF 101.32%, #FFFFFF 125.67%)",
    headingColor: "#FBAF35",
    arrowSrc: ARROW_MAIN,
    arrowTransform: "rotate(135deg) rotate(180deg)",
    arrowFrame: { top: "27%", left: "-36.6%", width: "97.2%", height: "62.2%" },
  },
  falsch: {
    gradient:
      "linear-gradient(-18.37deg, #AA3B3D 20.1%, #EEA0AF 113.73%, #FFFFFF 131.03%)",
    headingColor: "#C86A7C",
    arrowSrc: ARROW_MAIN,
    arrowTransform: "scaleY(-1) rotate(180deg)",
    arrowFrame: { top: "24.6%", left: "-32.2%", width: "144.4%", height: "37.2%" },
  },
  // Figma "topic=none" (node 427-2100) uses the same vertical-line SVG as
  // the other arrows, wrapped in a `-rotate-90` element. We replicate that
  // here by sizing the wrapper tall-thin (32.096 × 186 in Figma px) and
  // positioning it so rotate(-90deg) around centre lands the rotated
  // bounding box at the visual slot (left:32 top:277 w:186 h:32.096 on a
  // 320 × 500 card). See plan file for the centre-of-rotation math.
  no_classification: {
    gradient: "linear-gradient(148.11deg, #CCC4CC 2.19%, #7B7B7B 100%)",
    headingColor: "#7B7B7B",
    arrowSrc: ARROW_LINE,
    arrowTransform: "rotate(-90deg)",
    arrowFrame: { top: "40%", left: "34.06%", width: "10.03%", height: "37.2%" },
  },
};

export function getVerdictVisual(verdict: CorrectnessClass): VerdictVisual {
  return VERDICT_VISUALS[verdict];
}
