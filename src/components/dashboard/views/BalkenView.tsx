import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { ECharts } from 'echarts';
import { ArrowDownAZ, ArrowDownZA, Layers as LayersIcon } from 'lucide-react';
import type { Myth, Metric, AppState, BalkenSort } from '../../../lib/dashboard/types';
import {
  buildTooltipHtml,
  formatValue,
  getCategoryName,
  getIndicatorValue,
  getMythMetric,
  getMythShortText,
} from '../../../lib/dashboard/data';
import { getCorrectnessColor } from '../../../lib/dashboard/colors';
import { t } from '../../../lib/dashboard/translations';

interface Props {
  myths: Myth[];
  metrics: Metric[];
  state: AppState;
  onSelectMyth: (id: number) => void;
  /** Stage 4 — three sort chips above the chart need to mutate
   *  `state.balkenSort` so the FilterDrawer's radio group stays
   *  synced with the inline chips. */
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  /** Stage 4 — empty-state CTA resets categoryIds + verdictFilter +
   *  search + balkenSort so the user can recover from an "over-filtered
   *  to nothing" state in one click. */
  onResetFilters?: () => void;
}

export interface BalkenViewHandle {
  /** Returns the underlying ECharts instance for export. */
  getEchartsInstance: () => ECharts | null;
}

interface Datum {
  myth: Myth;
  value: number;
  category: string;
}

const GROUP_LABELS: Record<string, string> = {
  adults: 'Volljährige (18–70)',
  minors: 'Minderjährige (16–17)',
  consumers: 'Konsumierende',
  young_adults: 'Junge Erwachsene (18–26)',
  parents: 'Eltern',
};

function sortData(data: Datum[], sort: BalkenSort): Datum[] {
  const copy = data.slice();
  if (sort === 'value-desc') return copy.sort((a, b) => b.value - a.value);
  if (sort === 'value-asc') return copy.sort((a, b) => a.value - b.value);
  // 'category': group by category, sort by value desc within
  return copy.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category, 'de');
    return b.value - a.value;
  });
}

const SORT_CHIPS: { value: BalkenSort; label: string; icon: 'asc' | 'desc' | 'cat' }[] = [
  { value: 'value-desc', label: '↓ nach Wert', icon: 'desc' },
  { value: 'value-asc', label: '↑ nach Wert', icon: 'asc' },
  { value: 'category', label: 'Nach Kategorie', icon: 'cat' },
];

