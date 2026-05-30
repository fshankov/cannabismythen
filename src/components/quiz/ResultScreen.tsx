/**
 * ResultScreen — Per-module result page.
 *
 * Top-to-bottom order (Stage E commit 3, 2026-05-23):
 *   1) Header: "Dein Ergebnis — {module title}"
 *   2) Consolidated ShareCard hero: tonal headline (code-side
 *      `result.achievementHeadline.*`), user score, Erwachsene Ø,
 *      delta sentence, small share icon top-right.
 *   3) Module review (worst-first): unified list — replaced by the
 *      wrong-myths Fakten-Karten grid in Stage E commit 4.
 *   4) Action stack: Fakten-Karten · Nächstes Modul · Erneut versuchen.
 *
 * Keystatic verdict.title / verdict.body are no longer rendered on
 * this page — they remain as an editorial-suggestion surface in
 * `src/content/quiz/*.mdoc` with the `internalNotes` marker added in
 * Stage E commit 2 explaining the split.
 */

import { useEffect, useMemo, useRef } from "react";
import type { CardAnswer, QuizMyth, QuizResult, QuizTheme, ScoreBand } from "./types";
import {
  QUIZ_THEMES,
  schritte,
  scoreBand,
} from "./quizData";
import { t } from "./i18n";
import { trackResultCardViewed } from "./matomo";
import ShareCard from "./ShareCard";
import FaktenCard from "../fakten-karten/FaktenCard";
import type {
  QuizTextEntry,
  QuizVerdictsEntry,
  QuizIntrosEntry,
  QuizShareCopyEntry,
  QuizFaktenContentEntry,
} from "./QuizPlayer";

interface ResultScreenProps {
  result: QuizResult;
  theme: QuizTheme;
  /** Visible deck order (Stage 2). The review list sorts independently
   *  by Schritte; original index is preserved as a tiebreaker for stable
   *  ordering within the same band. */
  orderedMyths: QuizMyth[];
  quizTextMap: Record<string, QuizTextEntry>;
  verdicts: QuizVerdictsEntry;
  intros: QuizIntrosEntry;
  /** Stage 7: per-band share/comparison copy. Per-module override merged
   *  with the global `share-copy.yaml` singleton on the Astro page. */
  shareCopy: QuizShareCopyEntry;
  /** Stage E commit 4 (2026-05-23): per-myth fakten-karten payload for
   *  the wrong-myths grid. Built in `src/pages/quiz/[slug].astro`. */
  faktenContentMap: Record<string, QuizFaktenContentEntry>;
  onRestart: () => void;
  /** Stage D (2026-05-22): the per-row CTA now opens the FactsheetPanel
   *  popup instead of jumping back to the question card. Same handler
   *  used by QuizCard's "Mehr auf der Fakten-Karte" button, threaded
   *  from QuizPlayer's `handleShowFactsheet`. */
  onShowFactsheet: (myth: QuizMyth) => void;
  /** Stage E commit 4: slug-based opener for the wrong-myths
   *  `FaktenCard` grid. FaktenCard hands back a kebab slug; the
   *  parent resolves to a QuizMyth so the popup still gets the user's
   *  answer wired through (Stage D PR1). */
  onShowFactsheetBySlug: (slug: string) => void;
}

