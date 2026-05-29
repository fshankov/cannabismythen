/**
 * FeedbackStrip — Per-question feedback shown above the QuizCard.
 * Stage E commit 5 (2026-05-23).
 *
 * Renders inside the `quiz-progress-slot` portal (alongside the
 * existing `ProgressBar`), shown only AFTER the user has answered
 * the current myth. Carries the feedback that used to live on the
 * QuizCard back face:
 *
 *   • Schritte verdict line (gamified relabel, CAR-8 2026-05-28 —
 *     Volltreffer! / Ganz nah dran! / Leicht verschätzt! / Ganz
 *     schön knifflig! — see i18n.ts `schritte.{exact,near,off,far}`).
 *   • Myth statement + `Wissenschaftlich: <pill>` (small inline pair).
 *   • Population sentence (CAR-10 rewrite, 2026-05-28):
 *     "Erwachsene (18–70) erreichen hier im Durchschnitt {X} von 100
 *     Punkten." (i18n key `result.row.populationMean`). Replaces the
 *     misleading "Du gehörst zu N% der Erwachsenen…" framing — the
 *     value is the per-myth mean Richtigkeit (0–100), NOT a binary
 *     "% who got it exactly right". See CaRM §4.3.3 and the SCORING
 *     METHODOLOGY block in quizData.ts.
 *
 * The QuizCard back face is now stripped to just the statement
 * summary + `Mehr auf der Fakten-Karte →` button + `Nächste Frage →`
 * (or `Ergebnis ansehen →` on the last card). All the detail content
 * (explanation paragraph, population bar) lives inside the
 * FactsheetPanel popup if the user wants depth.
 *
 * The strip clears whenever the user advances to an unanswered
 * question — QuizPlayer's render condition gates on `currentAnswer`.
 */

import type { CardAnswer, QuizMyth, Schritte } from "./types";
import { schritte } from "./quizData";
import { t } from "./i18n";

/** Format a number the German way for body copy: integers stay bare
 *  (no trailing ",0"), non-integers use a comma decimal separator and
 *  one fractional digit. Mirrors the local helper in ShareCard.tsx. */
