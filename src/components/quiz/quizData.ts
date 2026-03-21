/**
 * Quiz data — structured myth entries for all 4 quiz themes.
 *
 * Data sourced from:
 *   - CaRM survey: "Ergebnisse CaRM Tab sort 1.xlsx", sheet "Volljährige"
 *     (Richtigkeit d. Beurteilung column — Adults 18–70)
 *   - /src/content/zahlen-und-fakten/*.mdoc (myth page slugs, classifications)
 */

import type { QuizTheme, QuizMyth, ResultTier, ResultTierIndex, Classification, CardAnswer } from "./types";

// ─── Result Tiers (percentage-based) ────────────────────────────────────────────

export const RESULT_TIERS: ResultTier[] = [
  {
    titleKey: "tier.0.title",
    messageKey: "tier.0.message",
    rangePct: [0, 30],
  },
  {
    titleKey: "tier.1.title",
    messageKey: "tier.1.message",
    rangePct: [31, 55],
  },
  {
    titleKey: "tier.2.title",
    messageKey: "tier.2.message",
    rangePct: [56, 80],
  },
  {
    titleKey: "tier.3.title",
    messageKey: "tier.3.message",
    rangePct: [81, 100],
  },
];

/** Get the tier index for a given score as percentage of total. */
export function getTierIndex(correctCount: number, total: number): ResultTierIndex {
  const pct = (correctCount / total) * 100;
  if (pct <= 30) return 0;
  if (pct <= 55) return 1;
  if (pct <= 80) return 2;
  return 3;
}

// ─── Distance-based scoring (matches CaRM "Richtigkeit d. Beurteilung") ──────

/** Ordinal position of each classification on the 4-point scale. */
const CLASS_POS: Record<Classification, number> = {
  richtig: 1,
  eher_richtig: 2,
  eher_falsch: 3,
  falsch: 4,
};

/**
 * Score a single answer on the same 0–100 "Richtigkeit" scale used by CaRM.
 * 0 steps from correct → 100, 1 step → 66.67, 2 steps → 33.33, 3 steps → 0.
 */
export function distanceScore(
  chosen: Classification,
  correct: Classification
): number {
  const d = Math.abs(CLASS_POS[chosen] - CLASS_POS[correct]);
  return ((3 - d) / 3) * 100;
}

// ─── Percentile Computation ────────────────────────────────────────────────────

/**
 * Compute the user's percentile using the CaRM distance-based scoring model.
 *
 * The "Richtigkeit d. Beurteilung / Punkte" values in the survey are composite
 * scores (0–100) measuring average closeness to the correct classification —
 * NOT binary "% who got it exactly right". See the Erläuterungen sheet.
 *
 * Algorithm:
 *   1. Score each user answer on the same 0–100 scale (distanceScore).
 *   2. Sum across all questions → user's total Richtigkeit.
 *   3. Sum the population means → population total Richtigkeit.
 *   4. Estimate population variance as Σ μ_i(100 − μ_i) (max-entropy bound).
 *   5. Normal approximation: percentile = Φ((userTotal − popTotal) / σ) × 100.
 */
export function computePercentile(
  myths: QuizMyth[],
  answers: CardAnswer[]
): number {
  // Build a lookup from mythId → chosen classification
  const chosenMap = new Map<string, Classification>();
  for (const a of answers) {
    chosenMap.set(a.mythId, a.chosenClassification);
  }

  let userTotal = 0;
  let popTotal = 0;
  let popVariance = 0;

  for (const myth of myths) {
    const chosen = chosenMap.get(myth.id);
    if (chosen) {
      userTotal += distanceScore(chosen, myth.correctClassification);
    }
    const mu = myth.populationCorrectPct;
    popTotal += mu;
    popVariance += mu * (100 - mu);
  }

  const popSd = Math.sqrt(popVariance);
  if (popSd === 0) return 50;

  const z = (userTotal - popTotal) / popSd;

  // Standard normal CDF approximation (Abramowitz & Stegun 26.2.17)
  const pctile = normalCdf(z) * 100;

  return Math.round(Math.min(99, Math.max(1, pctile)));
}

/** Standard normal CDF — rational approximation, max error < 7.5 × 10⁻⁸. */
function normalCdf(x: number): number {
  if (x < -8) return 0;
  if (x > 8) return 1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX / 2);
  return 0.5 * (1.0 + sign * y);
}

// ─── Quiz: Cannabis & Alltag (10 questions, m12 dropped — keine_aussage) ──────

