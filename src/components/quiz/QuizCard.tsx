/**
 * QuizCard — A single myth question rendered as a flippable card.
 *
 * Used in the one-question-at-a-time flow inside QuizPlayer.
 * Front face: myth statement + 4 answer buttons (always visible).
 * Back face (after answering): three-tier feedback message, the user's
 * answer chip plus (when wrong) the correct answer chip, the explanation,
 * a population comparison bar, and a "Nächste Frage" CTA.
 *
 * Per-card details:
 * - Answer button order is deterministically randomized by myth.id.
 * - Each card carries a deterministic idle tilt (≤1.5°) so consecutive
 *   cards feel like a hand-shuffled stack.
 * - On mobile coarse pointers (and outside `prefers-reduced-motion`),
 *   the back face supports a horizontal swipe-to-advance gesture.
 */

import {
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";
import type { QuizMyth, Classification, CardAnswer } from "./types";
import { t } from "./i18n";
import {
  usePointerSwipe,
  useIsCoarsePointer,
  usePrefersReducedMotion,
} from "./usePointerSwipe";

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

/** Map a hash to a tilt in (-1.5°, +1.5°). */
function tiltFromHash(hash: number): number {
  const range = 3; // -1.5 .. +1.5
  return ((hash % 1000) / 1000) * range - range / 2;
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
  /** How many phantom cards are stacked behind this one (0–2). */
  deckBehind?: number;
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
  deckBehind = 0,
}: QuizCardProps) {
  const isAnswered = answer !== null;
  const flipped = isAnswered;
  const cardRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  const statement = statementText || t(myth.statementKey);
  const explanation = explanationText || t(myth.explanationKey);

  const isCoarsePointer = useIsCoarsePointer();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Drag-to-advance is only useful once the user has answered (back face).
  usePointerSwipe(cardRef, {
    enabled: isAnswered && isCoarsePointer && !prefersReducedMotion,
    onCommit: onNext,
  });

  // Stable per-myth answer order (deterministic so reload doesn't shuffle)
  const orderedOptions = useMemo(
    () => shuffleStable(ALL_OPTIONS, hashCode(myth.id)),
    [myth.id]
  );

  // Idle tilt (deterministic per myth). Falls back to 0 for SSR sanity.
  const tilt = useMemo(() => tiltFromHash(hashCode(myth.id)), [myth.id]);

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

  const hasPopData = typeof myth.populationCorrectPct === "number";
  const popPct = hasPopData ? Math.round(myth.populationCorrectPct) : 0;
  const populationLine = hasPopData
    ? t("ui.populationLine", { pct: popPct })
    : t("ui.populationUnavailable");

  const cellStyle: CSSProperties = {
    ["--card-tilt" as string]: `${tilt.toFixed(2)}deg`,
  };

  return (
    <div
      className="quiz-card__cell quiz-card__cell--flow"
      role="region"
      aria-label={t("ui.questionLabel", { n: index + 1, total })}
      data-deck={Math.max(0, Math.min(2, deckBehind))}
      data-answered={isAnswered ? "true" : "false"}
      style={cellStyle}
    >
      <div
        ref={cardRef}
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

                {/* Two-chip layout: user's answer (always) + correct answer (if wrong). */}
                <dl
                  className="quiz-card__answer-chips"
                  data-correct={answer.isCorrect ? "true" : "false"}
                >
                  <div>
                    <dt>{t("ui.yourAnswerLabel")}</dt>
                    <dd>
                      <span
                        className={`classification classification--${answer.chosenClassification}`}
                      >
                        {t(`classification.${answer.chosenClassification}`)}
                      </span>
                    </dd>
                  </div>
                  {!answer.isCorrect && (
                    <div>
                      <dt>{t("ui.correctAnswerLabel")}</dt>
                      <dd>
                        <span
                          className={`classification classification--${myth.correctClassification}`}
                        >
                          {t(`classification.${myth.correctClassification}`)}
                        </span>
                      </dd>
                    </div>
                  )}
                </dl>

                <p className="quiz-card__explanation">{explanation}</p>

                {hasPopData && (
                  <div
                    className="quiz-card__pop-bar"
                    role="img"
                    aria-label={`${popPct} Prozent der Befragten antworteten korrekt`}
                  >
                    <div className="quiz-card__pop-bar-track">
                      <div
                        className="quiz-card__pop-bar-fill"
                        style={{ width: `${popPct}%` }}
                      />
                    </div>
                    <span className="quiz-card__pop-bar-value">
                      {popPct} %
                    </span>
                  </div>
                )}

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

                <p className="quiz-card__swipe-hint" aria-hidden="true">
                  {t("ui.swipeHint")}
                </p>

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
