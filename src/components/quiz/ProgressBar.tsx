/**
 * ProgressBar — quiet single-line header bar.
 *
 * Stage A (2026-05-16) — Pew minimalism: the live score pill is gone.
 * The bar carries title + thin progress fill + a "Mythos N von Y"
 * counter (CAR-6 2026-05-28; N reflects the currently-viewing index,
 * not the answered count). Mounted via portal into the site header.
 */

import { t } from "./i18n";

interface ProgressBarProps {
  quizTitle: string;
  /** 1-based index of the currently-visible question. Used for the
   *  "Mythos N von 7" label (CAR-6, 2026-05-28). */
  current: number;
  /** Number of questions answered so far. Drives the progress-fill width. */
  answered: number;
  /** Total questions in this module. */
  total: number;
}

export default function ProgressBar({
  quizTitle,
  current,
  answered,
  total,
}: ProgressBarProps) {
  const pct = total > 0 ? (answered / total) * 100 : 0;

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
          {/* suppressHydrationWarning: the lazy localStorage restore in
              QuizPlayer creates a one-frame SSR/client diff. */}
          <div
            className="quiz-progress__fill"
            style={{ width: `${pct}%` }}
            suppressHydrationWarning
          />
        </div>
      </div>

      <span className="quiz-progress__label" suppressHydrationWarning>
        {t("ui.progress", { current, total })}
      </span>
    </div>
  );
}
