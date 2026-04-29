/**
 * TitleCard — first "slide" of the quiz deck.
 *
 * Reuses the same outer markup as QuizCard (cell → card → inner → face) so
 * the deck illusion, surface treatment, and shadow apply uniformly. Renders a
 * single front face — no flip — with the quiz title, subtitle, optional
 * Keystatic summary, a meta line, and the primary "Los geht's" CTA.
 *
 * On dismissal the card adds the `quiz-card--leaving` class for one
 * `--dur-slide` so it slides up and fades out before the question card
 * mounts in its place.
 */

import { useState } from "react";
import { t } from "./i18n";

interface TitleCardProps {
  title: string;
  subtitle: string;
  summary?: string;
  questionCount: number;
  onStart: () => void;
}

export default function TitleCard({
  title,
  subtitle,
  summary,
  questionCount,
  onStart,
}: TitleCardProps) {
  const [leaving, setLeaving] = useState(false);
  const minutes = Math.max(1, Math.round(questionCount * 0.5));

  const handleStart = () => {
    if (leaving) return;
    setLeaving(true);
    // Match --dur-slide (320ms). Calling onStart unmounts this card, so the
    // parent will swap in QuizCard once the slide-out has played.
    window.setTimeout(onStart, 320);
  };

  return (
    <div
      className="quiz-card__cell quiz-card__cell--flow quiz-card__cell--title"
      role="region"
      aria-label={title}
    >
      <div
        className={`quiz-card quiz-card--flow quiz-card--title${leaving ? " quiz-card--leaving" : ""}`}
      >
        <div className="quiz-card__inner">
          <div className="quiz-card__face quiz-card__front">
            <p className="quiz-card__title-eyebrow">Selbsttest</p>
            <h2 className="quiz-card__title-heading">{title}</h2>
            <p className="quiz-card__title-subtitle">{subtitle}</p>
            {summary && (
              <p className="quiz-card__title-summary">{summary}</p>
            )}
            <p className="quiz-card__title-meta">
              {t("ui.quizMeta", { n: questionCount, min: minutes })}
            </p>
            <div className="quiz-card__title-actions">
              <button
                type="button"
                className="quiz-card__next-btn quiz-card__title-cta"
                onClick={handleStart}
                autoFocus
              >
                {t("ui.startQuiz")} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