const mythsAlltag: QuizMyth[] = [
  {
    id: "m04",
    statementKey: "myth.m04.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m04.explanation",
    populationCorrectPct: 69.66,
    mythPageSlug: "m04-weniger-schaedlich-alkohol",
  },
  {
    id: "m05",
    statementKey: "myth.m05.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m05.explanation",
    populationCorrectPct: 76.43,
    mythPageSlug: "m05-schwierig-dosieren",
  },
  {
    id: "m06",
    statementKey: "myth.m06.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m06.explanation",
    populationCorrectPct: 88.97,
    mythPageSlug: "m06-mischkonsum",
  },
  {
    id: "m07",
    statementKey: "myth.m07.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m07.explanation",
    populationCorrectPct: 85.70,
    mythPageSlug: "m07-zusaetze",
  },
  {
    id: "m13",
    statementKey: "myth.m13.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m13.explanation",
    populationCorrectPct: 78.32,
    mythPageSlug: "m13-spastiken",
  },
  {
    id: "m21",
    statementKey: "myth.m21.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m21.explanation",
    populationCorrectPct: 91.71,
    mythPageSlug: "m21-verkehr",
  },
  {
    id: "m29",
    statementKey: "myth.m29.statement",
    correctClassification: "eher_richtig",
    explanationKey: "myth.m29.explanation",
    populationCorrectPct: 84.40,
    mythPageSlug: "m29-gemuetslage",
  },
  {
    id: "m31",
    statementKey: "myth.m31.statement",
    correctClassification: "eher_richtig",
    explanationKey: "myth.m31.explanation",
    populationCorrectPct: 82.01,
    mythPageSlug: "m31-m32-entspannt-aggressiv",
  },
  {
    id: "m32",
    statementKey: "myth.m32.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m32.explanation",
    populationCorrectPct: 57.86,
    mythPageSlug: "m31-m32-entspannt-aggressiv",
  },
  {
    id: "m33",
    statementKey: "myth.m33.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m33.explanation",
    populationCorrectPct: 60.97,
    mythPageSlug: "m33-kreativ",
  },
];

// ─── Quiz: Cannabis & Gesellschaft (9 questions) ──────────────────────────────

const mythsGesellschaft: QuizMyth[] = [
  {
    id: "m34",
    statementKey: "myth.m34.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m34.explanation",
    populationCorrectPct: 54.17,
    mythPageSlug: "m34-soziale-beziehungen",
  },
  {
    id: "m35",
    statementKey: "myth.m35.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m35.explanation",
    populationCorrectPct: 63.33,
    mythPageSlug: "m35-soziale-regeln",
  },
  {
    id: "m36",
    statementKey: "myth.m36.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m36.explanation",
    populationCorrectPct: 55.28,
    mythPageSlug: "m36-m37-leistungen-niveau",
  },
  {
    id: "m37",
    statementKey: "myth.m37.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m37.explanation",
    populationCorrectPct: 35.85,
    mythPageSlug: "m36-m37-leistungen-niveau",
  },
  {
    id: "m38",
    statementKey: "myth.m38.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m38.explanation",
    populationCorrectPct: 61.80,
    mythPageSlug: "m38-cool",
  },
  {
    id: "m39",
    statementKey: "myth.m39.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m39.explanation",
    populationCorrectPct: 25.50,
    mythPageSlug: "m39-bevoelkerung-konsumiert",
  },
  {
    id: "m40",
    statementKey: "myth.m40.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m40.explanation",
    populationCorrectPct: 35.76,
    mythPageSlug: "m40-ueberall-erlaubt",
  },
  {
    id: "m41",
    statementKey: "myth.m41.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m41.explanation",
    populationCorrectPct: 79.26,
    mythPageSlug: "m41-m42-anstieg-konsum",
  },
  {
    id: "m42",
    statementKey: "myth.m42.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m42.explanation",
    populationCorrectPct: 53.06,
    mythPageSlug: "m41-m42-anstieg-konsum",
  },
];

// ─── Quiz: Cannabis & Körper (10 questions, m17 dropped — keine_aussage) ──────

