/**
 * ResultScreen — Shown after all questions are answered.
 *
 * Displays: score, percentile, result tier with motivational message,
 * recommended myth page links, and the shareable result card.
 */

import { useEffect, useRef } from "react";
import type { QuizResult } from "./types";
import { RESULT_TIERS, QUIZ_THEMES } from "./quizData";
import { t } from "./i18n";
import { trackResultCardViewed, trackMythLinkClicked } from "./matomo";
import ShareCard from "./ShareCard";

interface ResultScreenProps {
  result: QuizResult;
}

export default function ResultScreen({ result }: ResultScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const tier = RESULT_TIERS[result.tierIndex];
  const tierTitle = t(tier.titleKey);
  const tierMessage = t(tier.messageKey);
  const theme = QUIZ_THEMES[result.themeSlug];

  // Track result view
  useEffect(() => {
    trackResultCardViewed(tierTitle);
  }, [tierTitle]);

  // Smooth scroll into view
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const recommendedSlugs = theme?.recommendedLinks[result.tierIndex] ?? [];
  const quizUrl = typeof window !== "undefined"
    ? `${window.location.origin}/selbsttest/${result.themeSlug}/`
    : `/selbsttest/${result.themeSlug}/`;

  return (
    <section
      ref={containerRef}
      className="quiz-result"
      aria-label={t("ui.resultTitle")}
    >
      <h2 className="quiz-result__title">{t("ui.resultTitle")}</h2>

      {/* Score ring / display */}
      <div className="quiz-result__score-section">
        <div className={`quiz-result__ring quiz-result__ring--tier${result.tierIndex}`}>
          <span className="quiz-result__score-number">
            {result.correctCount}
          </span>
          <span className="quiz-result__score-divider">/</span>
          <span className="quiz-result__score-total">
            {result.totalQuestions}
          </span>
        </div>
        <p className="quiz-result__score-label">
          {t("ui.scoreLabel", {
            correct: result.correctCount,
            total: result.totalQuestions,
          })}
        </p>
      </div>

      {/* Percentile line */}
      <p className="quiz-result__percentile">
        {t("ui.percentileLine", { pct: result.percentile })}
      </p>

      {/* Tier card */}
      <div className={`quiz-result__tier quiz-result__tier--${result.tierIndex}`}>
        <h3 className="quiz-result__tier-title">{tierTitle}</h3>
        <p className="quiz-result__tier-message">{tierMessage}</p>
      </div>

      {/* Shareable card */}
      <ShareCard result={result} quizUrl={quizUrl} />

      {/* Recommended links */}
      {recommendedSlugs.length > 0 && (
        <div className="quiz-result__links">
          <h3>{t("ui.recommendedLinks")}</h3>
          <ul>
            {recommendedSlugs.map((slug) => (
              <li key={slug}>
                <a
                  href={`/zahlen-und-fakten/${slug}/`}
                  onClick={() => {
                    // Extract mythId from slug (e.g. "m01-allheilmittel" → "m01")
                    const mythId = slug.split("-")[0];
                    trackMythLinkClicked(mythId);
                  }}
                >
                  {slug.replace(/^m\d+-m?\d*-?/, "").replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
                  {" "}→
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation */}
      <div className="quiz-result__nav">
        <a href="/selbsttest/" className="quiz-result__nav-link">
          ← {t("ui.backToQuizzes")}
        </a>
      </div>
    </section>
  );
}
