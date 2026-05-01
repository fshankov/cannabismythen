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
  ALL_MYTHS_BY_ID,
  QUIZ_THEMES,
  breakdownCounts,
  computePercentile,
  moduleScore as computeModuleScore,
  pickSchnellcheckMyths,
  pointsForSchritte,
  schritte,
  scoreBand,
} from "./quizData";
import { t } from "./i18n";
import {
  trackAnswerSubmitted,
  trackKeyboardShortcutUsed,
  trackQuizCompleted,
  trackQuizStarted,
} from "./matomo";
import QuizCard from "./QuizCard";
import TitleCard from "./TitleCard";
import ProgressBar from "./ProgressBar";
import ResultScreen from "./ResultScreen";
import FactsheetPanel from "./FactsheetPanel";
import ShortcutHelp from "./ShortcutHelp";
import type { MythContentEntry } from "./FactsheetPanel";

export type { MythContentEntry };

/** Shape of editable quiz text from Keystatic content. */
export interface QuizTextEntry {
  statement: string;
  explanation: string;
}

/** Shape of editable per-band verdict + intro copy from Keystatic.
 *  Mirrors the `verdicts` + `weakSpotIntro` + `strongPerformanceIntro`
 *  fields on each quiz module .mdoc. */
export interface QuizVerdictsEntry {
  profi?: { title?: string; body?: string };
  guterweg?: { title?: string; body?: string };
  gehtnoch?: { title?: string; body?: string };
  erwischt?: { title?: string; body?: string };
}

/** Module-level intro copy shown above the result-page myth review. */
export interface QuizIntrosEntry {
  weakSpotIntro?: string;
  strongPerformanceIntro?: string;
}

/** Resolved per-band share/comparison copy. The Astro page merges per-
 *  module overrides with the global `share-copy.yaml` singleton; this
 *  is the merged result. {pct} placeholders survive into the runtime. */
export interface QuizShareCopyEntry {
  profi?: string;
  guterweg?: string;
  gehtnoch?: string;
  erwischt?: string;
}

interface QuizPlayerProps {
  /** Quiz slug, e.g. "quiz-risiken" */
  quizSlug: string;
  /** JSON-serialized Record<mythId, MythContentEntry> from Astro build */
  mythContent?: string;
  /** JSON-serialized Record<mythId, QuizTextEntry> from Keystatic quiz content */
  quizText?: string;
  /** JSON-serialized QuizVerdictsEntry from Keystatic content. Stage 5
   *  consumes this on the ResultScreen. Stage 1 only plumbs it through. */
  verdicts?: string;
  /** JSON-serialized QuizIntrosEntry from Keystatic content. Same plumbing
   *  contract as `verdicts` — Stage 5 owns rendering. */
  intros?: string;
  /** JSON-serialized QuizShareCopyEntry. Per-module override merged with
   *  global `share-copy.yaml` singleton on the Astro page (Stage 7). */
  shareCopy?: string;
  /** Optional Keystatic summary used in the intro card */
  quizSummary?: string;
}

// ── Persisted progress shape ────────────────────────────────────────────────
//
// v3 bump (Stage 1): drop the optional `confidence` field from each answer
// (ConfidenceInput was deleted), and reserve an optional `order: string[]`
// field that Stage 2 will populate when randomized question order ships.
// Older v1 records are upgraded on read by stripping unknown fields and
// re-saving as v3 on the next state mutation.
interface PersistedState {
  v: 3;
  answers: Record<string, CardAnswer>;
  currentIndex: number;
  finished: boolean;
  /** True once the user has tapped "Los geht's" on the title card. */
  introDismissed?: boolean;
  /** Reserved for Stage 2 (random-per-visit question order). When absent,
   *  the deck renders in `theme.myths` natural order. */
  order?: string[];
}

function storageKey(slug: string): string {
  return `cm-quiz-progress::${slug}`;
}

/** Strip unknown / dead fields off any persisted answer record. Older
 *  shapes carried a `confidence?: "sure"|"unsure"` field that no longer
 *  exists; this normalises everything onto the current `CardAnswer` shape. */
