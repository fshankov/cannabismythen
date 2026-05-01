import type { CarmData, Myth, Metric, Indicator, GroupId, Lang, VerdictFilter } from './types';

let cachedData: CarmData | null = null;

/** Group ids that exist in carm-data.json but are intentionally excluded from
 *  the dashboard. `general_population` mixes minors and adults and produces
 *  scores that don't match the published per-group analysis. */
const EXCLUDED_GROUP_IDS = new Set(['general_population']);

export async function loadData(): Promise<CarmData> {
  if (cachedData) return cachedData;
  const res = await fetch('/data/carm-data.json');
  const raw = (await res.json()) as CarmData & {
    metrics: Array<Metric & { group_id: string }>;
    groups: Array<{ id: string }>;
  };
  cachedData = {
    ...raw,
    metrics: raw.metrics.filter((m) => !EXCLUDED_GROUP_IDS.has(m.group_id)) as Metric[],
    groups: raw.groups.filter((g) => !EXCLUDED_GROUP_IDS.has(g.id)) as CarmData['groups'],
  };
  return cachedData;
}

export function getMythMetric(
  metrics: Metric[],
  mythId: number,
  groupId: GroupId
): Metric | undefined {
  return metrics.find((m) => m.myth_id === mythId && m.group_id === groupId);
}

export function getIndicatorValue(metric: Metric | undefined, indicator: Indicator): number | null {
  if (!metric) return null;
  return metric[indicator];
}

export function getMythText(myth: Myth, lang: Lang): string {
  return lang === 'en' ? myth.text_en : myth.text_de;
}

export function getMythShortText(myth: Myth, lang: Lang): string {
  return lang === 'en' ? myth.text_short_en : myth.text_short_de;
}

export function getCategoryName(myth: Myth, lang: Lang): string {
  return lang === 'en' ? myth.category_en : myth.category_de;
}

export function formatValue(value: number | null, indicator: Indicator): string {
  if (value === null || value === undefined) return 'n/a';
  if (indicator === 'awareness') {
    return `${value.toFixed(1)}%`;
  }
  return value.toFixed(1);
}

export function getIndicatorUnit(indicator: Indicator): string {
  if (indicator === 'awareness') return '%';
  return 'pts';
}

export function getIndicatorRange(indicator: Indicator): [number, number] {
  if (indicator === 'awareness') return [0, 100];
  return [0, 100];
}

export function filterMyths(
  myths: Myth[],
  categoryIds: number[],
  verdictFilter: VerdictFilter,
  mythIds: number[] = [],
): Myth[] {
  let filtered = myths;

  // Unified Filter drawer: a myth is included if its category_id is in the
  // selected categories OR its id is in the explicitly-selected myth list.
  // When BOTH lists are empty the filter is a no-op (show all myths).
  if (categoryIds.length > 0 || mythIds.length > 0) {
    filtered = filtered.filter(
      (m) =>
        (m.category_id !== null && categoryIds.includes(m.category_id)) ||
        mythIds.includes(m.id),
    );
  }

  if (verdictFilter !== 'all') {
    filtered = filtered.filter((m) => m.correctness_class === verdictFilter);
  }

  return filtered;
}

/** Population_relevance was only collected for these two groups; values for
 *  the other three are null in carm-data.json. */
const POP_REL_VALID_GROUPS: GroupId[] = ['adults', 'minors'];

/** Group ids that should be greyed-out in the IndicatorGroupSelector for the
 *  given indicator. Currently only `population_relevance` has a restriction. */
export function getDisabledGroupsForIndicator(indicator: Indicator): GroupId[] {
  if (indicator === 'population_relevance') {
    return ['consumers', 'young_adults', 'parents'];
  }
  return [];
}

/** Auto-correct an invalid (indicator, groupIds) combination. Returns the
 *  same array reference when no correction is needed so callers can compare
 *  identity to detect a change. */
export function correctGroupsForIndicator(
  indicator: Indicator,
  groupIds: GroupId[],
): GroupId[] {
  if (indicator !== 'population_relevance' || groupIds.length === 0) return groupIds;
  const valid = groupIds.filter((g) => POP_REL_VALID_GROUPS.includes(g));
  if (valid.length === groupIds.length) return groupIds;
  if (valid.length === 0) return ['adults'];
  return valid;
}

/** Get the first available group's metric for a myth (for multi-group) */
export function getFirstAvailableMetric(
  metrics: Metric[],
  mythId: number,
  groupIds: GroupId[]
): Metric | undefined {
  for (const gid of groupIds) {
    const m = getMythMetric(metrics, mythId, gid);
    if (m) return m;
  }
  return undefined;
}

