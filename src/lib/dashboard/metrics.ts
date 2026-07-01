import type { MythGroupMetrics } from "./types";

/** Group ids included in the per-myth slice. Mirrors EXCLUDED_GROUP_IDS in
 *  data.ts: `general_population` is intentionally dropped because it mixes
 *  minors and adults and is not displayed on any user-facing chart. */
const VALID_GROUPS: ReadonlySet<string> = new Set([
  "adults",
  "minors",
  "consumers",
  "young_adults",
  "parents",
]);

/** Raw shape of a single metric row in `public/data/carm-data.json`.
 *  Looser than the `Metric` type in types.ts (group_id is a plain string here)
 *  because the JSON includes the excluded `general_population` group_id that
 *  this helper filters out. */
interface RawMetric {
  myth_id: number;
  group_id: string;
  awareness: number | null;
  significance: number | null;
  correctness: number | null;
  prevention_significance: number | null;
  population_relevance: number | null;
}

/** Build-time per-myth metric slice.
 *
 *  Used by the prerender frontmatter of `/fakten-karten/index.astro` and
 *  `/quiz/[slug].astro` to slice `carm-data.json` by `myth_id`, dropping
 *  the excluded `general_population` group, and forward a typed
 *  `MythGroupMetrics` per myth into a React island. */
export function buildGroupMetricsByMythId(
  rawMetrics: ReadonlyArray<RawMetric>,
): Record<number, MythGroupMetrics> {
  const result: Record<number, MythGroupMetrics> = {};
  for (const m of rawMetrics) {
    if (!VALID_GROUPS.has(m.group_id)) continue;
    if (!result[m.myth_id]) result[m.myth_id] = [];
    result[m.myth_id].push({
      group_id: m.group_id as MythGroupMetrics[number]["group_id"],
      awareness: m.awareness,
      significance: m.significance,
      correctness: m.correctness,
      prevention_significance: m.prevention_significance,
      population_relevance: m.population_relevance,
    });
  }
  return result;
}
