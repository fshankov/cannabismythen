/**
 * QuizPlayer — Interactive quiz island component (React).
 *
 * Main component that renders:
 *   - A start screen with quiz title and description
 *   - An all-cards-at-once responsive grid of QuizCards
 *   - A persistent progress bar
 *   - A result screen after all cards are answered
 *
 * TODO before production:
 *   - Replace Matomo URL/siteId in BaseLayout.astro with real values
 *   - Create custom dimensions 1 (chosen_answer) and 2 (percentile_tier) in Matomo dashboard
 *   - Verify all explanation texts with the editorial team
 *   - Confirm population percentages match latest survey data
 *   - Review tier boundaries and percentile algorithm with UX team
 *   - Add proper error boundary for React island hydration failures
 *   - Consider adding a "restart quiz" button after results
 */

import { useState, useCallback, useMemo } from "react";
import type { Classification, CardAnswer, QuizResult } from "./types";
import { QUIZ_THEMES, computePercentile, getTierIndex } from "./quizData";
import { t } from "./i18n";
import {
  trackQuizStarted,
  trackAnswerSubmitted,
  trackQuizCompleted,
} from "./matomo";
import QuizCard from "./QuizCard";
import ProgressBar from "./ProgressBar";
import ResultScreen from "./ResultScreen";

interface QuizPlayerProps {
  /** Quiz slug, e.g. "quiz-alltag" */
  quizSlug: string;
}

export default function QuizPlayer({ quizSlug }: QuizPlayerProps) {
  const theme = QUIZ_THEMES[quizSlug];

  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, CardAnswer>>({});

  if (!theme) {
    return (
      <div className="quiz-player quiz-player--error">
        <p>Quiz nicht gefunden: {quizSlug}</p>
      </div>
    );
  }

  const totalQuestions = theme.myths.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQuestions;

  // Compute result when all questions answered
  const result: QuizResult | null = useMemo(() => {
    if (!allAnswered) return null;

    const correctCount = Object.values(answers).filter((a) => a.isCorrect).length;
    const percentile = computePercentile(theme.myths, correctCount);
    const tierIndex = getTierIndex(correctCount);

    return {
      themeSlug: quizSlug,
      totalQuestions,
      correctCount,
      percentile,
      tierIndex,
      answers: Object.values(answers),
    };
  }, [allAnswered, answers, theme.myths, quizSlug, totalQuestions]);

  // Track completion
  const prevAllAnswered = useMemo(() => allAnswered, [allAnswered]);
  if (result && prevAllAnswered) {
    // Side effect in render — we track once when result first appears.
    // This is safe because result is memoized and only computed once.
  }

  const handleStart = useCallback(() => {
    setStarted(true);
    trackQuizStarted(t(theme.titleKey));
  }, [theme.titleKey]);

  const handleAnswer = useCallback(
    (mythId: string, chosen: Classification) => {
      const myth = theme.myths.find((m) => m.id === mythId);
      if (!myth || answers[mythId]) return;

      const isCorrect = chosen === myth.correctClassification;

      const newAnswer: CardAnswer = {
        mythId,
        chosenClassification: chosen,
        isCorrect,
      };

      trackAnswerSubmitted(mythId, isCorrect, chosen);

      setAnswers((prev) => {
        const next = { ...prev, [mythId]: newAnswer };

        // Check if this was the last answer
        if (Object.keys(next).length === totalQuestions) {
          const correctCount = Object.values(next).filter((a) => a.isCorrect).length;
          const percentile = computePercentile(theme.myths, correctCount);
          const tierIndex = getTierIndex(correctCount);
          trackQuizCompleted(t(theme.titleKey), correctCount, tierIndex);
        }

        return next;
      });
    },
    [theme.myths, theme.titleKey, answers, totalQuestions]
  );

  // ── Start Screen ──────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="quiz-player quiz-player--start">
        <div className="quiz-player__start-card">
          <h2 className="quiz-player__title">{t(theme.titleKey)}</h2>
          <p className="quiz-player__subtitle">{t(theme.subtitleKey)}</p>
          <p className="quiz-player__description">
            {t(theme.descriptionKey)}
          </p>
          <p className="quiz-player__meta">
            {t("ui.questionsCount", { n: totalQuestions })}
          </p>
          <button
            className="quiz-player__start-btn"
            onClick={handleStart}
          >
            {t("ui.startQuiz")}
          </button>
        </div>
      </div>
    );
  }

  // ── Active Quiz ───────────────────────────────────────────────────
  return (
    <div className="quiz-player quiz-player--active">
      <header className="quiz-player__header">
        <h2 className="quiz-player__title quiz-player__title--small">
          {t(theme.titleKey)}
        </h2>
        <ProgressBar answered={answeredCount} total={totalQuestions} />
      </header>

      <div className="quiz-player__grid">
        {theme.myths.map((myth, i) => (
          <QuizCard
            key={myth.id}
            myth={myth}
            index={i}
            total={totalQuestions}
            answer={answers[myth.id] || null}
            onAnswer={handleAnswer}
          />
        ))}
      </div>

      {result && <ResultScreen result={result} />}
    </div>
  );
}