const BalkenView = forwardRef<BalkenViewHandle, Props>(function BalkenView(
  { myths, metrics, state, onSelectMyth, update, onResetFilters },
  ref,
) {
  const chartRef = useRef<ReactECharts>(null);

  useImperativeHandle(ref, () => ({
    getEchartsInstance: () => chartRef.current?.getEchartsInstance() ?? null,
  }));

  const wrapperRef = useRef<HTMLDivElement>(null);

  /**
   * Stage 4 — chart height adapts to the available viewport instead of
   * the hard `data.length * 22 + 80` curve. We measure the chart
   * wrapper's top offset on mount + resize, subtract a 80px footer
   * margin, and clamp 420–1200. Falls back to the bar-driven curve
   * when the wrapper hasn't measured yet (initial render before the
   * effect runs).
   */
  const [viewportH, setViewportH] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800,
  );
  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const groupId = state.groupIds[0] ?? 'adults';
  const groupName = GROUP_LABELS[groupId] ?? groupId;

  const data = useMemo<Datum[]>(() => {
    const out: Datum[] = [];
    for (const myth of myths) {
      const metric = getMythMetric(metrics, myth.id, groupId);
      const value = getIndicatorValue(metric, state.indicator);
      if (value === null) continue;
      out.push({ myth, value, category: getCategoryName(myth, 'de') });
    }
    return sortData(out, state.balkenSort);
  }, [myths, metrics, groupId, state.indicator, state.balkenSort]);

  const option = useMemo(() => {
    // ECharts horizontal bars render bottom-up on the y-axis. Reverse so the
    // highest-ranked myth appears at the TOP of the chart.
    const ordered = [...data].reverse();

    const max = state.indicator === 'awareness' ? 100 : 100;
    // Smart label position: render the value INSIDE the bar when there's
    // room (≥25% of axis), otherwise just past the bar end.
    const insideThreshold = max * 0.25;

    const yLabels = ordered.map((d) => {
      const txt = getMythShortText(d.myth, 'de');
      return txt.length > 64 ? txt.slice(0, 62) + '…' : txt;
    });

    return {
      animation: false,
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        formatter: (params: { dataIndex?: number }[] | { dataIndex?: number }) => {
          const arr = Array.isArray(params) ? params : [params];
          const idx = arr[0]?.dataIndex;
          if (idx === undefined) return '';
          const d = ordered[idx];
          if (!d) return '';
          return buildTooltipHtml({
            myth: d.myth,
            lang: 'de',
            groupName,
            indicator: state.indicator,
            value: d.value,
          });
        },
      },
      grid: {
        left: 240,
        right: 64,
        top: 16,
        bottom: 40,
      },
      xAxis: {
        type: 'value' as const,
        max,
        name: t(`indicator.${state.indicator}` as never, 'de'),
        nameLocation: 'middle' as const,
        nameGap: 28,
        splitLine: {
          show: true,
          lineStyle: { type: 'dashed' as const, color: '#e5e7eb' },
        },
        z: 0,
      },
      yAxis: {
        type: 'category' as const,
        data: yLabels,
        axisLabel: {
          width: 220,
          overflow: 'truncate' as const,
          fontSize: 12,
          color: '#1e293b',
          // Stage 4 — widen the click target so tapping the y-axis
          // myth label opens the factsheet, not just the bar itself.
          triggerEvent: true,
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      series: [
        {
          type: 'bar' as const,
          barMaxWidth: 22,
          itemStyle: {
            borderRadius: [0, 3, 3, 0] as [number, number, number, number],
          },
          label: {
            show: true,
            formatter: (p: { value: number; dataIndex: number }) => {
              return formatValue(p.value, state.indicator);
            },
            // Per-datum position: insideRight when bar is wide, otherwise right.
            position: ((p: { value: number }) =>
              p.value >= insideThreshold ? 'insideRight' : 'right') as unknown as 'insideRight',
            color: '#1e293b',
            fontSize: 11,
            fontWeight: 600,
          },
          data: ordered.map((d) => {
            // Stage 4 — fix bar-label contrast on the lime-700
            // (`eher_richtig`) bars. White text on #4d7c0f fails
            // WCAG AA at body sizes (~3.7:1). Force the dark text
            // token for that one verdict so the inside-right label
            // stays legible.
            const insideRight = d.value >= insideThreshold;
            const isLime = d.myth.correctness_class === 'eher_richtig';
            const labelColor = insideRight
              ? isLime
                ? '#1a1a2e'
                : '#ffffff'
              : '#1e293b';
            return {
              value: d.value,
              itemStyle: {
                color: getCorrectnessColor(d.myth.correctness_class),
                borderRadius: [0, 3, 3, 0] as [number, number, number, number],
              },
              label: { color: labelColor },
            };
          }),
        },
      ],
    };
  }, [data, state.indicator, groupName]);

  // Sort chips above the chart (Stage 4 — synced with state.balkenSort
  // so the FilterDrawer's radio group and the inline chips stay in
  // lockstep).
  const renderSortChips = () => (
    <div
      className="carm-balken-sort"
      role="group"
      aria-label={t('sort.label', 'de')}
    >
      {SORT_CHIPS.map((chip) => {
        const active = state.balkenSort === chip.value;
        const Icon =
          chip.icon === 'desc'
            ? ArrowDownZA
            : chip.icon === 'asc'
              ? ArrowDownAZ
              : LayersIcon;
        return (
          <button
            key={chip.value}
            type="button"
            className={`carm-balken-sort__chip ${active ? 'is-active' : ''}`}
            aria-pressed={active}
            onClick={() => update('balkenSort', chip.value)}
          >
            <Icon size={14} strokeWidth={2} aria-hidden="true" />
            {chip.label}
          </button>
        );
      })}
    </div>
  );

  if (data.length === 0) {
    return (
      <div className="carm-balken-view" ref={wrapperRef}>
        {renderSortChips()}
        <div className="carm-balken-empty" role="status">
          <p className="carm-balken-empty__title">
            {t('filter.empty.title', 'de')}
          </p>
          <p className="carm-balken-empty__body">
            {t('filter.empty.body', 'de')}
          </p>
          {onResetFilters && (
            <button
              type="button"
              className="carm-btn carm-btn--primary carm-balken-empty__cta"
              onClick={onResetFilters}
            >
              {t('filter.empty.cta', 'de')}
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleClick = (params: { dataIndex?: number; componentType?: string; value?: string }) => {
    // Click can come from the bar (`series`) OR — Stage 4 — from the
    // y-axis label (`yAxis`). Both produce the same `dataIndex` when
    // the y-axis triggers the event, so the lookup is identical.
    if (params.dataIndex === undefined) return;
    const ordered = [...data].reverse();
    const datum = ordered[params.dataIndex];
    if (datum) onSelectMyth(datum.myth.id);
  };

  /**
   * Height — Stage 4. Prefers the available viewport: the chart
   * wrapper's top offset (measured during render) is subtracted from
   * `window.innerHeight`, leaving room for an 80px footer. Clamp
   * 420–1200 to keep extreme small / tall windows sane. Falls back
   * to the legacy `data.length * 22 + 80` curve when measurement
   * isn't available yet.
   */
  const top = wrapperRef.current?.getBoundingClientRect().top ?? 200;
  const measured = Math.floor(viewportH - top - 80);
  const fallback = data.length * 22 + 80;
  const height = Math.min(1200, Math.max(420, measured > 0 ? measured : fallback));

  return (
    <div className="carm-balken-view" ref={wrapperRef}>
      {renderSortChips()}
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ height, width: '100%' }}
        onEvents={{ click: handleClick }}
        opts={{ renderer: 'svg' }}
        notMerge
      />
    </div>
  );
});

export default BalkenView;
