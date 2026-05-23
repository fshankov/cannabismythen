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
  userJoinedPercent,
} from "./quizData";
import { t } from "./i18n";
import { trackResultCardViewed } from "./matomo";
import ShareCard from "./ShareCard";
import type {
  QuizTextEntry,
  QuizVerdictsEntry,
  QuizIntrosEntry,
  QuizShareCopyEntry,
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
  onRestart: () => void;
  /** Stage D (2026-05-22): the per-row CTA now opens the FactsheetPanel
   *  popup instead of jumping back to the question card. Same handler
   *  used by QuizCard's "Mehr auf der Fakten-Karte" button, threaded
   *  from QuizPlayer's `handleShowFactsheet`. */
  onShowFactsheet: (myth: QuizMyth) => void;
}

/** Schritte → German label, no period (matches the back-of-card verdict). */
function schritteLabel(s: 0 | 1 | 2 | 3): string {
  if (s === 0) return t("schritte.exact");
  if (s === 1) return t("schritte.near");
  if (s === 2) return t("schritte.off");
  return t("schritte.far");
}

/** Treat copy that begins with "PLACEHOLDER" (or is empty) as missing,
 *  so it falls back to the hardcoded sentence rather than rendering the
 *  editorial marker on the public page. */
function realCopy(s: string | undefined): string {
  const trimmed = (s ?? "").trim();
  if (!trimmed) return "";
  if (/^PLACEHOLDER\b/i.test(trimmed)) return "";
  return trimmed;
}

export default function ResultScreen({
  result,
  theme,
  orderedMyths,
  quizTextMap,
  verdicts,
  intros,
  shareCopy,
  onRestart,
  onShowFactsheet,
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

  // ── Intros (weakSpotIntro / strongPerformanceIntro) — pick by whether
  //    any answer is 2+ Schritte off. Falls back to a quiet generic line.
  const hasWeakSpot = reviewRows.some((r) => r.schritte >= 2);
  const reviewIntro = hasWeakSpot
    ? realCopy(intros.weakSpotIntro) ||
      "Hier sind deine Antworten — sortiert nach Abstand zur Wissenschaft."
    : realCopy(intros.strongPerformanceIntro) ||
      "Du lagst bei jeder Aussage nah dran. Hier zur Erinnerung der Stand der Forschung.";

  return (
    <section
      ref={panelRef}
      className="quiz-result"
      tabIndex={-1}
      aria-label={t("ui.resultTitle")}
    >
      {/* Header */}
      <header className="quiz-result__header">
        <h1 className="quiz-result__title">
          {t("ui.resultTitle")} — {t(theme.titleKey)}
        </h1>
      </header>

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

      {/* Module review, worst-first */}
      <div className="quiz-result__retrospective">
        <h2 className="quiz-result__retrospective-title">
          {t("ui.retrospectiveTitle")}
        </h2>
        <p className="quiz-result__retrospective-intro">{reviewIntro}</p>
        {/* Stage D (2026-05-22) — the four-column Stage B comparison
            table is gone. Per-row "Deine Antwort" and "Wissenschaftlich"
            chips now live inside the FactsheetPanel popup (popup-first
            pattern), and the per-row "Du gehörst zu X %" sentence lands
            in PR2 of the Stage-D overhaul. PR1 ships the scaffold: a
            single-row <ul> with a Schritte-tinted leading dot + the
            statement + "Mehr auf der Fakten-Karte →" CTA that opens the
            popup (replaces the broken "Zur Frage" jump-back). */}
        <ul className="quiz-result__list" aria-label={t("ui.retrospectiveTitle")}>
          {reviewRows.map((row, idx) => {
            const { myth, answer, schritte: s } = row;
            const statement =
              quizTextMap[myth.id]?.statement || t(myth.statementKey);
            const bandModifier = ["exact", "near", "off", "far"][s];
            // Stage D PR2 — Pew per-question reframe. The user joined
            // either the {pct} % who placed this statement genau richtig
            // (when s === 0) or the (100 − pct) % who didn't.
            // `userJoinedPercent` does the branch; we pick the template.
            const joinedPct = userJoinedPercent(
              myth,
              answer.chosenClassification,
            );
            const joinedSentence =
              s === 0
                ? t("result.row.joinedExact", { pct: joinedPct })
                : t("result.row.joinedMissed", { pct: joinedPct });
            // Stage D PR3 — flag the top weakest rows so the user gets a
            // gentle nudge toward the myths most worth a closer look.
            // Highlight up to the first 3 rows that are NOT genau-richtig
            // (s > 0). If the user nailed everything, no highlight shows.
            const isHighlighted = idx < 3 && s > 0;
            return (
              <li
                key={myth.id}
                className={[
                  "quiz-result__list-item",
                  `quiz-result__list-item--${bandModifier}`,
                  isHighlighted ? "quiz-result__list-item--highlighted" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="sr-only">{schritteLabel(s)}</span>
                <span
                  className={`quiz-result__list-dot quiz-result__list-dot--${bandModifier}`}
                  aria-hidden="true"
                />
                <div className="quiz-result__list-body">
                  {isHighlighted && (
                    <span className="quiz-result__list-flag">
                      {t("result.row.especiallyWorth")}
                    </span>
                  )}
                  <p className="quiz-result__list-statement">{statement}</p>
                  <p className="quiz-result__list-joined">{joinedSentence}</p>
                </div>
                <button
                  type="button"
                  className="quiz-result__list-action"
                  onClick={() => onShowFactsheet(myth)}
                >
                  {t("ui.openMythDetail")}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Stage D PR3 (2026-05-22) — the BugHerd #44 "Weiter erkunden"
          block (Daten-Explorer + Meine Interessen cross-links) was
          removed. Per the Stage D design ruling, the result page now
          points exclusively at Fakten-Karten + the next quiz module +
          a retry option, since those are the surfaces that continue
          the same learning track. Daten-Explorer / Meine-Interessen
          remain reachable from the global header / mobile tab bar. */}
      <div className="quiz-result__actions">
        <div className="quiz-result__actions-primary">
          <a
            href="/fakten-karten/"
            className="quiz-result__cta quiz-result__cta--primary"
          >
            Lies mehr in den Fakten-Karten →
          </a>
          {nextSlug && nextThemeTitle && nextSlug !== result.themeSlug && (
            <a
              href={`/quiz/${nextSlug}/`}
              className="quiz-result__cta quiz-result__cta--secondary"
            >
              {t("ui.nextModule.cta", { title: nextThemeTitle })}
            </a>
          )}
        </div>
        <div className="quiz-result__actions-tertiary">
          <button
            type="button"
            className="quiz-result__textlink"
            onClick={onRestart}
          >
            {t("ui.restartQuiz")}
          </button>
          <span className="quiz-result__textlink-sep" aria-hidden="true">
            ·
          </span>
          <a href="/quiz/" className="quiz-result__textlink">
            ← {t("ui.backToQuizzes")}
          </a>
        </div>
      </div>
    </section>
  );
}
