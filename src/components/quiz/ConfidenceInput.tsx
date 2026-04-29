/**
 * ConfidenceInput — slide-up panel asking "Wie sicher bist du?" after the
 * user picks a verdict.
 *
 * Mounted as an absolute-positioned overlay over the bottom of the front
 * face. The card flip is gated on this pick (when `confidenceEnabled` is
 * on). When the feature is off, this component is never rendered and the
 * card flips immediately after the verdict pick.
 */

import { t } from "./i18n";

interface ConfidenceInputProps {
  onChoose: (c: "sure" | "unsure") => void;
}

export default function ConfidenceInput({ onChoose }: ConfidenceInputProps) {
  return (
    <div
      className="quiz-card__confidence"
      role="group"
      aria-label={t("ui.confidence.label")}
    >
      <span className="quiz-card__confidence-label">
        {t("ui.confidence.label")}
      </span>
      <div className="quiz-card__confidence-buttons">
        <button
          type="button"
          className="quiz-card__confidence-btn"
          onClick={() => onChoose("unsure")}
        >
          {t("ui.confidence.unsure")}
        </button>
        <button
          type="button"
          className="quiz-card__confidence-btn"
          onClick={() => onChoose("sure")}
        >
          {t("ui.confidence.sure")}
        </button>
      </div>
    </div>
  );
}
