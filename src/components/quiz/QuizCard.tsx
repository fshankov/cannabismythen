/**
 * QuizCard — A single myth card in the quiz grid.
 *
 * States:
 *   1. Unanswered: shows myth statement + 4/5 answer buttons
 *   2. Answered (correct): green tint, shows explanation + population comparison
 *   3. Answered (incorrect): warm red/amber tint, shows explanation + comparison
 *
 * The card uses a CSS flip transition (respects prefers-reduced-motion).
 * After answering, the card is locked and cannot be re-answered.
 */

import { useRef, useEffect, useCallback } from "react";
import type { QuizMyth, Classification, CardAnswer } from "./types";
import { t } from "./i18n";

/** All possible answer values in display order. */
const ANSWER_OPTIONS: Classification[] = [
  "falsch",
  "eher_falsch",
  "eher_richtig",
  "richtig",
  "keine_aussage",
];

/** The 4 primary answer options (no "keine_aussage"). */
const PRIMARY_OPTIONS: Classification[] = [
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
}

export default function QuizCard({
  myth,
  index,
  total,
  answer,
  onAnswer,
}: QuizCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isAnswered = answer !== null;

  // Focus management: after answering, move focus to the card result
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isAnswered && resultRef.current) {
      resultRef.current.focus();
    }
  }, [isAnswered]);

  const handleAnswer = useCallback(
    (chosen: Classification) => {
      if (!isAnswered) {
        onAnswer(myth.id, chosen);
      }
    },
    [isAnswered, myth.id, onAnswer]
  );

  // Determine which answer options to show
  const showKeineAussage = myth.correctClassification === "keine_aussage";
  const options = showKeineAussage ? ANSWER_OPTIONS : PRIMARY_OPTIONS;

  // Classification CSS modifier
  const classificationClass = answer
    ? `quiz-card--${answer.isCorrect ? "correct" : "incorrect"}`
    : "";

  return (
    <div
      ref={cardRef}
      className={`quiz-card ${classificationClass} ${isAnswered ? "quiz-card--answered" : ""}`}
      role="region"
      aria-label={t("ui.questionLabel", { n: index + 1, total })}
    >
      {/* ── Front: Question ──────────────────────────────────────── */}
      <div className={`quiz-card__face quiz-card__front ${isAnswered ? "quiz-card__face--hidden" : ""}`}>
        <span className="quiz-card__number">
          {index + 1} / {total}
        </span>
        <p className="quiz-card__statement">{t(myth.statementKey)}</p>

        <div className="quiz-card__buttons" role="group" aria-label="Einordnung wählen">
          {options.map((opt) => (
            <button
              key={opt}
              className={`quiz-card__btn quiz-card__btn--${opt}`}
              onClick={() => handleAnswer(opt)}
              disabled={isAnswered}
              aria-label={`${t(`answer.${opt}`)} — ${t(myth.statementKey)}`}
            >
              {t(`answer.${opt}`)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Back: Result ─────────────────────────────────────────── */}
      {isAnswered && answer && (
        <div
          ref={resultRef}
          className={`quiz-card__face quiz-card__back`}
          tabIndex={-1}
          aria-live="polite"
        >
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

          <p className="quiz-card__statement quiz-card__statement--small">
            {t(myth.statementKey)}
          </p>

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

          {!answer.isCorrect && (
            <div className="quiz-card__your-answer">
              <span className="quiz-card__your-answer-prefix">
                {t("ui.yourAnswer")}
              </span>
              <span
                className={`classification classification--${answer.chosenClassification}`}
              >
                {t(`classification.${answer.chosenClassification}`)}
              </span>
            </div>
          )}

          <p className="quiz-card__explanation">
            {t(myth.explanationKey)}
          </p>

          <p className="quiz-card__population">
            {myth.populationCorrectPct !== null
              ? t("population.correct", {
                  pct: myth.populationCorrectPct.toFixed(1),
                })
              : t("population.unavailable")}
          </p>

          <a
            href={`/zahlen-und-fakten/${myth.mythPageSlug}/`}
            className="quiz-card__link"
            target="_blank"
            rel="noopener"
          >
            {t("ui.learnMore")} →
          </a>
        </div>
      )}
    </div>
  );
}
