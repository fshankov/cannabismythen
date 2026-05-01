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
  /** % of Erwachsene (18–70) in the CaRM-Studie who answered the myth
   *  exactly correctly. Reference: feedback-texte.mdoc table. */
  populationCorrectPct: number;
  /** Slug for the myth detail page, e.g. "m01-allheilmittel" */
  mythPageSlug: string;
}

/** Distance from the scientific verdict on the 4-point Likert scale.
 *  0 = exact match, 3 = opposite end. Source of truth for all per-question
 *  scoring (see quizData.ts → schritte()). */
export type Schritte = 0 | 1 | 2 | 3;

/** Score band derived from `moduleScore` (a percentage). Maps 1:1 to the
 *  four `verdicts.{band}` cells in the Keystatic quiz schema. */
export type ScoreBand = "profi" | "guterweg" | "gehtnoch" | "erwischt";

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
  /** True when the user's pick exactly matches the scientific verdict
   *  (Schritte = 0). Kept for back-compat with persisted state and a
   *  few legacy display branches; new code should derive Schritte/points
   *  via schritte() / pointsForSchritte() instead. */
  isCorrect: boolean;
}

/** Direction of a swipe / keyboard nav commit. */
export type Direction = "next" | "prev";

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
  /** Count of answers with Schritte = 0 (exact match). */
  correctCount: number;
  /** Schritte-based module score, rounded percent (0–100). The "Richtigkeit"
   *  metric used by CaRM: each answer contributes 1.00 / 0.66 / 0.33 / 0.00
   *  depending on its Schritte distance. Replaces the old binary
   *  `correctCount / totalQuestions × 100` framing. */
  moduleScore: number;
  /** Schritte breakdown: how many of each kind the user got. */
  breakdown: { exact: number; near: number; off: number; far: number };
  /** Score band derived from `moduleScore`. Used to look up Keystatic
   *  `verdicts.{band}` copy on the result page. */
  band: ScoreBand;
  /** Percentile vs. Erwachsene (18–70) in the CaRM-Studie. Mean-based
   *  approximation (see computePercentile in quizData.ts). */
  percentile: number;
  /** @deprecated Stage 5 removes this. Kept now so ResultScreen still
   *  compiles against the legacy RESULT_TIERS path. */
  tierIndex: ResultTierIndex;
  /** @deprecated Stage 5 removes this. Same rationale as tierIndex. */
  correctPct: number;
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
  | "myth_link_clicked"
  | "card_swiped"
  | "keyboard_shortcut_used";

export interface MatomoEvent {
  category: MatomoEventCategory;
  action: MatomoEventAction;
  name: string;
  value?: number;
  customDimensions?: Record<string, string>;
}
