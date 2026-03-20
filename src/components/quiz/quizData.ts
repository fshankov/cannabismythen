/**
 * Quiz data — structured myth entries for all 4 quiz themes.
 *
 * Data sourced from:
 *   - /src/content/selbsttest/quiz-*.mdoc (questions, classifications, feedback, population %)
 *   - /src/content/zahlen-und-fakten/*.mdoc (myth page slugs)
 *   - /src/content/selbsttest/feedback-texte.mdoc (population comparison data)
 *
 * TODO before production:
 *   - Verify all explanation texts with editorial team
 *   - Confirm population % figures match latest survey data
 *   - Review "keine_aussage" question handling with UX team
 *   - Add recommended myth links per tier (currently uses first 3 myths from each quiz)
 */

import type { QuizTheme, QuizMyth, ResultTier, ResultTierIndex } from "./types";

// ─── Result Tiers ──────────────────────────────────────────────────────────────

export const RESULT_TIERS: ResultTier[] = [
  {
    titleKey: "tier.0.title",
    messageKey: "tier.0.message",
    range: [0, 3],
  },
  {
    titleKey: "tier.1.title",
    messageKey: "tier.1.message",
    range: [4, 6],
  },
  {
    titleKey: "tier.2.title",
    messageKey: "tier.2.message",
    range: [7, 8],
  },
  {
    titleKey: "tier.3.title",
    messageKey: "tier.3.message",
    range: [9, Infinity], // adapts to quiz length (9, 10, or 11)
  },
];

export function getTierIndex(correct: number): ResultTierIndex {
  if (correct <= 3) return 0;
  if (correct <= 6) return 1;
  if (correct <= 8) return 2;
  return 3;
}

// ─── Percentile Computation ────────────────────────────────────────────────────

/**
 * Compute the percentile using dynamic programming over independent Bernoulli
 * variables. Each question has a known probability p_i that a random German
 * adult answers it correctly. We compute P(score < userScore) * 100.
 *
 * For "keine_aussage" questions with no population data, we assume 20% accuracy
 * (5 options, random guess).
 */
export function computePercentile(
  myths: QuizMyth[],
  correctCount: number
): number {
  const n = myths.length;
  const probs = myths.map((m) =>
    m.populationCorrectPct !== null ? m.populationCorrectPct / 100 : 0.2
  );

  // dp[j] = probability of getting exactly j correct after processing questions so far
  let dp = new Array(n + 1).fill(0);
  dp[0] = 1;

  for (let i = 0; i < n; i++) {
    const p = probs[i];
    const newDp = new Array(n + 1).fill(0);
    for (let j = 0; j <= i; j++) {
      if (dp[j] === 0) continue;
      newDp[j] += dp[j] * (1 - p); // wrong
      newDp[j + 1] += dp[j] * p; // correct
    }
    dp = newDp;
  }

  // percentile = P(random adult scores strictly less than userScore)
  let cdf = 0;
  for (let j = 0; j < correctCount; j++) {
    cdf += dp[j];
  }

  return Math.round(Math.min(99, Math.max(1, cdf * 100)));
}

// ─── Quiz: Cannabis & Alltag ───────────────────────────────────────────────────

const mythsAlltag: QuizMyth[] = [
  {
    id: "m04",
    statementKey: "myth.m04.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m04.explanation",
    populationCorrectPct: 69.7,
    mythPageSlug: "m04-weniger-schaedlich-alkohol",
  },
  {
    id: "m05",
    statementKey: "myth.m05.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m05.explanation",
    populationCorrectPct: 76.4,
    mythPageSlug: "m05-schwierig-dosieren",
  },
  {
    id: "m06",
    statementKey: "myth.m06.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m06.explanation",
    populationCorrectPct: 89.0,
    mythPageSlug: "m06-mischkonsum",
  },
  {
    id: "m07",
    statementKey: "myth.m07.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m07.explanation",
    populationCorrectPct: 85.7,
    mythPageSlug: "m07-zusaetze",
  },
  {
    id: "m12",
    statementKey: "myth.m12.statement",
    correctClassification: "keine_aussage",
    explanationKey: "myth.m12.explanation",
    populationCorrectPct: null,
    mythPageSlug: "m12-entzuendungen",
  },
  {
    id: "m13",
    statementKey: "myth.m13.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m13.explanation",
    populationCorrectPct: 78.3,
    mythPageSlug: "m13-spastiken",
  },
  {
    id: "m21",
    statementKey: "myth.m21.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m21.explanation",
    populationCorrectPct: 91.7,
    mythPageSlug: "m21-verkehr",
  },
  {
    id: "m29",
    statementKey: "myth.m29.statement",
    correctClassification: "eher_richtig",
    explanationKey: "myth.m29.explanation",
    populationCorrectPct: 84.4,
    mythPageSlug: "m29-gemuetslage",
  },
  {
    id: "m31",
    statementKey: "myth.m31.statement",
    correctClassification: "eher_richtig",
    explanationKey: "myth.m31.explanation",
    populationCorrectPct: 82.0,
    mythPageSlug: "m31-m32-entspannt-aggressiv",
  },
  {
    id: "m32",
    statementKey: "myth.m32.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m32.explanation",
    populationCorrectPct: 57.9,
    mythPageSlug: "m31-m32-entspannt-aggressiv",
  },
  {
    id: "m33",
    statementKey: "myth.m33.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m33.explanation",
    populationCorrectPct: 61.0,
    mythPageSlug: "m33-kreativ",
  },
];

