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
import type {
  QuizMyth,
  Classification,
  CardAnswer,
  Schritte,
} from "./types";
import { t } from "./i18n";
import { schritte, pointsForSchritte } from "./quizData";
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

/** Front-face statement display: strip a single trailing `.`, `!`, or `?`
 *  so the card reads as a slogan rather than a sentence. The .mdoc source
 *  keeps full sentences (proper grammar in Keystatic); the result page +
 *  FactsheetPanel render the unmodified text. Stage 2 of the overhaul. */
function displayStatement(s: string): string {
  return s.replace(/[.!?]\s*$/, "");
}

/** Map a hash to a tilt in (-1.5°, +1.5°). */
function tiltFromHash(hash: number): number {
  const range = 3; // -1.5 .. +1.5
  return ((hash % 1000) / 1000) * range - range / 2;
}

/** Stage 3 — Schritte → editorial label key (no period). */
const SCHRITTE_LABEL_KEY: Record<Schritte, string> = {
  0: "schritte.exact",
  1: "schritte.near",
  2: "schritte.off",
  3: "schritte.far",
};

/** Stage 3 — classification token used for the verdict text colour on the
 *  Schritte verdict line. Maps Schritte to the back-face colour ramp:
 *  0 → richtig (green), 1 → eher_richtig (lime), 2 → eher_falsch (amber),
 *  3 → falsch (rose). */
const SCHRITTE_COLOR_CLASS: Record<Schritte, Classification> = {
  0: "richtig",
  1: "eher_richtig",
  2: "eher_falsch",
  3: "falsch",
};

