/**
 * QuizCard — A single myth question rendered as a flippable card.
 *
 * Redesign 2026-05-29 (Figma 9Ix8F9bkjVbvU41QsxnxYX node 427-2143).
 *
 * Three visual states inside one card shell:
 *   1. Front — unanswered: statement + 4-button colored answer grid
 *      (Falsch / Eher Falsch / Eher Richtig / Richtig, each an arrow SVG
 *      + label). Replaces the old VerdictScale spectrum.
 *   2. Front — post-answer feedback: statement dims, the answer label
 *      fades, the chosen button gets a result border (correct button shown
 *      dashed), and a feedback cluster appears (tier icon + verdict phrase
 *      only — the points badge +3 / +2 / +1 / 0 lives in the FeedbackStrip
 *      below the card, not on the card). Holds ~1.8 s. (The card itself is
 *      borderless in every state — 2026-05-30.)
 *   3. Back (3D flip): statement tinted by the scientific verdict + a
 *      VerdictPill + the summary explanation + Details / Nächste buttons.
 *
 * Already-answered cards (navigating back, or restored progress) skip the
 * feedback animation and render the back immediately. prefers-reduced-motion
 * also skips the celebration delay.
 *
 * Per-card details preserved from the prior version: deterministic answer
 * tilt, deck illusion, front-face swipe nav (coarse pointers), streak chip,
 * SR-only live region, focus-on-answer.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type {
  QuizMyth,
  Classification,
  CardAnswer,
  Schritte,
} from "./types";
import { t } from "./i18n";
import { schritte } from "./quizData";
import { fireConfetti, fireFloatingEmoji } from "./celebrate";
import {
  usePointerSwipe,
  useIsCoarsePointer,
  usePrefersReducedMotion,
} from "./usePointerSwipe";
import StreakChip from "./StreakChip";
import VerdictPill from "../shared/VerdictPill";
import { trackCardSwiped } from "./matomo";
import {
  CheckCircle,
  CircleDashed,
  AlertCircle,
  XCircle,
  Search,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

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
 *  so the card reads as a slogan rather than a sentence. */
function displayStatement(s: string): string {
  return s.replace(/[.!?]\s*$/, "");
}

/** Map a hash to a tilt in (-1.5°, +1.5°). */
function tiltFromHash(hash: number): number {
  const range = 3; // -1.5 .. +1.5
  return ((hash % 1000) / 1000) * range - range / 2;
}

/** Schritte → editorial verdict label key (gamified set, CAR-8). */
const SCHRITTE_LABEL_KEY: Record<Schritte, string> = {
  0: "schritte.exact",
  1: "schritte.near",
  2: "schritte.off",
  3: "schritte.far",
};

/** Schritte → feedback tier icon (same set as the FeedbackStrip, for
 *  tonal consistency — NOT a single ThumbsUp, which reads wrong for the
 *  3-Schritte case). */
const SCHRITTE_ICON: Record<Schritte, LucideIcon> = {
  0: CheckCircle,
  1: CircleDashed,
  2: AlertCircle,
  3: XCircle,
};

/** Schritte → feedback tier modifier (drives icon/phrase/points colour). */
const SCHRITTE_TIER: Record<Schritte, string> = {
  0: "exact",
  1: "near",
  2: "off",
  3: "far",
};

/** Schritte → card-border tier (0 green, 1 amber, 2–3 rose). */
const SCHRITTE_BORDER: Record<Schritte, string> = {
  0: "correct",
  1: "almost",
  2: "wrong",
  3: "wrong",
};

/** The 4 answer options in spectrum order (Falsch → Richtig), matching the
 *  QuizPlayer keyboard map (1→falsch … 4→richtig) and the Figma grid. Each
 *  carries the exact inline arrow SVG verified in quiz-card-preview.html. */
