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
  Classification,
  CardAnswer,
  Schritte,
  ScoreBand,
} from "./types";

// ─── SCORING METHODOLOGY (CaRM §4.3.3 alignment, 2026-05-28) ───────────
//
// Single source of truth for everything score-related. If you find
// another scorer anywhere in the quiz codebase, that's a bug — route it
// through here instead.
//
// PER-QUESTION RICHTIGKEIT (Likert distance → Punkte)
//   Each classification answer sits on a 4-step Likert scale
//   (falsch=0 < eher_falsch=1 < eher_richtig=2 < richtig=3). The user's
//   Schritte is |userPos − sciencePos|, ranging 0 (exact) to 3 (opposite).
//   Schritte map to Punkte per CaRM's standardisation (Abschlussbericht
//   §4.3.3 + Tabelle "Indikatoren der quantitativen Analyse", p. 51):
//
//     0 Schritte → 3 Punkte
//     1 Schritt  → 2 Punkte
//     2 Schritte → 1 Punkt
//     3 Schritte → 0 Punkte
//
//   (2026-06-04 integer ladder = `3 − Schritte`, replaces the old fractional
//   1 / 0,66 / 0,33 / 0 scale.) It is the report's 0–100 standardisation
//   (§4.3.3, p. 51: 100 / 66.67 / 33.33 / 0) rescaled to 0–3 (× 3 / 100).
//   Same ladder ISD applies to the survey responses.
//
// USER DECK TOTAL vs POPULATION DECK TOTAL (apples-to-apples)
//   User's Punkte for a deck of N myths = Σ pointsForSchritte (0..3N, integer).
//   Population's Punkte for the same deck = Σ (populationCorrectPct × 3 / 100)
//   per `populationExpectedPunkte(myths)` — also 0..3N (a mean, one decimal).
//
//   Both sides use the SAME per-question 3/2/1/0 ladder. A Schritte=1 answer
//   contributes 2 Punkte; the population's mean for that same myth (e.g.
//   78.32 Richtigkeit) contributes 78.32 × 3 / 100 = 2.35 Punkte.
//   Apples-to-apples — directly comparable, no rescaling needed.
//
// BAND THRESHOLDS (scoreBand → profi / guterweg / gehtnoch / erwischt)
//   Absolute thresholds on the percentage form (moduleScore returns a
//   rounded percent). ≥80 = profi, ≥60 = guterweg, ≥40 = gehtnoch.
//   The report defines "75+ Punkte = hohe Ausprägung" (p. 51); our 80
//   profi cutoff is slightly stricter for editorial reasons.
//
// SCHÄTZFRAGEN — NONE EXIST IN THE QUIZ
//   Every quiz card is a 4-level Likert classification; there is no
//   numeric-guess card type. Per-Schritte feedback labels in i18n.ts
//   (`schritte.{exact,near,off,far}`) apply uniformly to all cards.

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
  correct: Classification,
): Schritte {
  const d = Math.abs(LIKERT_VALUES[chosen] - LIKERT_VALUES[correct]);
  return d as Schritte;
}

/** Points for a single answer on the integer ladder (2026-06-04, Fedor):
 *  exact = 3, one step off = 2, two steps off = 1, opposite poles = 0.
 *  i.e. `3 − schritte`. Replaces the old fractional 1 / 0,66 / 0,33 / 0
 *  "Richtigkeit" scale. A deck of N myths now scores 0 … 3·N. */
export function pointsForSchritte(s: Schritte): 3 | 2 | 1 | 0 {
  return (3 - s) as 3 | 2 | 1 | 0;
}

/** Display string for one answer's points (per-card badge): bare "3 / 2 / 1"
 *  for a scoring answer, "0" for the opposite-pole answer (rendered in rose;
 *  the verdict phrase next to it carries the comment). The leading "+" was
 *  dropped per ISD request (Asana 1215366221348214) — integer 3/2/1/0 ladder. */
export function pointsDisplay(s: Schritte): string {
  const p = pointsForSchritte(s);
  return `${p}`;
}

/** Module score as an integer percentage (0–100). Sum of per-question
 *  points (now 0–3 each) over the max possible (3 · question count), scaled
 *  to 0–100, so `scoreBand()` thresholds stay unchanged. Only includes
 *  questions the user actually answered — partial runs return a partial
 *  score. */
export function moduleScore(answers: CardAnswer[], myths: QuizMyth[]): number {
  if (myths.length === 0) return 0;
  let sumPoints = 0;
  for (const a of answers) {
    const myth = myths.find((m) => m.id === a.mythId);
    if (!myth) continue;
    sumPoints += pointsForSchritte(
      schritte(a.chosenClassification, myth.correctClassification),
    );
  }
  return Math.round((sumPoints / (myths.length * 3)) * 100);
}

