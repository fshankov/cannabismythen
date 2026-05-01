/**
 * ProgressBar — Schritte-colored pill row in the site header.
 *
 * Stage 4 of the quiz overhaul replaced the original linear progress bar
 * + score chip with a row of one pill per question. Each pill carries the
 * Schritte band of the user's answer (or "open" if not answered yet),
 * doubles as a jump-to-question control, and is keyboard-navigable.
 *
 * The component is mounted via a portal into a slot in the site header
 * (id="quiz-progress-slot"), so it travels with the page chrome rather
 * than the quiz body. Stays horizontal at every breakpoint per DESIGN.md
 * mobile spec; overflows horizontally on narrow phones.
 *
 * Note: the file name is still "ProgressBar.tsx" because the sandbox
 * could not rename. Stage 9 of the overhaul lists this file for `git mv`
 * to ProgressPills.tsx alongside the remaining cleanup.
 */

import type { CardAnswer, QuizMyth, Schritte } from "./types";
import { schritte } from "./quizData";
import { t } from "./i18n";

interface ProgressPillsProps {
  /** Module title shown to the left of the pill row. */
  quizTitle: string;
  /** The visible deck order (Stage 2 random shuffle); pills render 1:1. */
  myths: QuizMyth[];
  /** Map of mythId → user's answer. Missing entries → unanswered. */
  answers: Record<string, CardAnswer>;
  /** Index into `myths` of the currently-active question. */
  currentIndex: number;
  /** Click-to-jump handler. */
  onJump: (idx: number) => void;
}

/** Stage 4 — Schritte band → CSS modifier on the pill. */
function bandClass(s: Schritte | "open"): string {
  if (s === "open") return "quiz-pill--open";
  if (s === 0) return "quiz-pill--exact";
  if (s === 1) return "quiz-pill--near";
  if (s === 2) return "quiz-pill--off";
  return "quiz-pill--far";
}

function bandLabel(s: Schritte | "open"): string {
  if (s === "open") return "noch offen";
  if (s === 0) return t("schritte.exact");
  if (s === 1) return t("schritte.near");
  if (s === 2) return t("schritte.off");
  return t("schritte.far");
}

export default function ProgressBar({
  quizTitle,
  myths,
  answers,
  currentIndex,
  onJump,
}: ProgressPillsProps) {
  return (
    <div className="quiz-header-bar">
      <span className="quiz-header-bar__title">{quizTitle}</span>

      <ol
        className="quiz-pill-row"
        role="list"
        aria-label={t("ui.progress", {
          answered: Object.keys(answers).length,
          total: myths.length,
        })}
      >
        {myths.map((m, i) => {
          const a = answers[m.id];
          const band: Schritte | "open" = a
            ? schritte(a.chosenClassification, m.correctClassification)
            : "open";
          const isCurrent = i === currentIndex;
          return (
            <li key={m.id}>
              <button
                type="button"
                className={[
                  "quiz-pill",
                  bandClass(band),
                  isCurrent ? "quiz-pill--current" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={`${t("ui.questionLabel", {
                  n: i + 1,
                  total: myths.length,
                })}, ${bandLabel(band)} — zur Übersicht`}
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => onJump(i)}
              >
                {i + 1}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
