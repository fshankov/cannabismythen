import type { ECharts } from 'echarts';
import type { CarmData, GroupId, Indicator, Myth } from './types';
import { exportCSV } from './data';

const SOURCE_LINE = 'Datenquelle: CaRM-Studie, ISD Hamburg, 2022–2023 · cannabismythen.de';
const SOURCE_LINE_CSV = `# ${SOURCE_LINE}`;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

/** CSV: full filtered dataset, BOM-prefixed for Excel, with a German source
 *  comment row at the top. */
export function downloadFullCSV(
  myths: Myth[],
  metrics: CarmData['metrics'],
  groupIds: GroupId[],
  filename = 'cannabismythen-carm-daten.csv',
) {
  const csv = exportCSV(myths, metrics, groupIds, 'de');
  const body = `${SOURCE_LINE_CSV}\n${csv}`;
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

interface ExportChrome {
  title: string;
  subtitle: string;
  /** Verdict legend swatches — color, label pairs. */
  legend: { color: string; label: string }[];
}

interface ChartExportOpts extends ExportChrome {
  chart: ECharts;
  view: string;
  indicator: Indicator;
  group: GroupId;
}

const CANVAS_PADDING = 24;
const TITLE_HEIGHT = 28;
const SUBTITLE_HEIGHT = 20;
const LEGEND_HEIGHT = 28;
const SOURCE_HEIGHT = 18;

/** PNG export with title, subtitle, legend, and source baked in. The chart
 *  itself is captured at 2× pixelRatio for retina screens. */
export function downloadChartPng(opts: ChartExportOpts) {
  const { chart, title, subtitle, legend, view, indicator, group } = opts;
  const dataUrl = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' });

  const img = new Image();
  img.onload = () => {
    const W = img.width;
    const headerH = (TITLE_HEIGHT + SUBTITLE_HEIGHT) * 2; // *2 because pixelRatio is 2
    const footerH = (LEGEND_HEIGHT + SOURCE_HEIGHT) * 2;
    const totalW = W;
    const totalH = headerH + img.height + footerH + CANVAS_PADDING * 4;

    const canvas = document.createElement('canvas');
    canvas.width = totalW;
    canvas.height = totalH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalW, totalH);

    // Title
    let y = CANVAS_PADDING * 2;
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 32px "Segoe UI", system-ui, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(title, CANVAS_PADDING * 2, y);
    y += TITLE_HEIGHT * 2;

    // Subtitle
    ctx.fillStyle = '#4a5568';
    ctx.font = '24px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(subtitle, CANVAS_PADDING * 2, y);
    y += SUBTITLE_HEIGHT * 2 + CANVAS_PADDING;

    // Chart
    ctx.drawImage(img, 0, y);
    y += img.height + CANVAS_PADDING;

    // Legend swatches + labels
    let lx = CANVAS_PADDING * 2;
    ctx.font = '22px "Segoe UI", system-ui, sans-serif';
    for (const item of legend) {
      ctx.fillStyle = item.color;
      ctx.fillRect(lx, y + 4, 24, 24);
      ctx.fillStyle = '#1a1a2e';
      const labelX = lx + 32;
      ctx.fillText(item.label, labelX, y + 4);
      const w = ctx.measureText(item.label).width;
      lx = labelX + w + 32;
    }
    y += LEGEND_HEIGHT * 2;

    // Source line
    ctx.fillStyle = '#718096';
    ctx.font = '20px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(SOURCE_LINE, CANVAS_PADDING * 2, y);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const filename = `cannabismythen-${view}-${indicator}-${group}.png`;
      downloadBlob(blob, filename);
    }, 'image/png');
  };
  img.src = dataUrl;
}

/** SVG export — the chart itself plus header/footer text wrapped into one SVG. */
export function downloadChartSvg(opts: ChartExportOpts) {
  const { chart, title, subtitle, legend, view, indicator, group } = opts;
  const renderToSvg = (chart as unknown as { renderToSVGString?: () => string }).renderToSVGString;
  const inner =
    typeof renderToSvg === 'function'
      ? renderToSvg.call(chart)
      : chart.getDataURL({ type: 'svg' });

  // Wrap into an outer SVG with title / subtitle / legend / source.
  const innerSvg = inner.startsWith('data:')
    ? decodeURIComponent(inner.replace(/^data:image\/svg\+xml(;base64)?,/, ''))
    : inner;

  const padding = 24;
  const titleH = 28;
  const subtitleH = 20;
  const legendH = 28;
  const sourceH = 18;

  // Pull width/height from the inner svg root attributes, fall back to 800x500.
  const widthMatch = innerSvg.match(/width="(\d+)"/);
  const heightMatch = innerSvg.match(/height="(\d+)"/);
  const innerW = widthMatch ? Number(widthMatch[1]) : 800;
  const innerH = heightMatch ? Number(heightMatch[1]) : 500;

  const totalW = innerW;
  const totalH = padding * 4 + titleH + subtitleH + innerH + legendH + sourceH;

  // Build legend labels
  let lx = padding;
  const legendNodes = legend
    .map((it) => {
      const swatch = `<rect x="${lx}" y="${padding * 3 + titleH + subtitleH + innerH + 4}" width="14" height="14" fill="${it.color}" rx="2"/>`;
      const text = `<text x="${lx + 20}" y="${padding * 3 + titleH + subtitleH + innerH + 16}" font-family="Segoe UI, system-ui, sans-serif" font-size="13" fill="#1a1a2e">${escapeXml(it.label)}</text>`;
      lx += 20 + it.label.length * 7 + 24;
      return swatch + text;
    })
    .join('');

  // Strip outer <svg ...> from inner so we can place it as a <g> with transform
  const innerBody = innerSvg
    .replace(/<\?xml[^?]*\?>/, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
  <rect x="0" y="0" width="${totalW}" height="${totalH}" fill="#ffffff"/>
  <text x="${padding}" y="${padding + 22}" font-family="Segoe UI, system-ui, sans-serif" font-size="20" font-weight="700" fill="#1a1a2e">${escapeXml(title)}</text>
  <text x="${padding}" y="${padding + 22 + subtitleH}" font-family="Segoe UI, system-ui, sans-serif" font-size="14" fill="#4a5568">${escapeXml(subtitle)}</text>
  <g transform="translate(0, ${padding * 2 + titleH + subtitleH})">${innerBody}</g>
  ${legendNodes}
  <text x="${padding}" y="${totalH - padding / 2}" font-family="Segoe UI, system-ui, sans-serif" font-size="12" fill="#718096">${escapeXml(SOURCE_LINE)}</text>
</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const filename = `cannabismythen-${view}-${indicator}-${group}.svg`;
  downloadBlob(blob, filename);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
