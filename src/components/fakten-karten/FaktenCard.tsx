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
 * Statistics live ONLY inside the FactsheetPanel popup — cards never
 * show data viz.
 */

import { useCallback } from "react";
import VerdictStatement from "../shared/VerdictStatement";
import CategoryFooter from "./CategoryFooter";
import { getCategoryMeta } from "../../lib/fakten-karten/categories";
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
  /** Required for category coloring + footer rendering. */
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
  const meta = getCategoryMeta(categoryGroup);

  const handleClick = useCallback(() => {
    if (onShowFactsheet) onShowFactsheet(myth.slug);
  }, [onShowFactsheet, myth.slug]);

  // Both faces render their own left-edge stripe so the category color
  // signal stays continuous across the flip — without it, the back of
  // the card would lose its category identity mid-rotation.
  const stripe = (
    <span
      className="fakten-card__stripe"
      style={{ background: meta.strip }}
      aria-hidden="true"
    />
  );

  return (
    <div className="quiz-card__cell">
      <button
        type="button"
        className="fakten-card"
        onClick={handleClick}
        aria-label={`${myth.title} — Factsheet öffnen`}
      >
        <div className="fakten-card__inner">
          <div className="fakten-card__face fakten-card__face--front">
            {stripe}
            <div className="fakten-card__face-body">
              <VerdictStatement
                statement={myth.title}
                verdict={verdict}
                as="p"
                className="fakten-card__statement"
              />
              <CategoryFooter categoryGroup={categoryGroup} />
            </div>
          </div>
          <div className="fakten-card__face fakten-card__face--back">
            {stripe}
            <div className="fakten-card__face-body">
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
