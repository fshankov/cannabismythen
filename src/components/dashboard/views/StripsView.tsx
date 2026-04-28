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

interface BeeswarmNode {
  mythId: number;
  myth: Myth;
  value: number;
  x0: number;
  x: number;
  y: number;
}

export default function StripsView({ myths, metrics, groups, state, update, onSelectMyth }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  const selectedGroup: GroupId = state.groupIds[0] || 'general_population';
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
  const stripHeight = isMobile ? 76 : 96;
  const stripGap = isMobile ? 18 : 24;
  const margin = isMobile
    ? { top: 8, right: 14, bottom: 8, left: 14 }
    : { top: 12, right: 24, bottom: 12, left: 24 };
  const innerW = Math.max(0, width - margin.left - margin.right);
  const totalHeight = margin.top + margin.bottom + INDICATORS.length * stripHeight + (INDICATORS.length - 1) * stripGap;

  const xScale = useMemo(() => d3.scaleLinear().domain([0, 100]).range([0, innerW]), [innerW]);

  // Run a force-simulation per strip to position dots without overlap
  const stripData = useMemo(() => {
    const radius = isMobile ? 5 : 6;
    return INDICATORS.map((ind) => {
      const nodes: BeeswarmNode[] = [];
      for (const myth of myths) {
        const metric = getMythMetric(metrics, myth.id, selectedGroup);
        const v = getIndicatorValue(metric, ind);
        if (v === null) continue;
        const x0 = xScale(v);
        nodes.push({ mythId: myth.id, myth, value: v, x0, x: x0, y: 0 });
      }
      const sim = d3
        .forceSimulation(nodes as any)
        .force('x', d3.forceX<BeeswarmNode>((d) => d.x0).strength(1))
        .force('y', d3.forceY<BeeswarmNode>(0).strength(0.18))
        .force('collide', d3.forceCollide<BeeswarmNode>(radius + 0.6))
        .stop();
      for (let i = 0; i < 140; i++) sim.tick();
      return { indicator: ind, nodes, radius };
    });
  }, [myths, metrics, selectedGroup, xScale, isMobile]);

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
    <div className="strips-view" ref={containerRef}>
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
        className="strips-svg"
        width={width}
        height={totalHeight}
        viewBox={`0 0 ${width} ${totalHeight}`}
        role="img"
        aria-label={t('howto.strips', state.lang)}
      >
        {stripData.map((strip, i) => {
          const stripTop = margin.top + i * (stripHeight + stripGap);
          const baselineY = stripTop + stripHeight - 18;
          const dotsY = stripTop + stripHeight / 2 - 2;
          const label = t(`indicator.${strip.indicator}.short` as any, state.lang);

          return (
            <g key={strip.indicator} transform={`translate(${margin.left}, 0)`}>
              {/* Header label */}
              <text x={0} y={stripTop + 12} fontSize={isMobile ? 11 : 13} fontWeight={600} fill="#1e293b">
                {label}
              </text>

              {/* Strip background */}
              <rect
                x={0}
                y={dotsY - stripHeight / 2 + 18}
                width={innerW}
                height={stripHeight - 30}
                fill="#f8fafc"
                stroke="#e2e8f0"
                rx={6}
              />

              {/* Tick gridlines */}
              {ticks.map((tk) => (
                <g key={tk}>
                  <line
                    x1={xScale(tk)}
                    x2={xScale(tk)}
                    y1={dotsY - stripHeight / 2 + 18}
                    y2={dotsY + stripHeight / 2 - 12}
                    stroke="#e5e7eb"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={xScale(tk)}
                    y={baselineY + 12}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#94a3b8"
                  >
                    {tk}
                  </text>
                </g>
              ))}

              {/* Dots */}
              {strip.nodes.map((n) => {
                const isSelected = n.mythId === selectedMythId;
                const dimmed = selectedMythId !== null && !isSelected;
                const r = isSelected ? strip.radius + 2.5 : strip.radius;
                return (
                  <g key={n.mythId}>
                    <circle
                      cx={n.x}
                      cy={dotsY + n.y}
                      r={r}
                      fill={getCorrectnessColor(n.myth.correctness_class)}
                      fillOpacity={dimmed ? 0.15 : isSelected ? 1 : 0.85}
                      stroke={isSelected ? '#0f172a' : 'none'}
                      strokeWidth={isSelected ? 1.5 : 0}
                    />
                    <circle
                      cx={n.x}
                      cy={dotsY + n.y}
                      r={14}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleDotClick(n.mythId)}
                    >
                      <title>
                        {`${getMythShortText(n.myth, state.lang)} — ${label}: ${n.value.toFixed(1)}`}
                      </title>
                    </circle>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Vertical connector for the selected myth across all strips */}
        {selectedMythId !== null && (
          <g transform={`translate(${margin.left}, 0)`} pointerEvents="none">
            {stripData.map((strip, i) => {
              const node = strip.nodes.find((n) => n.mythId === selectedMythId);
              if (!node) return null;
              const stripTop = margin.top + i * (stripHeight + stripGap);
              const dotsY = stripTop + stripHeight / 2 - 2;
              const nextStrip = stripData[i + 1];
              if (!nextStrip) return null;
              const nextNode = nextStrip.nodes.find((n) => n.mythId === selectedMythId);
              if (!nextNode) return null;
              const nextStripTop = margin.top + (i + 1) * (stripHeight + stripGap);
              const nextDotsY = nextStripTop + stripHeight / 2 - 2;
              return (
                <line
                  key={`conn-${i}`}
                  x1={node.x}
                  y1={dotsY + node.y}
                  x2={nextNode.x}
                  y2={nextDotsY + nextNode.y}
                  stroke="#0f172a"
                  strokeWidth={1.25}
                  strokeDasharray="3 3"
                />
              );
            })}
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
