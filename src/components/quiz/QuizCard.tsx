/**
 * QuizCard — A single myth card in the quiz grid.
 *
 * Three visual states:
 *   1. Unanswered (front): myth statement only; buttons appear on hover/tap
 *   2. Answered (back): brief explanation + "mehr" button
 *   3. Read-only front: myth statement + classification labels; click flips back
 *
 * Uses real CSS 3D perspective flip (rotateY 180deg).
 * Grid cell has fixed height — no reflow when a card flips.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import type { QuizMyth, Classification, CardAnswer } from "./types";
import { t } from "./i18n";

/** Truncate a string to `max` chars, breaking at word boundary. */
function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  const cut = str.lastIndexOf(" ", max);
  return str.slice(0, cut > 0 ? cut : max) + "\u2026";
}

/** The 4 answer options in display order. */
const ANSWER_OPTIONS: Classification[] = [
  "falsch",
  "eher_falsch",
  "eher_richtig",
  "richtig",
];

interface QuizCardProps {
  myth: QuizMyth;
  index: number;
  total: number;
  answer: CardAnswer | null;
  onAnswer: (mythId: string, chosen: Classification) => void;
  onShowFactsheet?: (myth: QuizMyth) => void;
  /** Statement text from Keystatic content (overrides i18n key) */
  statementText?: string;
  /** Explanation text from Keystatic content (overrides i18n key) */
  explanationText?: string;
}

export default function QuizCard({
  myth,
  index,
  total,
  answer,
  onAnswer,
  onShowFactsheet,
  statementText,
  explanationText,
}: QuizCardProps) {
  const isAnswered = answer !== null;

  // Mobile: track whether buttons are revealed (first tap)
  const [revealed, setRevealed] = useState(false);
  // Read-only flip-back: when answered, toggling shows front or back
  const [showingFront, setShowingFront] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  // Focus management: after answering, focus the result
  useEffect(() => {
    if (isAnswered && resultRef.current && !showingFront) {
      resultRef.current.focus();
    }
  }, [isAnswered, showingFront]);

  const handleCardClick = useCallback(() => {
    if (isAnswered) {
      // Toggle between front (read-only) and back (result)
      setShowingFront((prev) => !prev);
      return;
    }
    // Mobile reveal: first tap reveals buttons
    if (!revealed) {
      setRevealed(true);
    }
  }, [isAnswered, revealed]);

  const handleAnswer = useCallback(
    (e: React.MouseEvent, chosen: Classification) => {
      e.stopPropagation();
      if (!isAnswered) {
        onAnswer(myth.id, chosen);
        setRevealed(false);
        setShowingFront(false);
      }
    },
    [isAnswered, myth.id, onAnswer]
  );

  // Determine flip state: show back when answered AND not toggled to front
  const flipped = isAnswered && !showingFront;

  const correctClass = answer
    ? answer.isCorrect ? "quiz-card--correct" : "quiz-card--incorrect"
    : "";

  return (
    <div
      className="quiz-card__cell"
      role="region"
      aria-label={t("ui.questionLabel", { n: index + 1, total })}
    >
      <div
        className={[
          "quiz-card",
          isAnswered ? "quiz-card--answered" : "",
          correctClass,
          flipped ? "quiz-card--flipped" : "",
          revealed ? "quiz-card--revealed" : "",
        ].filter(Boolean).join(" ")}
        onClick={handleCardClick}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        <div className="quiz-card__inner">
          {/* ── FRONT FACE ──────────────────────────────────────── */}
          <div className="quiz-card__face quiz-card__front">
            <span className="quiz-card__number">
              {index + 1} / {total}
            </span>
            <p className="quiz-card__statement">
              {statementText || t(myth.statementKey)}
            </p>

            {/* After answering: show both classifications on the front */}
            {isAnswered && answer && (
              <div className="quiz-card__front-labels">
                <div className="quiz-card__correct-label">
                  <span className="quiz-card__correct-label-prefix">
                    {t("ui.correctAnswer")}
                  </span>
                  <span
                    className={`classification classification--${myth.correctClassification}`}
                  >
                    {t(`classification.${myth.correctClassification}`)}
                  </span>
                </div>
              </div>
            )}

            {/* Answer buttons — hidden at rest, revealed on hover/tap */}
            {!isAnswered && (
              <div
                className="quiz-card__buttons"
                role="group"
                aria-label="Einordnung wählen"
              >
                {ANSWER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    className={`quiz-card__btn quiz-card__btn--${opt}`}
                    onClick={(e) => handleAnswer(e, opt)}
                    aria-label={`${t(`answer.${opt}`)} — ${statementText || t(myth.statementKey)}`}
                  >
                    {t(`answer.${opt}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── BACK FACE ───────────────────────────────────────── */}
          <div
            ref={resultRef}
            className="quiz-card__face quiz-card__back"
            tabIndex={-1}
            aria-live="polite"
          >
            {isAnswered && answer && (
              <>
                <div className="quiz-card__result-header">
                  <span
                    className={`quiz-card__result-badge ${
                      answer.isCorrect
                        ? "quiz-card__result-badge--correct"
                        : "quiz-card__result-badge--incorrect"
                    }`}
                  >
                    {answer.isCorrect ? t("ui.correct") : t("ui.incorrect")}
                  </span>
                  <span className="quiz-card__number">
                    {index + 1} / {total}
                  </span>
                </div>

                {/* Brief explanation — CSS line-clamp handles truncation */}
                <p className="quiz-card__explanation">
                  {explanationText || t(myth.explanationKey)}
                </p>

                {/* "mehr" button to open full factsheet panel */}
                <button
                  type="button"
                  className="quiz-card__more-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onShowFactsheet) onShowFactsheet(myth);
                  }}
                >
                  {t("ui.moreLink")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
