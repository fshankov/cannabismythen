/**
 * QuizPlayer — Interactive one-question-at-a-time quiz flow.
 *
 * Flow:
 *   1. Component mounts → optionally restores progress from localStorage
 *   2. Renders ONE QuizCard at a time, full-bleed on mobile
 *   3. After each answer the card flips to show feedback + verdict + explanation
 *   4. "Nächste Frage" advances to the next question
 *   5. After the last question the ResultScreen is rendered inline with a
 *      retrospective list, share card and cross-link to the data explorer.
 *
 * Progress is persisted in localStorage under `cm-quiz-progress::<slug>` so a
 * reload doesn't lose the user's answers. Users see an explicit notice and
 * can reset the quiz at any time.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type {
  CardAnswer,
  Classification,
  QuizMyth,
  QuizResult,
} from "./types";
import {
  QUIZ_THEMES,
  computePercentile,
  getTierIndex,
} from "./quizData";
import { t } from "./i18n";
import {
  trackAnswerSubmitted,
  trackQuizCompleted,
  trackQuizStarted,
} from "./matomo";
import QuizCard from "./QuizCard";
import ProgressBar from "./ProgressBar";
import ResultScreen from "./ResultScreen";
import FactsheetPanel from "./FactsheetPanel";
import type { MythContentEntry } from "./FactsheetPanel";

export type { MythContentEntry };

/** Shape of editable quiz text from Keystatic content. */
export interface QuizTextEntry {
  statement: string;
  explanation: string;
}

interface QuizPlayerProps {
  /** Quiz slug, e.g. "quiz-risiken" */
  quizSlug: string;
  /** JSON-serialized Record<mythId, MythContentEntry> from Astro build */
  mythContent?: string;
  /** JSON-serialized Record<mythId, QuizTextEntry> from Keystatic selbsttest content */
  quizText?: string;
}

// ── Scoring: distance from evidence-based classification ─────────────────────
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

interface PersistedState {
  v: 1;
  answers: Record<string, CardAnswer>;
  currentIndex: number;
  finished: boolean;
}

function storageKey(slug: string): string {
  return `cm-quiz-progress::${slug}`;
}

function loadProgress(slug: string): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed && parsed.v === 1 && typeof parsed.answers === "object") {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveProgress(slug: string, state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(state));
  } catch {
    // ignore (quota / private mode)
  }
}

function clearProgress(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(slug));
  } catch {
    // ignore
  }
}

