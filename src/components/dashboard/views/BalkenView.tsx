import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { ECharts } from 'echarts';
import type { Myth, Metric, AppState, BalkenSort } from '../../../lib/dashboard/types';
import {
  buildTooltipHtml,
  formatValue,
  getIndicatorValue,
  getMythMetric,
  getMythShortText,
} from '../../../lib/dashboard/data';
import { getCorrectnessColor, getCorrectnessBgColor } from '../../../lib/dashboard/colors';
import { t } from '../../../lib/dashboard/translations';

interface Props {
  myths: Myth[];
  metrics: Metric[];
  state: AppState;
  onSelectMyth: (id: number) => void;
  /** Empty-state CTA resets categoryIds + mythIds + verdictFilter +
   *  search + balkenSort so the user can recover from an
   *  "over-filtered to nothing" state in one click. */
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
  if (sort === 'value-asc') return copy.sort((a, b) => a.value - b.value);
  return copy.sort((a, b) => b.value - a.value);
}

const BalkenView = forwardRef<BalkenViewHandle, Props>(function BalkenView(
  { myths, metrics, state, onSelectMyth, onResetFilters },
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
      out.push({ myth, value, category: myth.category_de });
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

    // Verdict-coloured y-axis labels — replaces the separate
    // VerdictLegend sidebar that used to live to the right of the chart.
    // Each label is rendered with an ECharts `rich` style keyed by the
    // myth's correctness_class, so the text picks up the verdict colour
    // and a leading verdict arrow glyph (↑ ↗ ↙ ↓ —) before the label.
    // Truncation rule unchanged.
    const VERDICT_GLYPH: Record<string, string> = {
      richtig: '↑ ',
      eher_richtig: '↗ ',
      eher_falsch: '↙ ',
      falsch: '↓ ',
      no_classification: '— ',
    };
    const yLabels = ordered.map((d) => {
      const txt = getMythShortText(d.myth, 'de');
      const trimmed = txt.length > 60 ? txt.slice(0, 58) + '…' : txt;
      const cls = d.myth.correctness_class;
      const glyph = VERDICT_GLYPH[cls] ?? '';
      return `{${cls}|${glyph}${trimmed}}`;
    });

    // Each y-axis label renders as a verdict-tinted pill: subtle bg
    // (Emerald-50 / Lime-50 / Amber-50 / Rose-50), verdict-colored
    // bold text, leading arrow glyph, and a small left padding so the
    // text doesn't touch the pill edge. Matches the row treatment of
    // Tabelle myth cells so a Balken row and a Tabelle row read as
    // the same thing.
    const pillPadding: [number, number, number, number] = [3, 8, 3, 8];
    const richStyles = {
      richtig: {
        color: getCorrectnessColor('richtig'),
        backgroundColor: getCorrectnessBgColor('richtig'),
        padding: pillPadding,
        borderRadius: 4,
        fontWeight: 600,
      },
      eher_richtig: {
        color: getCorrectnessColor('eher_richtig'),
        backgroundColor: getCorrectnessBgColor('eher_richtig'),
        padding: pillPadding,
        borderRadius: 4,
        fontWeight: 600,
      },
      eher_falsch: {
        color: getCorrectnessColor('eher_falsch'),
        backgroundColor: getCorrectnessBgColor('eher_falsch'),
        padding: pillPadding,
        borderRadius: 4,
        fontWeight: 600,
      },
      falsch: {
        color: getCorrectnessColor('falsch'),
        backgroundColor: getCorrectnessBgColor('falsch'),
        padding: pillPadding,
        borderRadius: 4,
        fontWeight: 600,
      },
      no_classification: {
        color: '#1e293b',
        backgroundColor: getCorrectnessBgColor('no_classification'),
        padding: pillPadding,
        borderRadius: 4,
        fontWeight: 500,
      },
    };

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
        // 248 leaves an 8px gap between the verdict-tinted y-axis
        // label pills (width 232 below) and the chart's left axis
        // line so the pills don't visually butt against the bars.
        left: 248,
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
          // 232 = grid.left (248) − 16 pill horizontal padding.
          width: 232,
          overflow: 'truncate' as const,
          fontSize: 12,
          color: '#1e293b',
          // Widen the click target so tapping the y-axis myth label
          // opens the factsheet, not just the bar itself.
          triggerEvent: true,
          rich: richStyles,
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

  // Sort UI now lives in the shared dashboard toolbar (`<SortToggle>`);
  // the inline chips that used to render here were removed when the
  // toolbar consolidated.

  if (data.length === 0) {
    return (
      <div className="carm-balken-view" ref={wrapperRef}>
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
