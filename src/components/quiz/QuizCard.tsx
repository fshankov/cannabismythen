/**
 * QuizCard — A single myth question rendered as a flippable card.
 *
 * Used in the one-question-at-a-time flow inside QuizPlayer.
 * Front face: myth statement + 4 answer buttons (always visible).
 * Back face (after answering): three-tier feedback message, the myth statement
 * with the evidence-based verdict, a 2-sentence explanation, the population
 * comparison line, and a "Nächste Frage" CTA.
 *
 * Answer button order is randomized per myth (deterministic by myth.id) so
 * users cannot pattern-match "Richtig" → correct for true myths.
 */

import { useEffect, useMemo, useRef } from "react";
import type { QuizMyth, Classification, CardAnswer } from "./types";
import { t } from "./i18n";

const ALL_OPTIONS: Classification[] = [
  "falsch",
  "eher_falsch",
  "eher_richtig",
  "richtig",
];

/** Stable hash for deterministic randomization. */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Deterministic Fisher-Yates shuffle seeded by `seed`. */
function shuffleStable<T>(arr: readonly T[], seed: number): T[] {
  const out = [...arr];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Ordinal scale used for distance-based feedback. */
const CLASS_POS: Record<Classification, number> = {
  richtig: 1,
  eher_richtig: 2,
  eher_falsch: 3,
  falsch: 4,
};

/** Three-tier feedback by ordinal distance. */
function feedbackKey(chosen: Classification, correct: Classification): string {
  const d = Math.abs(CLASS_POS[chosen] - CLASS_POS[correct]);
  if (d === 0) return "ui.feedback.correct";
  if (d === 1) return "ui.feedback.near";
  return "ui.feedback.far";
}

interface QuizCardProps {
  myth: QuizMyth;
  index: number;
  total: number;
  answer: CardAnswer | null;
  onAnswer: (mythId: string, chosen: Classification) => void;
  onNext: () => void;
  onShowFactsheet?: (myth: QuizMyth) => void;
  isLastQuestion: boolean;
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
  onNext,
  onShowFactsheet,
  isLastQuestion,
  statementText,
  explanationText,
}: QuizCardProps) {
  const isAnswered = answer !== null;
  const flipped = isAnswered;
  const resultRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  const statement = statementText || t(myth.statementKey);
  const explanation = explanationText || t(myth.explanationKey);

  // Stable per-myth answer order (deterministic so reload doesn't shuffle)
  const orderedOptions = useMemo(
    () => shuffleStable(ALL_OPTIONS, hashCode(myth.id)),
    [myth.id]
  );

  // Focus the back when the user answers (announces feedback).
  useEffect(() => {
    if (isAnswered && resultRef.current) {
      resultRef.current.focus();
    }
  }, [isAnswered, myth.id]);

  const handleAnswerClick = (chosen: Classification) => {
    if (!isAnswered) onAnswer(myth.id, chosen);
  };

  const correctClass = answer
    ? answer.isCorrect
      ? "quiz-card--correct"
      : "quiz-card--incorrect"
    : "";

  const feedbackText = answer
    ? t(feedbackKey(answer.chosenClassification, myth.correctClassification))
    : "";

  const verdictPhrase = t(
    `ui.classificationPhrase.${myth.correctClassification}`
  );
  const mythVerdict = t("ui.mythVerdict", {
    statement,
    verdict: verdictPhrase,
  });

  const populationLine =
    typeof myth.populationCorrectPct === "number"
      ? t("ui.populationLine", {
          pct: Math.round(myth.populationCorrectPct),
        })
      : t("ui.populationUnavailable");

  return (
    <div
      className="quiz-card__cell quiz-card__cell--flow"
      role="region"
      aria-label={t("ui.questionLabel", { n: index + 1, total })}
    >
      <div
        className={[
          "quiz-card",
          "quiz-card--flow",
          isAnswered ? "quiz-card--answered" : "",
          correctClass,
          flipped ? "quiz-card--flipped" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="quiz-card__inner">
          {/* ── FRONT FACE ──────────────────────────────────────── */}
          <div className="quiz-card__face quiz-card__front">
            <span className="quiz-card__number">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <p className="quiz-card__statement">{statement}</p>

            <div
              className="quiz-card__buttons quiz-card__buttons--always"
              role="group"
              aria-label="Einordnung wählen"
            >
              {orderedOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`quiz-card__btn quiz-card__btn--${opt}`}
                  onClick={() => handleAnswerClick(opt)}
                  disabled={isAnswered}
                  aria-label={`${t(`answer.${opt}`)} — ${statement}`}
                >
                  {t(`answer.${opt}`)}
                </button>
              ))}
            </div>
          </div>

          {/* ── BACK FACE ───────────────────────────────────────── */}
          <div
            ref={resultRef}
            className="quiz-card__face quiz-card__back"
            tabIndex={-1}
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
                    {feedbackText}
                  </span>
                  <span className="quiz-card__number">
                    {String(index + 1).padStart(2, "0")} /{" "}
                    {String(total).padStart(2, "0")}
                  </span>
                </div>

                <p className="quiz-card__verdict-line">{mythVerdict}</p>

                {/* Show user's choice next to the correct one if they differ */}
                {!answer.isCorrect && (
                  <p className="quiz-card__your-answer">
                    <span className="quiz-card__your-answer-label">
                      {t("ui.yourAnswerLabel")}:
                    </span>{" "}
                    <span
                      className={`classification classification--${answer.chosenClassification}`}
                    >
                      {t(`classification.${answer.chosenClassification}`)}
                    </span>
                  </p>
                )}

                <p className="quiz-card__explanation">{explanation}</p>

                <p className="quiz-card__population">{populationLine}</p>

                <div className="quiz-card__back-actions">
                  {onShowFactsheet && (
                    <button
                      type="button"
                      className="quiz-card__more-btn"
                      onClick={() => onShowFactsheet(myth)}
                    >
                      {t("ui.openMythDetail")}
                    </button>
                  )}
                  <button
                    type="button"
                    className="quiz-card__next-btn"
                    onClick={onNext}
                    autoFocus
                  >
                    {isLastQuestion
                      ? t("ui.finishQuiz")
                      : t("ui.nextQuestion")}{" "}
                    →
                  </button>
                </div>

                {/* SR-only live region announcing the feedback */}
                <div
                  ref={liveRef}
                  className="sr-only"
                  aria-live="polite"
                >
                  {feedbackText} {mythVerdict}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
