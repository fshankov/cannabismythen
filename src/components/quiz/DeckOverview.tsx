/**
 * DeckOverview — bottom-sheet overview of all questions in the deck.
 *
 * Triggered by the "Übersicht aller {n} Fragen" button in QuizPlayer.
 * Renders one tile per myth, coloured by the user's distance from the
 * correct classification (or "open" if not answered yet). Clicking a tile
 * jumps the player to that question and closes the sheet.
 *
 * Mounted via React portal so it can escape the QuizPlayer's stacking
 * context. Closes on:
 *  - backdrop click
 *  - the explicit "×" close button
 *  - Esc key (handled at the document level by QuizPlayer)
 */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { CardAnswer, QuizMyth } from "./types";
import { t } from "./i18n";

interface DeckOverviewProps {
  myths: QuizMyth[];
  answers: Record<string, CardAnswer>;
  currentIndex: number;
  onJump: (idx: number) => void;
  onClose: () => void;
  /** Returns the rendered statement for a myth (Keystatic content or
   *  i18n fallback — passed in so this component doesn't need its own
   *  text resolution logic). */
  statementText: (mythId: string) => string;
  /** Returns 0 (correct) / 1 (near) / 2-3 (far) — or null if unanswered.
   *  Same distance calculation as feedbackKey() in QuizCard. */
  distanceOf: (mythId: string) => number | null;
}

export default function DeckOverview({
  myths,
  answers,
  currentIndex,
  onJump,
  onClose,
  statementText,
  distanceOf,
}: DeckOverviewProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Move focus into the panel on mount so the screen reader announces it
  // and Esc/keyboard interactions work without an extra tab.
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.focus();
    }
  }, []);

  // Render via portal so we escape the QuizPlayer stacking context.
  // The portal target is `document.body` — guarded for SSR.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="deck-overview"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deck-overview-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="deck-overview__panel"
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="deck-overview__header">
          <h3
            id="deck-overview-title"
            className="deck-overview__title"
          >
            {t("ui.deckOverview.title", { n: myths.length })}
          </h3>
          <button
            type="button"
            className="deck-overview__close"
            onClick={onClose}
            aria-label={t("ui.close")}
          >
            ×
          </button>
        </div>

        <ol className="deck-overview__grid">
          {myths.map((m, i) => {
            const a = answers[m.id];
            const dist = distanceOf(m.id);
            const stateClass =
              dist === null
                ? "is-open"
                : dist === 0
                  ? "is-correct"
                  : dist === 1
                    ? "is-near"
                    : "is-far";
            const verdictChip = a
              ? dist === 0
                ? t("ui.feedback.correctShort")
                : dist === 1
                  ? t("ui.feedback.nearShort")
                  : t("ui.feedback.farShort")
              : null;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  className={[
                    "deck-overview__card",
                    stateClass,
                    i === currentIndex ? "is-current" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    onJump(i);
                    onClose();
                  }}
                  aria-current={i === currentIndex ? "step" : undefined}
                >
                  <span className="deck-overview__num">
                    {String(i + 1).padStart(2, "0")} /{" "}
                    {String(myths.length).padStart(2, "0")}
                  </span>
                  <span className="deck-overview__stmt">
                    {statementText(m.id)}
                  </span>
                  {verdictChip && (
                    <span className="deck-overview__verdict-chip">
                      {verdictChip}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>,
    document.body
  );
}
