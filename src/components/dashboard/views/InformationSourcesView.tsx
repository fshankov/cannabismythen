import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import type {
  AppState,
  DashboardDefinitions,
  InformationSourcesData,
  SourceMetricType,
  SourceGroupId,
  InformationSource,
} from '../../../lib/dashboard/types';
import { t } from '../../../lib/dashboard/translations';
import InfoTooltip from '../InfoTooltip';

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  definitions?: DashboardDefinitions | null;
}

const METRIC_KEYS: SourceMetricType[] = ['search', 'perception', 'trust', 'prevention'];

const METRIC_LABELS: Record<SourceMetricType, string> = {
  search: 'Suche',
  perception: 'Wahrnehmung',
  trust: 'Vertrauen',
  prevention: 'Präventionspotential',
};

const GROUP_LABELS: Record<SourceGroupId, string> = {
  adults: 'Volljährige (18–70)',
  minors: 'Minderjährige (16–17)',
  consumers: 'Konsument:innen',
  young_adults: 'Junge Erwachsene (18–26)',
  parents: 'Eltern',
};

const GROUP_KEYS: SourceGroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];

export default function InformationSourcesView({ state, update, definitions }: Props) {
  const [sourceData, setSourceData] = useState<InformationSourcesData | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const metric = state.sourceMetric;
  const group = state.sourceGroup;

  useEffect(() => {
    fetch('/data/information-sources.json')
      .then((r) => r.json())
      .then(setSourceData);
  }, []);

  // Build sorted data for current metric + group
  const chartItems = useMemo(() => {
    if (!sourceData) return [];
    const metricDef = sourceData.metrics[metric];
    if (!metricDef) return [];
    const groupData = metricDef.data[group] || {};

    // Only include sources that have data for this metric
    const items = sourceData.sources
      .filter((s) => groupData[String(s.id)] !== undefined)
      .map((s) => ({
        source: s,
        value: groupData[String(s.id)],
        category: sourceData.sourceCategories.find((c) => c.id === s.category),
      }))
      .sort((a, b) => b.value - a.value);

    return items;
  }, [sourceData, metric, group]);

  // Color map
  const categoryColorMap = useMemo(() => {
    if (!sourceData) return new Map<string, string>();
    return new Map(sourceData.sourceCategories.map((c) => [c.id, c.color]));
  }, [sourceData]);

  // D3 rendering
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || chartItems.length === 0 || !sourceData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const isSubItem = (s: InformationSource) => s.parentId !== null;
    const rowHeight = 28;
    const marginTop = 8;
    const marginBottom = 40;
    const marginLeft = 250;
    const marginRight = 60;
    const width = containerRef.current.clientWidth;
    const height = marginTop + chartItems.length * rowHeight + marginBottom;

    svg.attr('width', width).attr('height', height);

    const metricDef = sourceData.metrics[metric];
    const maxVal = d3.max(chartItems, (d) => d.value) || 100;
    const xMax = metricDef.unit === '%' ? Math.min(100, Math.ceil(maxVal / 10) * 10 + 5) : Math.ceil(maxVal / 10) * 10 + 5;

    const x = d3.scaleLinear().domain([0, xMax]).range([marginLeft, width - marginRight]);
    const y = d3
      .scaleBand<number>()
      .domain(chartItems.map((_, i) => i))
      .range([marginTop, height - marginBottom])
      .padding(0.15);

    // Grid lines
    const xTicks = x.ticks(6);
    svg
      .append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(xTicks)
      .join('line')
      .attr('x1', (d) => x(d))
      .attr('x2', (d) => x(d))
      .attr('y1', marginTop)
      .attr('y2', height - marginBottom)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-dasharray', '3,3');

    // X-axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(6)
          .tickFormat((d) => (metricDef.unit === '%' ? `${d}%` : String(d)))
      )
      .call((g) => g.select('.domain').attr('stroke', '#cbd5e1'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#cbd5e1'))
      .call((g) =>
        g.selectAll('.tick text').attr('fill', '#64748b').attr('font-size', '11px').attr('font-family', 'Inter Variable, Inter, sans-serif')
      );

    // X-axis label
    svg
      .append('text')
      .attr('x', (marginLeft + width - marginRight) / 2)
      .attr('y', height - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'Inter Variable, Inter, sans-serif')
      .text(`${metricDef.label} (${metricDef.unit === '%' ? 'Nutzungsanteil %' : metricDef.unit})`);

    // Lollipop stems
    svg
      .append('g')
      .selectAll('line')
      .data(chartItems)
      .join('line')
      .attr('x1', x(0))
      .attr('x2', (d) => x(d.value))
      .attr('y1', (_, i) => (y(i) || 0) + y.bandwidth() / 2)
      .attr('y2', (_, i) => (y(i) || 0) + y.bandwidth() / 2)
      .attr('stroke', (d) => categoryColorMap.get(d.source.category) || '#6B7280')
      .attr('stroke-opacity', (d) => (isSubItem(d.source) ? 0.3 : 0.4))
      .attr('stroke-width', (d) => (isSubItem(d.source) ? 1 : 1.5));

    // Lollipop dots
    const dots = svg
      .append('g')
      .selectAll('circle')
      .data(chartItems)
      .join('circle')
      .attr('cx', (d) => x(d.value))
      .attr('cy', (_, i) => (y(i) || 0) + y.bandwidth() / 2)
      .attr('r', (d) => (isSubItem(d.source) ? 5 : 7))
      .attr('fill', (d) => categoryColorMap.get(d.source.category) || '#6B7280')
      .attr('fill-opacity', (d) => (isSubItem(d.source) ? 0.65 : 0.9))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer');

    // Value labels (at dot end)
    svg
      .append('g')
      .selectAll('text')
      .data(chartItems)
      .join('text')
      .attr('x', (d) => x(d.value) + 10)
      .attr('y', (_, i) => (y(i) || 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', '#64748b')
      .attr('font-size', '10.5px')
      .attr('font-family', 'Inter Variable, Inter, sans-serif')
      .attr('font-variant-numeric', 'tabular-nums')
      .text((d) => (metricDef.unit === '%' ? `${d.value.toFixed(1)}%` : d.value.toFixed(1)));

    // Y-axis labels
    svg
      .append('g')
      .selectAll('text')
      .data(chartItems)
      .join('text')
      .attr('x', marginLeft - 10)
      .attr('y', (_, i) => (y(i) || 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', (d) => (isSubItem(d.source) ? '#94a3b8' : '#1e293b'))
      .attr('font-size', (d) => (isSubItem(d.source) ? '11px' : '12px'))
      .attr('font-weight', (d) => (isSubItem(d.source) ? '400' : '500'))
      .attr('font-family', 'Inter Variable, Inter, sans-serif')
      .text((d) => d.source.name);

    // Tooltip interactions
    const tooltip = d3.select(tooltipRef.current);

    dots
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(120)
          .attr('r', isSubItem(d.source) ? 7 : 9);

        const catName = d.category?.name || '';
        tooltip
          .style('opacity', '1')
          .style('left', `${event.offsetX + 16}px`)
          .style('top', `${event.offsetY - 10}px`).html(`
            <div style="font-weight:700;font-size:0.82rem;margin-bottom:2px;color:#1e293b">${d.source.name.replace(/^\s*↳\s*/, '')}</div>
            <div style="font-size:0.72rem;color:#64748b;margin-bottom:6px">${catName} · ${GROUP_LABELS[group]}</div>
            <div style="font-size:0.88rem;font-weight:700;color:${categoryColorMap.get(d.source.category) || '#6B7280'}">${metricDef.unit === '%' ? d.value.toFixed(1) + '%' : d.value.toFixed(1) + ' Punkte'}</div>
          `);
      })
      .on('mousemove', (event) => {
        tooltip.style('left', `${event.offsetX + 16}px`).style('top', `${event.offsetY - 10}px`);
      })
      .on('mouseleave', (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(120)
          .attr('r', isSubItem(d.source) ? 5 : 7);
        tooltip.style('opacity', '0');
      });
  }, [chartItems, sourceData, metric, group, categoryColorMap]);

  // Resize handler
  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;
    const observer = new ResizeObserver(() => {
      // Trigger re-render by forcing a state-like update
      // The D3 effect above depends on chartItems which triggers re-draw
      if (svgRef.current && containerRef.current && chartItems.length > 0) {
        const svg = d3.select(svgRef.current);
        svg.attr('width', containerRef.current.clientWidth);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [chartItems]);

  if (!sourceData) {
    return <div className="carm-loading">Daten werden geladen…</div>;
  }

  return (
    <div className="sources-view">
      {/* Metric selector pills */}
      <div className="sources-controls">
        <div className="sources-pills">
          {METRIC_KEYS.map((m) => {
            const def = definitions?.sourcesIndicators?.[m];
            return (
              <button
                key={m}
                className={`indicator-tag ${m === metric ? 'active' : ''}`}
                onClick={() => update('sourceMetric', m)}
              >
                {METRIC_LABELS[m]}
                {def && (
                  <InfoTooltip
                    title={def.label}
                    definition={def.definition}
                    scale={def.scale}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="sources-pills">
          {GROUP_KEYS.map((g) => (
            <button
              key={g}
              className={`circular-group-btn ${g === group ? 'active' : ''}`}
              onClick={() => update('sourceGroup', g)}
            >
              {GROUP_LABELS[g]}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="sources-description">
        {sourceData.metrics[metric].description}
      </div>

      {/* Legend */}
      <div className="sources-legend">
        {sourceData.sourceCategories.map((cat) => (
          <span key={cat.id} className="sources-legend-item">
            <span
              className="sources-legend-dot"
              style={{ backgroundColor: cat.color }}
            />
            {cat.name}
          </span>
        ))}
      </div>

      {/* Chart */}
      <div className="sources-chart-container" ref={containerRef}>
        <svg ref={svgRef} />
        <div ref={tooltipRef} className="sources-tooltip" />
      </div>
    </div>
  );
}
