/**
 * ResultScreen — Per-module result page (Stage 5 rebuild).
 *
 * Top-to-bottom order:
 *   1) Header: "Ihr Ergebnis — {module title}"  (Sie form, BugHerd #13)
 *   2) Hero number: Schritte percentage in 60/80/96 px clamp, coloured by band
 *   3) Breakdown line: "X genau richtig · Y nah dran · Z daneben · W komplett daneben"
 *      (only bands with count > 0)
 *   4) Verdict block: title + body from Keystatic verdicts.{band}
 *   5) Population comparison: honest banded sentence; never claims
 *      "you know more than X %" when the user got most wrong.
 *   6) Module review (worst-first): Schritte chip per row, weakSpotIntro
 *      or strongPerformanceIntro at the top.
 *   7) Share section: refreshed ShareCard + Web Share / clipboard fallback
 *   8) CTAs: Fakten-Karten · Nächstes Modul · Quiz zurücksetzen · Alle Module
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
  onJumpToQuestion: (idx: number) => void;
  onShowFactsheet: (myth: QuizMyth) => void;
}

/** Stage 5 — fallback verdict copy used when a Keystatic cell is empty.
 *  These are intentionally generic; Keystatic copy should always win. */
const VERDICT_FALLBACK: Record<ScoreBand, { title: string; body: string }> = {
  profi: {
    title: "Mythen-Profi",
    body: "Sie erkennen die Cannabis-Mythen klar als das, was sie sind — Halbwahrheiten oder Mythen.",
  },
  guterweg: {
    title: "Auf dem richtigen Weg",
    body: "Bei den meisten Aussagen liegen Sie richtig. Ein paar Details lohnen einen zweiten Blick.",
  },
  gehtnoch: {
    title: "Da geht noch was",
    body: "Manche Mythen sind hartnäckig. In den Fakten-Karten finden Sie die Forschung dahinter.",
  },
  erwischt: {
    title: "Mythen haben Sie erwischt",
    body: "Die Forschung sagt häufig etwas anderes als die Alltagserzählung. Zeit für eine Tour durch die Fakten-Karten.",
  },
};

/** BugHerd #29 + #38 + #39 — canonical population framing (2026-05-07).
 *  Replaces the previous banded user-vs-population comparison with a
 *  factual statement about the population's average score for the module:
 *  "Erwachsene haben in einer Studie durchschnittlich {x} von {z} möglichen
 *  Punkten erreicht ({pct} %)."
 *
 *  Three-tier copy resolution:
 *    1. per-module Keystatic override (`shareCopy[band]`)
 *    2. global default singleton (merged into `shareCopy` by the Astro page)
 *    3. hardcoded fallback below (final defence so layout never breaks)
 *
 *  Placeholder semantics (changed in 2026-05-07 session):
 *    - {x}    → population's average absolute points for THIS module (int)
 *    - {z}    → number of myths in THIS module (int)
 *    - {pct}  → population's average percentage for THIS module (int, 0–100)
 *  Note: {pct} previously meant the user's percentile; legacy per-module
 *  overrides in `.mdoc` may need editorial refresh (flagged in
 *  internalNotes for ISD review).
 */
function bandedPopulationLine(
  band: ScoreBand,
  populationStats: PopulationStats,
  shareCopy: QuizShareCopyEntry
): string {
  const override = (shareCopy[band] ?? "").trim();
  const usable =
    override && !/^PLACEHOLDER\b/i.test(override)
      ? override
      : HARDCODED_FALLBACK[band];
  return usable
    .replace(/\{x\}/g, String(populationStats.absolutePoints))
    .replace(/\{z\}/g, String(populationStats.questionCount))
    .replace(/\{pct\}/g, String(populationStats.percent));
}

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

/** Final-defence fallback in case both the per-module override AND the
 *  global singleton are empty. CaRM IS a methodologically representative
 *  German sample (n=2.097, weighted by sex/age/education), but the word
 *  "repräsentativ" is dropped from user-visible copy per editorial ruling
 *  2026-05-06; the data framing remains accurate. All four bands now
 *  share the canonical sentence per the 2026-05-07 session — banded
 *  differentiation moves to the verdict block (Keystatic verdicts.{band}). */