// ─── Quiz: Cannabis & Gesellschaft ─────────────────────────────────────────────

const mythsGesellschaft: QuizMyth[] = [
  {
    id: "m34",
    statementKey: "myth.m34.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m34.explanation",
    populationCorrectPct: 54.2,
    mythPageSlug: "m34-soziale-beziehungen",
  },
  {
    id: "m35",
    statementKey: "myth.m35.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m35.explanation",
    populationCorrectPct: 63.3,
    mythPageSlug: "m35-soziale-regeln",
  },
  {
    id: "m36",
    statementKey: "myth.m36.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m36.explanation",
    populationCorrectPct: 55.3,
    mythPageSlug: "m36-m37-leistungen-niveau",
  },
  {
    id: "m37",
    statementKey: "myth.m37.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m37.explanation",
    populationCorrectPct: 35.8,
    mythPageSlug: "m36-m37-leistungen-niveau",
  },
  {
    id: "m38",
    statementKey: "myth.m38.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m38.explanation",
    populationCorrectPct: 61.8,
    mythPageSlug: "m38-cool",
  },
  {
    id: "m39",
    statementKey: "myth.m39.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m39.explanation",
    populationCorrectPct: 25.5,
    mythPageSlug: "m39-bevoelkerung-konsumiert",
  },
  {
    id: "m40",
    statementKey: "myth.m40.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m40.explanation",
    populationCorrectPct: 35.8,
    mythPageSlug: "m40-ueberall-erlaubt",
  },
  {
    id: "m41",
    statementKey: "myth.m41.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m41.explanation",
    populationCorrectPct: 79.3,
    mythPageSlug: "m41-m42-anstieg-konsum",
  },
  {
    id: "m42",
    statementKey: "myth.m42.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m42.explanation",
    populationCorrectPct: 53.1,
    mythPageSlug: "m41-m42-anstieg-konsum",
  },
];

// ─── Quiz: Cannabis & Körper ───────────────────────────────────────────────────

const mythsKoerper: QuizMyth[] = [
  {
    id: "m01",
    statementKey: "myth.m01.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m01.explanation",
    populationCorrectPct: 49.1,
    mythPageSlug: "m01-allheilmittel",
  },
  {
    id: "m02",
    statementKey: "myth.m02.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m02.explanation",
    populationCorrectPct: 63.8,
    mythPageSlug: "m02-harmlos",
  },
  {
    id: "m03",
    statementKey: "myth.m03.statement",
    correctClassification: "eher_richtig",
    explanationKey: "myth.m03.explanation",
    populationCorrectPct: 77.9,
    mythPageSlug: "m03-heranwachsende",
  },
  {
    id: "m08",
    statementKey: "myth.m08.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m08.explanation",
    populationCorrectPct: 89.9,
    mythPageSlug: "m08-foetus",
  },
  {
    id: "m09",
    statementKey: "myth.m09.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m09.explanation",
    populationCorrectPct: 74.3,
    mythPageSlug: "m09-ueberdosierung",
  },
  {
    id: "m10",
    statementKey: "myth.m10.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m10.explanation",
    populationCorrectPct: 49.7,
    mythPageSlug: "m10-schmerzen",
  },
  {
    id: "m11",
    statementKey: "myth.m11.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m11.explanation",
    populationCorrectPct: 71.9,
    mythPageSlug: "m11-uebelkeit",
  },
  {
    id: "m14",
    statementKey: "myth.m14.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m14.explanation",
    populationCorrectPct: 76.2,
    mythPageSlug: "m14-herz-kreislauf",
  },
  {
    id: "m15",
    statementKey: "myth.m15.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m15.explanation",
    populationCorrectPct: 78.8,
    mythPageSlug: "m15-atemwege",
  },
  {
    id: "m16",
    statementKey: "myth.m16.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m16.explanation",
    populationCorrectPct: 73.6,
    mythPageSlug: "m16-krebs",
  },
  {
    id: "m17",
    statementKey: "myth.m17.statement",
    correctClassification: "keine_aussage",
    explanationKey: "myth.m17.explanation",
    populationCorrectPct: null,
    mythPageSlug: "m17-abnehmen",
  },
];

// ─── Quiz: Cannabis & Psyche ───────────────────────────────────────────────────

