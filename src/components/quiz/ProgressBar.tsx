/**
 * ProgressBar — Shows quiz completion progress + live score.
 *
 * Renders: [Quiz Title] [═══════ bar ═══════] [score pill] [count]
 *
 * Score system (Stage 1 — Schritte / CaRM "Richtigkeit"):
 *   exact match → 1.00 pt, 1 step → 0.66 pt, 2 steps → 0.33 pt, 3 steps → 0.
 *   The pill displays the running module-score percentage (rounded), not a
 *   ±delta. The flash class still keys off `lastScoreDelta` so a great
 *   answer flashes brighter than a far-off one.
 *
 * NOTE: Stage 4 of the overhaul replaces this component with a Schritte-
 * coloured pill row. This file is intentionally low-touch in Stage 1.
 */

import { useState, useEffect, useRef } from "react";
import { t } from "./i18n";

interface ProgressBarProps {
  answered: number;
  total: number;
  score: number;
  lastScoreDelta: number; // used to trigger flash animation
  quizTitle: string;
}

export default function ProgressBar({
  answered,
  total,
  score,
  lastScoreDelta,
  quizTitle,
}: ProgressBarProps) {
  const pct = total > 0 ? (answered / total) * 100 : 0;
  const [flashClass, setFlashClass] = useState("");
  const prevAnswered = useRef(answered);

  // Flash animation when a new answer comes in. `lastScoreDelta` is the
  // points awarded for the most recent answer on a 0–100 scale (100 = exact,
  // 66 = 1 step, 33 = 2 steps, 0 = 3 steps).
  useEffect(() => {
    if (answered > prevAnswered.current && answered > 0) {
      const cls =
        lastScoreDelta >= 90
          ? "quiz-score--flash-great"
          : lastScoreDelta >= 60
            ? "quiz-score--flash-good"
            : lastScoreDelta <= 0
              ? "quiz-score--flash-bad"
              : "quiz-score--flash-warn";
      setFlashClass(cls);
      const timer = setTimeout(() => setFlashClass(""), 600);
      return () => clearTimeout(timer);
    }
    prevAnswered.current = answered;
  }, [answered, lastScoreDelta]);

  // Update ref after effect
  useEffect(() => {
    prevAnswered.current = answered;
  }, [answered]);

  // Score is now a 0–100 percentage; the colour ramps from neutral up.
  const scoreColorClass =
    score >= 80
      ? "quiz-score__value--positive"
      : score >= 40
        ? "quiz-score__value--neutral"
        : "quiz-score__value--negative";

  return (
    <div className="quiz-header-bar">
      <span className="quiz-header-bar__title">{quizTitle}</span>

      <div
        className="quiz-progress"
        role="progressbar"
        aria-valuenow={answered}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div className="quiz-progress__bar">
          {/* SSR sees no saved progress so the bar starts at 0 % on the
              server; hydration fills it in with the localStorage-restored
              value. Suppressing the inevitable mismatch is intentional —
              Stage 4 of the overhaul replaces this component with the new
              Schritte pill row, so this is a deliberately short-lived hack. */}
          <div
            className="quiz-progress__fill"
            style={{ width: `${pct}%` }}
            suppressHydrationWarning
          />
        </div>
      </div>

      {answered > 0 && (
        <span className={`quiz-score ${flashClass}`}>
          <span className={`quiz-score__value ${scoreColorClass}`}>
            {score}&nbsp;%
          </span>
        </span>
      )}

      <span className="quiz-progress__label">
        {t("ui.progress", { answered, total })}
      </span>
    </div>
  );
}
