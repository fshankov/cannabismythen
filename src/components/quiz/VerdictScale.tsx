/**
 * VerdictScale — 4-segment horizontal verdict scale.
 *
 * Replaces the old 2×2 button grid in the front face of QuizCard, and
 * (in compact mode) is reused as a read-only badge in the ResultScreen
 * retrospective rows.
 *
 * Design rationale (DESIGN_RECOMMENDATIONS §5.2 + QUIZ_REDESIGN_PLAN.md §3.5):
 * - Reads as a left-to-right spectrum from "falsch" → "richtig", matching
 *   the gradient hairline above the row.
 * - One row instead of a 2×2 grid: the eye doesn't have to track which
 *   button is "more correct than the one to its right".
 * - Each segment carries a glyph (colour-blind safe), a label, and a
 *   keyboard hint (1–4).
 * - Compact mode hides the labels for use inside narrow review rows.
 */

import {
  ArrowUp,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Classification } from "./types";
import { t } from "./i18n";

const ORDER: Classification[] = [
  "falsch",
  "eher_falsch",
  "eher_richtig",
  "richtig",
];

/** Canonical site-wide verdict iconography — same Lucide arrows used by
 *  the dashboard's `<VerdictArrow>` and the FaktenCard. The earlier
 *  ◣/◤ unicode glyphs were swapped out in Stage 1 of the
 *  Daten-Explorer refactor to give every verdict surface one shared
 *  visual language. */
const GLYPH: Record<Classification, LucideIcon> = {
  falsch: ArrowDown,
  eher_falsch: ArrowDownLeft,
  eher_richtig: ArrowUpRight,
  richtig: ArrowUp,
};

interface VerdictScaleProps {
  /** Currently chosen verdict (or null if not yet answered). */
  selected: Classification | null;
  /** Optional: the correct verdict — when provided, segments get
   *  is-correct / is-wrong styling for the post-answer review state. */
  correct?: Classification;
  /** Disable all interactions (used after answering or in read-only review). */
  disabled?: boolean;
  /** Click handler. */
  onChoose: (c: Classification) => void;
  /** When true: hide labels and shrink padding (used inside review rows). */
  compact?: boolean;
  /** When true: focus the first segment on mount (front-face initial focus). */
  autoFocus?: boolean;
}

export default function VerdictScale({
  selected,
  correct,
  disabled,
  onChoose,
  compact = false,
  autoFocus = false,
}: VerdictScaleProps) {
  return (
    <div
      className={`verdict-scale ${compact ? "verdict-scale--compact" : ""}`}
    >
      {!compact && (
        <div className="verdict-scale__spectrum" aria-hidden="true" />
      )}
      <div
        className="verdict-scale__row"
        role="radiogroup"
        aria-label={t("ui.verdictScale.label")}
      >
        {ORDER.map((c, i) => {
          const isSelected = selected === c;
          const isCorrectMark = correct && correct === c;
          const isWrongMark = correct && isSelected && correct !== c;
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-keyshortcuts={String(i + 1)}
              autoFocus={autoFocus && i === 0}
              disabled={disabled}
              className={[
                "verdict-scale__seg",
                `verdict-scale__seg--${c}`,
                isSelected ? "is-selected" : "",
                isCorrectMark ? "is-correct" : "",
                isWrongMark ? "is-wrong" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => !disabled && onChoose(c)}
            >
              <span className="verdict-scale__glyph" aria-hidden="true">
                {(() => {
                  const Icon = GLYPH[c];
                  return <Icon size={20} strokeWidth={2.25} />;
                })()}
              </span>
              {!compact && (
                <span className="verdict-scale__label">
                  {t(`answer.${c}`)}
                </span>
              )}
              {!compact && (
                <kbd className="verdict-scale__kbd" aria-hidden="true">
                  Taste {i + 1}
                </kbd>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
