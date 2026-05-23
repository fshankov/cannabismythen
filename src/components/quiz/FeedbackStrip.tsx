/**
 * FeedbackStrip — Per-question feedback shown above the QuizCard.
 * Stage E commit 5 (2026-05-23).
 *
 * Renders inside the `quiz-progress-slot` portal (alongside the
 * existing `ProgressBar`), shown only AFTER the user has answered
 * the current myth. Carries the feedback that used to live on the
 * QuizCard back face:
 *
 *   • Schritte verdict line (improved wording — see i18n.ts
 *     `schritte.{exact,near,off,far}`).
 *   • Myth statement + `Wissenschaftlich: <pill>` (small inline pair).
 *   • Population sentence: "Du gehörst zu N % der Erwachsenen (18–70),
 *     die diese Aussage [genau richtig / nicht genau richtig]
 *     eingeordnet haben." (reuses `result.row.joinedExact` /
 *     `result.row.joinedMissed` keys from Stage D PR2).
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
import { schritte, userJoinedPercent } from "./quizData";
import { t } from "./i18n";
import VerdictPill from "../shared/VerdictPill";

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
  /** Required in "answer" mode. */
  answer?: CardAnswer;
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

/** Modifier class for the verdict pill background tone. Matches the
 *  classification token convention used on the result-page row dots. */
const SCHRITTE_MODIFIER: Record<Schritte, string> = {
  0: "exact",
  1: "near",
  2: "off",
  3: "far",
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
  // Guard: in TypeScript the optional props mean callers can omit them,
  // but in practice the answer-mode call sites always pass both. Render
  // nothing if the caller passed the wrong combination.
  if (!myth || !answer) return null;

  const s: Schritte = schritte(answer.chosenClassification, myth.correctClassification);
  const verdictText = t(SCHRITTE_LABEL_KEY[s]);
  const verdictModifier = SCHRITTE_MODIFIER[s];

  const statement = statementText || t(myth.statementKey);

  const joinedPct = userJoinedPercent(myth, answer.chosenClassification);
  const joinedSentence =
    s === 0
      ? t("result.row.joinedExact", { pct: joinedPct })
      : t("result.row.joinedMissed", { pct: joinedPct });

  return (
    <div
      className="quiz-feedback-strip"
      role="status"
      aria-live="polite"
    >
      <div
        className={`quiz-feedback-strip__verdict quiz-feedback-strip__verdict--${verdictModifier}`}
      >
        {verdictText}
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
      <p className="quiz-feedback-strip__joined">{joinedSentence}</p>
    </div>
  );
}
