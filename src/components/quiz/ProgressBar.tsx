/**
 * ProgressBar — Shows quiz completion progress.
 * Displays "X von Y beantwortet" with an animated bar.
 */

import { t } from "./i18n";

interface ProgressBarProps {
  answered: number;
  total: number;
}

export default function ProgressBar({ answered, total }: ProgressBarProps) {
  const pct = total > 0 ? (answered / total) * 100 : 0;

  return (
    <div className="quiz-progress" role="progressbar" aria-valuenow={answered} aria-valuemin={0} aria-valuemax={total}>
      <div className="quiz-progress__bar">
        <div
          className="quiz-progress__fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="quiz-progress__label">
        {t("ui.progress", { answered, total })}
      </span>
    </div>
  );
}
