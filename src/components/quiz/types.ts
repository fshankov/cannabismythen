/**
 * Quiz system type definitions.
 *
 * All types used across the interactive quiz components:
 * QuizPlayer, QuizCard, ResultScreen, ShareCard.
 */

/** The 4 classification values used in the quiz answer buttons. */
export type Classification =
  | "richtig"
  | "eher_richtig"
  | "eher_falsch"
  | "falsch";

/** A single myth/question within a quiz. */
export interface QuizMyth {
  /** Internal myth ID, e.g. "m01" */
  id: string;
  /** The myth statement shown on the card front */
  statementKey: string;
  /** The correct classification */
  correctClassification: Classification;
  /** 1–2 sentence explanation shown after answering */
  explanationKey: string;
  /** % of German general population (16–70) who answered correctly (from CaRM survey, population-weighted) */
  populationCorrectPct: number;
  /** Slug for the myth detail page, e.g. "m01-allheilmittel" */
  mythPageSlug: string;
}

/** One of the 4 quiz themes. */
export interface QuizTheme {
  /** URL slug, e.g. "quiz-alltag" */
  slug: string;
  /** i18n key for the theme title */
  titleKey: string;
  /** i18n key for the theme subtitle */
  subtitleKey: string;
  /** i18n key for a short description */
  descriptionKey: string;
  /** The myths in this quiz */
  myths: QuizMyth[];
}

/** Tracks the user's answer state for a single card. */
export interface CardAnswer {
  mythId: string;
  chosenClassification: Classification;
  isCorrect: boolean;
}

/** Result tier (0–3, lowest to highest). */
export type ResultTierIndex = 0 | 1 | 2 | 3;

/** A result tier definition (percentage-based boundaries). */
export interface ResultTier {
  /** i18n key for the tier title */
  titleKey: string;
  /** i18n key for the motivational message */
  messageKey: string;
  /** Percentage range: [minPct, maxPct] inclusive */
  rangePct: [number, number];
}

/** Complete quiz result after all questions answered. */
export interface QuizResult {
  themeSlug: string;
  totalQuestions: number;
  correctCount: number;
  correctPct: number; // 0–100, percentage of questions correct
  percentile: number; // 0–100, "better than X% of the general population (16–70)"
  tierIndex: ResultTierIndex;
  answers: CardAnswer[];
}

/** Typed Matomo event for the quiz (kept for existing calls). */
export type MatomoEventCategory = "Quiz";

export type MatomoEventAction =
  | "started"
  | "answer_submitted"
  | "completed"
  | "result_card_viewed"
  | "result_card_shared"
  | "myth_link_clicked";

export interface MatomoEvent {
  category: MatomoEventCategory;
  action: MatomoEventAction;
  name: string;
  value?: number;
  customDimensions?: Record<string, string>;
}
