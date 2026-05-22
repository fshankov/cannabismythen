/**
 * ResultScreen — Per-module result page (Stage A rebuild).
 *
 * Top-to-bottom order:
 *   1) Header: "Dein Ergebnis — {module title}"
 *   2) Hero card (ShareCard): Keystatic verdict title + body + user score
 *      sentence + population reference sentence + share button.
 *      Band-tinted background.
 *   3) Module review (worst-first): per-myth answer/science pills +
 *      "Zur Frage" link. weakSpotIntro / strongPerformanceIntro intro.
 *   4) Action stack: Fakten-Karten · Nächstes Modul · Daten-Explorer ·
 *      Meine Interessen · Quiz zurücksetzen · Alle Module.
 *
 * Dropped in Stage A: medal/emoji + big-% hero, breakdown line, per-myth
 * "Zur Karte →" link. Sie → Du sweep on touched strings.
 */

import { useEffect, useMemo, useRef } from "react";
import type { CardAnswer, QuizMyth, QuizResult, QuizTheme, ScoreBand } from "./types";
import { QUIZ_THEMES, schritte, scoreBand } from "./quizData";
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

/** Stage 5 — fallback verdict copy used when a Keystatic cell is empty.
 *  These are intentionally generic; Keystatic copy should always win.
 *  Stage A (2026-05-16) — Sie → Du flip on touched fallbacks. */
const VERDICT_FALLBACK: Record<ScoreBand, { title: string; body: string }> = {
  profi: {
    title: "Mythen-Profi",
    body: "Du erkennst die Cannabis-Mythen klar als das, was sie sind — Halbwahrheiten oder Mythen.",
  },
  guterweg: {
    title: "Auf dem richtigen Weg",
    body: "Bei den meisten Aussagen liegst du richtig. Ein paar Details lohnen einen zweiten Blick.",
  },
  gehtnoch: {
    title: "Da geht noch was",
    body: "Manche Mythen sind hartnäckig. In den Fakten-Karten findest du die Forschung dahinter.",
  },
  erwischt: {
    title: "Mythen haben dich erwischt",
    body: "Die Forschung sagt häufig etwas anderes als die Alltagserzählung. Zeit für eine Tour durch die Fakten-Karten.",
  },
};

interface PopulationStats {
  /** Population's average absolute points for the module, rounded
   *  (BugHerd #31). E.g. 4 if 4.27 of 7 questions on average. */
  absolutePoints: number;
  /** Number of myths/questions in the module. */
  questionCount: number;
  /** Population's average percentage score for the module, rounded. */
  percent: number;
}

/** Compute the population's reference score for the module from each
 *  myth's `populationCorrectPct` (CaRM mean distanceScore 0–100).
 *  Average pct = mean of populationCorrectPct.
 *  Average absolute = sum(populationCorrectPct) / 100, since each myth's
 *  max points = 1 and pct/100 = expected points-per-question. */
