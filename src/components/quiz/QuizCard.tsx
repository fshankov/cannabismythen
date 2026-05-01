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
import VerdictScale from "./VerdictScale";
import StreakChip from "./StreakChip";
import { trackCardSwiped } from "./matomo";

/** Stable hash for deterministic randomization. */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
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

/** Tier class derived from the same ordinal distance as feedbackKey().
 *  Single source of truth for back-face background tinting + verdict-banner
 *  colour. Keep in sync with feedbackKey(). */
function tierClass(chosen: Classification, correct: Classification): string {
  const d = Math.abs(CLASS_POS[chosen] - CLASS_POS[correct]);
  if (d === 0) return "is-correct";
  if (d === 1) return "is-near";
  return "is-far";
}

/** Glyph paired with the verdict banner — colour-blind safe shape cue. */
const TIER_GLYPH: Record<"is-correct" | "is-near" | "is-far", string> = {
  "is-correct": "✓",
  "is-near": "≈",
  "is-far": "✕",
};

interface QuizCardProps {
  myth: QuizMyth;
  index: number;
  total: number;
  answer: CardAnswer | null;
  onAnswer: (mythId: string, chosen: Classification) => void;
  onNext: () => void;
  /** Optional: enables left-to-right swipe-back on the front face. */
  onPrev?: () => void;
  onShowFactsheet?: (myth: QuizMyth) => void;
  isLastQuestion: boolean;
  /** Statement text from Keystatic content (overrides i18n key) */
  statementText?: string;
  /** Explanation text from Keystatic content (overrides i18n key) */
  explanationText?: string;
  /** How many phantom cards are stacked behind this one (0–2). */
  deckBehind?: number;
  /** Quiz theme label shown in the front-face topbar (e.g. "Medizinischer Nutzen"). */
  categoryLabel?: string;
  /** When ≥ 2, render a 🔥 streak chip pinned to the front face top-right. */
  streakCount?: number;
  /** Population pct of the *general population* — used in micro-copy table. */
  populationCorrectPct?: number;
}

