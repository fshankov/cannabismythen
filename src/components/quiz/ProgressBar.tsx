/**
 * ProgressBar — quiet single-line header bar.
 *
 * Stage A (2026-05-16) — Pew minimalism: the live score pill is gone.
 * The bar carries title + thin progress fill + an "Aussage X von Y"
 * counter. Mounted via portal into the site header.
 */

import { t } from "./i18n";

interface ProgressBarProps {
  quizTitle: string;
  /** Number of questions answered so far. */
  answered: number;
  /** Total questions in this module. */
  total: number;
}

export default function ProgressBar({
  quizTitle,
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
        {t("ui.progress", { answered, total })}
      </span>
    </div>
  );
}
