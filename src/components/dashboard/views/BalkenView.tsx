import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { ECharts } from 'echarts';
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

const BalkenView = forwardRef<BalkenViewHandle, Props>(function BalkenView(
  { myths, metrics, state, onSelectMyth },
  ref,
) {
  const chartRef = useRef<ReactECharts>(null);

  useImperativeHandle(ref, () => ({
    getEchartsInstance: () => chartRef.current?.getEchartsInstance() ?? null,
  }));

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
          data: ordered.map((d) => ({
            value: d.value,
            itemStyle: {
              color: getCorrectnessColor(d.myth.correctness_class),
              borderRadius: [0, 3, 3, 0] as [number, number, number, number],
            },
            label: {
              // Override per-bar so insideRight uses white, right uses dark.
              color: d.value >= insideThreshold ? '#ffffff' : '#1e293b',
            },
          })),
        },
      ],
    };
  }, [data, state.indicator, groupName]);

  if (data.length === 0) {
    return (
      <div className="carm-balken-empty" role="status">
        <p className="carm-balken-empty__title">{t('filter.empty.title', 'de')}</p>
        <p className="carm-balken-empty__body">{t('filter.empty.body', 'de')}</p>
      </div>
    );
  }

  const handleClick = (params: { dataIndex?: number }) => {
    if (params.dataIndex === undefined) return;
    // The series is reversed for display, so invert the index lookup.
    const ordered = [...data].reverse();
    const datum = ordered[params.dataIndex];
    if (datum) onSelectMyth(datum.myth.id);
  };

  // Height grows with the number of bars; clamp to a reasonable floor + ceil.
  const height = Math.min(1200, Math.max(420, data.length * 22 + 80));

  return (
    <div className="carm-balken-view">
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
