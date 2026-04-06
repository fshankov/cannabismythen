import { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import type {
  AppState,
  InformationSourcesData,
  SourceMetricType,
  SourceGroupId,
  InformationSource,
} from '../../../lib/dashboard/types';

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
}

const METRIC_KEYS: SourceMetricType[] = ['search', 'perception', 'trust', 'prevention'];

const METRIC_LABELS: Record<SourceMetricType, string> = {
  search: 'Suche',
  perception: 'Wahrnehmung',
  trust: 'Vertrauen',
  prevention: 'Prävention',
};

// Distinct, accessible colors, one per metric
const METRIC_COLORS: Record<SourceMetricType, string> = {
  search: '#F97316',      // orange
  perception: '#8B5CF6',  // purple
  trust: '#2563EB',       // blue
  prevention: '#059669',  // emerald green
};

const GROUP_LABELS: Record<SourceGroupId, string> = {
  adults: 'Volljährige (18–70)',
  minors: 'Minderjährige (16–17)',
  consumers: 'Konsument:innen',
  young_adults: 'Junge Erwachsene (18–26)',
  parents: 'Eltern',
};

const GROUP_KEYS: SourceGroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];

interface RowDatum {
  source: InformationSource;
  categoryColor: string;
  values: Partial<Record<SourceMetricType, number>>;
  prevention: number | null;
  gap: number | null; // trust − search
  min: number | null;
  max: number | null;
}