const ANSWER_OPTIONS: { value: Classification; svg: ReactNode }[] = [
  {
    value: "falsch",
    svg: (
      <svg width="26" height="22" viewBox="0 0 26 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.2666 18.8793C0.567207 18.8798 0 19.4464 0 20.1459C0 20.8454 0.567207 21.4121 1.2666 21.4125L24.2705 21.4125C24.9703 21.4125 25.5371 20.8457 25.5371 20.1459C25.5371 19.4462 24.9703 18.8793 24.2705 18.8793L1.2666 18.8793Z" fill="#E9A8B9" />
        <path d="M12.771 1.26703L12.771 19.3997" stroke="#BE123C" strokeWidth="2.53404" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20.8223 10.3315L12.771 19.3978L4.71974 10.3315" stroke="#BE123C" strokeWidth="2.53404" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: "eher_falsch",
    svg: (
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32.2303 13.271L13.271 32.2303" stroke="#E0B58D" strokeWidth="2.78333" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.47932 9.47998L22.7508 22.7515" stroke="#B45309" strokeWidth="2.78333" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22.7508 9.47803V22.7495H9.47929" stroke="#B45309" strokeWidth="2.78333" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: "eher_richtig",
    svg: (
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32.2303 20.351L13.271 1.39168" stroke="#C2D3A3" strokeWidth="2.78333" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.47932 24.142L22.7508 10.8705" stroke="#4D7C0F" strokeWidth="2.78333" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22.7508 24.144V10.8724H9.47929" stroke="#4D7C0F" strokeWidth="2.78333" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: "richtig",
    svg: (
      <svg width="30" height="22" viewBox="0 0 30 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M28.2041 1.39285L1.3916 1.39286" stroke="#A7D3C5" strokeWidth="2.78333" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.7979 20.1604L14.7978 1.39168" stroke="#047857" strokeWidth="2.78333" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24.1826 10.7776L14.7982 1.39324L5.41386 10.7776" stroke="#047857" strokeWidth="2.78333" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

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
  /** When ≥ 2, render a 🔥 streak chip pinned to the front face top-right. */
  streakCount?: number;
}

/** Delay before the post-answer feedback flips to the back face. */
const FLIP_DELAY_MS = 1800;

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
  streakCount = 0,
}: QuizCardProps) {
  const isAnswered = answer !== null;
  const cardRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  const statement = statementText || t(myth.statementKey);
  const explanation = explanationText || t(myth.explanationKey);

  const isCoarsePointer = useIsCoarsePointer();
  const prefersReducedMotion = usePrefersReducedMotion();

  // ── Three-state flow: front (play) → front (post-answer feedback) →
  //    back. `showBack` gates the 3D flip; the feedback state is the
  //    window where isAnswered && !showBack.
  const [showBack, setShowBack] = useState<boolean>(() => answer !== null);
  const prevAnswerRef = useRef<CardAnswer | null>(answer);

  useEffect(() => {
    const wasAnswered = prevAnswerRef.current !== null;
    prevAnswerRef.current = answer;

    if (answer === null) {
      setShowBack(false);
      return;
    }
    // Card already carried an answer when shown (nav back / restore) →
    // straight to the back, no celebration. Also covers reduced-motion.
    if (wasAnswered || prefersReducedMotion) {
      setShowBack(true);
      return;
    }
    // Fresh answer (null → set), motion allowed → celebrate by tier, then
    // hold the feedback state and flip to the back. Stage 5 (2026-05-29):
    // 🎉 confetti on an exact hit, a floating 👍 when one step off; nothing
    // for the two lower tiers (calm, no punishment).
    const freshSchritte = schritte(
      answer.chosenClassification,
      myth.correctClassification,
    );
    if (freshSchritte === 0) void fireConfetti(cardRef.current);
    else if (freshSchritte === 1) fireFloatingEmoji(cardRef.current, "👍");

    const tid = window.setTimeout(() => setShowBack(true), FLIP_DELAY_MS);
    return () => window.clearTimeout(tid);
  }, [answer, prefersReducedMotion]);

  // Front-face swipe back/forward — disabled once flipped to the back.
  usePointerSwipe(cardRef, {
    enabled: !showBack && !isAnswered && isCoarsePointer && !prefersReducedMotion,
    canCommit: (dir) => (dir === "prev" ? index > 0 : true),
    onCommit: (dir) => {
      trackCardSwiped(dir);
      if (dir === "next") onNext();
      else if (onPrev) onPrev();
    },
  });

  const tilt = useMemo(() => tiltFromHash(hashCode(myth.id)), [myth.id]);

  // Focus the back when it appears (announces feedback to SR users).
  useEffect(() => {
    if (showBack && resultRef.current) {
      resultRef.current.focus();
    }
  }, [showBack, myth.id]);

  const handleAnswerClick = (chosen: Classification) => {
    if (!isAnswered) onAnswer(myth.id, chosen);
  };

  // Schritte-derived feedback state.
  const userSchritte: Schritte | null = answer
    ? schritte(answer.chosenClassification, myth.correctClassification)
    : null;
  const showFeedback = isAnswered && !showBack && userSchritte !== null;
  const feedbackTier = userSchritte !== null ? SCHRITTE_TIER[userSchritte] : "";
  const FeedbackIcon = userSchritte !== null ? SCHRITTE_ICON[userSchritte] : null;
  const feedbackPhrase =
    userSchritte !== null ? t(SCHRITTE_LABEL_KEY[userSchritte]) : "";

  const schritteVerdictText = feedbackPhrase;
  const verdictPhrase = t(`ui.classificationPhrase.${myth.correctClassification}`);
  const mythVerdict = t("ui.mythVerdict", {
    statement,
    verdict: verdictPhrase,
  }).replace(/\.\s*$/, "");

  const cellStyle: CSSProperties = {
    ["--card-tilt" as string]: `${tilt.toFixed(2)}deg`,
  };

  // Card-shell classes: the feedback-border tint applies ONLY during the
  // post-answer feedback window (front face); the back face has no border.
  const cardBorderClass =
    showFeedback && userSchritte !== null
      ? `quiz-card--feedback-${SCHRITTE_BORDER[userSchritte]}`
      : "";

  return (
    <div
      className="quiz-card__cell quiz-card__cell--flow"
      role="region"
      aria-label={t("ui.questionLabel", { n: index + 1, total })}
      data-deck={Math.max(0, Math.min(2, deckBehind))}
      data-answered={isAnswered ? "true" : "false"}
      style={cellStyle}
    >
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
      {isAnswered && !isLastQuestion && (
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
          cardBorderClass,
          showBack ? "quiz-card--flipped" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="quiz-card__inner">
          {/* ── FRONT FACE ──────────────────────────────────────── */}
          <div className="quiz-card__face quiz-card__front">
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

            <StreakChip count={streakCount} />

            <div className="quiz-card__topbar">
              <span className="quiz-card__counter">
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(total).padStart(2, "0")}
              </span>
              {/* 2026-05-29 — the module title is already in the progress
                  bar above; showing it here truncated ("MEDIZINISCHER UND
                  T…") read as broken, so the category label was removed. */}
            </div>

            <p
              className={[
                "quiz-card__statement",
                showFeedback ? "quiz-card__statement--dimmed" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {displayStatement(statement)}
            </p>

            {/* ── On-card feedback: tier icon + phrase, vertically centred
                 between the statement and the buttons (2026-05-29 — points
                 moved to the strip). Feedback + answer-area are siblings;
                 both use margin-top:auto so the free space splits and the
                 feedback lands in the middle while the buttons stay at the
                 bottom. ─────────────────────────────────────────────── */}
            {showFeedback && FeedbackIcon && (
              <div className="quiz-card__feedback" aria-hidden="true">
                <div
                  className={`quiz-card__feedback-icon quiz-card__feedback-icon--${feedbackTier}`}
                >
                  <FeedbackIcon size={44} strokeWidth={2} />
                </div>
                <div
                  className={`quiz-card__feedback-line quiz-card__feedback-line--${feedbackTier}`}
                >
                  <span className="quiz-card__feedback-phrase">
                    {feedbackPhrase}
                  </span>
                </div>
              </div>
            )}

            <div className="quiz-answer-area">
              <p
                className={[
                  "quiz-answer-area__label",
                  isAnswered ? "is-hidden" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {t("ui.chooseAnswer")}
              </p>
              <div
                className="quiz-answer-grid"
                role="radiogroup"
                aria-label={t("ui.chooseAnswer")}
              >
                {ANSWER_OPTIONS.map((opt, i) => {
                  const isSelected =
                    answer?.chosenClassification === opt.value;
                  const isCorrectAnswer =
                    isAnswered &&
                    opt.value === myth.correctClassification &&
                    !isSelected;
                  const selModifier =
                    isSelected && userSchritte !== null
                      ? userSchritte === 0
                        ? "is-sel-correct"
                        : userSchritte === 1
                          ? "is-sel-near"
                          : "is-sel-wrong"
                      : "";
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-keyshortcuts={String(i + 1)}
                      aria-label={t(`answer.${opt.value}`)}
                      disabled={isAnswered}
                      className={[
                        "quiz-answer-btn",
                        `quiz-answer-btn--${opt.value}`,
                        selModifier,
                        isCorrectAnswer ? "is-correct-answer" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => handleAnswerClick(opt.value)}
                    >
                      <span className="quiz-answer-btn__icon" aria-hidden="true">
                        {opt.svg}
                      </span>
                    </button>
                  );
                })}
                {ANSWER_OPTIONS.map((opt) => (
                  <span
                    key={`lbl-${opt.value}`}
                    className="quiz-answer-grid__label"
                    aria-hidden="true"
                  >
                    {t(`answer.${opt.value}`)}
                  </span>
                ))}
              </div>
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
                <p
                  className={`quiz-card__statement quiz-card__statement--back statement--${myth.correctClassification}`}
                >
                  {displayStatement(statement)}
                </p>

                <div className="quiz-card__back-pill">
                  <span className="quiz-card__verdict-label">Wissenschaftlich:</span>
                  <VerdictPill verdict={myth.correctClassification} size="sm" />
                </div>

                <div className="quiz-card__explanation-wrap">
                  <p className="quiz-card__explanation">{explanation}</p>
                </div>

                <div className="quiz-card__back-actions">
                  {onShowFactsheet && (
                    <button
                      type="button"
                      className="quiz-card__more-btn"
                      onClick={() => onShowFactsheet(myth)}
                    >
                      {t("ui.openMythDetail")}
                      <Search size={18} strokeWidth={2} aria-hidden="true" />
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
                      : t("ui.nextQuestion")}
                    <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>

                {/* SR-only live region — announces the verdict. */}
                <div ref={liveRef} className="sr-only" aria-live="polite">
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
