/**
 * ProgressBar — Shows quiz completion progress + live score.
 *
 * Renders: [Quiz Title] [═══════ bar ═══════] [score pill] [count]
 *
 * Score system (distance from evidence-based classification):
 *   exact match → +2, 1 step → +1, 2 steps → −1, 3 steps → −2
 *
 * The score pill flashes green/red on each new answer.
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

  // Flash animation when a new answer comes in
  useEffect(() => {
    if (answered > prevAnswered.current && answered > 0) {
      const cls =
        lastScoreDelta >= 2
          ? "quiz-score--flash-great"
          : lastScoreDelta > 0
            ? "quiz-score--flash-good"
            : lastScoreDelta <= -2
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

  const scoreSign = score > 0 ? "+" : "";
  const scoreColorClass =
    score > 0
      ? "quiz-score__value--positive"
      : score < 0
        ? "quiz-score__value--negative"
        : "quiz-score__value--neutral";

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
          <div
            className="quiz-progress__fill"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {answered > 0 && (
        <span className={`quiz-score ${flashClass}`}>
          <span className={`quiz-score__value ${scoreColorClass}`}>
            {scoreSign}{score}
          </span>
        </span>
      )}

      <span className="quiz-progress__label">
        {t("ui.progress", { answered, total })}
      </span>
    </div>
  );
}
