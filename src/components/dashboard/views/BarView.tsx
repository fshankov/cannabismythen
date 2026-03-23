import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { Myth, Metric, AppState } from '../../../lib/dashboard/types';
import { getMythMetric, getIndicatorValue, getMythShortText, formatValue, getCategoryName, buildTooltipHtml } from '../../../lib/dashboard/data';
import { getCorrectnessColor } from '../../../lib/dashboard/colors';
import { t } from '../../../lib/dashboard/translations';

interface Props {
  myths: Myth[];
  metrics: Metric[];
  state: AppState;
  onSelectMyth: (id: number) => void;
}

interface BarItem {
  myth: Myth;
  value: number;
  category: string;
  isFirstInCategory: boolean;
}

export default function BarView({ myths, metrics, state, onSelectMyth }: Props) {
  const groupId = state.groupIds[0] || 'adults';

  const chartData = useMemo(() => {
    const catGroups = new Map<string, Array<{ myth: Myth; value: number }>>();

    for (const myth of myths) {
      const metric = getMythMetric(metrics, myth.id, groupId);
      const value = getIndicatorValue(metric, state.indicator);
      if (value === null) continue;

      const catName = getCategoryName(myth, state.lang);
      if (!catGroups.has(catName)) catGroups.set(catName, []);
      catGroups.get(catName)!.push({ myth, value });
    }

    const items: BarItem[] = [];
    for (const [catName, group] of catGroups) {
      group.sort((a, b) => a.value - b.value);
      group.forEach((item, i) => {
        items.push({
          ...item,
          category: catName,
          isFirstInCategory: i === 0,
        });
      });
    }

    return items;
  }, [myths, metrics, groupId, state.indicator, state.lang]);

  const groupName = useMemo(() => {
    const groups = [
      { id: 'adults', de: 'Volljährige', en: 'Adults' },
      { id: 'minors', de: 'Minderjährige', en: 'Minors' },
      { id: 'consumers', de: 'Konsumierende (letzte 30 Tage)', en: 'Consumers (past 30 days)' },
      { id: 'young_adults', de: 'Junge Erwachsene', en: 'Young Adults' },
      { id: 'parents', de: 'Eltern', en: 'Parents' },
    ];
    const g = groups.find((g) => g.id === groupId);
    return g ? (state.lang === 'de' ? g.de : g.en) : groupId;
  }, [groupId, state.lang]);

  const option = useMemo(() => {
    const yData = chartData.map((d) => {
      const text = getMythShortText(d.myth, state.lang);
      return text.length > 55 ? text.substring(0, 52) + '…' : text;
    });

    const categoryBoundaries: number[] = [];
    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i].isFirstInCategory && i > 0) {
        categoryBoundaries.push(i - 0.5);
      }
    }

    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex;
          if (idx === undefined) return '';
          const d = chartData[idx];
          return buildTooltipHtml({
            myth: d.myth,
            lang: state.lang,
            groupName,
            indicator: state.indicator,
            value: d.value,
          });
        },
      },
      grid: {
        left: 220,
        right: 60,
        top: 20,
        bottom: 40,
      },
      xAxis: {
        type: 'value' as const,
        name: t(`indicator.${state.indicator}` as any, state.lang),
        nameLocation: 'middle' as const,
        nameGap: 28,
        max: state.indicator === 'awareness' ? 100 : undefined,
        splitLine: {
          show: true,
          lineStyle: { type: 'dashed' as const, color: '#e5e7eb' },
        },
        z: 0,
      },
      yAxis: {
        type: 'category' as const,
        data: yData,
        axisLabel: {
          width: 200,
          overflow: 'truncate' as const,
          fontSize: 11,
          color: '#1e293b',
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      series: [
        {
          type: 'bar',
          z: 10,
          data: chartData.map((d) => ({
            value: d.value,
            itemStyle: { color: getCorrectnessColor(d.myth.correctness_class) },
          })),
          barMaxWidth: 20,
          barGap: '50%',
          label: {
            show: true,
            position: 'right' as const,
            formatter: (p: any) => formatValue(p.value, state.indicator),
            fontSize: 10,
            color: '#64748b',
          },
          markLine: categoryBoundaries.length > 0
            ? {
                silent: true,
                symbol: 'none',
                lineStyle: { color: '#cbd5e1', width: 1, type: 'solid' as const },
                label: { show: false },
                data: categoryBoundaries.map((pos) => ({
                  yAxis: pos,
                })),
              }
            : undefined,
        },
      ],
    };
  }, [chartData, state.lang, state.indicator, groupName]);

  const handleClick = (params: any) => {
    const idx = params.dataIndex;
    if (idx !== undefined && chartData[idx]) {
      onSelectMyth(chartData[idx].myth.id);
    }
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: Math.max(400, chartData.length * 28 + 60) }}
      onEvents={{ click: handleClick }}
      opts={{ renderer: 'svg' }}
    />
  );
}
