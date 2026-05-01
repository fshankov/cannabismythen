/**
 * ProgressBar — quiet single-line header bar.
 *
 * Restored to the original visual language after the Stage 4 pill-row
 * experiment was rolled back: title + thin progress fill + small score
 * chip showing the live Schritte percentage + "X von Y beantwortet" label.
 * Mounted via portal into the site header.
 */

import { useEffect, useRef, useState } from "react";
import { t } from "./i18n";

interface ProgressBarProps {
  quizTitle: string;
  /** Number of questions answered so far. */
  answered: number;
  /** Total questions in this module. */
  total: number;
  /** Live module score (0–100, Schritte-based). */
  score: number;
  /** Points awarded for the just-submitted answer (0–100), drives the
   *  brief flash animation on the chip. */
  lastScoreDelta: number;
}

export default function ProgressBar({
  quizTitle,
  answered,
  total,
  score,
  lastScoreDelta,
}: ProgressBarProps) {
  const pct = total > 0 ? (answered / total) * 100 : 0;
  const [flashClass, setFlashClass] = useState("");
  const prevAnswered = useRef(answered);

  // Flash on each new answer. Delta is the points (0–100) just earned.
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

  useEffect(() => {
    prevAnswered.current = answered;
  }, [answered]);

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
          {/* Bar fill is restored from local state to the actual answered
              fraction; suppressHydrationWarning because the lazy localStorage
              restore inside QuizPlayer creates a one-frame SSR/client diff. */}
          <div
            className="quiz-progress__fill"
            style={{ width: `${pct}%` }}
            suppressHydrationWarning
          />
        </div>
      </div>

      {answered > 0 && (
        <span className={`quiz-score ${flashClass}`}>
          <span
            className={`quiz-score__value ${scoreColorClass}`}
            suppressHydrationWarning
          >
            {score}&nbsp;%
          </span>
        </span>
      )}

      <span className="quiz-progress__label" suppressHydrationWarning>
        {t("ui.progress", { answered, total })}
      </span>
    </div>
  );
}