/** Per-band counts derived from the user's Schritte per question. The
 *  result page uses this for the "X exact · Y near · Z off · W far"
 *  breakdown line. */
export function breakdownCounts(
  answers: CardAnswer[],
  myths: QuizMyth[],
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

// ─── Stage D (2026-05-22) — Pew-style per-question + aggregate framing ────
//
// Today's result page mixes Schritte-coverage % (partial credit) on the
// user side with genau-richtig count % (binary) on the population side —
// not apples-to-apples. The three helpers below replace that comparison
// with an honest split:
//
//   1. `userJoinedPercent` — per question, "the user joined X % of the
//      Erwachsene (18–70) who matched the science" (or the (100−X) % who
//      didn't). That's the Pew per-question reframe.
//
//   2. `populationExpectedExactCount` — Σ p_i / 100 over a deck. The
//      expected genau-richtig count a random Erwachsene gets, treated as
//      a Poisson-binomial expectation. Single decimal precision; no
//      assumption beyond the per-myth populationCorrectPct values.
//
//   3. `exactCountDelta` — signed delta of user.exactCount − populationExpected,
//      single decimal. Drives the "über / unter / auf dem Schnitt" line on
//      the achievement card.
//
// Schritte stays under the hood as today — per-question feedback
// (Genau richtig / Nah dran / ...) and band-tier mapping (Mythen-Profi
// → Erwischt). It does NOT appear in any user-vs-population sentence;
// only genau-richtig counts do, since those are apples-to-apples.

/**
 * @deprecated 2026-05-28 (CAR-9 / CAR-10, Harald review).
 *
 * Reframe of the per-question population reveal: was
 * "Du gehörst zu N % der Erwachsenen, die diese Aussage genau richtig
 * eingeordnet haben." — but `populationCorrectPct` is the mean Richtigkeit
 * score (0–100), NOT the share of fully-correct respondents (see types.ts
 * JSDoc + the SCORING METHODOLOGY block above). The per-card population
 * reveal (`result.row.populationMean`) was removed 2026-06-04 — that
 * comparison now lives only on the result card (ShareCard).
 *
 * Function kept inert for one release cycle in case an out-of-tree
 * branch still calls it. Retire alongside the `populationCorrectPct`
 * rename in the follow-up Asana task.
 */
export function userJoinedPercent(
  myth: QuizMyth,
  userAnswer: Classification,
): number {
  const exact = userAnswer === myth.correctClassification;
  const raw = exact
    ? myth.populationCorrectPct
    : 100 - myth.populationCorrectPct;
  return Math.round(raw);
}

/** User's deck total in Punkte (0–3·N scale, N = number of myths).
 *  Sum of pointsForSchritte (3 / 2 / 1 / 0) across all answers — an integer.
 *  Apples-to-apples with `populationExpectedPunkte()` (the population's mean
 *  on the same 3/2/1/0 ladder). */
export function userExpectedPunkte(
  myths: QuizMyth[],
  answers: CardAnswer[],
): number {
  if (myths.length === 0) return 0;
  let sum = 0;
  for (const a of answers) {
    const myth = myths.find((m) => m.id === a.mythId);
    if (!myth) continue;
    sum += pointsForSchritte(
      schritte(a.chosenClassification, myth.correctClassification),
    );
  }
  return Math.round(sum * 10) / 10;
}

/** Population's expected deck total in Punkte on the 3/2/1/0 ladder
 *  (0–3·N scale), shown on the result card with one decimal. Each myth
 *  contributes the mean Richtigkeit converted to the new scale:
 *  `populationCorrectPct × 3 / 100` (populationCorrectPct is the CaRM mean
 *  Richtigkeit, 0–100; ×3/100 maps it onto 0–3). Apples-to-apples with
 *  `userExpectedPunkte()`. The populationCorrectPct values are unchanged —
 *  only the conversion factor. */
export function populationExpectedPunkte(myths: QuizMyth[]): number {
  if (myths.length === 0) return 0;
  const sum = myths.reduce(
    (acc, m) => acc + (m.populationCorrectPct * 3) / 100,
    0,
  );
  return Math.round(sum * 10) / 10;
}

/** Population's module score as a percentage (0–100): the mean
 *  populationCorrectPct across the deck. Apples-to-apples with the user's
 *  `moduleScore` (both are mean per-question Richtigkeit on a 0–100 scale).
 *  Drives the result-page percentage-point delta (QuizCard redesign,
 *  2026-05-29). */
export function populationModuleScore(myths: QuizMyth[]): number {
  if (myths.length === 0) return 0;
  const sum = myths.reduce((acc, m) => acc + m.populationCorrectPct, 0);
  return Math.round(sum / myths.length);
}

/** Signed delta `userExactCount − populationExpectedPunkte`, one decimal.
 *  Positive → user above the population average. (Currently unused.) */
export function exactCountDelta(
  userExactCount: number,
  myths: QuizMyth[],
): number {
  const expected = populationExpectedPunkte(myths);
  return Math.round((userExactCount - expected) * 10) / 10;
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
  correct: Classification,
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
  answers: CardAnswer[],
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
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) *
      t *
      Math.exp((-absX * absX) / 2);
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
    // Stage E commit 3 (2026-05-23): 78.06 → 78.32 (carm-data.json alignment).
    populationCorrectPct: 78.32,
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
    // Stage E commit 3 (2026-05-23): 30.39 → 30.18 (carm-data.json alignment).
    populationCorrectPct: 30.18,
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

// ─── Quiz 2: Risiken für Entwicklung, Körper und Psyche (10 questions) ────────
//
// Session 1 of 2026-05 — m03 (Heranwachsende) moved out of this module
// into Allgemeine-Gefährlichkeit per the Kategorisierung_2026 05 06 docx
// Quiz table.

const mythsRisiken: QuizMyth[] = [
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
    populationCorrectPct: 76.2,
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
    populationCorrectPct: 73.7,
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
    populationCorrectPct: 74.3,
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
    mythPageSlug: "m31-entspannt",
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
    mythPageSlug: "m32-nicht-aggressiv",
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
    mythPageSlug: "m36-leistungen",
  },
  {
    id: "m37",
    statementKey: "myth.m37.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m37.explanation",
    populationCorrectPct: 35.76,
    mythPageSlug: "m37-soziales-niveau",
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
    mythPageSlug: "m41-gesetz-anstieg",
  },
  {
    id: "m42",
    statementKey: "myth.m42.statement",
    correctClassification: "eher_falsch",
    explanationKey: "myth.m42.explanation",
    populationCorrectPct: 53.12,
    mythPageSlug: "m42-gesetz-anstieg-minderjaehrige",
  },
  {
    id: "m40",
    statementKey: "myth.m40.statement",
    correctClassification: "falsch",
    explanationKey: "myth.m40.explanation",
    // Stage E commit 3 (2026-05-23): 36.09 → 35.76 (carm-data.json alignment).
    populationCorrectPct: 35.76,
    mythPageSlug: "m40-ueberall-erlaubt",
  },
];

