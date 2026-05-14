import type {
  CarmData,
  CorrectnessClass,
  GroupId,
  Indicator,
  InformationSourcesData,
  Metric,
  Myth,
} from './types';

let cached: CarmData | null = null;
let cachedSources: InformationSourcesData | null = null;

/**
 * Load carm-data.json from public/data/. Cached after first call.
 */
export async function loadCarmData(): Promise<CarmData> {
  if (cached) return cached;
  const res = await fetch('/data/carm-data.json');
  if (!res.ok) throw new Error(`Failed to load carm-data.json: ${res.status}`);
  cached = (await res.json()) as CarmData;
  return cached;
}

/** Load information-sources.json from public/data/. */
export async function loadInformationSources(): Promise<InformationSourcesData> {
  if (cachedSources) return cachedSources;
  const res = await fetch('/data/information-sources.json');
  if (!res.ok) throw new Error(`Failed to load information-sources.json: ${res.status}`);
  cachedSources = (await res.json()) as InformationSourcesData;
  return cachedSources;
}

/** Look up the metric row for one myth × one group. May return null if missing. */
export function getMetric(
  data: CarmData,
  mythId: number,
  groupId: GroupId,
): Metric | null {
  return data.metrics.find((m) => m.myth_id === mythId && m.group_id === groupId) ?? null;
}

/** Read a single indicator value for one myth × one group. */
export function getIndicatorValue(
  data: CarmData,
  mythId: number,
  groupId: GroupId,
  indicator: Indicator,
): number | null {
  const metric = getMetric(data, mythId, groupId);
  if (!metric) return null;
  return metric[indicator];
}

/** Sort myths by category_id then id (stable thematic order). */
export function sortedMyths(data: CarmData): Myth[] {
  return [...data.myths].sort((a, b) => {
    const ca = a.category_id ?? 999;
    const cb = b.category_id ?? 999;
    if (ca !== cb) return ca - cb;
    return a.id - b.id;
  });
}

/** Active dashboard groups in display order. */
export const ACTIVE_GROUPS: GroupId[] = [
  'adults',
  'minors',
  'consumers',
  'young_adults',
  'parents',
];

export const GROUP_LABEL_DE: Record<GroupId, string> = {
  adults: 'Volljährige',
  minors: 'Minderjährige',
  consumers: 'Konsumierende',
  young_adults: 'junge Erwachsene',
  parents: 'Eltern',
};

export const INDICATOR_LABEL_DE: Record<Indicator, string> = {
  awareness: 'Kenntnis',
  significance: 'Bedeutung',
  correctness: 'Richtigkeit',
  prevention_significance: 'Präventionsbedeutung',
  population_relevance: 'Bevölkerungsrisiko',
};

/* ──────────────────────────────────────────────────────────────────
 * Iter-11: shared verdict + theme helpers.
 *
 * Both VizMythGrid (right viz column, classified + themed modes) and
 * ScrollytellingViewer (left text column, in-body legends rendered
 * when step.gridMode is set) consume the same category list, colour
 * tokens, and verdict counts. Hoisting these here keeps one source
 * of truth for the Step 3 + Step 4 visuals.
 * ────────────────────────────────────────────────────────────────── */

/** Per-verdict CSS-var lookup. Hex tokens live in global.css; this
 *  map just hands them out for inline-style backgrounds (e.g. the
 *  classified grid cell + the in-body verdict puck). */
export const VERDICT_COLOR: Record<CorrectnessClass, string> = {
  richtig: 'var(--classification-richtig)',
  eher_richtig: 'var(--classification-eher-richtig)',
  eher_falsch: 'var(--classification-eher-falsch)',
  falsch: 'var(--classification-falsch)',
  no_classification: 'var(--classification-keine-aussage)',
};

/** Step 4 / in-body legend uses the canonical verdict names (richtig,
 *  eher richtig, …) — not the "stimmt / stimmt nicht" pill-phrasing
 *  used in dashboard filters. Per Fedor's Iter-11 clarification. */
export const VERDICT_LABEL_DE: Record<CorrectnessClass, string> = {
  richtig: 'richtig',
  eher_richtig: 'eher richtig',
  eher_falsch: 'eher falsch',
  falsch: 'falsch',
  no_classification: 'keine Aussage',
};

/** Display order — falsch → richtig (matches the daten-explorer
 *  filter row site-wide). `no_classification` lands last. */
export const VERDICT_ORDER: CorrectnessClass[] = [
  'falsch',
  'eher_falsch',
  'eher_richtig',
  'richtig',
  'no_classification',
];

/** Override for the verdict glyph when it renders ON a verdict-colored
 *  background (classified grid cell, verdict puck). White stroke on
 *  top of the background colour. */
export const ON_VERDICT_BG_GLYPH = {
  main: '#ffffff',
  shadow: 'rgba(255, 255, 255, 0.55)',
} as const;

/** Dark themed-cell background per category. The integer category_id
 *  is mapped onto a 9-step palette of muted darks (themes 1-9). */
export function themeColorFor(catId: number | null): string {
  if (catId === null) return 'var(--bg-elev)';
  const idx = ((catId - 1) % 9) + 1;
  return `var(--theme-${idx})`;
}

/** Ordered, deduplicated list of categories that appear in the first
 *  42 myths (sorted-by-category-then-id). Same logic the grid uses to
 *  render the cells, so the legend matches what's on screen. */
export function orderedCategoriesFromData(
  data: CarmData,
): { id: number; name: string }[] {
  const myths = sortedMyths(data).slice(0, 42);
  const seen = new Set<number>();
  const out: { id: number; name: string }[] = [];
  for (const m of myths) {
    if (m.category_id !== null && !seen.has(m.category_id)) {
      seen.add(m.category_id);
      const cat = data.categories.find((c) => c.id === m.category_id);
      out.push({
        id: m.category_id,
        name: cat?.name_de ?? `Kategorie ${m.category_id}`,
      });
    }
  }
  return out;
}

/** Verdict-count tally across the first 42 myths. Used by the in-body
 *  classified legend (Step 4). */
export function verdictCountsFromData(
  data: CarmData,
): Record<CorrectnessClass, number> {
  const counts: Record<CorrectnessClass, number> = {
    richtig: 0,
    eher_richtig: 0,
    eher_falsch: 0,
    falsch: 0,
    no_classification: 0,
  };
  for (const m of sortedMyths(data).slice(0, 42)) {
    counts[m.correctness_class]++;
  }
  return counts;
}
