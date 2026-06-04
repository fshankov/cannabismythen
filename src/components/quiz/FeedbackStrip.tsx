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
import { schritte, pointsDisplay } from "./quizData";
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
import {
  CircleCheckBig,
  CircleArrowOutUpRight,
  CircleArrowOutDownLeft,
  CircleX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// 2026-05-30 (Fedor) — the "result" variant was removed. The result page
// no longer shows a "Dein Ergebnis — [Modul]" strip; the module name now
// lives inside the ResultScreen verdict card (ShareCard eyebrow). The strip
// is answer-mode only.
type FeedbackStripVariant = "answer";

interface FeedbackStripProps {
  /** Always "answer" now — kept as an explicit prop so the in-quiz call
   *  site stays self-documenting. Renders the per-question verdict +
   *  scientific pill + population sentence. */
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

/** Lucide icon per Schritte tier. 2026-05-30 — synced to the icon
 *  handoff's `feedback-*` family: the "almost" tiers use directional
 *  CircleArrowOut glyphs (leaning right/wrong) so the correctness
 *  spectrum reads as a gradient, not four unrelated circles. Tier
 *  colours stay on the site classification palette (set in quiz.css)
 *  so the strip's feedback icon and its verdict pill never show two
 *  different reds/greens. */
const SCHRITTE_ICON: Record<Schritte, LucideIcon> = {
  0: CircleCheckBig,
  1: CircleArrowOutUpRight,
  2: CircleArrowOutDownLeft,
  3: CircleX,
};

export default function FeedbackStrip({
  myth,
  answer,
}: FeedbackStripProps) {
  // ── Answer-mode strip ───────────────────────────────────────────────
  // Guard: render nothing when the parent didn't pass a myth.
  if (!myth) return null;

  // 2026-06-04 (Fedor) — the strip now ALWAYS renders so it reserves the same
  // height in the quiz flow whether or not the user has answered. When
  // unanswered it renders a structurally-identical but INVISIBLE "ghost"
  // (same three rows + the same, answer-independent, population line), so its
  // height matches the filled strip at every viewport width and the
  // persistence notice below the card never jumps when the real feedback
  // appears on answer. The ghost uses the correct classification as a neutral
  // placeholder for the answer rows; it is visibility:hidden + aria-hidden,
  // so it reveals nothing and screen readers skip it.
  const isGhost = !answer;
  const chosen = answer
    ? answer.chosenClassification
    : myth.correctClassification;

  const s: Schritte = schritte(chosen, myth.correctClassification);
  const verdictText = t(SCHRITTE_LABEL_KEY[s]);
  const verdictModifier = SCHRITTE_MODIFIER[s];
  const VerdictIcon = SCHRITTE_ICON[s];
  // 2026-05-29 — "+1 aus 1" form (points earned out of 1 possible per card).
  const pointsText = `${pointsDisplay(s)} aus 1`;

  // 2026-05-29 (QuizCard redesign) — per-question population reveal on the
  // 0–1 per-card points scale (no percentages on cards). populationCorrectPct
  // is the mean Richtigkeit per myth (0–100); /100 puts it on the same 0–1
  // scale as the user's on-card points badge. One decimal → e.g. "0,8".
  const populationSentence = t("result.row.populationMean", {
    points: formatGermanDecimal(myth.populationCorrectPct / 100),
  });

  // Three centered rows: answers (your pick vs the science), verdict + points,
  // population line. Same markup for the filled + ghost states; the ghost only
  // adds the `--ghost` modifier (visibility:hidden) + aria-hidden.
  return (
    <div
      className={`quiz-feedback-strip${isGhost ? " quiz-feedback-strip--ghost" : ""}`}
      role={isGhost ? undefined : "status"}
      aria-live={isGhost ? undefined : "polite"}
      aria-hidden={isGhost ? "true" : undefined}
    >
      <div className="quiz-feedback-strip__row quiz-feedback-strip__row--answers">
        <span className="quiz-feedback-strip__answer">
          <span className="quiz-feedback-strip__answer-label">
            {t("ui.yourAnswerLabel")}:
          </span>{" "}
          <VerdictPill verdict={chosen} size="sm" />
        </span>
        <span className="quiz-feedback-strip__sep" aria-hidden="true">·</span>
        <span className="quiz-feedback-strip__scientific">
          <span className="quiz-feedback-strip__scientific-label">
            {t("classification.scientific")}:
          </span>{" "}
          <VerdictPill verdict={myth.correctClassification} size="sm" />
        </span>
      </div>
      <div className="quiz-feedback-strip__row quiz-feedback-strip__row--verdict">
        <span
          className={`quiz-feedback-strip__verdict quiz-feedback-strip__verdict--${verdictModifier}`}
        >
          <VerdictIcon
            size={18}
            strokeWidth={2}
            aria-hidden="true"
            className="quiz-feedback-strip__verdict-icon"
          />
          <span className="quiz-feedback-strip__verdict-text">{verdictText}</span>
        </span>
        <span
          className={`quiz-feedback-strip__points quiz-feedback-strip__points--${verdictModifier}`}
        >
          {pointsText}
        </span>
      </div>
      <p className="quiz-feedback-strip__population">{populationSentence}</p>
    </div>
  );
}