// ─── Quiz 5: Allgemeine Einschätzung der Gefährlichkeit (7 questions) ─────────
//
// Session 1 of 2026-05 — m03 (Heranwachsende) added to this module per the
// Kategorisierung_2026 05 06 docx Quiz table. Order matches the docx:
// m04, m02, m03, m09, m05, m06, m07.

const mythsGefaehrlichkeit: QuizMyth[] = [
  {
    id: "m04",
    statementKey: "myth.m04.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m04.explanation",
    // Stage E commit 3 (2026-05-23): 69.42 → 69.66 to match carm-data.json
    // `metrics[group_id="adults"].correctness`. Validation script PR4 flagged.
    populationCorrectPct: 69.66,
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
    id: "m03",
    statementKey: "myth.m03.statement",
    correctClassification: "eher_richtig",
    explanationKey: "myth.m03.explanation",
    populationCorrectPct: 77.84,
    mythPageSlug: "m03-heranwachsende",
  },
  {
    id: "m09",
    statementKey: "myth.m09.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m09.explanation",
    // Stage E commit 3 (2026-05-23): 74.08 → 74.30 (carm-data.json alignment).
    populationCorrectPct: 74.3,
    mythPageSlug: "m09-ueberdosierung",
  },
  {
    id: "m05",
    statementKey: "myth.m05.statement",
    correctClassification: "richtig",
    explanationKey: "myth.m05.explanation",
    // Stage E commit 3 (2026-05-23): 76.17 → 76.43 (carm-data.json alignment).
    populationCorrectPct: 76.43,
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
  "quiz-medizinischer-nutzen": {
    slug: "quiz-medizinischer-nutzen",
    titleKey: "quiz.medizin.title",
    subtitleKey: "quiz.medizin.subtitle",
    descriptionKey: "quiz.medizin.description",
    myths: mythsMedizin,
  },
  "quiz-risiken-koerper-psyche": {
    slug: "quiz-risiken-koerper-psyche",
    titleKey: "quiz.risiken.title",
    subtitleKey: "quiz.risiken.subtitle",
    descriptionKey: "quiz.risiken.description",
    myths: mythsRisiken,
  },
  "quiz-stimmung-wahrnehmung": {
    slug: "quiz-stimmung-wahrnehmung",
    titleKey: "quiz.stimmung.title",
    subtitleKey: "quiz.stimmung.subtitle",
    descriptionKey: "quiz.stimmung.description",
    myths: mythsStimmung,
  },
  "quiz-soziales-bevoelkerung": {
    slug: "quiz-soziales-bevoelkerung",
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
  // Stage 6: Schnellcheck — dynamic 7-myth deck balanced across the five
  // theme buckets. Empty `myths` here; the player calls
  // `pickSchnellcheckMyths()` at mount time and persists the selection
  // for the session.
  "quiz-schnellcheck": {
    slug: "quiz-schnellcheck",
    titleKey: "quiz.schnellcheck.title",
    subtitleKey: "quiz.schnellcheck.subtitle",
    descriptionKey: "quiz.schnellcheck.description",
    myths: [],
    dynamic: true,
  },
};

/** All five static quiz slugs that group the 40 used myths by theme.
 *  m12 + m17 are `keine_aussage` and not included in any module. */
const STATIC_THEME_BUCKETS: Array<{ slug: string; myths: QuizMyth[] }> = [
  { slug: "quiz-medizinischer-nutzen", myths: mythsMedizin },
  { slug: "quiz-risiken-koerper-psyche", myths: mythsRisiken },
  { slug: "quiz-stimmung-wahrnehmung", myths: mythsStimmung },
  { slug: "quiz-soziales-bevoelkerung", myths: mythsGesellschaft },
  { slug: "quiz-gefaehrlichkeit", myths: mythsGefaehrlichkeit },
];

/** Global mythId → QuizMyth lookup across every static theme. Used by
 *  the Schnellcheck deck (Stage 6) to rehydrate persisted picks: the
 *  saved `order` field in localStorage stores mythIds; this map resolves
 *  them back to full QuizMyth objects. */
export const ALL_MYTHS_BY_ID: Record<string, QuizMyth> = (() => {
  const out: Record<string, QuizMyth> = {};
  for (const bucket of STATIC_THEME_BUCKETS) {
    for (const m of bucket.myths) out[m.id] = m;
  }
  return out;
})();

/**
 * Stage 6 — pick 7 myths balanced across the five theme buckets.
 *
 * Strategy: take 1 random myth from each of the 5 buckets, then fill the
 * remaining 2 slots from the union of not-yet-picked myths (also random).
 * Returns a freshly shuffled array each call; pass `seed`-style behaviour
 * by injecting a custom rng for tests.
 *
 * Why not pure-random across all 40? A pure sample frequently produces
 * runs heavily weighted toward one theme, which makes the Schnellcheck
 * feel less like a cross-section. The balanced strategy guarantees
 * thematic variety while still feeling random.
 */
export function pickSchnellcheckMyths(
  rng: () => number = Math.random,
): QuizMyth[] {
  const picked: QuizMyth[] = [];

  // 1) one from each bucket
  for (const bucket of STATIC_THEME_BUCKETS) {
    if (bucket.myths.length === 0) continue;
    const idx = Math.floor(rng() * bucket.myths.length);
    picked.push(bucket.myths[idx]);
  }

  // 2) fill remaining slots (up to 7) from the union of remaining myths
  const pickedIds = new Set(picked.map((m) => m.id));
  const pool: QuizMyth[] = [];
  for (const bucket of STATIC_THEME_BUCKETS) {
    for (const m of bucket.myths) {
      if (!pickedIds.has(m.id)) pool.push(m);
    }
  }
  while (picked.length < 7 && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }

  // 3) final shuffle so the "balanced" pick doesn't always start medizin →
  //    risiken → stimmung → gesellschaft → gefaehrlichkeit.
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }

  return picked;
}

/** All quiz slugs in display order. Schnellcheck sits last so editorial
 *  modules remain the primary entry points. */
export const QUIZ_SLUGS = [
  "quiz-medizinischer-nutzen",
  "quiz-risiken-koerper-psyche",
  "quiz-stimmung-wahrnehmung",
  "quiz-soziales-bevoelkerung",
  "quiz-gefaehrlichkeit",
  "quiz-schnellcheck",
] as const;