export default function QuizPlayer({
  quizSlug,
  mythContent,
  quizText,
}: QuizPlayerProps) {
  const theme = QUIZ_THEMES[quizSlug];
  const [answers, setAnswers] = useState<Record<string, CardAnswer>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [factsheetMyth, setFactsheetMyth] = useState<QuizMyth | null>(null);
  const [lastScoreDelta, setLastScoreDelta] = useState(0);
  const [restoredNotice, setRestoredNotice] = useState(false);
  const hasTrackedStart = useRef(false);
  const hydrated = useRef(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (!theme || hydrated.current) return;
    hydrated.current = true;
    const saved = loadProgress(quizSlug);
    if (saved) {
      const validAnswers: Record<string, CardAnswer> = {};
      for (const m of theme.myths) {
        if (saved.answers[m.id]) validAnswers[m.id] = saved.answers[m.id];
      }
      setAnswers(validAnswers);
      const safeIndex = Math.min(
        Math.max(0, saved.currentIndex || 0),
        theme.myths.length - 1
      );
      setCurrentIndex(safeIndex);
      setFinished(Boolean(saved.finished));
      if (Object.keys(validAnswers).length > 0) {
        setRestoredNotice(true);
        const tid = setTimeout(() => setRestoredNotice(false), 4000);
        return () => clearTimeout(tid);
      }
    }
  }, [quizSlug, theme]);

  // Persist on every state change once hydrated
  useEffect(() => {
    if (!hydrated.current || !theme) return;
    saveProgress(quizSlug, {
      v: 1,
      answers,
      currentIndex,
      finished,
    });
  }, [quizSlug, theme, answers, currentIndex, finished]);

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

  // Parse content maps once
  const mythContentMap: Record<string, MythContentEntry> = useMemo(() => {
    if (!mythContent) return {};
    try {
      return JSON.parse(mythContent);
    } catch {
      return {};
    }
  }, [mythContent]);

  const quizTextMap: Record<string, QuizTextEntry> = useMemo(() => {
    if (!quizText) return {};
    try {
      return JSON.parse(quizText);
    } catch {
      return {};
    }
  }, [quizText]);

  // Track quiz start once per mount
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

  const totalScore = useMemo(() => {
    let s = 0;
    for (const a of Object.values(answers)) {
      const myth = theme.myths.find((m) => m.id === a.mythId);
      if (myth) s += answerScore(a.chosenClassification, myth.correctClassification);
    }
    return s;
  }, [answers, theme.myths]);

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
      answers: theme.myths
        .map((m) => answersList.find((a) => a.mythId === m.id)!)
        .filter(Boolean),
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
        if (Object.keys(next).length === totalQuestions) {
          const list = Object.values(next);
          const correctCount = list.filter((a) => a.isCorrect).length;
          const tierIndex = getTierIndex(correctCount, totalQuestions);
          trackQuizCompleted(t(theme.titleKey), correctCount, tierIndex);
        }
        return next;
      });
    },
    [theme.myths, theme.titleKey, answers, totalQuestions]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  }, [currentIndex, totalQuestions]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setFinished(false);
    }
  }, [currentIndex]);

  const handleJumpTo = useCallback((idx: number) => {
    setCurrentIndex(idx);
    setFinished(false);
  }, []);

  const handleRestart = useCallback(() => {
    setAnswers({});
    setLastScoreDelta(0);
    setCurrentIndex(0);
    setFinished(false);
    clearProgress(quizSlug);
  }, [quizSlug]);

  const handleShowFactsheet = useCallback((myth: QuizMyth) => {
    setFactsheetMyth(myth);
  }, []);

  const handleCloseFactsheet = useCallback(() => {
    setFactsheetMyth(null);
  }, []);

  // Resolve current myth (clamp to valid range)
  const safeIndex = Math.min(
    Math.max(0, currentIndex),
    Math.max(0, totalQuestions - 1)
  );
  const currentMyth = theme.myths[safeIndex];
  const currentAnswer = currentMyth ? answers[currentMyth.id] || null : null;

  const showResults = finished && result !== null;

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
          <header className="quiz-player__header">
            {progressBarContent}
          </header>
        )
      }

      {!showResults && currentMyth && (
        <div className="quiz-player__flow">
          <QuizCard
            key={currentMyth.id}
            myth={currentMyth}
            index={safeIndex}
            total={totalQuestions}
            answer={currentAnswer}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onShowFactsheet={handleShowFactsheet}
            isLastQuestion={safeIndex === totalQuestions - 1}
            statementText={quizTextMap[currentMyth.id]?.statement}
            explanationText={quizTextMap[currentMyth.id]?.explanation}
          />

          <nav
            className="quiz-player__nav"
            aria-label="Frage-Navigation"
          >
            <button
              type="button"
              className="quiz-player__nav-btn"
              onClick={handlePrev}
              disabled={safeIndex === 0}
            >
              ← {t("ui.previousQuestion")}
            </button>
            <ol className="quiz-player__dots" aria-label="Fortschritt">
              {theme.myths.map((m, i) => {
                const a = answers[m.id];
                const state = a
                  ? a.isCorrect
                    ? "correct"
                    : "incorrect"
                  : "open";
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      className={`quiz-player__dot quiz-player__dot--${state} ${
                        i === safeIndex ? "quiz-player__dot--current" : ""
                      }`}
                      aria-label={t("ui.questionLabel", {
                        n: i + 1,
                        total: totalQuestions,
                      })}
                      aria-current={i === safeIndex ? "step" : undefined}
                      onClick={() => handleJumpTo(i)}
                    >
                      {i + 1}
                    </button>
                  </li>
                );
              })}
            </ol>
            {allAnswered ? (
              <button
                type="button"
                className="quiz-player__nav-btn quiz-player__nav-btn--primary"
                onClick={() => setFinished(true)}
              >
                {t("ui.skipToResult")} →
              </button>
            ) : (
              <button
                type="button"
                className="quiz-player__nav-btn"
                onClick={handleNext}
                disabled={
                  !currentAnswer || safeIndex === totalQuestions - 1
                }
              >
                {t("ui.nextQuestion")} →
              </button>
            )}
          </nav>

          <div className="quiz-player__notice" role="note">
            <span aria-hidden="true">🔒</span>{" "}
            {restoredNotice
              ? `${t("ui.progressRestored")} ${t("ui.persistenceNotice")}`
              : t("ui.persistenceNotice")}
            {answeredCount > 0 && (
              <>
                {" "}
                <button
                  type="button"
                  className="quiz-player__reset-link"
                  onClick={handleRestart}
                >
                  {t("ui.resetProgress")}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showResults && result && (
        <ResultScreen
          result={result}
          theme={theme}
          quizTextMap={quizTextMap}
          onRestart={handleRestart}
          onJumpToQuestion={(idx) => {
            setFinished(false);
            setCurrentIndex(idx);
          }}
          onShowFactsheet={handleShowFactsheet}
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
