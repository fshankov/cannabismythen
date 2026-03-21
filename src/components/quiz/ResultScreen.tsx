/**
 * ResultScreen — Full-screen modal shown after all questions are answered.
 *
 * Simplified: shows only the ShareCard (dark green visual) + action buttons.
 * Locks body scroll on mount. No close button — user exits via restart or nav.
 */

import { useEffect, useRef } from "react";
import type { QuizResult } from "./types";
import { RESULT_TIERS } from "./quizData";
import { t } from "./i18n";
import { trackResultCardViewed } from "./matomo";
import ShareCard from "./ShareCard";

interface ResultScreenProps {
  result: QuizResult;
  onRestart: () => void;
}

export default function ResultScreen({ result, onRestart }: ResultScreenProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const tier = RESULT_TIERS[result.tierIndex];
  const tierTitle = t(tier.titleKey);

  // Track result view
  useEffect(() => {
    trackResultCardViewed(tierTitle);
  }, [tierTitle]);

  // Lock body scroll + focus modal on mount
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (panelRef.current) {
      panelRef.current.focus();
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const quizUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/selbsttest/${result.themeSlug}/`
      : `/selbsttest/${result.themeSlug}/`;

  return (
    <div className="quiz-modal__backdrop" role="dialog" aria-modal="true" aria-label={t("ui.resultTitle")}>
      <div
        ref={panelRef}
        className="quiz-modal__panel quiz-modal__panel--compact"
        tabIndex={-1}
      >
        {/* Headline */}
        <h2 className="quiz-modal__headline">
          {t("ui.resultTitle")}
        </h2>

        {/* Shareable card (the dark green visual card) */}
        <ShareCard result={result} quizUrl={quizUrl} />

        {/* Actions */}
        <div className="quiz-modal__actions">
          <button
            className="quiz-modal__restart-btn"
            onClick={onRestart}
          >
            {t("ui.restartQuiz")}
          </button>
          <a href="/zahlen-und-fakten/" className="quiz-modal__nav-link">
            {t("ui.zahlenUndFakten")} &rarr;
          </a>
          <a href="/selbsttest/" className="quiz-modal__nav-link">
            &larr; {t("ui.backToQuizzes")}
          </a>
        </div>
      </div>
    </div>
  );
}
