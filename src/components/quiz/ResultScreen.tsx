/**
 * ResultScreen — Inline results dashboard shown after the last question.
 *
 * Headline: "Sie wussten X / Y — besser als Z % der Befragten."
 * Sections: tier card, share card, per-question retrospective list,
 * cross-link to the data explorer, and a restart button.
 */

import { useEffect, useRef } from "react";
import type { CardAnswer, QuizResult, QuizTheme } from "./types";
import { RESULT_TIERS } from "./quizData";
import { t } from "./i18n";
import { trackResultCardViewed } from "./matomo";
import ShareCard from "./ShareCard";
import type { QuizTextEntry } from "./QuizPlayer";

interface ResultScreenProps {
  result: QuizResult;
  theme: QuizTheme;
  quizTextMap: Record<string, QuizTextEntry>;
  onRestart: () => void;
  onJumpToQuestion: (idx: number) => void;
  onShowFactsheet: (myth: QuizTheme["myths"][number]) => void;
}

function feedbackLabel(answer: CardAnswer, correctClass: string): string {
  if (answer.isCorrect) return t("ui.feedback.correct");
  // 1-step distance computed via simple ordinal logic
  const order = { richtig: 1, eher_richtig: 2, eher_falsch: 3, falsch: 4 } as const;
  const d = Math.abs(
    order[answer.chosenClassification] - order[correctClass as keyof typeof order]
  );
  if (d === 1) return t("ui.feedback.near");
  return t("ui.feedback.far");
}

export default function ResultScreen({
  result,
  theme,
  quizTextMap,
  onRestart,
  onJumpToQuestion,
  onShowFactsheet,
}: ResultScreenProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const tier = RESULT_TIERS[result.tierIndex];
  const tierTitle = t(tier.titleKey);

  useEffect(() => {
    trackResultCardViewed(tierTitle);
  }, [tierTitle]);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.focus();
      // Scroll the result into view (helps when arriving from the last question)
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const quizUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/selbsttest/${result.themeSlug}/`
      : `/selbsttest/${result.themeSlug}/`;

  return (
    <section
      ref={panelRef}
      className="quiz-result"
      tabIndex={-1}
      aria-label={t("ui.resultTitle")}
    >
      <header className="quiz-result__header">
        <h1 className="quiz-result__title">{t("ui.resultTitle")}</h1>
        <p className="quiz-result__headline">
          {t("ui.scoreHeadlineCompare", {
            correct: result.correctCount,
            total: result.totalQuestions,
            pct: result.percentile,
          })}
        </p>
      </header>

      <div className={`quiz-result__tier quiz-result__tier--${result.tierIndex}`}>
        <h2 className="quiz-result__tier-title">{tierTitle}</h2>
        <p className="quiz-result__tier-message">{t(tier.messageKey)}</p>
      </div>

      <div className="quiz-result__share">
        <h2 className="quiz-result__share-heading">
          {t("ui.shareResultHeading")}
        </h2>
        <ShareCard result={result} quizUrl={quizUrl} />
      </div>

      <div className="quiz-result__retrospective">
        <h2 className="quiz-result__retrospective-title">
          {t("ui.retrospectiveTitle")}
        </h2>
        <ol className="quiz-result__list">
          {theme.myths.map((myth, idx) => {
            const a = result.answers.find((x) => x.mythId === myth.id);
            if (!a) return null;
            const statement =
              quizTextMap[myth.id]?.statement || t(myth.statementKey);
            const stateClass = a.isCorrect
              ? "quiz-result__item--correct"
              : "quiz-result__item--incorrect";
            return (
              <li
                key={myth.id}
                className={`quiz-result__item ${stateClass}`}
              >
                <div className="quiz-result__item-row">
                  <span
                    className="quiz-result__item-mark"
                    aria-hidden="true"
                  >
                    {a.isCorrect ? "✓" : "✗"}
                  </span>
                  <span className="quiz-result__item-num">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <p className="quiz-result__item-statement">{statement}</p>
                </div>
                <div className="quiz-result__item-meta">
                  <span className="quiz-result__item-feedback">
                    {feedbackLabel(a, myth.correctClassification)}
                  </span>
                  <span
                    className={`classification classification--${myth.correctClassification}`}
                  >
                    {t(`classification.${myth.correctClassification}`)}
                  </span>
                  {!a.isCorrect && (
                    <span className="quiz-result__item-your-answer">
                      ({t("ui.yourAnswerLabel")}:{" "}
                      <span
                        className={`classification classification--${a.chosenClassification}`}
                      >
                        {t(`classification.${a.chosenClassification}`)}
                      </span>
                      )
                    </span>
                  )}
                </div>
                <div className="quiz-result__item-actions">
                  <button
                    type="button"
                    className="quiz-result__item-link"
                    onClick={() => onJumpToQuestion(idx)}
                  >
                    Zur Frage
                  </button>
                  <button
                    type="button"
                    className="quiz-result__item-link"
                    onClick={() => onShowFactsheet(myth)}
                  >
                    Details →
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="quiz-result__actions">
        <button
          type="button"
          className="quiz-modal__restart-btn"
          onClick={onRestart}
        >
          {t("ui.restartQuiz")}
        </button>
        <a href="/zahlen-und-fakten/" className="quiz-modal__nav-link">
          {t("ui.exploreData")} →
        </a>
        <a href="/selbsttest/" className="quiz-modal__nav-link">
          ← {t("ui.backToQuizzes")}
        </a>
      </div>
    </section>
  );
}
