/**
 * FaktenCard — editorial card surface on /fakten-karten/.
 *
 * Single `<button>` that opens the FactsheetPanel popup on click. On
 * desktop hover the card performs a 3D flip on the Y axis: the front
 * face (statement + category footer) rotates out and the back face
 * (cardSummary + "Tippen für mehr →" CTA) rotates in. Touch / no-hover
 * devices skip the flip entirely (handled in CSS) and tap goes
 * straight to the popup.
 *
 * Front-face chrome is verdict-coloured (gradient background + faint
 * background arrow indicating direction), per Figma 427-2043
 * (Design-Preferences, 2026-05-28). Category color stays alive only in
 * the filter UI; on the card itself, only the verdict matters.
 *
 * Statistics live ONLY inside the FactsheetPanel popup — cards never
 * show data viz.
 */

import { useCallback, type CSSProperties } from "react";
import CategoryFooter from "./CategoryFooter";
import VerdictPill from "../shared/VerdictPill";
import { getVerdictVisual } from "../../lib/fakten-karten/verdict-colors";
import type { CorrectnessClass } from "../../lib/dashboard/types";

export interface FaktenCardMyth {
  mythNumber: number;
  title: string;
  classification: string;
  /**
   * Conversational label from Keystatic (e.g. "Das stimmt nicht.").
   * Retained on the type for backwards compatibility; not rendered.
   */
  classificationLabel: string;
  /** Popup "Synthese" copy. Read by FactsheetPanel, NOT by the card back. */
  cardSummary: string;
  /** ISD-finalised short summary (Zusammenfassung 2026-05-20). Rendered on
   *  the card back; intentionally distinct from cardSummary so the popup
   *  shows a different perspective when the user taps in. */
  cardShortSummary: string;
  slug: string;
}

interface FaktenCardProps {
  myth: FaktenCardMyth;
  /** Drives the CategoryFooter rendered at the bottom of each face. */
  categoryGroup: string;
  onShowFactsheet?: (slug: string) => void;
}

const VALID_VERDICTS: ReadonlySet<CorrectnessClass> = new Set([
  "richtig",
  "eher_richtig",
  "eher_falsch",
  "falsch",
  "no_classification",
]);

function toVerdict(raw: string): CorrectnessClass {
  return VALID_VERDICTS.has(raw as CorrectnessClass)
    ? (raw as CorrectnessClass)
    : "no_classification";
}

export default function FaktenCard({
  myth,
  categoryGroup,
  onShowFactsheet,
}: FaktenCardProps) {
  const verdict = toVerdict(myth.classification);
  const visual = getVerdictVisual(verdict);

  const handleClick = useCallback(() => {
    if (onShowFactsheet) onShowFactsheet(myth.slug);
  }, [onShowFactsheet, myth.slug]);

  const frontFaceStyle: CSSProperties = {
    backgroundImage: visual.gradient,
  };
  const arrowStyle: CSSProperties = {
    top: visual.arrowFrame.top,
    left: visual.arrowFrame.left,
    width: visual.arrowFrame.width,
    height: visual.arrowFrame.height,
    transform: visual.arrowTransform,
  };
  // Phase-3-ready: back face consumes this var for its verdict-tinted
  // title. Set now so Phase 3 only adds CSS rules.
  const backFaceStyle = {
    "--verdict-heading-color": visual.headingColor,
  } as CSSProperties;

  return (
    <div className="quiz-card__cell">
      <button
        type="button"
        className="fakten-card"
        onClick={handleClick}
        aria-label={`${myth.title} — Factsheet öffnen`}
      >
        <div className="fakten-card__inner">
          <div
            className="fakten-card__face fakten-card__face--front"
            style={frontFaceStyle}
          >
            <span
              className="fakten-card__bg-arrow"
              style={arrowStyle}
              aria-hidden="true"
            >
              <img src={visual.arrowSrc} alt="" />
            </span>
            <div className="fakten-card__face-body">
              <p className="fakten-card__statement">{myth.title}</p>
              <CategoryFooter categoryGroup={categoryGroup} tone="on-color" />
            </div>
          </div>
          <div
            className="fakten-card__face fakten-card__face--back"
            style={backFaceStyle}
          >
            <div className="fakten-card__face-body">
              <p className="fakten-card__back-title">{myth.title}</p>
              <span className="fakten-card__back-badge">
                <VerdictPill verdict={verdict} size="sm" />
              </span>
              <p className="fakten-card__summary">
                {myth.cardShortSummary || myth.cardSummary}
              </p>
              <span className="fakten-card__cta">Tippen für mehr →</span>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
