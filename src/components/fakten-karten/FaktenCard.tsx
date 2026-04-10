/**
 * FaktenCard — Educational flip card for the Fakten-Karten grid.
 *
 * No quiz interaction (no 4-button answer mechanic).
 * Tap/click flips between front (statement + verdict) and back (summary + link).
 * Reuses quiz card structural CSS for the 3D flip.
 */

import { useState, useCallback } from "react";
import type { MythContentEntry } from "../shared/FactsheetPanel";

export interface FaktenCardMyth {
  mythNumber: number;
  title: string;
  classification: string;
  classificationLabel: string;
  cardSummary: string;
  slug: string;
}

interface FaktenCardProps {
  myth: FaktenCardMyth;
  mythContentEntry?: MythContentEntry;
  onShowFactsheet?: (slug: string) => void;
}

/** Icon for classification verdict bar */
function classificationIcon(classification: string): string {
  if (classification === "richtig" || classification === "eher_richtig") return "\u2713";
  if (classification === "falsch" || classification === "eher_falsch") return "\u2717";
  return "~";
}

export default function FaktenCard({
  myth,
  onShowFactsheet,
}: FaktenCardProps) {
  const [flipped, setFlipped] = useState(false);

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
            <div className={`fakten-card__verdict-bar classification--${myth.classification}`}>
              <span className="fakten-card__verdict-icon">
                {classificationIcon(myth.classification)}
              </span>
              <span className="fakten-card__verdict-label">
                {myth.classificationLabel}
              </span>
            </div>
            <p className="quiz-card__statement">
              {myth.title}
            </p>
            <span className="fakten-card__flip-hint">
              {"\u21A9"} Erklärung
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
              {"\u21A9"} zurück
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
