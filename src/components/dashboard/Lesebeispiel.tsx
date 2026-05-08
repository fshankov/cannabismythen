/**
 * Lesebeispiel — auto-rendered "reading example" sentence for a myth.
 *
 * Source: Harald Lahusen (ISD), email 2026-05-07. Stored at
 *   `_local/team/Lesebeispiel-Harald-2026-05-07.md`
 *
 * The component takes a single myth × audience metric row and renders a
 * 5-sentence German paragraph that walks the reader through the five
 * indicators (Kenntnis / Bedeutung / Beurteilung / Präventionsbedeutung /
 * Bevölkerungsrelevanz), classifying each value into a 7-band
 * Anteil/Niveau scale.
 *
 * Scope (locked 2026-05-07): Erwachsene only. The component renders nothing
 * if the audience is not "adults". Future iterations may extend to the
 * other four Zielgruppen — they would need their own ISD-reviewed copy
 * variants since the introductory sentence and the population-relevance
 * framing are audience-specific.
 *
 * **AI draft, awaiting ISD review.** The 7-band thresholds (10/25/40/60/75/90)
 * were inferred from Harald's worked m02 example; the band words were
 * lifted verbatim from his email. Self-test against m02 reproduces his
 * paragraph exactly, but ISD should sign off on the boundaries before
 * the copy is treated as final.
 */

import type { Metric, GroupId, Lang } from "../../lib/dashboard/types";

// ─── 7-band Anteil / Niveau scale ──────────────────────────────────────
//
// Boundaries (left-inclusive, right-exclusive; the final bucket includes
// 100). Inferred from Harald's worked m02 example for adults:
//   value 7  → 0–10  → "sehr niedriges Niveau"
//   value 18 → 10–25 → "niedriger Anteil"
//   value 32 → 25–40 → "niedriges mittleres Niveau"
//   value 53 → 40–60 → "mittleres Niveau"
//   value 64 → 60–75 → "hohes mittleres Niveau"
//
// Anteil is masculine ("ein … Anteil") and is only used for Kenntnis.
// Niveau is neuter ("ein … Niveau") and is used for the four point-based
// indicators. The two arrays below are kept aligned by index.

const BAND_THRESHOLDS = [10, 25, 40, 60, 75, 90] as const;

const ANTEIL_LABELS = [
  "sehr niedriger Anteil",
  "niedriger Anteil",
  "niedriger mittlerer Anteil",
  "mittlerer Anteil",
  "hoher mittlerer Anteil",
  "hoher Anteil",
  "sehr hoher Anteil",
] as const;

const NIVEAU_LABELS = [
  "sehr niedriges Niveau",
  "niedriges Niveau",
  "niedriges mittleres Niveau",
  "mittleres Niveau",
  "hohes mittleres Niveau",
  "hohes Niveau",
  "sehr hohes Niveau",
] as const;

/** Pick the correct band index (0–6) for a 0–100 value. */
function bandIndex(value: number): number {
  let i = 0;
  while (i < BAND_THRESHOLDS.length && value >= BAND_THRESHOLDS[i]) i++;
  return i;
}

function anteilLabel(value: number): string {
  return ANTEIL_LABELS[bandIndex(value)];
}

function niveauLabel(value: number): string {
  return NIVEAU_LABELS[bandIndex(value)];
}

// ─── Component ─────────────────────────────────────────────────────────

interface LesebeispielProps {
  metric: Metric;
  audience: GroupId;
  /** Currently only "de" is wired up; English copy waits on ISD. */
  lang?: Lang;
}

export default function Lesebeispiel({ metric, audience, lang = "de" }: LesebeispielProps) {
  // Locked scope: Erwachsene only (BugHerd/feedback-tracker decision #4,
  // 2026-05-07). Other audiences silently render nothing so the parent
  // page layout doesn't break when the user switches tabs.
  if (audience !== "adults") return null;
  if (lang !== "de") return null;

  const { awareness, significance, correctness, prevention_significance, population_relevance } =
    metric;

  // If any of the five indicators is missing for this audience, drop
  // the component rather than render a partial / misleading paragraph.
  const allPresent =
    awareness !== null &&
    significance !== null &&
    correctness !== null &&
    prevention_significance !== null &&
    population_relevance !== null;
  if (!allPresent) return null;

  // BugHerd #31 — round to int site-wide.
  const kenntnisPct = Math.round(awareness as number);
  const bedeutungPts = Math.round(significance as number);
  const beurteilungPts = Math.round(correctness as number);
  const praeventionPts = Math.round(prevention_significance as number);
  const bevoelkerungPts = Math.round(population_relevance as number);

  return (
    <aside className="lesebeispiel" aria-labelledby="lesebeispiel-heading">
      <h2 id="lesebeispiel-heading" className="lesebeispiel__heading">
        Lesebeispiel für die Gruppe der Erwachsenen
      </h2>
      <p className="lesebeispiel__body">
        In der Zielgruppe der Erwachsenen kennen{" "}
        <strong>{kenntnisPct}&nbsp;%</strong> diesen Mythos. Das ist ein{" "}
        <strong>{anteilLabel(awareness as number)}</strong>. Die Bedeutung dieses Mythos für
        die Erwachsenen, die diesen Mythos kennen{" "}
        <strong>{kenntnisPct}&nbsp;%</strong>, für ihren Umgang mit Cannabis hat ein{" "}
        <strong>{niveauLabel(significance as number)}</strong> von{" "}
        <strong>{bedeutungPts}&nbsp;Punkten</strong>. Die Beurteilung des Mythos in
        Übereinstimmung mit der wissenschaftlichen Klassifizierung erreicht bei diesen
        Erwachsenen ein <strong>{niveauLabel(correctness as number)}</strong> von{" "}
        <strong>{beurteilungPts}&nbsp;Punkten</strong>. Aus der individuellen Bedeutung und
        der Beurteilung der Richtigkeit resultiert ein{" "}
        <strong>{niveauLabel(prevention_significance as number)}</strong> für die
        Präventionsbedeutung (<strong>{praeventionPts}&nbsp;Punkte</strong>) für die
        Zielgruppe der Erwachsenen, die diesen Mythos kennen. Mit Blick auf die gesamte
        volljährige Bevölkerung (nicht nur diejenigen, die den Mythos schon kennen) ergibt
        sich ein <strong>{niveauLabel(population_relevance as number)}</strong> für die
        Präventionsbedeutung (Bevölkerungsrelevanz: <strong>{bevoelkerungPts}&nbsp;Punkte</strong>)
        für diesen Mythos.
      </p>
      <p className="lesebeispiel__review-flag" hidden>
        AI draft, awaiting ISD review (Harald Lahusen, 2026-05-07 template).
      </p>
    </aside>
  );
}

// ─── Test helpers (exported for ad-hoc verification) ───────────────────

/** Self-test reference values from Harald's m02 example.
 *  Used by the inline self-test in `_local/BugHerd/lesebeispiel-selftest.ts`
 *  (if/when one is wired up). Do NOT remove without updating that file. */
export const HARALD_M02_REFERENCE = {
  audience: "adults" as const,
  values: {
    awareness: 18,
    significance: 53,
    correctness: 64,
    prevention_significance: 32,
    population_relevance: 7,
  },
  expectedBands: {
    awareness: "niedriger Anteil",
    significance: "mittleres Niveau",
    correctness: "hohes mittleres Niveau",
    prevention_significance: "niedriges mittleres Niveau",
    population_relevance: "sehr niedriges Niveau",
  },
} as const;

export { anteilLabel, niveauLabel, bandIndex };