export default function QuizCard({
  myth,
  index,
  total,
  answer,
  onAnswer,
  onNext,
  onPrev,
  onShowFactsheet,
  isLastQuestion,
  statementText,
  explanationText,
  deckBehind = 0,
  categoryLabel,
  streakCount = 0,
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

  // Front-face swipe back/forward (Phase C §3.10). Disabled on the back
  // face so the inner explanation can scroll horizontally without
  // hijacking. Vertical scroll wins via the SLOP check inside the hook.
  // Left-swipe (=== "prev") is vetoed at index 0 via canCommit.
  usePointerSwipe(cardRef, {
    enabled: !flipped && isCoarsePointer && !prefersReducedMotion,
    canCommit: (dir) => (dir === "prev" ? index > 0 : true),
    onCommit: (dir) => {
      trackCardSwiped(dir);
      if (dir === "next") onNext();
      else if (onPrev) onPrev();
    },
  });

  // Idle tilt (deterministic per myth). Falls back to 0 for SSR sanity.
  // Note: the verdict-scale renders in a fixed left-to-right order
  // (falsch → richtig). The old shuffled 4-button grid is gone — the
  // spectrum metaphor only works if the segments stay in spectrum order.
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

  const tier = answer
    ? tierClass(answer.chosenClassification, myth.correctClassification)
    : "";

  const feedbackText = answer
    ? t(feedbackKey(answer.chosenClassification, myth.correctClassification))
    : "";

  const verdictPhrase = t(
    `ui.classificationPhrase.${myth.correctClassification}`
  );
  // The verdict template is split into prefix + bolded verdict + suffix so
  // we can render the verdict word as a <strong> without relying on dangerouslySet
  // markup. Template shape: `Der Mythos „{statement}" ist {verdict}.`
  const mythVerdictPrefix = t("ui.mythVerdict", {
    statement,
    verdict: "__VERDICT_PH__",
  }).split("__VERDICT_PH__");
  const mythVerdict = t("ui.mythVerdict", {
    statement,
    verdict: verdictPhrase,
  });

  const hasPopData = typeof myth.populationCorrectPct === "number";
  const popPct = hasPopData ? Math.round(myth.populationCorrectPct) : 0;

  // Micro-copy under the population bar — picks one short line that ties
  // the user's answer back to their streak / the population. See plan §3.7.
  // Only computed when there's an answer; the back face only renders when
  // the card is flipped, which only happens after answering.
  let microCopyText: string | null = null;
  if (answer && hasPopData) {
    const dist = Math.abs(
      CLASS_POS[answer.chosenClassification] -
        CLASS_POS[myth.correctClassification]
    );
    if (streakCount >= 3) {
      microCopyText = t("ui.microCopy.streak", { n: streakCount });
    } else if (answer.isCorrect && popPct < 50) {
      microCopyText = t("ui.microCopy.correct", { missPct: 100 - popPct });
    } else if (answer.isCorrect && popPct >= 50) {
      microCopyText = t("ui.microCopy.popular", { pct: popPct });
    } else if (dist === 1) {
      microCopyText = t("ui.microCopy.nearMiss", { pct: popPct });
    } else {
      microCopyText = t("ui.microCopy.farMiss", { pct: popPct });
    }
  }

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
          tier,
          flipped ? "quiz-card--flipped" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="quiz-card__inner">
          {/* ── FRONT FACE ──────────────────────────────────────── */}
          <div className="quiz-card__face quiz-card__front">
            {/* Swipe edge overlays — opacity bound to --swipe-progress-*
                vars written by usePointerSwipe. Aria-hidden because they
                are pure visual feedback. */}
            {index > 0 && (
              <div
                className="quiz-card__swipe-edge quiz-card__swipe-edge--prev"
                aria-hidden="true"
              >
                ←
              </div>
            )}
            <div
              className="quiz-card__swipe-edge quiz-card__swipe-edge--next"
              aria-hidden="true"
            >
              →
            </div>

            {/* Streak chip lives INSIDE the front face so the 3D flip
                hides it on the back via backface-visibility. See
                StreakChip.tsx for the rationale. */}
            <StreakChip count={streakCount} />

            <div className="quiz-card__topbar">
              <span className="quiz-card__counter">
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(total).padStart(2, "0")}
              </span>
              {categoryLabel && (
                <span className="quiz-card__category">{categoryLabel}</span>
              )}
            </div>

            <p className="quiz-card__statement">{statement}</p>

            <VerdictScale
              selected={answer ? answer.chosenClassification : null}
              disabled={isAnswered}
              onChoose={handleAnswerClick}
            />
          </div>

          {/* ── BACK FACE ───────────────────────────────────────── */}
          <div
            ref={resultRef}
            className="quiz-card__face quiz-card__back"
            tabIndex={-1}
          >
            {isAnswered && answer && (
              <>
                {/* Topbar — same shape as the front so the card feels stable
                    front-to-back. */}
                <div className="quiz-card__topbar">
                  <span className="quiz-card__counter">
                    {String(index + 1).padStart(2, "0")} /{" "}
                    {String(total).padStart(2, "0")}
                  </span>
                </div>

                {/* 1 — The verdict (largest text, tier-coloured banner).
                    This is the colleague's three-tier headline. */}
                <div className="quiz-card__verdict-banner">
                  <span
                    className="quiz-card__verdict-glyph"
                    aria-hidden="true"
                  >
                    {TIER_GLYPH[tier as keyof typeof TIER_GLYPH]}
                  </span>
                  <span>{feedbackText}</span>
                </div>

                {/* 2 — The myth-line: "Der Mythos „X" ist Y." with the verdict
                    word bolded. The `statement--{verdict}` class applies the
                    subtle verdict tint that's used across the site (factsheet
                    H1, FaktenCard title, Streifen card statement). */}
                <p
                  className={`quiz-card__myth-line statement--${myth.correctClassification}`}
                >
                  {mythVerdictPrefix[0]}
                  <strong>{verdictPhrase}</strong>
                  {mythVerdictPrefix[1]}
                </p>

                {/* 3 — Optional answer chip: only when the user was wrong. */}
                {!answer.isCorrect && (
                  <p className="quiz-card__answer-note">
                    {t("ui.yourAnswerLabel")}
                    {": "}
                    <span
                      className={`quiz-card__answer-chip classification classification--${answer.chosenClassification}`}
                    >
                      {t(`classification.${answer.chosenClassification}`)}
                    </span>
                  </p>
                )}

                {/* 4 — Scrollable explanation. The wrap fills remaining space;
                    inner div scrolls with overscroll-contain so page never
                    scrolls when the inner reaches its end. */}
                <div className="quiz-card__explanation-wrap">
                  <div className="quiz-card__explanation">
                    <p>{explanation}</p>
                  </div>
                </div>

                {/* 5 — Population bar pinned to the bottom. */}
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
                      {popPct} % {t("ui.populationCorrectShort")}
                    </span>
                  </div>
                )}

                {/* 6 — Micro-copy line. One short sentence that contextualises
                    the user's answer against their streak / the population. */}
                {microCopyText && (
                  <p className="quiz-card__micro-copy">{microCopyText}</p>
                )}

                {/* 7 — Action row pinned to the very bottom. */}
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

                {/* SR-only live region announcing the feedback. */}
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