export function buildTooltipHtml(opts: {
  myth: Myth;
  lang: Lang;
  groupName?: string;
  indicator: Indicator;
  value: number | null;
  extraLines?: string[];
}): string {
  const { myth, lang, groupName, indicator, value, extraLines } = opts;
  const text = getMythText(myth, lang);
  const category = getCategoryName(myth, lang);
  // Canonical verdict labels (matches verdict.* in translations.ts and
  // classification.* in quiz i18n). Don't reintroduce "Fakt" / "Mythos".
  const verdict = lang === 'de'
    ? ({ richtig: 'Richtig', eher_richtig: 'Eher richtig', eher_falsch: 'Eher falsch', falsch: 'Falsch', no_classification: 'Keine Aussage möglich' }[myth.correctness_class])
    : ({ richtig: 'Correct', eher_richtig: 'Tends to be correct', eher_falsch: 'Tends to be incorrect', falsch: 'Incorrect', no_classification: 'No classification' }[myth.correctness_class]);
  // Verdict explanation paragraph — re-homes the copy that used to
  // live in the deleted right-hand `VerdictLegend` sidebar so the
  // chart tooltip can carry the same definition that the inline
  // VerdictArrowWithInfo popover surfaces on every other tab.
  const verdictInfo: Partial<Record<typeof myth.correctness_class, { de: string; en: string }>> = {
    richtig: {
      de: 'Der Mythos entspricht dem aktuellen wissenschaftlichen Kenntnisstand.',
      en: 'The myth aligns with the current scientific evidence.',
    },
    eher_richtig: {
      de: 'Der Mythos ist tendenziell zutreffend, aber mit Einschränkungen.',
      en: 'The myth tends to be correct, with caveats.',
    },
    eher_falsch: {
      de: 'Der Mythos ist tendenziell nicht zutreffend, enthält aber Teilwahrheiten.',
      en: 'The myth tends to be incorrect, with partial truths.',
    },
    falsch: {
      de: 'Der Mythos widerspricht dem wissenschaftlichen Kenntnisstand.',
      en: 'The myth contradicts the current scientific evidence.',
    },
  };
  const verdictCopy = verdictInfo[myth.correctness_class]?.[lang];
  const indLabel = lang === 'de'
    ? ({ awareness: 'Kenntnis', significance: 'Bedeutung', correctness: 'Richtigkeit', prevention_significance: 'Prävention', population_relevance: 'Bev. Relevanz' }[indicator])
    : ({ awareness: 'Awareness', significance: 'Significance', correctness: 'Correctness', prevention_significance: 'Prevention', population_relevance: 'Pop. Relevance' }[indicator]);
  const val = formatValue(value, indicator);

  let html = `<div style="max-width:360px;line-height:1.5">`;
  html += `<strong style="font-size:13px">${text}</strong><br/>`;
  html += `<span style="color:#64748b;font-size:11px">${category}</span><br/>`;
  if (groupName) {
    html += `${lang === 'de' ? 'Gruppe' : 'Group'}: ${groupName}<br/>`;
  }
  html += `${indLabel}: <strong>${val}</strong><br/>`;
  html += `${lang === 'de' ? 'Urteil' : 'Verdict'}: ${verdict}`;
  if (verdictCopy) {
    html += `<br/><span style="color:#475569;font-size:11px;font-style:italic">${verdictCopy}</span>`;
  }
  if (extraLines) {
    for (const line of extraLines) {
      html += `<br/>${line}`;
    }
  }
  html += `</div>`;
  return html;
}

export function exportCSV(
  myths: Myth[],
  metrics: Metric[],
  groupIds: GroupId[],
  lang: Lang
): string {
  const groupId = groupIds[0] || 'adults';
  const header = [
    'ID',
    lang === 'de' ? 'Mythos' : 'Myth',
    lang === 'de' ? 'Kategorie' : 'Category',
    lang === 'de' ? 'Evidenz' : 'Science Verdict',
    lang === 'de' ? 'Kenntnis (%)' : 'Awareness (%)',
    lang === 'de' ? 'Bedeutung' : 'Significance',
    lang === 'de' ? 'Richtigkeit' : 'Correctness',
    lang === 'de' ? 'Präventionsbedeutung' : 'Prevention Significance',
    lang === 'de' ? 'Bevölkerungsrelevanz' : 'Population Relevance',
  ];

  const rows = myths.map((m) => {
    const metric = getMythMetric(metrics, m.id, groupId);
    return [
      m.id,
      `"${getMythText(m, lang).replace(/"/g, '""')}"`,
      `"${getCategoryName(m, lang).replace(/"/g, '""')}"`,
      `"${(lang === 'de' ? m.classification_de : '') || 'n/a'}"`,
      metric?.awareness ?? '',
      metric?.significance ?? '',
      metric?.correctness ?? '',
      metric?.prevention_significance ?? '',
      metric?.population_relevance ?? '',
    ].join(',');
  });

  return [header.join(','), ...rows].join('\n');
}
