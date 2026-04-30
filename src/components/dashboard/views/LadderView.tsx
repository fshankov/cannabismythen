import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { Myth, Metric, Group, GroupId, AppState, Indicator } from '../../../lib/dashboard/types';
import { getMythMetric, getIndicatorValue, getMythShortText } from '../../../lib/dashboard/data';
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
  const frac = (mythId * 0.6180339887) % 1;
  return frac - 0.5;
}

export default function LadderView({ myths, metrics, groups, state, update, onSelectMyth }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  const selectedGroup: GroupId = state.groupIds[0] || 'adults';
  const selectedMythId = state.selectedMythId;

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setWidth(Math.floor(w));
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const isMobile = width < 640;
  const margin = isMobile
    ? { top: 28, right: 16, bottom: 28, left: 16 }
    : { top: 36, right: 32, bottom: 32, left: 32 };
  const height = isMobile ? 480 : 520;
  const innerW = Math.max(0, width - margin.left - margin.right);
  const innerH = height - margin.top - margin.bottom;
  const axisGap = innerW / INDICATORS.length;
  const laneHalf = Math.min(28, axisGap * 0.32);

  const yScale = useMemo(() => d3.scaleLinear().domain([0, 100]).range([innerH, 0]), [innerH]);

  const axisX = useCallback(
    (i: number) => margin.left + axisGap * (i + 0.5),
    [margin.left, axisGap],
  );

  const dots = useMemo(() => {
    const out: Array<{
      mythId: number;
      myth: Myth;
      indicator: Indicator;
      indicatorIdx: number;
      cx: number;
      cy: number;
      value: number;
    }> = [];
    for (const myth of myths) {
      const metric = getMythMetric(metrics, myth.id, selectedGroup);
      INDICATORS.forEach((ind, i) => {
        const v = getIndicatorValue(metric, ind);
        if (v === null) return;
        out.push({
          mythId: myth.id,
          myth,
          indicator: ind,
          indicatorIdx: i,
          cx: axisX(i) + jitter(myth.id) * laneHalf * 1.6,
          cy: yScale(v),
          value: v,
        });
      });
    }
    return out;
  }, [myths, metrics, selectedGroup, axisX, yScale, laneHalf]);

  const polylinePoints = useMemo(() => {
    if (selectedMythId === null) return null;
    const ordered = dots
      .filter((d) => d.mythId === selectedMythId)
      .sort((a, b) => a.indicatorIdx - b.indicatorIdx);
    if (ordered.length < 2) return null;
    return ordered;
  }, [dots, selectedMythId]);

  const handleDotClick = useCallback(
    (mythId: number) => {
      if (mythId === selectedMythId) {
        onSelectMyth(mythId);
      } else {
        update('selectedMythId', mythId);
      }
    },
    [selectedMythId, update, onSelectMyth],
  );

  const selectedMyth = selectedMythId !== null ? myths.find((m) => m.id === selectedMythId) : null;
  const ticks = [0, 25, 50, 75, 100];

  return (
    <div className="ladder-view" ref={containerRef}>
      <div className="population-pills" role="tablist" aria-label={t('misc.population', state.lang)}>
        {groups.map((g) => {
          const active = g.id === selectedGroup;
          return (
            <button
              key={g.id}
              role="tab"
              aria-selected={active}
              className={`population-pill ${active ? 'active' : ''}`}
              onClick={() => update('groupIds', [g.id])}
            >
              {state.lang === 'de' ? g.name_de : g.name_en}
            </button>
          );
        })}
      </div>

      <svg
        className="ladder-svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t('howto.ladder', state.lang)}
      >
        {/* Gridlines */}
        <g aria-hidden="true">
          {ticks.map((tk) => (
            <line
              key={tk}
              x1={margin.left}
              x2={width - margin.right}
              y1={margin.top + yScale(tk)}
              y2={margin.top + yScale(tk)}
              stroke="#e5e7eb"
              strokeDasharray="2 4"
            />
          ))}
        </g>

        {/* Axes */}
        {INDICATORS.map((ind, i) => {
          const x = axisX(i);
          const label = t(`indicator.${ind}.short` as any, state.lang);
          return (
            <g key={ind} transform={`translate(0, ${margin.top})`}>
              <line x1={x} x2={x} y1={0} y2={innerH} stroke="#cbd5e1" strokeWidth={1} />
              <text
                x={x}
                y={-10}
                textAnchor="middle"
                fontSize={isMobile ? 10 : 12}
                fontWeight={600}
                fill="#1e293b"
              >
                {label}
              </text>
              {/* Tick labels on the leftmost axis only */}
              {i === 0 &&
                ticks.map((tk) => (
                  <text
                    key={tk}
                    x={margin.left - 4}
                    y={yScale(tk) + 3}
                    textAnchor="start"
                    fontSize={9}
                    fill="#94a3b8"
                  >
                    {tk}
                  </text>
                ))}
            </g>
          );
        })}

        {/* Dots */}
        <g transform={`translate(0, ${margin.top})`}>
          {dots.map((d) => {
            const isSelected = d.mythId === selectedMythId;
            const dimmed = selectedMythId !== null && !isSelected;
            const r = isSelected ? 7 : 4.5;
            return (
              <g key={`${d.mythId}-${d.indicator}`}>
                <circle
                  cx={d.cx}
                  cy={d.cy}
                  r={r}
                  fill={getCorrectnessColor(d.myth.correctness_class)}
                  fillOpacity={dimmed ? 0.15 : isSelected ? 1 : 0.75}
                  stroke={isSelected ? '#0f172a' : 'none'}
                  strokeWidth={isSelected ? 1.5 : 0}
                />
                {/* Transparent enlarged hit area for touch */}
                <circle
                  cx={d.cx}
                  cy={d.cy}
                  r={14}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleDotClick(d.mythId)}
                >
                  <title>
                    {`${getMythShortText(d.myth, state.lang)} — ${t(`indicator.${d.indicator}.short` as any, state.lang)}: ${d.value.toFixed(1)}`}
                  </title>
                </circle>
              </g>
            );
          })}
        </g>

        {/* Polyline connecting selected myth across axes */}
        {polylinePoints && (
          <g transform={`translate(0, ${margin.top})`} pointerEvents="none">
            <path
              d={d3.line<{ cx: number; cy: number }>()
                .x((p) => p.cx)
                .y((p) => p.cy)
                .curve(d3.curveMonotoneX)(polylinePoints) || ''}
              fill="none"
              stroke="#0f172a"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          </g>
        )}
      </svg>

      {selectedMyth && (
        <div className="ladder-footer">
          <span className="ladder-footer__label">
            <span
              className="ladder-footer__swatch"
              style={{ background: getCorrectnessColor(selectedMyth.correctness_class) }}
              aria-hidden="true"
            />
            <strong>{getMythShortText(selectedMyth, state.lang)}</strong>
          </span>
          <span className="ladder-footer__actions">
            <button className="ladder-footer__btn" onClick={() => onSelectMyth(selectedMyth.id)}>
              {t('misc.viewDetails', state.lang)}
            </button>
            <button className="ladder-footer__btn ladder-footer__btn--muted" onClick={() => update('selectedMythId', null)}>
              {t('misc.deselect', state.lang)}
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
