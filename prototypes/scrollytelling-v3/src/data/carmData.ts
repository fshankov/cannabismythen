import type {
  CarmData,
  GroupId,
  Indicator,
  InformationSourcesData,
  Metric,
  Myth,
} from './types';

let cached: CarmData | null = null;
let cachedSources: InformationSourcesData | null = null;

/**
 * Load carm-data.json from the prototype's public/ folder.
 * Cached after first call.
 */
export async function loadCarmData(): Promise<CarmData> {
  if (cached) return cached;
  const res = await fetch('/carm-data.json');
  if (!res.ok) throw new Error(`Failed to load carm-data.json: ${res.status}`);
  cached = (await res.json()) as CarmData;
  return cached;
}

/** Load info-sources.json (mirrors src/lib/dashboard's information-sources). */
export async function loadInformationSources(): Promise<InformationSourcesData> {
  if (cachedSources) return cachedSources;
  const res = await fetch('/info-sources.json');
  if (!res.ok) throw new Error(`Failed to load info-sources.json: ${res.status}`);
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
