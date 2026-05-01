/**
 * FaktenCard — Educational flip card for the Fakten-Karten grid.
 *
 * No quiz interaction (no 4-button answer mechanic).
 * Tap/click flips between front (statement + verdict) and back (summary + link).
 * Reuses quiz card structural CSS for the 3D flip.
 *
 * The card uses the canonical verdict iconography (`<VerdictArrow>`) and
 * canonical labels (Richtig / Eher richtig / Eher falsch / Falsch) so the
 * card matches every other verdict surface on the site. The conversational
 * `classificationLabel` field on each myth's `.mdoc` is intentionally
 * IGNORED here in favour of the canonical label — see Stage 1 of the
 * Daten-Explorer refactor.
 */

import { useState, useCallback } from "react";
import VerdictArrow from "../shared/VerdictArrow";
import type { CorrectnessClass } from "../../lib/dashboard/types";
import type { MythContentEntry } from "../shared/FactsheetPanel";

export interface FaktenCardMyth {
  mythNumber: number;
  title: string;
  classification: string;
  /**
   * Conversational label from Keystatic (e.g. "Das stimmt nicht.").
   * Retained on the type for backwards compatibility but not rendered —
   * Stage 1 of the Daten-Explorer refactor unified all verdict labels.
   */
  classificationLabel: string;
  cardSummary: string;
  slug: string;
}

interface FaktenCardProps {
  myth: FaktenCardMyth;
  mythContentEntry?: MythContentEntry;
  onShowFactsheet?: (slug: string) => void;
}

const VALID_VERDICTS: ReadonlySet<CorrectnessClass> = new Set([
  "richtig",
  "eher_richtig",
  "eher_falsch",
  "falsch",
  "no_classification",
]);

/** Canonical German labels for each verdict. Mirrors `verdict.*` in
 *  `src/lib/dashboard/translations.ts` and `classification.*` in
 *  `src/components/quiz/i18n.ts` — keep in sync. */
const VERDICT_LABEL: Record<CorrectnessClass, string> = {
  richtig: "Richtig",
  eher_richtig: "Eher richtig",
  eher_falsch: "Eher falsch",
  falsch: "Falsch",
  no_classification: "Keine Aussage möglich",
};

function toVerdict(raw: string): CorrectnessClass {
  return VALID_VERDICTS.has(raw as CorrectnessClass)
    ? (raw as CorrectnessClass)
    : "no_classification";
}

export default function FaktenCard({
  myth,
  onShowFactsheet,
}: FaktenCardProps) {
  const [flipped, setFlipped] = useState(false);
  const verdict = toVerdict(myth.classification);
  const verdictLabel = VERDICT_LABEL[verdict];

  const handleFlip = useCallback(() => {
    setFlipped((prev) => !prev);
  }, []);

  return (
    <div className="quiz-card__cell">
      <div
        className={`quiz-card fakten-card ${flipped ? "quiz-card--flipped" : ""}`}
        onClick={handleFlip}
        tabIndex={0}
        role="button"
        aria-label={`${myth.title} — ${flipped ? "Erklärung" : "Karte umdrehen"}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleFlip();
          }
        }}
      >
        <div className="quiz-card__inner">
          {/* ── FRONT FACE ── */}
          <div className="quiz-card__face quiz-card__front fakten-card__front">
            <div
              className={`fakten-card__verdict-bar classification--${verdict}`}
            >
              <span className="fakten-card__verdict-icon" aria-hidden="true">
                <VerdictArrow verdict={verdict} size={14} strokeWidth={2.5} />
              </span>
              <span className="fakten-card__verdict-label">
                {verdictLabel}
              </span>
            </div>
            <p className={`quiz-card__statement statement--${verdict}`}>
              {myth.title}
            </p>
            <span className="fakten-card__flip-hint">
              {"↩"} Erklärung
            </span>
          </div>

          {/* ── BACK FACE ── */}
          <div className="quiz-card__face quiz-card__back fakten-card__back">
            <p className="fakten-card__summary">
              {myth.cardSummary}
            </p>
            <button
              type="button"
              className="quiz-card__more-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onShowFactsheet) onShowFactsheet(myth.slug);
              }}
            >
              mehr erfahren &rarr;
            </button>
            <span className="fakten-card__flip-hint">
              {"↩"} zurück
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
