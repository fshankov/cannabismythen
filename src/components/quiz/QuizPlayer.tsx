/**
 * QuizPlayer — Interactive one-question-at-a-time quiz flow.
 *
 * Flow:
 *   1. Component mounts → progress is restored synchronously from localStorage
 *      via lazy useState initializers (no flash of empty state).
 *   2. Renders ONE QuizCard at a time, full-bleed on mobile.
 *   3. After each answer the card flips to show feedback, the myth verdict,
 *      a 2-sentence explanation, and a population comparison bar.
 *   4. "Nächste Frage" advances to the next question.
 *   5. After the last question the ResultScreen is rendered inline with a
 *      retrospective list, share card and cross-link to the data explorer.
 *
 * Progress is persisted in localStorage under `cm-quiz-progress::<slug>` so a
 * reload doesn't lose the user's answers. Users see an explicit notice and
 * can reset the quiz at any time.
 *
 * Architecture: the outer `QuizPlayer` resolves the theme; if the slug is
 * unknown it renders an error and bails out. Otherwise it mounts
 * `QuizPlayerInner` with a non-null `theme`, so every hook lives behind a
 * stable, theme-guaranteed component (no Rules-of-Hooks gotchas).
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
  QuizTheme,
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
  /** Optional Keystatic summary used in the intro card */
  quizSummary?: string;
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

/** Per-quiz accent token (one of the four classification colours) used to
 *  tint the progress bar fill, the dot ring, and the next-question CTA. */
const QUIZ_ACCENT: Record<string, string> = {
  "quiz-medizin": "var(--color-richtig)",
  "quiz-risiken": "var(--color-falsch)",
  "quiz-stimmung": "var(--color-eher-richtig)",
  "quiz-gefaehrlichkeit": "var(--color-eher-falsch)",
  "quiz-gesellschaft": "var(--color-accent)",
};

export default function QuizPlayer(props: QuizPlayerProps) {
  const theme = QUIZ_THEMES[props.quizSlug];
  if (!theme) {
    return (
      <div className="quiz-player quiz-player--error">
        <p>Quiz nicht gefunden: {props.quizSlug}</p>
      </div>
    );
  }
  return <QuizPlayerInner {...props} theme={theme} />;
}

interface QuizPlayerInnerProps extends QuizPlayerProps {
  theme: QuizTheme;
}

function QuizPlayerInner({
  quizSlug,
  mythContent,
  quizText,
  quizSummary,
  theme,
}: QuizPlayerInnerProps) {
  const totalQuestions = theme.myths.length;
  const accent = QUIZ_ACCENT[quizSlug] ?? "var(--color-accent)";

  // ── Lazy state initialisers: read localStorage SYNCHRONOUSLY before first
  //    render. No useEffect race, no flash of empty state on reload.
  const [answers, setAnswers] = useState<Record<string, CardAnswer>>(() => {
    const saved = loadProgress(quizSlug);
    if (!saved) return {};
    const valid: Record<string, CardAnswer> = {};
    for (const m of theme.myths) {
      if (saved.answers[m.id]) valid[m.id] = saved.answers[m.id];
    }
    return valid;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const saved = loadProgress(quizSlug);
    const raw = saved?.currentIndex ?? 0;
    return Math.min(Math.max(0, raw), Math.max(0, totalQuestions - 1));
  });

  const [finished, setFinished] = useState<boolean>(() => {
    const saved = loadProgress(quizSlug);
    return Boolean(saved?.finished);
  });

  const [factsheetMyth, setFactsheetMyth] = useState<QuizMyth | null>(null);
  const [lastScoreDelta, setLastScoreDelta] = useState(0);
  const [restoredNotice, setRestoredNotice] = useState<boolean>(() => {
    const saved = loadProgress(quizSlug);
    return Boolean(saved && Object.keys(saved.answers).length > 0);
  });

  const hasTrackedStart = useRef(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // ── Hide the "Fortschritt wiederhergestellt" notice after a moment.
  useEffect(() => {
    if (!restoredNotice) return;
    const tid = setTimeout(() => setRestoredNotice(false), 4000);
    return () => clearTimeout(tid);
  }, [restoredNotice]);

  // ── Persist on every state change. The lazy initializers mean the first
  //    write is identical to what was already on disk → safe no-op.
  useEffect(() => {
    saveProgress(quizSlug, { v: 1, answers, currentIndex, finished });
  }, [quizSlug, answers, currentIndex, finished]);

  // ── Find the portal target inside the site <header>.
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

  // ── Parse content maps once.
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

  // ── Track quiz start once per mount.
  useEffect(() => {
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true;
      trackQuizStarted(t(theme.titleKey));
    }
  }, [theme.titleKey]);

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
    setRestoredNotice(false);
    clearProgress(quizSlug);
  }, [quizSlug]);

  const handleShowFactsheet = useCallback((myth: QuizMyth) => {
    setFactsheetMyth(myth);
  }, []);

  const handleCloseFactsheet = useCallback(() => {
    setFactsheetMyth(null);
  }, []);

  // Resolve current myth (clamp index in case theme size changed).
  const safeIndex = Math.min(
    Math.max(0, currentIndex),
    Math.max(0, totalQuestions - 1)
  );
  const currentMyth = theme.myths[safeIndex];
  const currentAnswer = currentMyth ? answers[currentMyth.id] || null : null;

  const showResults = finished && result !== null;
  const showIntro = !showResults && answeredCount === 0;

  const progressBarContent = (
    <ProgressBar
      answered={answeredCount}
      total={totalQuestions}
      score={totalScore}
      lastScoreDelta={lastScoreDelta}
      quizTitle={t(theme.titleKey)}
    />
  );

  const estimatedMinutes = Math.max(1, Math.round(totalQuestions * 0.5));

  return (
    <div
      className="quiz-player quiz-player--active"
      style={{ ["--quiz-accent" as string]: accent }}
    >
      {portalTarget
        ? createPortal(progressBarContent, portalTarget)
        : (
          <header className="quiz-player__header">
            {progressBarContent}
          </header>
        )}

      {!showResults && currentMyth && (
        <div className="quiz-player__flow">
          {showIntro && (
            <header className="quiz-player__intro">
              <p className="quiz-player__intro-eyebrow">Selbsttest</p>
              <h1 className="quiz-player__intro-title">
                {t(theme.titleKey)}
              </h1>
              <p className="quiz-player__intro-subtitle">
                {t(theme.subtitleKey)}
              </p>
              {quizSummary && (
                <p className="quiz-player__intro-summary">{quizSummary}</p>
              )}
              <p className="quiz-player__intro-meta">
                {t("ui.questionsCount", { n: totalQuestions })} · ca.{" "}
                {estimatedMinutes} Min.
              </p>
            </header>
          )}

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