function normaliseAnswer(raw: unknown): CardAnswer | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.mythId !== "string" ||
    typeof r.chosenClassification !== "string" ||
    typeof r.isCorrect !== "boolean"
  ) {
    return null;
  }
  return {
    mythId: r.mythId,
    chosenClassification: r.chosenClassification as CardAnswer["chosenClassification"],
    isCorrect: r.isCorrect,
  };
}

function loadProgress(slug: string): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      v?: number;
      answers?: Record<string, unknown>;
      currentIndex?: number;
      finished?: boolean;
      introDismissed?: boolean;
      order?: unknown;
    };
    // Accept v1, v2 (transient pre-Stage-1 schema), and v3.
    // Older records get migrated to v3 by stripping dead fields below.
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.answers !== "object" ||
      parsed.answers === null
    ) {
      return null;
    }
    const version = parsed.v;
    if (version !== 1 && version !== 2 && version !== 3) return null;
    const answers: Record<string, CardAnswer> = {};
    for (const [k, v] of Object.entries(parsed.answers)) {
      const a = normaliseAnswer(v);
      if (a) answers[k] = a;
    }
    return {
      v: 3,
      answers,
      currentIndex:
        typeof parsed.currentIndex === "number" ? parsed.currentIndex : 0,
      finished: Boolean(parsed.finished),
      introDismissed: Boolean(parsed.introDismissed),
      order: Array.isArray(parsed.order)
        ? parsed.order.filter((x): x is string => typeof x === "string")
        : undefined,
    };
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

/** Count of consecutive `isCorrect` answers ending at index `idx`. Walks
 *  backward; stops at the first wrong or unanswered card. Used by the
 *  StreakChip on the front face. */
function streakAt(
  answers: Record<string, CardAnswer>,
  myths: QuizTheme["myths"],
  idx: number
): number {
  let streak = 0;
  for (let i = idx; i >= 0; i--) {
    const a = answers[myths[i].id];
    if (!a || !a.isCorrect) break;
    streak++;
  }
  return streak;
}

/** Ordered list of all theme slugs — used to compute the "Nächstes Modul"
 *  link on the result screen. Matches Object.keys(QUIZ_THEMES) order. */
const THEME_ORDER: string[] = Object.keys(QUIZ_THEMES);

/** Fisher–Yates shuffle, in-place safe (returns a fresh array). Used for
 *  the random-per-visit deck order added in Stage 2. Persisted as part of
 *  the v3 progress state so a mid-quiz reload keeps the same order. */