export default function InformationSourcesV2View({ state, update }: Props) {
  const [sourceData, setSourceData] = useState<InformationSourcesData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(900);

  const mode = state.sourcesV2Mode;
  const sort = state.sourcesV2Sort;
  const group = state.sourcesV2Group;
  const expanded = state.sourcesV2Expanded;

  useEffect(() => {
    fetch('/data/information-sources.json')
      .then((r) => r.json())
      .then(setSourceData);
  }, []);

  // Resize observer for responsive width
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      setContainerWidth(el.clientWidth);
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const categoryColorMap = useMemo(() => {
    if (!sourceData) return new Map<string, string>();
    return new Map(sourceData.sourceCategories.map((c) => [c.id, c.color]));
  }, [sourceData]);

  // Build row data (parents only, optionally with expanded children)
  const rows: RowDatum[] = useMemo(() => {
    if (!sourceData) return [];

    const buildRow = (s: InformationSource): RowDatum => {
      const values: Partial<Record<SourceMetricType, number>> = {};
      for (const m of METRIC_KEYS) {
        const metricData = sourceData.metrics[m]?.data[group] || {};
        const v = metricData[String(s.id)];
        if (typeof v === 'number') values[m] = v;
      }
      const nums = Object.values(values).filter((v): v is number => typeof v === 'number');
      const prevention = values.prevention ?? null;
      const gap =
        typeof values.trust === 'number' && typeof values.search === 'number'
          ? values.trust - values.search
          : null;
      return {
        source: s,
        categoryColor: categoryColorMap.get(s.category) || '#6B7280',
        values,
        prevention,
        gap,
        min: nums.length ? Math.min(...nums) : null,
        max: nums.length ? Math.max(...nums) : null,
      };
    };

    const parents = sourceData.sources.filter((s) => s.parentId === null);
    const parentRows = parents.map(buildRow);

    // Sort
    const sorted = [...parentRows].sort((a, b) => {
      if (sort === 'prevention') {
        const av = a.prevention ?? -Infinity;
        const bv = b.prevention ?? -Infinity;
        return bv - av;
      }
      // by absolute gap
      const av = a.gap === null ? -Infinity : Math.abs(a.gap);
      const bv = b.gap === null ? -Infinity : Math.abs(b.gap);
      return bv - av;
    });

    // Insert children beneath expanded parents
    const result: RowDatum[] = [];
    const expandedSet = new Set(expanded);
    for (const parentRow of sorted) {
      result.push(parentRow);
      if (expandedSet.has(parentRow.source.id)) {
        const children = sourceData.sources
          .filter((s) => s.parentId === parentRow.source.id)
          .map(buildRow);
        result.push(...children);
      }
    }
    return result;
  }, [sourceData, group, sort, expanded, categoryColorMap]);

  // Dumbbell D3 rendering
  useEffect(() => {
    if (mode !== 'dumbbell') return;
    if (!svgRef.current || rows.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rowHeight = 30;
    const marginTop = 30;
    const marginBottom = 50;
    const marginLeft = 280;
    const marginRight = 40;
    const width = containerWidth;
    const height = marginTop + rows.length * rowHeight + marginBottom;

    svg.attr('width', width).attr('height', height);

    // Determine x domain across all metrics (percent scale, 0..100)
    const x = d3.scaleLinear().domain([0, 100]).range([marginLeft, width - marginRight]);
    const y = d3
      .scaleBand<number>()
      .domain(rows.map((_, i) => i))
      .range([marginTop, height - marginBottom])
      .padding(0.2);

    // Grid lines
    const ticks = x.ticks(6);
    svg
      .append('g')
      .selectAll('line')
      .data(ticks)
      .join('line')
      .attr('x1', (d) => x(d))
      .attr('x2', (d) => x(d))
      .attr('y1', marginTop)
      .attr('y2', height - marginBottom)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-dasharray', '3,3');

    // X axis (top)
    svg
      .append('g')
      .attr('transform', `translate(0,${marginTop - 4})`)
      .call(d3.axisTop(x).ticks(6).tickFormat((d) => `${d}%`))
      .call((g) => g.select('.domain').attr('stroke', '#cbd5e1'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#cbd5e1'))
      .call((g) =>
        g.selectAll('.tick text').attr('fill', '#64748b').attr('font-size', '11px').attr('font-family', 'Inter Variable, Inter, sans-serif')
      );

    // X axis (bottom)
    svg
      .append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat((d) => `${d}%`))
      .call((g) => g.select('.domain').attr('stroke', '#cbd5e1'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#cbd5e1'))
      .call((g) =>
        g.selectAll('.tick text').attr('fill', '#64748b').attr('font-size', '11px').attr('font-family', 'Inter Variable, Inter, sans-serif')
      );

    // Connector lines (min→max)
    svg
      .append('g')
      .selectAll('line.connector')
      .data(rows)
      .join('line')
      .attr('class', 'connector')
      .attr('x1', (d) => (d.min !== null ? x(d.min) : marginLeft))
      .attr('x2', (d) => (d.max !== null ? x(d.max) : marginLeft))
      .attr('y1', (_, i) => (y(i) || 0) + y.bandwidth() / 2)
      .attr('y2', (_, i) => (y(i) || 0) + y.bandwidth() / 2)
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')
      .style('opacity', (d) => (d.min !== null && d.max !== null && d.min !== d.max ? 0.9 : 0));

    // Dots per metric
    const tooltip = d3.select(tooltipRef.current);
    const isChild = (s: InformationSource) => s.parentId !== null;

    const dotsGroup = svg.append('g');
    rows.forEach((row, i) => {
      const cy = (y(i) || 0) + y.bandwidth() / 2;
      const r = isChild(row.source) ? 5 : 7;
      for (const m of METRIC_KEYS) {
        const v = row.values[m];
        if (typeof v !== 'number') continue;
        dotsGroup
          .append('circle')
          .attr('cx', x(v))
          .attr('cy', cy)
          .attr('r', r)
          .attr('fill', METRIC_COLORS[m])
          .attr('fill-opacity', isChild(row.source) ? 0.7 : 0.92)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5)
          .style('cursor', 'pointer')
          .on('mouseenter', (event) => {
            d3.select(event.currentTarget).transition().duration(100).attr('r', r + 2);
            const unit = sourceData?.metrics[m]?.unit === '%' ? '%' : '';
            tooltip
              .style('opacity', '1')
              .html(`
                <div style="font-weight:700;font-size:0.82rem;margin-bottom:4px;color:#1e293b">${row.source.name.replace(/^\s*↳\s*/, '')}</div>
                <div style="font-size:0.72rem;color:#64748b;margin-bottom:6px">${GROUP_LABELS[group]}</div>
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${METRIC_COLORS[m]}"></span>
                  <span style="font-size:0.8rem;color:#334155">${METRIC_LABELS[m]}: <strong>${v.toFixed(1)}${unit}</strong></span>
                </div>
              `);
          })
          .on('mousemove', (event) => {
            const [mx, my] = d3.pointer(event, containerRef.current);
            tooltip.style('left', `${mx + 14}px`).style('top', `${my - 10}px`);
          })
          .on('mouseleave', (event) => {
            d3.select(event.currentTarget).transition().duration(100).attr('r', r);
            tooltip.style('opacity', '0');
          });
      }
    });

    // Row labels (source names colored by category)
    const labelGroup = svg.append('g');
    rows.forEach((row, i) => {
      const cy = (y(i) || 0) + y.bandwidth() / 2;
      const child = isChild(row.source);
      const parents = sourceData?.sources.filter((s) => s.parentId === null && sourceData.sources.some((c) => c.parentId === s.id)) || [];
      const hasChildren = !child && parents.some((p) => p.id === row.source.id);
      const isExpanded = expanded.includes(row.source.id);

      const g = labelGroup
        .append('g')
        .attr('transform', `translate(${marginLeft - 10},${cy})`)
        .style('cursor', hasChildren ? 'pointer' : 'default')
        .on('click', () => {
          if (!hasChildren) return;
          const next = isExpanded
            ? expanded.filter((id) => id !== row.source.id)
            : [...expanded, row.source.id];
          update('sourcesV2Expanded', next);
        });

      // expand indicator
      if (hasChildren) {
        g.append('text')
          .attr('x', 0)
          .attr('y', 0)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'end')
          .attr('fill', '#94a3b8')
          .attr('font-size', '10px')
          .attr('font-family', 'Inter Variable, Inter, sans-serif')
          .text(isExpanded ? '▾' : '▸');
      }

      g.append('text')
        .attr('x', hasChildren ? -12 : 0)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('fill', row.categoryColor)
        .attr('fill-opacity', child ? 0.7 : 1)
        .attr('font-size', child ? '11px' : '12px')
        .attr('font-weight', child ? 400 : 600)
        .attr('font-family', 'Inter Variable, Inter, sans-serif')
        .text(row.source.name);
    });
  }, [mode, rows, containerWidth, sourceData, group, expanded, update]);

  // Small multiples (2x2)
  useEffect(() => {
    if (mode !== 'multiples') return;
    if (!svgRef.current || !sourceData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Use parent-only sorted rows for stable y
    const parentRows = rows.filter((r) => r.source.parentId === null);

    // Layout: 2 cols x 2 rows of panels
    const panelGap = 40;
    const outerTop = 20;
    const outerBottom = 20;
    const outerLeft = 220;
    const outerRight = 30;
    const cols = 2;
    const innerW = containerWidth - outerLeft - outerRight - panelGap * (cols - 1);
    const panelW = innerW / cols;
    const rowH = 14;
    const panelH = parentRows.length * rowH + 40;
    const totalH = outerTop + panelH * 2 + panelGap + outerBottom;

    svg.attr('width', containerWidth).attr('height', totalH);

    const tooltip = d3.select(tooltipRef.current);

    METRIC_KEYS.forEach((metric, idx) => {
      const col = idx % cols;
      const rowIdx = Math.floor(idx / cols);
      const px = outerLeft + col * (panelW + panelGap);
      const py = outerTop + rowIdx * (panelH + panelGap);

      const g = svg.append('g').attr('transform', `translate(${px},${py})`);

      // Title
      g.append('text')
        .attr('x', 0)
        .attr('y', -6)
        .attr('fill', METRIC_COLORS[metric])
        .attr('font-size', '12px')
        .attr('font-weight', 700)
        .attr('font-family', 'Inter Variable, Inter, sans-serif')
        .text(METRIC_LABELS[metric]);

      const x = d3.scaleLinear().domain([0, 100]).range([0, panelW]);
      const y = d3
        .scaleBand<number>()
        .domain(parentRows.map((_, i) => i))
        .range([10, panelH - 20])
        .padding(0.2);

      // grid
      g.append('g')
        .selectAll('line')
        .data(x.ticks(4))
        .join('line')
        .attr('x1', (d) => x(d))
        .attr('x2', (d) => x(d))
        .attr('y1', 10)
        .attr('y2', panelH - 20)
        .attr('stroke', '#e5e7eb')
        .attr('stroke-dasharray', '2,2');

      // axis
      g.append('g')
        .attr('transform', `translate(0,${panelH - 20})`)
        .call(d3.axisBottom(x).ticks(4).tickFormat((d) => `${d}%`))
        .call((ax) => ax.select('.domain').attr('stroke', '#cbd5e1'))
        .call((ax) => ax.selectAll('.tick line').attr('stroke', '#cbd5e1'))
        .call((ax) =>
          ax.selectAll('.tick text').attr('fill', '#64748b').attr('font-size', '10px').attr('font-family', 'Inter Variable, Inter, sans-serif')
        );

      // rows bars (lollipop stems + dots)
      parentRows.forEach((row, i) => {
        const v = row.values[metric];
        const cy = (y(i) || 0) + y.bandwidth() / 2;

        // Only draw label in first column
        if (col === 0) {
          svg
            .append('text')
            .attr('x', px - 8)
            .attr('y', py + cy)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .attr('fill', row.categoryColor)
            .attr('font-size', '10px')
            .attr('font-family', 'Inter Variable, Inter, sans-serif')
            .text(row.source.name);
        }

        if (typeof v !== 'number') return;

        g.append('line')
          .attr('x1', 0)
          .attr('x2', x(v))
          .attr('y1', cy)
          .attr('y2', cy)
          .attr('stroke', METRIC_COLORS[metric])
          .attr('stroke-opacity', 0.35);

        g.append('circle')
          .attr('cx', x(v))
          .attr('cy', cy)
          .attr('r', 4)
          .attr('fill', METRIC_COLORS[metric])
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mouseenter', (event) => {
            d3.select(event.currentTarget).transition().duration(80).attr('r', 6);
            tooltip
              .style('opacity', '1')
              .html(`
                <div style="font-weight:700;font-size:0.82rem;margin-bottom:4px;color:#1e293b">${row.source.name}</div>
                <div style="font-size:0.72rem;color:#64748b;margin-bottom:6px">${GROUP_LABELS[group]}</div>
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${METRIC_COLORS[metric]}"></span>
                  <span style="font-size:0.8rem;color:#334155">${METRIC_LABELS[metric]}: <strong>${v.toFixed(1)}%</strong></span>
                </div>
              `);
          })
          .on('mousemove', (event) => {
            const [mx, my] = d3.pointer(event, containerRef.current);
            tooltip.style('left', `${mx + 14}px`).style('top', `${my - 10}px`);
          })
          .on('mouseleave', (event) => {
            d3.select(event.currentTarget).transition().duration(80).attr('r', 4);
            tooltip.style('opacity', '0');
          });
      });
    });
  }, [mode, rows, containerWidth, sourceData, group]);

  // Strategy matrix (Vertrauen × Suche scatter, size = Prävention)
  useEffect(() => {
    if (mode !== 'matrix') return;
    if (!svgRef.current || !sourceData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const marginTop = 30;
    const marginBottom = 60;
    const marginLeft = 70;
    const marginRight = 30;
    const width = containerWidth;
    const height = Math.min(600, Math.max(400, containerWidth * 0.55));

    svg.attr('width', width).attr('height', height);

    // Only use parent rows with both trust & search
    const matrixRows = rows.filter(
      (r) =>
        r.source.parentId === null &&
        typeof r.values.search === 'number' &&
        typeof r.values.trust === 'number'
    );

    const x = d3.scaleLinear().domain([0, 100]).range([marginLeft, width - marginRight]);
    const y = d3.scaleLinear().domain([0, 100]).range([height - marginBottom, marginTop]);
    const preventionVals = matrixRows.map((r) => r.values.prevention ?? 0);
    const maxPrev = d3.max(preventionVals) || 100;
    const size = d3.scaleSqrt().domain([0, maxPrev]).range([4, 22]);

    // Quadrant shading (median split)
    const medianX = d3.median(matrixRows, (d) => d.values.search as number) || 50;
    const medianY = d3.median(matrixRows, (d) => d.values.trust as number) || 50;

    svg
      .append('rect')
      .attr('x', x(medianX))
      .attr('y', marginTop)
      .attr('width', x(100) - x(medianX))
      .attr('height', y(medianY) - marginTop)
      .attr('fill', '#ecfdf5')
      .attr('opacity', 0.5);
    svg
      .append('rect')
      .attr('x', marginLeft)
      .attr('y', marginTop)
      .attr('width', x(medianX) - marginLeft)
      .attr('height', y(medianY) - marginTop)
      .attr('fill', '#fef3c7')
      .attr('opacity', 0.4);
    svg
      .append('rect')
      .attr('x', x(medianX))
      .attr('y', y(medianY))
      .attr('width', x(100) - x(medianX))
      .attr('height', y(0) - y(medianY))
      .attr('fill', '#dbeafe')
      .attr('opacity', 0.4);
    svg
      .append('rect')
      .attr('x', marginLeft)
      .attr('y', y(medianY))
      .attr('width', x(medianX) - marginLeft)
      .attr('height', y(0) - y(medianY))
      .attr('fill', '#fee2e2')
      .attr('opacity', 0.3);

    // median lines
    svg
      .append('line')
      .attr('x1', x(medianX))
      .attr('x2', x(medianX))
      .attr('y1', marginTop)
      .attr('y2', height - marginBottom)
      .attr('stroke', '#94a3b8')
      .attr('stroke-dasharray', '4,4');
    svg
      .append('line')
      .attr('x1', marginLeft)
      .attr('x2', width - marginRight)
      .attr('y1', y(medianY))
      .attr('y2', y(medianY))
      .attr('stroke', '#94a3b8')
      .attr('stroke-dasharray', '4,4');

    // Axes
    svg
      .append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat((d) => `${d}%`))
      .call((g) => g.select('.domain').attr('stroke', '#cbd5e1'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#cbd5e1'))
      .call((g) =>
        g.selectAll('.tick text').attr('fill', '#64748b').attr('font-size', '11px').attr('font-family', 'Inter Variable, Inter, sans-serif')
      );
    svg
      .append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(6).tickFormat((d) => `${d}%`))
      .call((g) => g.select('.domain').attr('stroke', '#cbd5e1'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#cbd5e1'))
      .call((g) =>
        g.selectAll('.tick text').attr('fill', '#64748b').attr('font-size', '11px').attr('font-family', 'Inter Variable, Inter, sans-serif')
      );

    // Axis labels
    svg
      .append('text')
      .attr('x', (marginLeft + width - marginRight) / 2)
      .attr('y', height - 20)
      .attr('text-anchor', 'middle')
      .attr('fill', METRIC_COLORS.search)
      .attr('font-size', '12px')
      .attr('font-weight', 700)
      .attr('font-family', 'Inter Variable, Inter, sans-serif')
      .text('Suche (Nutzungsanteil %)');
    svg
      .append('text')
      .attr('transform', `rotate(-90)`)
      .attr('x', -(marginTop + (height - marginBottom - marginTop) / 2))
      .attr('y', 18)
      .attr('text-anchor', 'middle')
      .attr('fill', METRIC_COLORS.trust)
      .attr('font-size', '12px')
      .attr('font-weight', 700)
      .attr('font-family', 'Inter Variable, Inter, sans-serif')
      .text('Vertrauen (Nutzungsanteil %)');

    // Quadrant labels
    const qLabel = (xPos: number, yPos: number, text: string, color: string) =>
      svg
        .append('text')
        .attr('x', xPos)
        .attr('y', yPos)
        .attr('text-anchor', 'middle')
        .attr('fill', color)
        .attr('font-size', '10px')
        .attr('font-weight', 600)
        .attr('font-family', 'Inter Variable, Inter, sans-serif')
        .attr('opacity', 0.8)
        .text(text);
    qLabel((x(medianX) + x(100)) / 2, marginTop + 14, 'Viel genutzt & vertraut', '#047857');
    qLabel((marginLeft + x(medianX)) / 2, marginTop + 14, 'Vertraut, wenig genutzt', '#b45309');
    qLabel((x(medianX) + x(100)) / 2, y(0) - 6, 'Viel genutzt, wenig vertraut', '#1d4ed8');
    qLabel((marginLeft + x(medianX)) / 2, y(0) - 6, 'Randständig', '#b91c1c');

    const tooltip = d3.select(tooltipRef.current);

    // Dots
    const dots = svg
      .append('g')
      .selectAll('circle')
      .data(matrixRows)
      .join('circle')
      .attr('cx', (d) => x(d.values.search as number))
      .attr('cy', (d) => y(d.values.trust as number))
      .attr('r', (d) => size(d.values.prevention ?? 0))
      .attr('fill', (d) => d.categoryColor)
      .attr('fill-opacity', 0.55)
      .attr('stroke', (d) => d.categoryColor)
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer');

    dots
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget).transition().duration(100).attr('fill-opacity', 0.85);
        tooltip
          .style('opacity', '1')
          .html(`
            <div style="font-weight:700;font-size:0.82rem;margin-bottom:4px;color:#1e293b">${d.source.name}</div>
            <div style="font-size:0.72rem;color:#64748b;margin-bottom:6px">${GROUP_LABELS[group]}</div>
            <div style="font-size:0.78rem;color:#334155;line-height:1.5">
              <div>Suche: <strong>${(d.values.search as number).toFixed(1)}%</strong></div>
              <div>Vertrauen: <strong>${(d.values.trust as number).toFixed(1)}%</strong></div>
              <div>Prävention: <strong>${d.values.prevention !== undefined ? (d.values.prevention as number).toFixed(1) + '%' : '—'}</strong></div>
            </div>
          `);
      })
      .on('mousemove', (event) => {
        const [mx, my] = d3.pointer(event, containerRef.current);
        tooltip.style('left', `${mx + 14}px`).style('top', `${my - 10}px`);
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).transition().duration(100).attr('fill-opacity', 0.55);
        tooltip.style('opacity', '0');
      });

    // Labels for notable points (top prevention)
    const topByPrev = [...matrixRows]
      .sort((a, b) => (b.values.prevention ?? 0) - (a.values.prevention ?? 0))
      .slice(0, 8);
    svg
      .append('g')
      .selectAll('text.lbl')
      .data(topByPrev)
      .join('text')
      .attr('class', 'lbl')
      .attr('x', (d) => x(d.values.search as number) + size(d.values.prevention ?? 0) + 4)
      .attr('y', (d) => y(d.values.trust as number))
      .attr('dy', '0.35em')
      .attr('fill', '#334155')
      .attr('font-size', '10px')
      .attr('font-family', 'Inter Variable, Inter, sans-serif')
      .text((d) => d.source.name);
  }, [mode, rows, containerWidth, sourceData, group]);

  if (!sourceData) {
    return <div className="carm-loading">Daten werden geladen…</div>;
  }

  return (
    <div className="sources-v2-view">
      {/* Controls */}
      <div className="sources-v2-controls">
        <div className="sources-v2-control-group">
          <span className="sources-v2-label">Ansicht</span>
          <div className="sources-pills">
            <button
              className={`indicator-tag ${mode === 'dumbbell' ? 'active' : ''}`}
              onClick={() => update('sourcesV2Mode', 'dumbbell')}
            >
              Hantel-Diagramm
            </button>
            <button
              className={`indicator-tag ${mode === 'multiples' ? 'active' : ''}`}
              onClick={() => update('sourcesV2Mode', 'multiples')}
            >
              Kleine Diagramme
            </button>
            <button
              className={`indicator-tag ${mode === 'matrix' ? 'active' : ''}`}
              onClick={() => update('sourcesV2Mode', 'matrix')}
            >
              Strategie-Matrix
            </button>
          </div>
        </div>

        <div className="sources-v2-control-group">
          <span className="sources-v2-label">Gruppe</span>
          <div className="sources-pills">
            {GROUP_KEYS.map((g) => (
              <button
                key={g}
                className={`circular-group-btn ${g === group ? 'active' : ''}`}
                onClick={() => update('sourcesV2Group', g)}
              >
                {GROUP_LABELS[g]}
              </button>
            ))}
          </div>
        </div>

        {mode === 'dumbbell' && (
          <div className="sources-v2-control-group">
            <span className="sources-v2-label">Sortierung</span>
            <div className="sources-pills">
              <button
                className={`indicator-tag ${sort === 'prevention' ? 'active' : ''}`}
                onClick={() => update('sourcesV2Sort', 'prevention')}
              >
                Nach Prävention
              </button>
              <button
                className={`indicator-tag ${sort === 'gap' ? 'active' : ''}`}
                onClick={() => update('sourcesV2Sort', 'gap')}
              >
                Nach Lücke (Vertrauen−Suche)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metric legend */}
      <div className="sources-v2-legend">
        {METRIC_KEYS.map((m) => (
          <span key={m} className="sources-legend-item">
            <span
              className="sources-legend-dot"
              style={{ backgroundColor: METRIC_COLORS[m] }}
            />
            {METRIC_LABELS[m]}
          </span>
        ))}
        <span className="sources-v2-legend-divider">•</span>
        <span className="sources-v2-legend-hint">
          Textfarbe = Kategorie · Klick auf Zeile für Unterkategorien
        </span>
      </div>

      {/* Category legend */}
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
