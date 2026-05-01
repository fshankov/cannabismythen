/**
 * Quiz data — structured myth entries for all 5 quiz themes + Schritte
 * scoring helpers.
 *
 * Editorial vs data split (mirrored in CLAUDE.md):
 *   - This file is the source of truth for **data integrity** — mythId,
 *     correctClassification, populationCorrectPct, mythPageSlug. Code
 *     reviewers gate changes here; the runtime trusts these values when
 *     computing scores.
 *   - Editorial text (statements, explanations, verdicts, intros, share
 *     copy) lives in `src/content/quiz/*.mdoc` and reaches the runtime
 *     through `src/pages/quiz/[slug].astro` → React props. The
 *     `statementKey` / `explanationKey` fields below are fallback i18n
 *     references only.
 *
 * Data sourced from:
 *   - `src/content/quiz/feedback-texte.mdoc` — Erwachsene (18–70) reference
 *     table from the CaRM-Studie. This is the source of truth for
 *     populationCorrectPct.
 *   - `src/content/zahlen-und-fakten/*.mdoc` — myth page slugs and
 *     scientific classifications.
 */

import type {
  QuizTheme,
  QuizMyth,
  ResultTier,
  ResultTierIndex,
  Classification,
  CardAnswer,
  Schritte,
  ScoreBand,
} from "./types";

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

// ─── Schritte scoring (matches CaRM "Richtigkeit d. Beurteilung") ──────
//
// Single source of truth for everything score-related. The legacy
// `+2/+1/-1/-2` scorer used in QuizPlayer was replaced by this module in
// the Stage 1 overhaul; if you find another scorer anywhere in the quiz
// codebase, that's a bug — route it through here instead.

/** Likert position of each classification on the 4-point scale.
 *  `falsch:0 … richtig:3` ascending matches CaRM's reporting. */
export const LIKERT_VALUES: Record<Classification, 0 | 1 | 2 | 3> = {
  falsch: 0,
  eher_falsch: 1,
  eher_richtig: 2,
  richtig: 3,
};

/** Per-question Schritte — distance between the user's pick and the
 *  scientific verdict on the 4-point scale. `0` is exact, `3` is opposite. */
export function schritte(
  chosen: Classification,
  correct: Classification
): Schritte {
  const d = Math.abs(LIKERT_VALUES[chosen] - LIKERT_VALUES[correct]);
  return d as Schritte;
}

/** CaRM "Richtigkeit" point value for a single answer's Schritte. */
export function pointsForSchritte(s: Schritte): 1 | 0.66 | 0.33 | 0 {
  if (s === 0) return 1;
  if (s === 1) return 0.66;
  if (s === 2) return 0.33;
  return 0;
}

/** Module score as an integer percentage. Sum of per-question points
 *  divided by question count, scaled to 0–100. Only includes questions
 *  the user actually answered — partial runs return a partial score. */
export function moduleScore(
  answers: CardAnswer[],
  myths: QuizMyth[]
): number {
  if (myths.length === 0) return 0;
  let sumPoints = 0;
  for (const a of answers) {
    const myth = myths.find((m) => m.id === a.mythId);
    if (!myth) continue;
    sumPoints += pointsForSchritte(
      schritte(a.chosenClassification, myth.correctClassification)
    );
  }
  return Math.round((sumPoints / myths.length) * 100);
}

/** Per-band counts derived from the user's Schritte per question. The
 *  result page uses this for the "X exact · Y near · Z off · W far"
 *  breakdown line. */
export function breakdownCounts(
  answers: CardAnswer[],
  myths: QuizMyth[]
): { exact: number; near: number; off: number; far: number } {
  const out = { exact: 0, near: 0, off: 0, far: 0 };
  for (const a of answers) {
    const myth = myths.find((m) => m.id === a.mythId);
    if (!myth) continue;
    const s = schritte(a.chosenClassification, myth.correctClassification);
    if (s === 0) out.exact++;
    else if (s === 1) out.near++;
    else if (s === 2) out.off++;
    else out.far++;
  }
  return out;
}

/** Map a module-score percentage to its named band. Bands match the
 *  Keystatic `verdicts.{band}` field labels (80–100 / 60–79 / 40–59 / 0–39). */
export function scoreBand(pct: number): ScoreBand {
  if (pct >= 80) return "profi";
  if (pct >= 60) return "guterweg";
  if (pct >= 40) return "gehtnoch";
  return "erwischt";
}

/**
 * Score a single answer on the same 0–100 "Richtigkeit" scale used by CaRM.
 * 0 steps from correct → 100, 1 step → 66.67, 2 steps → 33.33, 3 steps → 0.
 *
 * Implemented via `schritte()` so there's exactly one Schritte source of
 * truth in the codebase. Used by `computePercentile()` below for the
 * mean-based percentile estimate against the Erwachsene (18–70) sample.
 */