const mythsKoerper: QuizMyth[] = [
  {
    id: "m01",
    statementKey: "myth.m01.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m01.explanation",
    populationCorrectPct: 49.10,
    mythPageSlug: "m01-allheilmittel",
  },
  {
    id: "m02",
    statementKey: "myth.m02.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m02.explanation",
    populationCorrectPct: 63.77,
    mythPageSlug: "m02-harmlos",
  },
  {
    id: "m03",
    statementKey: "myth.m03.statement",
    correctClassification: "eher_richtig",
    explanationKey: "myth.m03.explanation",
    populationCorrectPct: 77.93,
    mythPageSlug: "m03-heranwachsende",
  },
  {
    id: "m08",
    statementKey: "myth.m08.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m08.explanation",
    populationCorrectPct: 89.87,
    mythPageSlug: "m08-foetus",
  },
  {
    id: "m09",
    statementKey: "myth.m09.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m09.explanation",
    populationCorrectPct: 74.30,
    mythPageSlug: "m09-ueberdosierung",
  },
  {
    id: "m10",
    statementKey: "myth.m10.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m10.explanation",
    populationCorrectPct: 49.74,
    mythPageSlug: "m10-schmerzen",
  },
  {
    id: "m11",
    statementKey: "myth.m11.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m11.explanation",
    populationCorrectPct: 71.89,
    mythPageSlug: "m11-uebelkeit",
  },
  {
    id: "m14",
    statementKey: "myth.m14.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m14.explanation",
    populationCorrectPct: 76.21,
    mythPageSlug: "m14-herz-kreislauf",
  },
  {
    id: "m15",
    statementKey: "myth.m15.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m15.explanation",
    populationCorrectPct: 78.80,
    mythPageSlug: "m15-atemwege",
  },
  {
    id: "m16",
    statementKey: "myth.m16.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m16.explanation",
    populationCorrectPct: 73.59,
    mythPageSlug: "m16-krebs",
  },
];

// ─── Quiz: Cannabis & Psyche (11 questions) ──────────────────────────────────

const mythsPsyche: QuizMyth[] = [
  {
    id: "m18",
    statementKey: "myth.m18.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m18.explanation",
    populationCorrectPct: 56.37,
    mythPageSlug: "m18-schlaf",
  },
  {
    id: "m19",
    statementKey: "myth.m19.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m19.explanation",
    populationCorrectPct: 87.56,
    mythPageSlug: "m19-wahrnehmung",
  },
  {
    id: "m20",
    statementKey: "myth.m20.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m20.explanation",
    populationCorrectPct: 83.34,
    mythPageSlug: "m20-kognition",
  },
  {
    id: "m22",
    statementKey: "myth.m22.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m22.explanation",
    populationCorrectPct: 51.65,
    mythPageSlug: "m22-einstiegsdroge",
  },
  {
    id: "m23",
    statementKey: "myth.m23.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m23.explanation",
    populationCorrectPct: 63.75,
    mythPageSlug: "m23-abhaengigkeit",
  },
  {
    id: "m24",
    statementKey: "myth.m24.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m24.explanation",
    populationCorrectPct: 74.25,
    mythPageSlug: "m24-psychosen",
  },
  {
    id: "m25",
    statementKey: "myth.m25.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m25.explanation",
    populationCorrectPct: 60.60,
    mythPageSlug: "m25-angst",
  },
  {
    id: "m26",
    statementKey: "myth.m26.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m26.explanation",
    populationCorrectPct: 30.18,
    mythPageSlug: "m26-depressionen",
  },
  {
    id: "m27",
    statementKey: "myth.m27.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m27.explanation",
    populationCorrectPct: 55.93,
    mythPageSlug: "m27-adhs",
  },
  {
    id: "m28",
    statementKey: "myth.m28.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m28.explanation",
    populationCorrectPct: 25.05,
    mythPageSlug: "m28-motivation",
  },
  {
    id: "m30",
    statementKey: "myth.m30.statement",
    correctClassification: "eher_richtig",
    explanationKey: "myth.m30.explanation",
    populationCorrectPct: 83.02,
    mythPageSlug: "m30-suizid",
  },
];

// ─── Quiz Themes ───────────────────────────────────────────────────────────────

export const QUIZ_THEMES: Record<string, QuizTheme> = {
  "quiz-alltag": {
    slug: "quiz-alltag",
    titleKey: "quiz.alltag.title",
    subtitleKey: "quiz.alltag.subtitle",
    descriptionKey: "quiz.alltag.description",
    myths: mythsAlltag,
  },
  "quiz-gesellschaft": {
    slug: "quiz-gesellschaft",
    titleKey: "quiz.gesellschaft.title",
    subtitleKey: "quiz.gesellschaft.subtitle",
    descriptionKey: "quiz.gesellschaft.description",
    myths: mythsGesellschaft,
  },
  "quiz-koerper": {
    slug: "quiz-koerper",
    titleKey: "quiz.koerper.title",
    subtitleKey: "quiz.koerper.subtitle",
    descriptionKey: "quiz.koerper.description",
    myths: mythsKoerper,
  },
  "quiz-psyche": {
    slug: "quiz-psyche",
    titleKey: "quiz.psyche.title",
    subtitleKey: "quiz.psyche.subtitle",
    descriptionKey: "quiz.psyche.description",
    myths: mythsPsyche,
  },
};

/** All quiz slugs in display order. */
export const QUIZ_SLUGS = [
  "quiz-alltag",
  "quiz-gesellschaft",
  "quiz-koerper",
  "quiz-psyche",
] as const;