/** German decimal-comma formatting for Schritte points. */
function formatPoints(p: number): string {
  return p.toFixed(2).replace(".", ",");
}

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

  // Stage 3: 4-band Schritte derivation. Replaces the old 3-tier
  // `is-correct/is-near/is-far` ternary. Drives the verdict text, the
  // colour token on the verdict line, and the points-line copy.
  const userSchritte: Schritte | null = answer
    ? schritte(answer.chosenClassification, myth.correctClassification)
    : null;
  const schritteVerdictText = userSchritte !== null
    ? t(SCHRITTE_LABEL_KEY[userSchritte])
    : "";
  const schritteVerdictColorClass = userSchritte !== null
    ? `quiz-card__verdict-line--${SCHRITTE_COLOR_CLASS[userSchritte]}`
    : "";
  const userPoints = userSchritte !== null
    ? pointsForSchritte(userSchritte)
    : 0;

  const verdictPhrase = t(
    `ui.classificationPhrase.${myth.correctClassification}`
  );
  // The verdict template is split into prefix + bolded verdict + suffix so
  // we can render the verdict word as a <strong> without relying on dangerouslySet
  // markup. Template shape: `Der Mythos „{statement}" ist {verdict}.`
  // Stage 3: stripped trailing period from the template (D5 — "no period").
  const mythVerdictPrefix = t("ui.mythVerdict", {
    statement,
    verdict: "__VERDICT_PH__",
  }).replace(/\.\s*$/, "").split("__VERDICT_PH__");
  const mythVerdict = t("ui.mythVerdict", {
    statement,
    verdict: verdictPhrase,
  }).replace(/\.\s*$/, "");

  const hasPopData = typeof myth.populationCorrectPct === "number";
  const popPct = hasPopData ? Math.round(myth.populationCorrectPct) : 0;

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
      {/* Stage 4: edge arrows for desktop nav. On mobile they shrink and
          tuck in close — swipe + the pill row in the header are the
          primary touch nav. */}
      {onPrev && index > 0 && (
        <button
          type="button"
          className="quiz-card__edge-arrow quiz-card__edge-arrow--prev"
          aria-label={t("ui.previousQuestion")}
          onClick={onPrev}
        >
          ←
        </button>
      )}
      {(isAnswered && !isLastQuestion) && (
        <button
          type="button"
          className="quiz-card__edge-arrow quiz-card__edge-arrow--next"
          aria-label={t("ui.nextQuestion")}
          onClick={onNext}
        >
          →
        </button>
      )}
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

            <p className="quiz-card__statement">{displayStatement(statement)}</p>

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

                {/* Remediation 5 — back-face copy stack, top to bottom,
                    all left-aligned:
                    1) Myth statement (left, tinted by scientific verdict).
                    2) Chip pair: Deine Antwort + Wissenschaftlich.
                    3) Schritte verdict line (large, colored by Schritte).
                    4) Sub-line: "n Schritt(e) daneben → x,xx Punkte".
                    5) Explanation paragraph.
                    6) Population stat (always shown, new wording).
                    7) Action buttons. */}

                {/* 1 — Statement, left-aligned, tinted by scientific verdict. */}
                <p
                  className={`quiz-card__statement quiz-card__statement--back statement--${myth.correctClassification}`}
                >
                  {displayStatement(statement)}
                </p>

                {/* 2 — Chip pair: user's answer + scientific verdict on
                    one line. Wraps on narrow screens. */}
                <p className="quiz-card__answer-note">
                  <span className="quiz-card__answer-label">
                    {t("ui.yourAnswerLabel")}:
                  </span>{" "}
                  <span
                    className={`quiz-card__answer-chip classification classification--${answer.chosenClassification}`}
                  >
                    {t(`classification.${answer.chosenClassification}`)}
                  </span>
                  <span className="quiz-card__answer-vs"> · </span>
                  <span className="quiz-card__answer-label">
                    {t("classification.scientific")}:
                  </span>{" "}
                  <span
                    className={`quiz-card__answer-chip classification classification--${myth.correctClassification}`}
                  >
                    {t(`classification.${myth.correctClassification}`)}
                  </span>
                </p>

                {/* 3 — Schritte verdict — large, colored by Schritte band. */}
                <p
                  className={`quiz-card__verdict-line ${schritteVerdictColorClass}`}
                >
                  {schritteVerdictText}
                </p>

                {/* 4 — Points sub-line (German decimal comma). */}
                <p className="quiz-card__verdict-points">
                  {t("schritte.points", {
                    schritte: userSchritte ?? 0,
                    points: formatPoints(userPoints),
                  })}
                </p>

                {/* 4 — Explanation. Scrollable inside its own region only when
                    it overflows the available card height. */}
                <div className="quiz-card__explanation-wrap">
                  <div className="quiz-card__explanation">
                    <p>{explanation}</p>
                  </div>
                </div>

                {/* 6 — Population stat (always shown). New wording:
                    "repräsentative Stichprobe in Deutschland" — same data
                    (CaRM IS that sample), more relatable framing. */}
                {hasPopData && (
                  <div
                    className="quiz-card__pop-bar"
                    role="img"
                    aria-label={`${popPct} Prozent der Erwachsenen 18 bis 70 in einer repräsentativen Stichprobe in Deutschland haben diesen Mythos genau richtig eingeschätzt`}
                  >
                    <p className="quiz-card__pop-bar-text">
                      <strong>{popPct}&nbsp;%</strong> der Erwachsenen
                      (18–70) in einer repräsentativen Stichprobe in
                      Deutschland haben diesen Mythos genau richtig
                      eingeschätzt.
                    </p>
                    <div className="quiz-card__pop-bar-track">
                      <div
                        className="quiz-card__pop-bar-fill"
                        style={{ width: `${popPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 6 — Action row pinned to the bottom. */}
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

                {/* SR-only live region announcing the feedback (Schritte
                    label + scientific verdict). */}
                <div
                  ref={liveRef}
                  className="sr-only"
                  aria-live="polite"
                >
                  {t("ui.yourAnswerLabel")}:{" "}
                  {t(`classification.${answer.chosenClassification}`)}.{" "}
                  {schritteVerdictText}. {mythVerdict}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
