/**
 * Quiz system type definitions.
 *
 * All types used across the interactive quiz components:
 * QuizPlayer, QuizCard, ResultScreen, ShareCard.
 */

/** The 4 classification values used in the quiz answer buttons. */
export type Classification =
  "richtig" | "eher_richtig" | "eher_falsch" | "falsch";

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
  /**
   * Mean Richtigkeit (0–100) for this myth across Erwachsene (18–70) in
   * der CaRM-Studie — NOT a binary "% who got it exactly right".
   *
   * Each respondent's Richtigkeit per myth is the standardised distance
   * between their Likert pick (richtig / eher richtig / eher falsch /
   * falsch) and the scientific classification, mapped
   * 0 Schritte → 100, 1 → 66.67, 2 → 33.33, 3 → 0
   * (CaRM Abschlussbericht §4.3.3 + Standardisierungstabelle, p. 51 ff.).
   * The per-myth value is the mean Richtigkeit across the Erwachsene
   * 18–70 sample (n = 2.097).
   *
   * Source: src/content/quiz/feedback-texte.mdoc Richtigkeit-table.
   *
   * @todo 2026-05-28 — rename to `populationMeanRichtigkeit` in a
   *   follow-up Asana task (cross-file refactor deferred from
   *   CAR-9/CAR-10 to keep this session tight). See the
   *   "SCORING METHODOLOGY" header in `quizData.ts` for the full
   *   user-vs-population symmetry argument.
   */
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

/** One of the quiz themes. */
export interface QuizTheme {
  /** URL slug, e.g. "quiz-alltag" */
  slug: string;
  /** i18n key for the theme title */
  titleKey: string;
  /** i18n key for the theme subtitle */
  subtitleKey: string;
  /** i18n key for a short description */
  descriptionKey: string;
  /** The myths in this quiz. Empty when `dynamic: true` — the player
   *  fills the deck via the theme's picker at mount time (Stage 6
   *  Schnellcheck). */
  myths: QuizMyth[];
  /** When `true`, this theme's myth list is generated at mount instead
   *  of being statically declared. Used by the Schnellcheck module
   *  which pulls 7 random myths balanced across the five themes. */
  dynamic?: boolean;
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

/** Complete quiz result after all questions answered. */
export interface QuizResult {
  themeSlug: string;
  totalQuestions: number;
  /** Count of answers with Schritte = 0 (exact match). */
  correctCount: number;
  /** Schritte-based module score, rounded percent (0–100). The "Richtigkeit"
   *  metric used by CaRM: each answer contributes 1.00 / 0.66 / 0.33 / 0.00
   *  depending on its Schritte distance. */
  moduleScore: number;
  /** Schritte breakdown: how many of each kind the user got. */
  breakdown: { exact: number; near: number; off: number; far: number };
  /** Score band derived from `moduleScore`. Used to look up Keystatic
   *  `verdicts.{band}` copy on the result page. */
  band: ScoreBand;
  /** Percentile vs. Erwachsene (18–70) in der CaRM-Studie. Mean-based
   *  approximation (see computePercentile in quizData.ts). */
  percentile: number;
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