export default function ResultScreen({
  result,
  theme,
  orderedMyths,
  quizTextMap,
  verdicts,
  intros,
  shareCopy,
  faktenContentMap,
  onRestart,
  onShowFactsheet,
  onShowFactsheetBySlug,
}: ResultScreenProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const band: ScoreBand = result.band ?? scoreBand(result.moduleScore);

  // Stage E commit 3 (2026-05-23): Matomo tracking name now uses the
  // code-side achievement headline (the string the user actually sees
  // at the top of the result page). Keystatic verdict.title is no
  // longer rendered (see `internalNotes` markers in src/content/quiz/*.mdoc).
  const achievementHeadline = t(`result.achievementHeadline.${band}`);
  useEffect(() => {
    trackResultCardViewed(achievementHeadline);
  }, [achievementHeadline]);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.focus();
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const quizUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/quiz/${result.themeSlug}/`
      : `/quiz/${result.themeSlug}/`;

  // ── Next module computation (Phase C §3.14) ──────────────────────────
  const themeSlugs = Object.keys(QUIZ_THEMES);
  const currentSlugIdx = themeSlugs.indexOf(result.themeSlug);
  const nextSlug =
    currentSlugIdx === -1
      ? themeSlugs[0]
      : themeSlugs[(currentSlugIdx + 1) % themeSlugs.length];
  const nextTheme = nextSlug ? QUIZ_THEMES[nextSlug] : undefined;
  const nextThemeTitle = nextTheme ? t(nextTheme.titleKey) : null;

  // ── Stage 5: build the worst-first review list. Primary sort by
  //    Schritte descending (3 → 2 → 1 → 0), secondary by the visible
  //    deck order so equally-bad answers stay stable. ────────────────
  const reviewRows = useMemo(() => {
    type Row = {
      myth: QuizMyth;
      answer: CardAnswer;
      schritte: 0 | 1 | 2 | 3;
      visibleIdx: number;
    };
    const rows: Row[] = [];
    orderedMyths.forEach((myth, visibleIdx) => {
      const a = result.answers.find((x) => x.mythId === myth.id);
      if (!a) return;
      rows.push({
        myth,
        answer: a,
        schritte: schritte(a.chosenClassification, myth.correctClassification),
        visibleIdx,
      });
    });
    rows.sort((a, b) => {
      if (b.schritte !== a.schritte) return b.schritte - a.schritte;
      return a.visibleIdx - b.visibleIdx;
    });
    return rows;
  }, [orderedMyths, result.answers]);

  // Stage E commit 4 (2026-05-23): Keystatic `weakSpotIntro` /
  // `strongPerformanceIntro` are no longer rendered on the result
  // page — the wrong-myths section below has its own heading. The
  // Keystatic fields remain populated as editorial-suggestion surface
  // alongside the verdict block; see the `internalNotes` marker on
  // each module .mdoc.

  return (
    <section
      ref={panelRef}
      className="quiz-result"
      tabIndex={-1}
      aria-label={t("ui.resultTitle")}
    >
      {/* 2026-05-30 (Fedor) — the visible `Dein Ergebnis — {module}`
          heading and the inline quiz progress bar were removed from the
          result page. The section keeps "Dein Ergebnis" only as an
          aria-label (above) for screen readers; the module name is now
          woven into the ShareCard verdict card eyebrow below. */}

      {/* Stage E commit 3 (2026-05-23) — Consolidated ShareCard hero.
          The Stage A Keystatic verdict + Stage D standalone achievement
          card are now folded into one block. ShareCard reads the
          tonal headline from code (`result.achievementHeadline.*`),
          computes the score / population / delta inside, and renders
          a small share icon top-right (replaces the big button below). */}
      <ShareCard
        result={result}
        quizUrl={quizUrl}
        moduleTitle={t(theme.titleKey)}
        deckMyths={theme.myths}
      />

      {/* Stage E commit 4 (2026-05-23) — wrong-myths grid. Replaces
          the Stage D unified `quiz-result__list` of all 7 myths with
          `Lohnt sich besonders` flag on the top 3. Now: only the
          myths the user did NOT place genau richtig (Schritte > 0)
          show up, rendered as fakten-karten flip cards. Click opens
          the FactsheetPanel popup with the Stage D PR1 `Deine Antwort`
          strip so the comparison stays contextualised. Section is
          hidden entirely if the user got everything right — no
          "Glückwunsch, alles richtig" line; the consolidated block
          above already carries that energy. */}
      {reviewRows.some((r) => r.schritte > 0) && (
        <div className="quiz-result__wrong-myths">
          <h2 className="quiz-result__wrong-myths-title">
            {t("result.wrongMyths.heading")}
          </h2>
          <div className="fakten-grid quiz-result__wrong-grid">
            {reviewRows
              .filter((r) => r.schritte > 0)
              .map((row) => {
                const fakten = faktenContentMap[row.myth.id];
                if (!fakten) return null;
                return (
                  <FaktenCard
                    key={row.myth.id}
                    myth={fakten}
                    categoryGroup={fakten.categoryGroup}
                    onShowFactsheet={onShowFactsheetBySlug}
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* Stage G (2026-05-23) — all four CTAs render as filled primary
          buttons. The Stage D primary/secondary/tertiary distinction is
          gone; one flat `.quiz-result__actions` row that wraps to a
          column on mobile. Fakten-Karten + Nächstes Modul + Quiz
          wiederholen + Alle Quiz-Module read as equal-weight next
          steps. */}
      <div className="quiz-result__actions">
        <a
          href="/fakten-karten/"
          className="quiz-result__cta quiz-result__cta--primary"
        >
          Lies mehr in den Fakten-Karten →
        </a>
        {nextSlug && nextThemeTitle && nextSlug !== result.themeSlug && (
          <a
            href={`/quiz/${nextSlug}/`}
            className="quiz-result__cta quiz-result__cta--primary"
          >
            {t("ui.nextModule.cta", { title: nextThemeTitle })}
          </a>
        )}
        <button
          type="button"
          className="quiz-result__cta quiz-result__cta--primary"
          onClick={onRestart}
        >
          {t("ui.restartQuiz")}
        </button>
        <a
          href="/quiz/"
          className="quiz-result__cta quiz-result__cta--primary"
        >
          ← {t("ui.backToQuizzes")}
        </a>
      </div>
    </section>
  );
}
