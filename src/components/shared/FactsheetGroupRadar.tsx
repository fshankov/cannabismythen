/**
 * FactsheetGroupRadar — popup radar chart (Tab 1 of the viz strip).
 *
 * Five indicator axes (Kenntnis / Bedeutung / Richtigkeit / Prävention /
 * Bev. Relevanz), five population-group lines overlaid (Erwachsene,
 * Minderjährige, Konsumierende, Junge Erwachsene, Eltern). Each line
 * has a stable per-group colour drawn from the `--audience-*` tokens in
 * `src/styles/global.css`.
 *
 * Hover / interaction:
 *   - Hovering a legend chip (above the chart) highlights that group's
 *     polygon and dims the others (ECharts `highlight` / `downplay`
 *     actions on the series).
 *   - Hovering the chart itself triggers a tooltip showing only the
 *     hovered vertex's value (single group + indicator), so the user
 *     can read off a number without crowding the legend.
 *   - Clicking a chip toggles that series' visibility.
 *
 * N/A handling (per Fedor 2026-05-25): `population_relevance` is only
 * sampled for adults + minors. For consumers / young_adults / parents
 * we push `null` at that vertex with `connectNulls: false`, so the
 * line visibly opens at the Bev. Relevanz edge instead of pulling to
 * zero. Tooltip shows "k. A." for those points.
 *
 * Renders SVG (`opts.renderer: 'svg'`) to match the rest of the
 * dashboard's chart conventions (LollipopView / ScatterView).
 */

import { useMemo, useRef, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsInstance } from 'echarts-for-react';
import type {
  CorrectnessClass,
  GroupId,
  Indicator,
  MythGroupMetrics,
} from '../../lib/dashboard/types';
import { POP_REL_INVALID_GROUPS } from '../../lib/dashboard/data';
import { AUDIENCE_ICONS_BY_GROUP } from '../../lib/icons/lookups';

interface Props {
  /** Pre-computed per-group metrics for the open myth. Same shape as
   *  the other two tabs of the viz strip — built at build-time. */
  metrics: MythGroupMetrics;

  /** Verdict for the open myth. Reserved for future use (e.g. tinting
   *  the radar grid) — currently the line palette is driven by the
   *  audience tokens, not the verdict, so this prop is unused. Kept
   *  in the signature for parity with `<FactsheetGroupBars>`. */
  verdict?: CorrectnessClass;
}

const INDICATORS: Indicator[] = [
  'awareness',
  'significance',
  'correctness',
  'prevention_significance',
  'population_relevance',
];

const INDICATOR_AXIS_LABELS: Record<Indicator, string> = {
  awareness: 'Kenntnis',
  significance: 'Bedeutung',
  correctness: 'Richtigkeit',
  prevention_significance: 'Prävention',
  population_relevance: 'Bev. Relevanz',
};

const GROUP_ORDER: GroupId[] = [
  'adults',
  'minors',
  'consumers',
  'young_adults',
  'parents',
];

const GROUP_FULL_LABELS: Record<GroupId, string> = {
  adults: 'Erwachsene (18–70)',
  minors: 'Minderjährige (16–17)',
  consumers: 'Konsumierende',
  young_adults: 'Junge Erwachsene (18–26)',
  parents: 'Eltern',
};

const GROUP_SHORT_LABELS: Record<GroupId, string> = {
  adults: 'Erw.',
  minors: 'Min.',
  consumers: 'Kons.',
  young_adults: 'Junge E.',
  parents: 'Eltern',
};

/** Per-group line colour. Mirrors the `--audience-*` CSS tokens added
 *  in `src/styles/global.css` (see the AUDIENCE_COLOR_VAR_BY_GROUP map
 *  in `src/lib/icons/lookups.ts`). Hardcoded here because ECharts
 *  serialises colours into its option tree before rendering — it does
 *  not resolve `var(--…)` from the SVG output. Keep this map in sync
 *  with the CSS tokens. */
const GROUP_LINE_COLOR: Record<GroupId, string> = {
  adults: '#0f172a',        // --audience-volljaehrige (slate-900)
  minors: '#d97706',        // --audience-minderjaehrige (amber-600)
  consumers: '#16a34a',     // --audience-konsumierende (green-600)
  young_adults: '#0d9488',  // --audience-junge-erwachsene (teal-600)
  parents: '#4f46e5',       // --audience-eltern (indigo-600)
};