function formatGermanDecimal(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  if (rounded === Math.trunc(rounded)) {
    return String(Math.trunc(rounded));
  }
  return rounded.toFixed(1).replace(".", ",");
}
import VerdictPill from "../shared/VerdictPill";
import { CheckCircle, CircleDashed, AlertCircle, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FeedbackStripVariant = "answer" | "result";

interface FeedbackStripProps {
  /** Stage F commit 1 (2026-05-23): "answer" renders the per-question
   *  verdict + statement + scientific pill + population sentence
   *  (default). "result" replaces that whole block with a single
   *  `Dein Ergebnis — {moduleTitle}` row so the sticky strip slot
   *  keeps a consistent visual rhythm between quiz mode and result
   *  mode. */
  variant?: FeedbackStripVariant;
  /** Required in "answer" mode. */
  myth?: QuizMyth;
  /** Required in "answer" mode. May be null when the current myth
   *  hasn't been answered yet — Stage G renders an empty placeholder
   *  in that case to keep the strip slot's height stable. */
  answer?: CardAnswer | null;
  /** Required in "answer" mode. Keystatic-editorial myth statement;
   *  falls back to the i18n key if undefined. */
  statementText?: string;
  /** Required in "result" mode. Module title (e.g. "Medizinischer und
   *  therapeutischer Nutzen") rendered in the result strip. */
  moduleTitle?: string;
}

/** Schritte → i18n key (improved wording in Stage E commit 5). */
const SCHRITTE_LABEL_KEY: Record<Schritte, string> = {
  0: "schritte.exact",
  1: "schritte.near",
  2: "schritte.off",
  3: "schritte.far",
};

/** Modifier class for the verdict icon stroke color. Maps to the
 *  classification token convention used elsewhere on the site. */
const SCHRITTE_MODIFIER: Record<Schritte, string> = {
  0: "exact",
  1: "near",
  2: "off",
  3: "far",
};

/** Stage F commit 2 (2026-05-23) — Lucide icon per Schritte tier.
 *  Replaces the tinted pill background with a single 18 × 18 icon
 *  next to plain text. Calm read; "feedback" iconography from the
 *  same library QuizPlayer's VerdictScale already uses. */
const SCHRITTE_ICON: Record<Schritte, LucideIcon> = {
  0: CheckCircle,
  1: CircleDashed,
  2: AlertCircle,
  3: XCircle,
};

export default function FeedbackStrip({
  variant = "answer",
  myth,
  answer,
  statementText,
  moduleTitle,
}: FeedbackStripProps) {
  // ── Result-mode strip ───────────────────────────────────────────────
  // Replaces the per-question feedback content with a single title row
  // when the user lands on the result page. Same DOM slot, same visual
  // rhythm — the only thing that changes is the inner block.
  if (variant === "result") {
    return (
      <div className="quiz-feedback-strip quiz-feedback-strip--result">
        <h1 className="quiz-feedback-strip__result-title">
          {t("ui.resultTitle")}
          {moduleTitle ? <> — <span className="quiz-feedback-strip__result-module">{moduleTitle}</span></> : null}
        </h1>
      </div>
    );
  }

  // ── Answer-mode strip ───────────────────────────────────────────────
  // Guard: render nothing when the parent didn't pass a myth.
  if (!myth) return null;

  // Stage G (2026-05-23): when the current myth hasn't been answered
  // yet, render an empty strip that reserves the same slot height. The
  // `--empty` modifier + CSS `min-height` keep the QuizCard below
  // anchored at the same y-position whether or not the user has
  // answered. aria-hidden so screen readers don't announce a blank
  // region.
  if (!answer) {
    return (
      <div
        className="quiz-feedback-strip quiz-feedback-strip--empty"
        aria-hidden="true"
      />
    );
  }

  const s: Schritte = schritte(answer.chosenClassification, myth.correctClassification);
  const verdictText = t(SCHRITTE_LABEL_KEY[s]);
  const verdictModifier = SCHRITTE_MODIFIER[s];
  const VerdictIcon = SCHRITTE_ICON[s];

  const statement = statementText || t(myth.statementKey);

  // 2026-05-29 (QuizCard redesign) — per-question population reveal on the
  // 0–1 per-card points scale (no percentages on cards). populationCorrectPct
  // is the mean Richtigkeit per myth (0–100); /100 puts it on the same 0–1
  // scale as the user's on-card points badge. One decimal → e.g. "0,8".
  const populationSentence = t("result.row.populationMean", {
    points: formatGermanDecimal(myth.populationCorrectPct / 100),
  });

  return (
    <div
      className="quiz-feedback-strip"
      role="status"
      aria-live="polite"
    >
      <div
        className={`quiz-feedback-strip__verdict quiz-feedback-strip__verdict--${verdictModifier}`}
      >
        <VerdictIcon
          size={18}
          strokeWidth={2}
          aria-hidden="true"
          className="quiz-feedback-strip__verdict-icon"
        />
        <span className="quiz-feedback-strip__verdict-text">{verdictText}</span>
      </div>
      <div className="quiz-feedback-strip__statement">
        <span className="quiz-feedback-strip__statement-text">{statement}</span>
        <span className="quiz-feedback-strip__statement-sep" aria-hidden="true">
          {" · "}
        </span>
        <span className="quiz-feedback-strip__scientific">
          <span className="quiz-feedback-strip__scientific-label">
            {t("classification.scientific")}:
          </span>{" "}
          <VerdictPill verdict={myth.correctClassification} size="sm" />
        </span>
      </div>
      <p className="quiz-feedback-strip__joined">{populationSentence}</p>
    </div>
  );
}
