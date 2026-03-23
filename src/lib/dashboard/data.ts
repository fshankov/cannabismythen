import type { CarmData, Myth, Metric, Indicator, GroupId, Lang, VerdictFilter } from './types';

let cachedData: CarmData | null = null;

export async function loadData(): Promise<CarmData> {
  if (cachedData) return cachedData;
  const res = await fetch('/data/carm-data.json');
  cachedData = await res.json();
  return cachedData!;
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
): Myth[] {
  let filtered = myths;

  if (categoryIds.length > 0) {
    filtered = filtered.filter((m) => m.category_id !== null && categoryIds.includes(m.category_id));
  }

  if (verdictFilter !== 'all') {
    filtered = filtered.filter((m) => m.correctness_class === verdictFilter);
  }

  return filtered;
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
  const verdict = lang === 'de'
    ? ({ richtig: 'Fakt', eher_richtig: 'Eher Fakt', eher_falsch: 'Eher Mythos', falsch: 'Mythos', no_classification: 'Keine Aussage möglich' }[myth.correctness_class])
    : ({ richtig: 'Fact', eher_richtig: 'Tends to be Fact', eher_falsch: 'Tends to be Myth', falsch: 'Myth', no_classification: 'No classification' }[myth.correctness_class]);
  const indLabel = lang === 'de'
    ? ({ awareness: 'Kenntnis', significance: 'Bedeutung', correctness: 'Richtigkeit', prevention_significance: 'Prävention' }[indicator])
    : ({ awareness: 'Awareness', significance: 'Significance', correctness: 'Correctness', prevention_significance: 'Prevention' }[indicator]);
  const val = formatValue(value, indicator);

  let html = `<div style="max-width:360px;line-height:1.5">`;
  html += `<strong style="font-size:13px">${text}</strong><br/>`;
  html += `<span style="color:#64748b;font-size:11px">${category}</span><br/>`;
  if (groupName) {
    html += `${lang === 'de' ? 'Gruppe' : 'Group'}: ${groupName}<br/>`;
  }
  html += `${indLabel}: <strong>${val}</strong><br/>`;
  html += `${lang === 'de' ? 'Urteil' : 'Verdict'}: ${verdict}`;
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
    ].join(',');
  });

  return [header.join(','), ...rows].join('\n');
}
