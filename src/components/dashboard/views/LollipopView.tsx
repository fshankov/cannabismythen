import { useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import type { Myth, Metric, Group, AppState, Indicator } from '../../../lib/dashboard/types';
import { getMythMetric, getIndicatorValue, getMythShortText, buildTooltipHtml } from '../../../lib/dashboard/data';
import { getCorrectnessColor } from '../../../lib/dashboard/colors';
import { t } from '../../../lib/dashboard/translations';

interface Props {
  myths: Myth[];
  metrics: Metric[];
  groups: Group[];
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  onSelectMyth: (id: number) => void;
}

const INDICATORS: Indicator[] = ['awareness', 'significance', 'correctness', 'prevention_significance'];

function jitter(mythId: number): number {
  const frac = ((mythId * 0.6180339887) % 1);
  return (frac - 0.5) * 0.4;
}

export default function LollipopView({ myths, metrics, groups, state, update, onSelectMyth }: Props) {
  const indicator = state.lollipopIndicator;
  const selectedMythId = state.selectedMythId;

  const chartData = useMemo(() => {
    const result: Array<{
      myth: Myth;
      groupId: string;
      groupIndex: number;
      groupName: string;
      value: number;
    }> = [];

    groups.forEach((group, gi) => {
      const gName = state.lang === 'de' ? group.name_de : group.name_en;
      for (const myth of myths) {
        const metric = getMythMetric(metrics, myth.id, group.id);
        const val = getIndicatorValue(metric, indicator);
        if (val === null) continue;
        result.push({
          myth,
          groupId: group.id,
          groupIndex: gi,
          groupName: gName,
          value: val,
        });
      }
    });

    return result;
  }, [myths, metrics, groups, indicator, state.lang]);

  const option = useMemo(() => {
    const yCategories = groups.map((g) => state.lang === 'de' ? g.name_de : g.name_en);

    const seriesData = chartData.map((d) => ({
      value: [d.value, d.groupIndex + jitter(d.myth.id)],
      itemStyle: {
        color: getCorrectnessColor(d.myth.correctness_class),
        opacity: selectedMythId === null ? 0.7 : d.myth.id === selectedMythId ? 1 : 0.15,
        borderColor: d.myth.id === selectedMythId ? '#1e293b' : 'transparent',
        borderWidth: d.myth.id === selectedMythId ? 2 : 0,
      },
      mythId: d.myth.id,
      mythData: d,
    }));

    const markLineData: any[] = [];
    if (selectedMythId !== null) {
      const selectedPoints = chartData
        .filter((d) => d.myth.id === selectedMythId)
        .sort((a, b) => a.groupIndex - b.groupIndex);
      for (let i = 0; i < selectedPoints.length - 1; i++) {
        markLineData.push([
          { coord: [selectedPoints[i].value, selectedPoints[i].groupIndex + jitter(selectedMythId)] },
          { coord: [selectedPoints[i + 1].value, selectedPoints[i + 1].groupIndex + jitter(selectedMythId)] },
        ]);
      }
    }

    return {
      tooltip: {
        trigger: 'item' as const,
        formatter: (params: any) => {
          const d = params.data?.mythData;
          if (!d) return '';
          return buildTooltipHtml({
            myth: d.myth,
            lang: state.lang,
            groupName: d.groupName,
            indicator,
            value: d.value,
          });
        },
      },
      grid: { left: 200, right: 30, top: 10, bottom: 50 },
      xAxis: {
        type: 'value' as const,
        name: t(`indicator.${indicator}` as any, state.lang),
        nameLocation: 'middle' as const,
        nameGap: 30,
        max: indicator === 'awareness' ? 100 : undefined,
        min: 0,
        splitLine: {
          show: true,
          lineStyle: { type: 'dashed' as const, color: '#e5e7eb' },
        },
      },
      yAxis: {
        type: 'category' as const,
        data: yCategories,
        axisLabel: {
          fontSize: 11,
          width: 180,
          overflow: 'truncate' as const,
        },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series: [{
        type: 'scatter',
        data: seriesData,
        symbolSize: selectedMythId === null ? 12 : (val: any[], params: any) => {
          return params.data?.mythId === selectedMythId ? 18 : 10;
        },
        emphasis: {
          scale: 1.4,
          itemStyle: { opacity: 1 },
        },
        markLine: markLineData.length > 0
          ? {
              symbol: 'none',
              lineStyle: { color: '#1e293b', width: 1.5, type: 'dashed' as const },
              data: markLineData,
              silent: true,
              animation: false,
            }
          : undefined,
      }],
      animationDuration: 300,
    };
  }, [chartData, groups, state.lang, indicator, selectedMythId]);

  const handleClick = useCallback((params: any) => {
    const mythId = params.data?.mythId;
    if (mythId !== undefined) {
      if (mythId === selectedMythId) {
        update('selectedMythId', null);
      } else {
        update('selectedMythId', mythId);
      }
    }
  }, [selectedMythId, update]);

  const handleDblClick = useCallback((params: any) => {
    const mythId = params.data?.mythId;
    if (mythId !== undefined) {
      onSelectMyth(mythId);
    }
  }, [onSelectMyth]);

  return (
    <div>
      <div className="lollipop-indicator-tags">
        {INDICATORS.map((ind) => (
          <button
            key={ind}
            className={`indicator-tag ${ind === indicator ? 'active' : ''}`}
            onClick={() => update('lollipopIndicator', ind)}
          >
            {t(`indicator.${ind}.short` as any, state.lang)}
          </button>
        ))}
      </div>
      <ReactECharts
        option={option}
        style={{ height: Math.max(300, groups.length * 80 + 60) }}
        onEvents={{ click: handleClick, dblclick: handleDblClick }}
        opts={{ renderer: 'svg' }}
      />
      {selectedMythId !== null && (
        <div style={{ padding: '8px 16px', fontSize: '0.82rem', color: '#64748b' }}>
          {(() => {
            const myth = myths.find((m) => m.id === selectedMythId);
            if (!myth) return null;
            return (
              <span>
                <strong>{getMythShortText(myth, state.lang)}</strong>
                {' — '}
                <button
                  onClick={() => onSelectMyth(selectedMythId)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1e40af',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    padding: 0,
                  }}
                >
                  {state.lang === 'de' ? 'Details anzeigen' : 'View details'}
                </button>
                {' | '}
                <button
                  onClick={() => update('selectedMythId', null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    padding: 0,
                  }}
                >
                  {state.lang === 'de' ? 'Auswahl aufheben' : 'Deselect'}
                </button>
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
}