export function distanceScore(
  chosen: Classification,
  correct: Classification
): number {
  const s = schritte(chosen, correct);
  return ((3 - s) / 3) * 100;
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

// ─── Quiz 1: Medizinischer und therapeutischer Nutzen (7 questions) ──────────
// m12 (Entzündungen) and m17 (Abnehmen) skipped — keine_aussage classification

const mythsMedizin: QuizMyth[] = [
  {
    id: "m10",
    statementKey: "myth.m10.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m10.explanation",
    populationCorrectPct: 49.92,
    mythPageSlug: "m10-schmerzen",
  },
  {
    id: "m13",
    statementKey: "myth.m13.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m13.explanation",
    populationCorrectPct: 78.06,
    mythPageSlug: "m13-spastiken",
  },
  {
    id: "m18",
    statementKey: "myth.m18.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m18.explanation",
    populationCorrectPct: 56.47,
    mythPageSlug: "m18-schlaf",
  },
  {
    id: "m25",
    statementKey: "myth.m25.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m25.explanation",
    populationCorrectPct: 60.74,
    mythPageSlug: "m25-angst",
  },
  {
    id: "m26",
    statementKey: "myth.m26.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m26.explanation",
    populationCorrectPct: 30.39,
    mythPageSlug: "m26-depressionen",
  },
  {
    id: "m27",
    statementKey: "myth.m27.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m27.explanation",
    populationCorrectPct: 56.05,
    mythPageSlug: "m27-adhs",
  },
  {
    id: "m01",
    statementKey: "myth.m01.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m01.explanation",
    populationCorrectPct: 49.05,
    mythPageSlug: "m01-allheilmittel",
  },
];

// ─── Quiz 2: Risiken für Entwicklung, Körper und Psyche (11 questions) ────────

const mythsRisiken: QuizMyth[] = [
  {
    id: "m03",
    statementKey: "myth.m03.statement",
    correctClassification: "eher_richtig",
    explanationKey: "myth.m03.explanation",
    populationCorrectPct: 77.84,
    mythPageSlug: "m03-heranwachsende",
  },
  {
    id: "m08",
    statementKey: "myth.m08.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m08.explanation",
    populationCorrectPct: 89.74,
    mythPageSlug: "m08-foetus",
  },
  {
    id: "m14",
    statementKey: "myth.m14.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m14.explanation",
    populationCorrectPct: 76.20,
    mythPageSlug: "m14-herz-kreislauf",
  },
  {
    id: "m15",
    statementKey: "myth.m15.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m15.explanation",
    populationCorrectPct: 78.66,
    mythPageSlug: "m15-atemwege",
  },
  {
    id: "m16",
    statementKey: "myth.m16.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m16.explanation",
    populationCorrectPct: 73.70,
    mythPageSlug: "m16-krebs",
  },
  {
    id: "m11",
    statementKey: "myth.m11.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m11.explanation",
    populationCorrectPct: 71.92,
    mythPageSlug: "m11-uebelkeit",
  },
  {
    id: "m24",
    statementKey: "myth.m24.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m24.explanation",
    populationCorrectPct: 74.30,
    mythPageSlug: "m24-psychosen",
  },
  {
    id: "m20",
    statementKey: "myth.m20.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m20.explanation",
    populationCorrectPct: 83.24,
    mythPageSlug: "m20-kognition",
  },
  {
    id: "m30",
    statementKey: "myth.m30.statement",
    correctClassification: "eher_richtig",
    explanationKey: "myth.m30.explanation",
    populationCorrectPct: 82.99,
    mythPageSlug: "m30-suizid",
  },
  {
    id: "m23",
    statementKey: "myth.m23.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m23.explanation",
    populationCorrectPct: 63.73,
    mythPageSlug: "m23-abhaengigkeit",
  },
  {
    id: "m22",
    statementKey: "myth.m22.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m22.explanation",
    populationCorrectPct: 51.75,
    mythPageSlug: "m22-einstiegsdroge",
  },
];

// ─── Quiz 3: Wirkung auf Stimmung und Wahrnehmung (6 questions) ───────────────

const mythsStimmung: QuizMyth[] = [
  {
    id: "m31",
    statementKey: "myth.m31.statement",
    correctClassification: "eher_richtig",
    explanationKey: "myth.m31.explanation",
    populationCorrectPct: 81.98,
    mythPageSlug: "m31-m32-entspannt-aggressiv",
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
    id: "m33",
    statementKey: "myth.m33.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m33.explanation",
    populationCorrectPct: 60.99,
    mythPageSlug: "m33-kreativ",
  },
  {
    id: "m32",
    statementKey: "myth.m32.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m32.explanation",
    populationCorrectPct: 57.98,
    mythPageSlug: "m31-m32-entspannt-aggressiv",
  },
  {
    id: "m28",
    statementKey: "myth.m28.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m28.explanation",
    populationCorrectPct: 25.24,
    mythPageSlug: "m28-motivation",
  },
  {
    id: "m19",
    statementKey: "myth.m19.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m19.explanation",
    populationCorrectPct: 87.57,
    mythPageSlug: "m19-wahrnehmung",
  },
];

// ─── Quiz 4: Bevölkerung, Gesellschaft und Gesetzgebung (10 questions) ─────────

const mythsGesellschaft: QuizMyth[] = [
  {
    id: "m39",
    statementKey: "myth.m39.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m39.explanation",
    populationCorrectPct: 25.63,
    mythPageSlug: "m39-bevoelkerung-konsumiert",
  },
  {
    id: "m21",
    statementKey: "myth.m21.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m21.explanation",
    populationCorrectPct: 91.64,
    mythPageSlug: "m21-verkehr",
  },
  {
    id: "m34",
    statementKey: "myth.m34.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m34.explanation",
    populationCorrectPct: 54.22,
    mythPageSlug: "m34-soziale-beziehungen",
  },
  {
    id: "m36",
    statementKey: "myth.m36.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m36.explanation",
    populationCorrectPct: 55.41,
    mythPageSlug: "m36-m37-leistungen-niveau",
  },
  {
    id: "m37",
    statementKey: "myth.m37.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m37.explanation",
    populationCorrectPct: 35.76,
    mythPageSlug: "m36-m37-leistungen-niveau",
  },
  {
    id: "m35",
    statementKey: "myth.m35.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m35.explanation",
    populationCorrectPct: 63.47,
    mythPageSlug: "m35-soziale-regeln",
  },
  {
    id: "m38",
    statementKey: "myth.m38.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m38.explanation",
    populationCorrectPct: 61.81,
    mythPageSlug: "m38-cool",
  },
  {
    id: "m41",
    statementKey: "myth.m41.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m41.explanation",
    populationCorrectPct: 79.23,
    mythPageSlug: "m41-m42-anstieg-konsum",
  },
  {
    id: "m42",
    statementKey: "myth.m42.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m42.explanation",
    populationCorrectPct: 53.12,
    mythPageSlug: "m41-m42-anstieg-konsum",
  },
  {
    id: "m40",
    statementKey: "myth.m40.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m40.explanation",
    populationCorrectPct: 36.09,
    mythPageSlug: "m40-ueberall-erlaubt",
  },
];

// ─── Quiz 5: Allgemeine Einschätzung der Gefährlichkeit (6 questions) ─────────

const mythsGefaehrlichkeit: QuizMyth[] = [
  {
    id: "m04",
    statementKey: "myth.m04.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m04.explanation",
    populationCorrectPct: 69.42,
    mythPageSlug: "m04-weniger-schaedlich-alkohol",
  },
  {
    id: "m02",
    statementKey: "myth.m02.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m02.explanation",
    populationCorrectPct: 63.86,
    mythPageSlug: "m02-harmlos",
  },
  {
    id: "m09",
    statementKey: "myth.m09.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m09.explanation",
    populationCorrectPct: 74.08,
    mythPageSlug: "m09-ueberdosierung",
  },
  {
    id: "m05",
    statementKey: "myth.m05.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m05.explanation",
    populationCorrectPct: 76.17,
    mythPageSlug: "m05-schwierig-dosieren",
  },
  {
    id: "m06",
    statementKey: "myth.m06.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m06.explanation",
    populationCorrectPct: 88.95,
    mythPageSlug: "m06-mischkonsum",
  },
  {
    id: "m07",
    statementKey: "myth.m07.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m07.explanation",
    populationCorrectPct: 85.59,
    mythPageSlug: "m07-zusaetze",
  },
];

// ─── Quiz Themes ───────────────────────────────────────────────────────────────

export const QUIZ_THEMES: Record<string, QuizTheme> = {
  "quiz-medizin": {
    slug: "quiz-medizin",
    titleKey: "quiz.medizin.title",
    subtitleKey: "quiz.medizin.subtitle",
    descriptionKey: "quiz.medizin.description",
    myths: mythsMedizin,
  },
  "quiz-risiken": {
    slug: "quiz-risiken",
    titleKey: "quiz.risiken.title",
    subtitleKey: "quiz.risiken.subtitle",
    descriptionKey: "quiz.risiken.description",
    myths: mythsRisiken,
  },
  "quiz-stimmung": {
    slug: "quiz-stimmung",
    titleKey: "quiz.stimmung.title",
    subtitleKey: "quiz.stimmung.subtitle",
    descriptionKey: "quiz.stimmung.description",
    myths: mythsStimmung,
  },
  "quiz-gesellschaft": {
    slug: "quiz-gesellschaft",
    titleKey: "quiz.gesellschaft.title",
    subtitleKey: "quiz.gesellschaft.subtitle",
    descriptionKey: "quiz.gesellschaft.description",
    myths: mythsGesellschaft,
  },
  "quiz-gefaehrlichkeit": {
    slug: "quiz-gefaehrlichkeit",
    titleKey: "quiz.gefaehrlichkeit.title",
    subtitleKey: "quiz.gefaehrlichkeit.subtitle",
    descriptionKey: "quiz.gefaehrlichkeit.description",
    myths: mythsGefaehrlichkeit,
  },
};

/** All quiz slugs in display order. */
export const QUIZ_SLUGS = [
  "quiz-medizin",
  "quiz-risiken",
  "quiz-stimmung",
  "quiz-gesellschaft",
  "quiz-gefaehrlichkeit",
] as const;