function shuffleMythIds(ids: string[]): string[] {
  const out = ids.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Build a stable deck order from a saved order array + the theme's myth
 *  list. If the saved order references unknown ids (theme changed), drop
 *  them; if any myths are missing from the order, append them in the
 *  theme's natural order. Falls back to the natural order entirely when
 *  no saved order exists. */
function resolveDeckOrder(
  themeMyths: QuizTheme["myths"],
  saved: string[] | undefined
): string[] {
  const themeIds = themeMyths.map((m) => m.id);
  if (!saved || saved.length === 0) return themeIds;
  const themeSet = new Set(themeIds);
  const ordered = saved.filter((id) => themeSet.has(id));
  const missing = themeIds.filter((id) => !ordered.includes(id));
  return [...ordered, ...missing];
}

/** Stage 6 — for the Schnellcheck (`theme.dynamic`), resolve the deck
 *  client-side from saved progress + the global mythId lookup. On the
 *  server we have no localStorage, so we render a small placeholder; the
 *  real deck mounts on hydration. */
function resolveDynamicTheme(
  template: QuizTheme,
  quizSlug: string
): QuizTheme {
  if (typeof window === "undefined") {
    // SSR: render an empty deck. The actual myths land at hydration.
    return template;
  }
  const saved = loadProgress(quizSlug);
  let mythIds = saved?.order ?? [];
  // Resolve persisted IDs against the global lookup; drop any unknowns.
  let myths = mythIds
    .map((id) => ALL_MYTHS_BY_ID[id])
    .filter((m): m is QuizMyth => Boolean(m));
  // Fresh visit (or stale persisted order with nothing left): pick a new 7.
  if (myths.length < 7) {
    myths = pickSchnellcheckMyths();
  }
  return { ...template, myths };
}

export default function QuizPlayer(props: QuizPlayerProps) {
  const template = QUIZ_THEMES[props.quizSlug];
  if (!template) {
    return (
      <div className="quiz-player quiz-player--error">
        <p>Quiz nicht gefunden: {props.quizSlug}</p>
      </div>
    );
  }
  const theme = template.dynamic
    ? resolveDynamicTheme(template, props.quizSlug)
    : template;
  // Stage 6: if the dynamic theme couldn't resolve any myths (SSR with
  // no client state), bail with a neutral placeholder. The hydration
  // pass will mount QuizPlayerInner with concrete myths.
  if (theme.myths.length === 0) {
    return (
      <div className="quiz-player quiz-player--loading">
        <p style={{ textAlign: "center", padding: "2rem" }}>
          Lade Schnellcheck …
        </p>
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
  verdicts,
  intros,
  shareCopy,
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

  // Stage 2: random-per-visit question order, stable within a session.
  // First visit → freshly shuffled deck; reload mid-quiz → same order
  // (read from localStorage). "Quiz zurücksetzen" clears the order so the
  // next visit re-rolls. SSR sees the natural theme order — the random
  // shuffle happens client-side after mount (see useEffect below) to keep
  // the SSR HTML deterministic. Hydration mismatch on the deck is avoided
  // by gating the shuffle behind `mounted`.
  const [order, setOrder] = useState<string[]>(() => {
    const saved = loadProgress(quizSlug);
    return resolveDeckOrder(theme.myths, saved?.order);
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

  // Title card is dismissed once the user starts (or has any saved answers).
  const [introDismissed, setIntroDismissed] = useState<boolean>(() => {
    const saved = loadProgress(quizSlug);
    if (!saved) return false;
    if (saved.introDismissed) return true;
    return Object.keys(saved.answers ?? {}).length > 0;
  });

  const [factsheetMyth, setFactsheetMyth] = useState<QuizMyth | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
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

  // ── First-mount shuffle: if localStorage didn't carry an `order`, we
  //    generate one client-side after hydration. Skipping the shuffle on
  //    the server keeps the SSR HTML deterministic (no hydration mismatch
  //    on the rendered question), and the user only sees the natural
  //    order for a single render before the shuffled order takes over.
  useEffect(() => {
    const saved = loadProgress(quizSlug);
    if (saved?.order && saved.order.length === theme.myths.length) return;
    const shuffled = shuffleMythIds(theme.myths.map((m) => m.id));
    setOrder(shuffled);
    // Intentionally only on mount + theme change. saveProgress is in the
    // next effect, so the new order will land in localStorage as soon as
    // any other state change triggers a save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizSlug, theme.myths]);

  // ── Persist on every state change. The lazy initializers mean the first
  //    write is identical to what was already on disk → safe no-op.
  useEffect(() => {
    saveProgress(quizSlug, {
      v: 3,
      answers,
      currentIndex,
      finished,
      introDismissed,
      order,
    });
  }, [quizSlug, answers, currentIndex, finished, introDismissed, order]);

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

  // Stage 5: parse Keystatic verdicts + intros once. Falls back to empty
  // shape so downstream code can rely on `?.title`/`?.body` access without
  // null checks. The hardcoded sentence-fallbacks live in ResultScreen.
  const verdictsMap: QuizVerdictsEntry = useMemo(() => {
    if (!verdicts) return {};
    try {
      return JSON.parse(verdicts) as QuizVerdictsEntry;
    } catch {
      return {};
    }
  }, [verdicts]);

  const introsMap: QuizIntrosEntry = useMemo(() => {
    if (!intros) return {};
    try {
      return JSON.parse(intros) as QuizIntrosEntry;
    } catch {
      return {};
    }
  }, [intros]);

  const shareCopyMap: QuizShareCopyEntry = useMemo(() => {
    if (!shareCopy) return {};
    try {
      return JSON.parse(shareCopy) as QuizShareCopyEntry;
    } catch {
      return {};
    }
  }, [shareCopy]);

  // ── Track quiz start once per mount.
  useEffect(() => {
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true;
      trackQuizStarted(t(theme.titleKey));
    }
  }, [theme.titleKey]);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQuestions;

  /** Live module score expressed as the Schritte-based percentage. Equal
   *  to the final `moduleScore` once every question has been answered;
   *  scales linearly with answered questions before that. The header
   *  pill renders this as a percent. */
  const totalScore = useMemo(() => {
    return computeModuleScore(Object.values(answers), theme.myths);
  }, [answers, theme.myths]);

  const result: QuizResult | null = useMemo(() => {
    if (!allAnswered) return null;
    const answersList = Object.values(answers);
    const correctCount = answersList.filter((a) => a.isCorrect).length;
    const score = computeModuleScore(answersList, theme.myths);
    const breakdown = breakdownCounts(answersList, theme.myths);
    const band = scoreBand(score);
    const percentile = computePercentile(theme.myths, answersList);
    return {
      themeSlug: quizSlug,
      totalQuestions,
      correctCount,
      moduleScore: score,
      breakdown,
      band,
      percentile,
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
      // Score delta = points awarded for THIS answer, on the same 0–100
      // scale as the running total. Drives the brief flash animation.
      const points = pointsForSchritte(
        schritte(chosen, myth.correctClassification)
      );
      setLastScoreDelta(Math.round(points * 100));

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
          // Stage 9: tier was a 0–3 band; map score band → 0..3 for Matomo
          // back-compat without re-importing the deleted helper.
          const score = computeModuleScore(list, theme.myths);
          const tierIndex = score >= 80 ? 3 : score >= 60 ? 2 : score >= 40 ? 1 : 0;
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
    setIntroDismissed(false);
    clearProgress(quizSlug);
    // Stage 6: dynamic decks (Schnellcheck) need a fresh pick of myths,
    // which only happens at mount time inside `resolveDynamicTheme`.
    // A reload is the most reliable trigger; static modules just re-roll
    // the deck order via setOrder() below and stay in-place.
    if (theme.dynamic && typeof window !== "undefined") {
      window.location.reload();
      return;
    }
    setOrder(shuffleMythIds(theme.myths.map((m) => m.id)));
  }, [quizSlug, theme.myths, theme.dynamic]);

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

  // ── Stage 2: derive the visible deck order. The `order` array is the
  //    user's session-stable shuffled sequence; `theme.myths` stays the
  //    canonical id → metadata map. Lookups by mythId go through the map;
  //    rendering by index goes through `orderedMyths`.
  const mythById = useMemo(() => {
    const map = new Map<string, QuizMyth>();
    for (const m of theme.myths) map.set(m.id, m);
    return map;
  }, [theme.myths]);
  const orderedMyths = useMemo(
    () =>
      order
        .map((id) => mythById.get(id))
        .filter((m): m is QuizMyth => Boolean(m)),
    [order, mythById]
  );

  const currentMyth = orderedMyths[safeIndex];
  const currentAnswer = currentMyth ? answers[currentMyth.id] || null : null;

  const showResults = finished && result !== null;
  const showTitleCard = !showResults && !introDismissed;
  const cardsRemainingBehind = showTitleCard
    ? Math.min(2, totalQuestions - 1)
    : Math.min(2, totalQuestions - safeIndex - 1);

  // ── Streak count for the front-face StreakChip. Computed from the
  //    visible deck so the chip reflects the user's run on the order they
  //    actually saw, not the theme's natural order. ────────────────────
  const streakCount = useMemo(
    () => streakAt(answers, orderedMyths, safeIndex),
    [answers, orderedMyths, safeIndex]
  );

  // ── Keyboard shortcuts (Phase C §3.12) ──────────────────────────────
  // Document-level keydown listener. Skips when an editable field has
  // focus, when modifier keys are held, when the result screen is shown,
  // or when no question is in flow.
  const VERDICT_BY_KEY: Record<string, Classification> = {
    "1": "falsch",
    "2": "eher_falsch",
    "3": "eher_richtig",
    "4": "richtig",
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack typing in inputs / editable elements.
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName?.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      // Skip combos with Ctrl/Cmd/Alt — those are app shortcuts.
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Esc closes the topmost overlay (priority order).
      if (e.key === "Escape") {
        if (helpOpen) {
          setHelpOpen(false);
          trackKeyboardShortcutUsed("close_help");
          e.preventDefault();
          return;
        }
        if (factsheetMyth) {
          setFactsheetMyth(null);
          trackKeyboardShortcutUsed("close_factsheet");
          e.preventDefault();
          return;
        }
        return;
      }

      // While any overlay is open, only Esc above is wired.
      if (helpOpen || factsheetMyth) return;

      // Don't operate before the user dismisses the title card or after
      // the result screen has taken over.
      if (showTitleCard || showResults || !currentMyth) return;

      // 1–4: pick a verdict (only if not already answered).
      const verdict = VERDICT_BY_KEY[e.key];
      if (verdict !== undefined) {
        if (!currentAnswer) {
          handleAnswer(currentMyth.id, verdict);
          trackKeyboardShortcutUsed(`answer:${verdict}`);
          e.preventDefault();
        }
        return;
      }

      // ←/→: navigate.
      if (e.key === "ArrowRight") {
        handleNext();
        trackKeyboardShortcutUsed("next");
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowLeft") {
        handlePrev();
        trackKeyboardShortcutUsed("prev");
        e.preventDefault();
        return;
      }

      // Enter: if answered, advance to next question.
      if (e.key === "Enter") {
        if (currentAnswer) {
          handleNext();
          trackKeyboardShortcutUsed("advance");
          e.preventDefault();
        }
        return;
      }

      // D: open the factsheet panel for the current myth.
      if (e.key === "d" || e.key === "D") {
        setFactsheetMyth(currentMyth);
        trackKeyboardShortcutUsed("open_factsheet");
        e.preventDefault();
        return;
      }

      // ?: toggle the shortcut-help popover. (Browsers fire this with
      // Shift+/; we accept either ? or / to be lenient.)
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        setHelpOpen((v) => !v);
        trackKeyboardShortcutUsed("toggle_help");
        e.preventDefault();
        return;
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    helpOpen,
    factsheetMyth,
    showTitleCard,
    showResults,
    currentMyth,
    currentAnswer,
    handleAnswer,
    handleNext,
    handlePrev,
  ]);

  // Stage 4: ProgressBar is now a Schritte-coloured pill row + module
  // title. Receives the visible deck (orderedMyths) and the answers map;
  // the pill colours derive from schritte() at render time.
  const progressBarContent = (
    <ProgressBar
      quizTitle={t(theme.titleKey)}
      myths={orderedMyths}
      answers={answers}
      currentIndex={safeIndex}
      onJump={handleJumpTo}
    />
  );

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
          {showTitleCard ? (
            <TitleCard
              title={t(theme.titleKey)}
              subtitle={t(theme.subtitleKey)}
              summary={quizSummary}
              questionCount={totalQuestions}
              onStart={() => setIntroDismissed(true)}
            />
          ) : (
            <QuizCard
              key={currentMyth.id}
              myth={currentMyth}
              index={safeIndex}
              total={totalQuestions}
              answer={currentAnswer}
              onAnswer={handleAnswer}
              onNext={handleNext}
              onPrev={handlePrev}
              onShowFactsheet={handleShowFactsheet}
              isLastQuestion={safeIndex === totalQuestions - 1}
              statementText={quizTextMap[currentMyth.id]?.statement}
              explanationText={quizTextMap[currentMyth.id]?.explanation}
              deckBehind={cardsRemainingBehind}
              categoryLabel={t(theme.titleKey)}
              streakCount={streakCount}
            />
          )}

          {/* Stage 4: bottom Zurück / dots / Nächste row removed. The
              Schritte pill row in the header now doubles as nav (click a
              pill to jump). Edge arrows on the card and ←/→ keyboard
              shortcuts cover sequential navigation. The "Direkt zum
              Ergebnis" affordance is handled implicitly: once every
              question is answered, advancing past the last question
              flips to the result page (handleNext flow). If users want
              to skip to the result mid-deck, the click-on-pill jump-back
              + back-face "Nächste Frage →" button reach the same goal.
              The persistence notice + reset link below remains the only
              footer chrome. */}

          {allAnswered && !showResults && (
            <div className="quiz-player__finish-row">
              <button
                type="button"
                className="quiz-card__next-btn"
                onClick={() => setFinished(true)}
              >
                {t("ui.finishQuiz")} →
              </button>
            </div>
          )}

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
          orderedMyths={orderedMyths}
          quizTextMap={quizTextMap}
          verdicts={verdictsMap}
          intros={introsMap}
          shareCopy={shareCopyMap}
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

      {helpOpen && <ShortcutHelp onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
