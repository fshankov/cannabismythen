/**
 * ResultScreen — Per-module result page (Stage 5 rebuild).
 *
 * Top-to-bottom order:
 *   1) Header: "Dein Ergebnis — {module title}"
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

/** Stage 7 — banded honest population copy. Three-tier resolution:
 *  per-module Keystatic override (`shareCopy[band]`) → global default
 *  singleton (already merged into `shareCopy` by the Astro page) →
 *  hardcoded fallback (final defence so the layout never breaks). */
function bandedPopulationLine(
  band: ScoreBand,
  percentile: number,
  shareCopy: QuizShareCopyEntry
): string {
  const template = (shareCopy[band] ?? "").trim() || HARDCODED_FALLBACK[band];
  return template.replace(/\{pct\}/g, String(percentile));
}

/** Final-defence fallback in case both the per-module override AND the
 *  global singleton are empty. Should never render in practice. */
const HARDCODED_FALLBACK: Record<ScoreBand, string> = {
  profi:
    "Du liegst klar über dem Schnitt der Erwachsenen (18–70) in der CaRM-Studie (ca. {pct} %).",
  guterweg:
    "Du liegst leicht über dem Schnitt der Erwachsenen (18–70) in der CaRM-Studie (ca. {pct} %).",
  gehtnoch:
    "Du liegst etwa im Schnitt der Erwachsenen (18–70) in der CaRM-Studie (ca. {pct} %).",
  erwischt:
    "Hier saßen noch viele Mythen. Die Fakten-Karten räumen das in zehn Minuten auf.",
};

/** Schritte → German label, no period (matches the back-of-card verdict). */
function schritteLabel(s: 0 | 1 | 2 | 3): string {
  if (s === 0) return t("schritte.exact");
  if (s === 1) return t("schritte.near");
  if (s === 2) return t("schritte.off");
  return t("schritte.far");
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
  const verdictTitle = verdict.title?.trim() || VERDICT_FALLBACK[band].title;
  const verdictBody = verdict.body?.trim() || VERDICT_FALLBACK[band].body;

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
    ? intros.weakSpotIntro?.trim() ||
      "Hier sind die Aussagen, bei denen es knapp wurde — sortiert nach Abstand zur Wissenschaft."
    : intros.strongPerformanceIntro?.trim() ||
      "Du lagst bei jeder Aussage nah dran. Hier zur Erinnerung der Stand der Forschung zu jedem Mythos.";

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

  return (
    <section
      ref={panelRef}
      className="quiz-result"
      tabIndex={-1}
      aria-label={t("ui.resultTitle")}
    >
      {/* 1 — Header */}
      <header className="quiz-result__header">
        <h1 className="quiz-result__title">
          {t("ui.resultTitle")} — {t(theme.titleKey)}
        </h1>
      </header>

      {/* 2 — Hero number */}
      <div className={`quiz-result__hero quiz-result__hero--${band}`}>
        <span
          className="quiz-result__hero-num"
          aria-label={`${result.moduleScore} Prozent`}
        >
          {result.moduleScore}
          <span className="quiz-result__hero-pct">&nbsp;%</span>
        </span>
        {/* 3 — Breakdown line */}
        {breakdownLine && (
          <p className="quiz-result__breakdown">{breakdownLine}</p>
        )}
      </div>

      {/* 4 — Verdict block (Keystatic) */}
      <div className={`quiz-result__verdict quiz-result__verdict--${band}`}>
        <h2 className="quiz-result__verdict-title">{verdictTitle}</h2>
        <p className="quiz-result__verdict-body">{verdictBody}</p>
      </div>

      {/* 5 — Population comparison (honest, banded) */}
      <p className="quiz-result__population">
        {bandedPopulationLine(band, result.percentile, shareCopy)}
      </p>
      <p className="quiz-result__population-source">
        Vergleichswert: Mittelwert pro Mythos bei Erwachsenen (18–70) in
        der CaRM-Studie.
      </p>

      {/* 6 — Module review, worst-first */}
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
                  <span
                    className={`quiz-result__item-chip quiz-result__item-chip--${bandModifier}`}
                    aria-label={schritteLabel(s)}
                  >
                    {s}
                  </span>
                  <p className="quiz-result__item-statement">{statement}</p>
                </div>
                <div className="quiz-result__item-meta">
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

      {/* 7 — Share section */}
      <div className="quiz-result__share">
        <h2 className="quiz-result__share-heading">
          {t("ui.shareResultHeading")}
        </h2>
        <ShareCard
          result={result}
          quizUrl={quizUrl}
          moduleTitle={t(theme.titleKey)}
          verdictTitle={verdictTitle}
          populationLine={bandedPopulationLine(band, result.percentile, shareCopy)}
        />
      </div>

      {/* 8 — CTAs */}
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
            className="quiz-result__cta quiz-result__cta--secondary"
          >
            {t("ui.nextModule.cta", { title: nextThemeTitle })}
          </a>
        )}
        <div className="quiz-result__actions-secondary">
          <button
            type="button"
            className="quiz-modal__restart-btn"
            onClick={onRestart}
          >
            {t("ui.restartQuiz")}
          </button>
          <a href="/quiz/" className="quiz-modal__nav-link">
            ← {t("ui.backToQuizzes")}
          </a>
        </div>
      </div>
    </section>
  );
}