export default function FactsheetGroupRadar({ metrics }: Props) {
  const chartRef = useRef<EChartsInstance | null>(null);

  // Quick lookup so we render series in canonical GROUP_ORDER even if
  // the metrics array arrived in a different order.
  const byGroup = useMemo(() => {
    const m = new Map<GroupId, MythGroupMetrics[number]>();
    for (const entry of metrics) m.set(entry.group_id, entry);
    return m;
  }, [metrics]);

  const option = useMemo(() => {
    const indicatorAxes = INDICATORS.map((ind) => ({
      name: INDICATOR_AXIS_LABELS[ind],
      max: 100,
    }));

    const series = GROUP_ORDER.map((g) => {
      const entry = byGroup.get(g);
      const color = GROUP_LINE_COLOR[g];
      const data = INDICATORS.map((ind) => {
        const raw = entry ? (entry[ind] as number | null) : null;
        // Force null for invalid pop_relevance combos so stray data
        // values don't render — matches POP_REL_INVALID_GROUPS in
        // src/lib/dashboard/data.ts. With `connectNulls: false` the
        // line visibly opens at this vertex.
        const value =
          ind === 'population_relevance' && POP_REL_INVALID_GROUPS.has(g)
            ? null
            : raw;
        return value;
      });
      return {
        name: GROUP_FULL_LABELS[g],
        type: 'radar' as const,
        symbol: 'circle' as const,
        symbolSize: 5,
        // Lines only — no fill. The user explicitly asked for the
        // Recharts "lines-only" radar look (their reference snippet
        // set `fillOpacity={0}`).
        areaStyle: undefined,
        connectNulls: false,
        lineStyle: { color, width: 2 },
        itemStyle: { color },
        emphasis: { focus: 'series' as const, lineStyle: { width: 3 } },
        data: [
          {
            value: data,
            name: GROUP_FULL_LABELS[g],
          },
        ],
      };
    });

    return {
      tooltip: {
        trigger: 'item' as const,
        triggerOn: 'mousemove|click' as const,
        // Custom formatter so N/A vertices read "k. A." rather than
        // ECharts' default "-" placeholder.
        formatter: (params: {
          name: string;
          value: Array<number | null>;
        }) => {
          const rows = INDICATORS.map((ind, i) => {
            const v = params.value[i];
            const label = INDICATOR_AXIS_LABELS[ind];
            const display = v === null ? 'k. A.' : `${Math.round(v)}`;
            return `<div style="display:flex;justify-content:space-between;gap:12px;"><span>${label}</span><strong>${display}</strong></div>`;
          }).join('');
          return `<div style="min-width:160px;"><div style="font-weight:600;margin-bottom:4px;">${params.name}</div>${rows}</div>`;
        },
      },
      radar: {
        indicator: indicatorAxes,
        radius: '62%',
        center: ['50%', '54%'],
        splitNumber: 4,
        axisName: {
          fontSize: 11,
          color: 'var(--color-text, #1f2937)',
        },
        splitLine: { lineStyle: { color: '#e5e7eb' } },
        splitArea: { areaStyle: { color: ['transparent'] } },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
      },
      series,
    };
  }, [byGroup]);

  const onChartReady = useCallback((instance: EChartsInstance) => {
    chartRef.current = instance;
  }, []);

  // Imperative highlight/downplay so the legend chip's hover state
  // drives the chart's emphasis state (mirrors ECharts' own legend
  // hover behaviour). Using string `dispatchAction` payload because
  // echarts-for-react re-exports ECharts' typed instance.
  const highlight = useCallback((seriesIndex: number) => {
    chartRef.current?.dispatchAction({
      type: 'highlight',
      seriesIndex,
    });
  }, []);

  const downplay = useCallback((seriesIndex: number) => {
    chartRef.current?.dispatchAction({
      type: 'downplay',
      seriesIndex,
    });
  }, []);

  const toggleSeries = useCallback((groupLabel: string) => {
    chartRef.current?.dispatchAction({
      type: 'legendToggleSelect',
      name: groupLabel,
    });
  }, []);

  return (
    <section
      className="factsheet-group-radar"
      aria-label="Indikator-Radar nach Bevölkerungsgruppen"
    >
      <ul className="factsheet-group-radar__legend" role="list">
        {GROUP_ORDER.map((g, idx) => {
          const Icon = AUDIENCE_ICONS_BY_GROUP[g];
          const color = GROUP_LINE_COLOR[g];
          return (
            <li
              key={g}
              className="factsheet-group-radar__legend-chip"
              style={{ color }}
              onMouseEnter={() => highlight(idx)}
              onMouseLeave={() => downplay(idx)}
              onFocus={() => highlight(idx)}
              onBlur={() => downplay(idx)}
            >
              <button
                type="button"
                className="factsheet-group-radar__legend-button"
                onClick={() => toggleSeries(GROUP_FULL_LABELS[g])}
                aria-label={`${GROUP_FULL_LABELS[g]} ein-/ausblenden`}
                title={GROUP_FULL_LABELS[g]}
              >
                <span
                  className="factsheet-group-radar__legend-icon"
                  aria-hidden="true"
                  style={{ color }}
                >
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                <span className="factsheet-group-radar__legend-label">
                  {GROUP_SHORT_LABELS[g]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="factsheet-group-radar__chart">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
          notMerge={true}
          lazyUpdate={false}
          onChartReady={onChartReady}
        />
      </div>
    </section>
  );
}