const HARDCODED_FALLBACK: Record<ScoreBand, string> = {
  profi:
    "Erwachsene haben in einer Studie durchschnittlich {x} von {z} möglichen Punkten erreicht ({pct} %).",
  guterweg:
    "Erwachsene haben in einer Studie durchschnittlich {x} von {z} möglichen Punkten erreicht ({pct} %).",
  gehtnoch:
    "Erwachsene haben in einer Studie durchschnittlich {x} von {z} möglichen Punkten erreicht ({pct} %).",
  erwischt:
    "Erwachsene haben in einer Studie durchschnittlich {x} von {z} möglichen Punkten erreicht ({pct} %).",
};

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
  onJumpToQuestion,
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
      "Hier sind Ihre Antworten — sortiert nach Abstand zur Wissenschaft."
    : realCopy(intros.strongPerformanceIntro) ||
      "Sie lagen bei jeder Aussage nah dran. Hier zur Erinnerung der Stand der Forschung.";

  // ── Breakdown line (only bands with count > 0).
  const breakdownParts: string[] = [];
  if (result.breakdown.exact > 0)
    breakdownParts.push(`${result.breakdown.exact} ${t("schritte.exact").toLowerCase()}`);
  if (result.breakdown.near > 0)
    breakdownParts.push(`${result.breakdown.near} ${t("schritte.near").toLowerCase()}`);
  if (result.breakdown.off > 0)
    breakdownParts.push(`${result.breakdown.off} ${t("schritte.off").toLowerCase()}`);
  if (result.breakdown.far > 0)
    breakdownParts.push(`${result.breakdown.far} ${t("schritte.far").toLowerCase()}`);
  const breakdownLine = breakdownParts.join(" · ");

  // Population reference for the canonical sentence (BugHerd #29/#38/#39).
  // Computed from each myth's populationCorrectPct; rounded per #31.
  const populationStats = computePopulationStats(theme.myths);

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

      {/* Remediation 3 — single hero card. Combines the percentage,
          band verdict (Keystatic), banded population sentence, and the
          share button. Replaces the old "verdict box + green ShareCard"
          duplication. The card is colored by band so the user reads
          their result at a glance. */}
      <ShareCard
        result={result}
        quizUrl={quizUrl}
        moduleTitle={t(theme.titleKey)}
        verdictTitle={verdictTitle}
        verdictBody={verdictBody}
        breakdownLine={breakdownLine}
        populationLine={bandedPopulationLine(band, populationStats, shareCopy)}
      />

      {/* Module review, worst-first */}
      <div className="quiz-result__retrospective">
        <h2 className="quiz-result__retrospective-title">
          {t("ui.retrospectiveTitle")}
        </h2>
        <p className="quiz-result__retrospective-intro">{reviewIntro}</p>
        <ol className="quiz-result__list" role="list">
          {reviewRows.map((row) => {
            const { myth, answer, schritte: s, visibleIdx } = row;
            const statement =
              quizTextMap[myth.id]?.statement || t(myth.statementKey);
            const bandModifier = ["exact", "near", "off", "far"][s];
            return (
              <li
                key={myth.id}
                className={`quiz-result__item quiz-result__item--${bandModifier}`}
              >
                <div className="quiz-result__item-row">
                  {/* BugHerd #42: chip showing the schritte number ("0..3")
                      and the colored left frame on the row both removed —
                      the verdict colour on the actual answer/science chips
                      below already communicates the band; the extra step-
                      count chip felt arithmetic. Kept invisibly for screen
                      readers. */}
                  <span
                    className="sr-only"
                    aria-label={schritteLabel(s)}
                  >
                    {schritteLabel(s)}
                  </span>
                  <p className="quiz-result__item-statement">{statement}</p>
                </div>
                {/* BugHerd #24 + #40 — line order swapped (Wissenschaftlich
                    first, then Ihre Antwort) per the 2026-05-07 ruling so the
                    user reads "truth, then their answer" rather than the
                    other way around. CSS adds a blank-line spacer between
                    the two pairs (.quiz-result__item-meta gap). */}
                <div className="quiz-result__item-meta">
                  <span className="quiz-result__item-pair">
                    <span className="quiz-result__item-meta-label">
                      Wissenschaftlich:
                    </span>{" "}
                    <span
                      className={`classification classification--${myth.correctClassification}`}
                    >
                      {t(`classification.${myth.correctClassification}`)}
                    </span>
                  </span>
                  <span className="quiz-result__item-pair">
                    <span className="quiz-result__item-meta-label">
                      {t("ui.yourAnswerLabel")}:
                    </span>{" "}
                    <span
                      className={`classification classification--${answer.chosenClassification}`}
                    >
                      {t(`classification.${answer.chosenClassification}`)}
                    </span>
                  </span>
                </div>
                <div className="quiz-result__item-actions">
                  <button
                    type="button"
                    className="quiz-result__item-link"
                    onClick={() => onJumpToQuestion(visibleIdx)}
                  >
                    Zur Frage
                  </button>
                  <button
                    type="button"
                    className="quiz-result__item-link"
                    onClick={() => onShowFactsheet(myth)}
                  >
                    Zur Karte →
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Action buttons — exactly two primary actions in matching size,
          plus two same-sized text links beneath. */}
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