const mythsPsyche: QuizMyth[] = [
  {
    id: "m18",
    statementKey: "myth.m18.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m18.explanation",
    populationCorrectPct: 56.4,
    mythPageSlug: "m18-schlaf",
  },
  {
    id: "m19",
    statementKey: "myth.m19.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m19.explanation",
    populationCorrectPct: 87.6,
    mythPageSlug: "m19-wahrnehmung",
  },
  {
    id: "m20",
    statementKey: "myth.m20.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m20.explanation",
    populationCorrectPct: 83.3,
    mythPageSlug: "m20-kognition",
  },
  {
    id: "m22",
    statementKey: "myth.m22.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m22.explanation",
    populationCorrectPct: 51.6,
    mythPageSlug: "m22-einstiegsdroge",
  },
  {
    id: "m23",
    statementKey: "myth.m23.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m23.explanation",
    populationCorrectPct: 63.7,
    mythPageSlug: "m23-abhaengigkeit",
  },
  {
    id: "m24",
    statementKey: "myth.m24.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m24.explanation",
    populationCorrectPct: 74.3,
    mythPageSlug: "m24-psychosen",
  },
  {
    id: "m25",
    statementKey: "myth.m25.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m25.explanation",
    populationCorrectPct: 60.6,
    mythPageSlug: "m25-angst",
  },
  {
    id: "m26",
    statementKey: "myth.m26.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m26.explanation",
    populationCorrectPct: 30.2,
    mythPageSlug: "m26-depressionen",
  },
  {
    id: "m27",
    statementKey: "myth.m27.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m27.explanation",
    populationCorrectPct: 55.9,
    mythPageSlug: "m27-adhs",
  },
  {
    id: "m28",
    statementKey: "myth.m28.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m28.explanation",
    populationCorrectPct: 25.1,
    mythPageSlug: "m28-motivation",
  },
  {
    id: "m30",
    statementKey: "myth.m30.statement",
    correctClassification: "eher_richtig",
    explanationKey: "myth.m30.explanation",
    populationCorrectPct: 83.0,
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
    recommendedLinks: [
      // Tier 0 (0–3): basics
      ["m06-mischkonsum", "m21-verkehr", "m07-zusaetze"],
      // Tier 1 (4–6): mid
      ["m04-weniger-schaedlich-alkohol", "m29-gemuetslage", "m33-kreativ"],
      // Tier 2 (7–8): good
      ["m12-entzuendungen", "m31-m32-entspannt-aggressiv", "m13-spastiken"],
      // Tier 3 (9+): expert
      ["m31-m32-entspannt-aggressiv", "m12-entzuendungen", "m05-schwierig-dosieren"],
    ],
  },
  "quiz-gesellschaft": {
    slug: "quiz-gesellschaft",
    titleKey: "quiz.gesellschaft.title",
    subtitleKey: "quiz.gesellschaft.subtitle",
    descriptionKey: "quiz.gesellschaft.description",
    myths: mythsGesellschaft,
    recommendedLinks: [
      ["m39-bevoelkerung-konsumiert", "m40-ueberall-erlaubt", "m38-cool"],
      ["m36-m37-leistungen-niveau", "m34-soziale-beziehungen", "m41-m42-anstieg-konsum"],
      ["m35-soziale-regeln", "m41-m42-anstieg-konsum", "m39-bevoelkerung-konsumiert"],
      ["m36-m37-leistungen-niveau", "m40-ueberall-erlaubt", "m34-soziale-beziehungen"],
    ],
  },
  "quiz-koerper": {
    slug: "quiz-koerper",
    titleKey: "quiz.koerper.title",
    subtitleKey: "quiz.koerper.subtitle",
    descriptionKey: "quiz.koerper.description",
    myths: mythsKoerper,
    recommendedLinks: [
      ["m01-allheilmittel", "m02-harmlos", "m10-schmerzen"],
      ["m08-foetus", "m14-herz-kreislauf", "m16-krebs"],
      ["m09-ueberdosierung", "m15-atemwege", "m17-abnehmen"],
      ["m10-schmerzen", "m01-allheilmittel", "m11-uebelkeit"],
    ],
  },
  "quiz-psyche": {
    slug: "quiz-psyche",
    titleKey: "quiz.psyche.title",
    subtitleKey: "quiz.psyche.subtitle",
    descriptionKey: "quiz.psyche.description",
    myths: mythsPsyche,
    recommendedLinks: [
      ["m23-abhaengigkeit", "m24-psychosen", "m26-depressionen"],
      ["m22-einstiegsdroge", "m18-schlaf", "m28-motivation"],
      ["m25-angst", "m27-adhs", "m30-suizid"],
      ["m28-motivation", "m26-depressionen", "m22-einstiegsdroge"],
    ],
  },
};

/** All quiz slugs in display order. */
export const QUIZ_SLUGS = [
  "quiz-alltag",
  "quiz-gesellschaft",
  "quiz-koerper",
  "quiz-psyche",
] as const;
