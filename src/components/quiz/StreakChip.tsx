/**
 * StreakChip — tiny "🔥 N richtig in Folge" chip pinned to the front
 * face of QuizCard.
 *
 * IMPORTANT (mockup-bug warning from QUIZ_REDESIGN_PLAN.md §3.7):
 *   Mount this INSIDE the front face div, NOT on the card root. If it lives
 *   on the card root, the 3D flip rotates it along with the card and it
 *   appears mirrored on the back face. Inside the front face it is hidden
 *   by `backface-visibility: hidden` after the flip — which is the right
 *   behaviour: the chip's job is announcing the streak at the moment the
 *   answer is committed.
 */

import { t } from "./i18n";

interface StreakChipProps {
  count: number;
}

export default function StreakChip({ count }: StreakChipProps) {
  if (count < 2) return null;
  return (
    <span
      className="quiz-card__streak"
      role="status"
      aria-live="polite"
    >
      <span aria-hidden="true">🔥</span>{" "}
      {t("ui.streak.label", { n: count })}
    </span>
  );
}