function computePopulationStats(myths: QuizMyth[]): PopulationStats {
  if (myths.length === 0) {
    return { absolutePoints: 0, questionCount: 0, percent: 0 };
  }
  const sumPct = myths.reduce((acc, m) => acc + m.populationCorrectPct, 0);
  return {
    absolutePoints: Math.round(sumPct / 100),
    questionCount: myths.length,
    percent: Math.round(sumPct / myths.length),
  };
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
  const verdict = verdicts[band] ?? {};
  const verdictTitle = realCopy(verdict.title) || VERDICT_FALLBACK[band].title;
  const verdictBody = realCopy(verdict.body) || VERDICT_FALLBACK[band].body;

  useEffect(() => {
    trackResultCardViewed(verdictTitle);
  }, [verdictTitle]);

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

  // Population reference for the canonical sentence (BugHerd #29/#38/#39).
  // Computed from each myth's populationCorrectPct; rounded per #31.
  const populationStats = computePopulationStats(theme.myths);

  // Stage A (2026-05-16) — Pew minimalism hero. The two sentences are
  // composed inline because they're structural, not banded copy. The
  // share-copy.yaml singleton is kept in sync for future re-engagement
  // (see editorial/quiz-overhaul/stage-a/spec.md §4).
  const userScoreLine =
    `Du hast ${result.breakdown.exact} von ${result.totalQuestions} ` +
    `Aussagen genau richtig eingeordnet (${result.moduleScore} %).`;
  const populationLine =
    `Erwachsene (18–70) in einer Bevölkerungsbefragung in Deutschland ` +
    `ordneten im Schnitt ${populationStats.absolutePoints} von ` +
    `${populationStats.questionCount} Aussagen genau richtig ein ` +
    `(${populationStats.percent} %).`;

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

      {/* Stage A (2026-05-16) — Pew minimalism hero. Verdict title +
          body (Keystatic) carry the warmth; the two new lines below
          carry the numbers. The medal/big-% pair was dropped. The
          card is still tinted by band so the result reads at a glance. */}
      <ShareCard
        result={result}
        quizUrl={quizUrl}
        moduleTitle={t(theme.titleKey)}
        verdictTitle={verdictTitle}
        verdictBody={verdictBody}
        userScoreLine={userScoreLine}
        populationLine={populationLine}
      />

      {/* Stage C (2026-05-17) — compact "Du vs. Ø Bevölkerung" stats
          grid. Pulls the headline numbers up so they read at a glance
          before the user scrolls into the per-question retrospective.
          CaRM only exposes the population's "% genau richtig" per myth,
          not a 4-Schritte breakdown, so the grid is intentionally two
          rows (Genau-richtig count + overall share %). The full
          Schritte band breakdown for the user lives inside the
          retrospective table below. */}
      <table
        className="quiz-result__summary"
        aria-label={t("ui.resultSummary.title")}
      >
        <thead>
          <tr>
            <th scope="col" className="quiz-result__summary-rowlabel">
              {t("ui.resultSummary.title")}
            </th>
            <th scope="col">{t("ui.resultSummary.colYou")}</th>
            <th scope="col">{t("ui.resultSummary.colPopulation")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="quiz-result__summary-rowlabel">
              {t("ui.resultSummary.rowExact")}
            </th>
            <td className="quiz-result__summary-num">
              {result.breakdown.exact}
              <span className="quiz-result__summary-denom">
                {" / "}
                {result.totalQuestions}
              </span>
            </td>
            <td className="quiz-result__summary-num quiz-result__summary-num--muted">
              {populationStats.absolutePoints}
              <span className="quiz-result__summary-denom">
                {" / "}
                {populationStats.questionCount}
              </span>
            </td>
          </tr>
          <tr>
            <th scope="row" className="quiz-result__summary-rowlabel">
              {t("ui.resultSummary.rowShare")}
            </th>
            <td
              className={`quiz-result__summary-num quiz-result__summary-num--band quiz-result__summary-num--band-${band}`}
            >
              {result.moduleScore}
              <span className="quiz-result__summary-denom"> %</span>
            </td>
            <td className="quiz-result__summary-num quiz-result__summary-num--muted">
              {populationStats.percent}
              <span className="quiz-result__summary-denom"> %</span>
            </td>
          </tr>
        </tbody>
      </table>

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
          {reviewRows.map((row) => {
            const { myth, schritte: s } = row;
            const statement =
              quizTextMap[myth.id]?.statement || t(myth.statementKey);
            const bandModifier = ["exact", "near", "off", "far"][s];
            return (
              <li
                key={myth.id}
                className={`quiz-result__list-item quiz-result__list-item--${bandModifier}`}
              >
                <span className="sr-only">{schritteLabel(s)}</span>
                <span
                  className={`quiz-result__list-dot quiz-result__list-dot--${bandModifier}`}
                  aria-hidden="true"
                />
                <span className="quiz-result__list-statement">{statement}</span>
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

      {/* Action buttons — exactly two primary actions in matching size,
          plus a "Weiter erkunden" invitation block + two same-sized text
          links beneath. BugHerd #44 (Session 3b, 2026-05-07): the
          invitation block adds explicit cross-section CTAs to
          Daten-Explorer + Meine Interessen so the result screen reads
          as a launchpad, not a dead end. The label "Meine Interessen"
          preempts the Item 6 FAQ section rename (still upcoming);
          /meine-interessen/ will 301 to /meine-interessen/ once Item 6
          ships. */}
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
        <div className="quiz-result__actions-explore">
          <p className="quiz-result__explore-heading">Weiter erkunden</p>
          <a
            href="/daten-explorer/"
            className="quiz-result__explore-link"
          >
            Daten-Explorer →
          </a>
          <a
            href="/meine-interessen/"
            className="quiz-result__explore-link"
          >
            Meine Interessen →
          </a>
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
