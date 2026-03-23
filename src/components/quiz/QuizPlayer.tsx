/**
 * QuizPlayer — Interactive quiz island component (React).
 *
 * Renders all myth cards in a responsive grid. No intermediate start screen —
 * the quiz begins immediately when the component mounts.
 *
 * The progress bar is portalled into the site <header> via #quiz-progress-slot,
 * so it appears as a merged second row inside the glassmorphism nav.
 *
 * When all cards are answered, a full-screen result modal opens.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Classification, CardAnswer, QuizResult, QuizMyth } from "./types";
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
import FactsheetPanel from "./FactsheetPanel";

/** Shape of pre-rendered myth content passed from Astro. */
export interface MythContentEntry {
  html: string;
  title: string;
  classification: string;
  classificationLabel: string;
  refCount: number;
}

/** Shape of editable quiz text from Keystatic content. */
export interface QuizTextEntry {
  statement: string;
  explanation: string;
}

interface QuizPlayerProps {
  /** Quiz slug, e.g. "quiz-alltag" */
  quizSlug: string;
  /** JSON-serialized Record<mythId, MythContentEntry> from Astro build */
  mythContent?: string;
  /** JSON-serialized Record<mythId, QuizTextEntry> from Keystatic selbsttest content */
  quizText?: string;
}

// ── Scoring: distance from evidence-based classification ─────────────────────
// exact match → +2, 1 step → +1, 2 steps → −1, 3 steps → −2
const CLASS_POS: Record<Classification, number> = {
  richtig: 1,
  eher_richtig: 2,
  eher_falsch: 3,
  falsch: 4,
};

function answerScore(chosen: Classification, correct: Classification): number {
  const d = Math.abs(CLASS_POS[chosen] - CLASS_POS[correct]);
  if (d === 0) return 2;
  if (d === 1) return 1;
  if (d === 2) return -1;
  return -2;
}

export default function QuizPlayer({ quizSlug, mythContent, quizText }: QuizPlayerProps) {
  const theme = QUIZ_THEMES[quizSlug];
  const [answers, setAnswers] = useState<Record<string, CardAnswer>>({});
  const [factsheetMyth, setFactsheetMyth] = useState<QuizMyth | null>(null);
  const [lastScoreDelta, setLastScoreDelta] = useState(0);
  const hasTrackedStart = useRef(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Find the portal target in the DOM
  useEffect(() => {
    const el = document.getElementById("quiz-progress-slot");
    if (el) {
      setPortalTarget(el);
      el.classList.add("quiz-progress-slot--active");
    }
    return () => {
      if (el) el.classList.remove("quiz-progress-slot--active");
    };
  }, []);

  // Parse myth content once
  const mythContentMap: Record<string, MythContentEntry> = useMemo(() => {
    if (!mythContent) return {};
    try {
      return JSON.parse(mythContent);
    } catch {
      return {};
    }
  }, [mythContent]);

  // Parse Keystatic quiz text (statement + explanation per myth)
  const quizTextMap: Record<string, QuizTextEntry> = useMemo(() => {
    if (!quizText) return {};
    try {
      return JSON.parse(quizText);
    } catch {
      return {};
    }
  }, [quizText]);

  // Track quiz start on mount
  useEffect(() => {
    if (theme && !hasTrackedStart.current) {
      hasTrackedStart.current = true;
      trackQuizStarted(t(theme.titleKey));
    }
  }, [theme]);

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

  // Compute running score
  const totalScore = useMemo(() => {
    let s = 0;
    for (const a of Object.values(answers)) {
      const myth = theme.myths.find((m) => m.id === a.mythId);
      if (myth) s += answerScore(a.chosenClassification, myth.correctClassification);
    }
    return s;
  }, [answers, theme.myths]);

  // Compute result when all questions answered
  const result: QuizResult | null = useMemo(() => {
    if (!allAnswered) return null;

    const answersList = Object.values(answers);
    const correctCount = answersList.filter((a) => a.isCorrect).length;
    const correctPct = Math.round((correctCount / totalQuestions) * 100);
    const percentile = computePercentile(theme.myths, answersList);
    const tierIndex = getTierIndex(correctCount, totalQuestions);

    return {
      themeSlug: quizSlug,
      totalQuestions,
      correctCount,
      correctPct,
      percentile,
      tierIndex,
      answers: answersList,
    };
  }, [allAnswered, answers, theme.myths, quizSlug, totalQuestions]);

  const handleAnswer = useCallback(
    (mythId: string, chosen: Classification) => {
      const myth = theme.myths.find((m) => m.id === mythId);
      if (!myth || answers[mythId]) return;

      const isCorrect = chosen === myth.correctClassification;
      const delta = answerScore(chosen, myth.correctClassification);
      setLastScoreDelta(delta);

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
          const nextList = Object.values(next);
          const correctCount = nextList.filter((a) => a.isCorrect).length;
          const tierIndex = getTierIndex(correctCount, totalQuestions);
          trackQuizCompleted(t(theme.titleKey), correctCount, tierIndex);
        }

        return next;
      });
    },
    [theme.myths, theme.titleKey, answers, totalQuestions]
  );

  const handleRestart = useCallback(() => {
    setAnswers({});
    setLastScoreDelta(0);
  }, []);

  const handleShowFactsheet = useCallback((myth: QuizMyth) => {
    setFactsheetMyth(myth);
  }, []);

  const handleCloseFactsheet = useCallback(() => {
    setFactsheetMyth(null);
  }, []);

  // The progress bar portalled into the site header
  const progressBarContent = (
    <ProgressBar
      answered={answeredCount}
      total={totalQuestions}
      score={totalScore}
      lastScoreDelta={lastScoreDelta}
      quizTitle={t(theme.titleKey)}
    />
  );

  return (
    <div className="quiz-player quiz-player--active">
      {/* Portal progress bar into site <header> */}
      {portalTarget
        ? createPortal(progressBarContent, portalTarget)
        : (
          // Fallback: render inline if portal target not found
          <header className="quiz-player__header">
            {progressBarContent}
          </header>
        )
      }

      <div className="quiz-player__grid">
        {theme.myths.map((myth, i) => (
          <QuizCard
            key={myth.id}
            myth={myth}
            index={i}
            total={totalQuestions}
            answer={answers[myth.id] || null}
            onAnswer={handleAnswer}
            onShowFactsheet={handleShowFactsheet}
            statementText={quizTextMap[myth.id]?.statement}
            explanationText={quizTextMap[myth.id]?.explanation}
          />
        ))}
      </div>

      {result && (
        <ResultScreen
          result={result}
          onRestart={handleRestart}
        />
      )}

      {factsheetMyth && (
        <FactsheetPanel
          myth={factsheetMyth}
          mythContentEntry={mythContentMap[factsheetMyth.id]}
          onClose={handleCloseFactsheet}
          statementText={quizTextMap[factsheetMyth.id]?.statement}
          explanationText={quizTextMap[factsheetMyth.id]?.explanation}
        />
      )}
    </div>
  );
}
