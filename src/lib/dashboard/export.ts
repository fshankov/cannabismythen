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

/**
 * JSON: full filtered dataset as a structured array of records, useful for
 * researchers and integrations.
 *
 * Each row is one myth × group × indicator combination so the file can be
 * loaded into pandas / R / a database without further reshaping.
 *
 * Stage 3 of the Daten-Explorer refactor added this so the OWID-style
 * export dialog has a "JSON (Rohdaten)" companion to the CSV row.
 */
export function downloadFullJSON(
  myths: Myth[],
  metrics: CarmData['metrics'],
  groupIds: GroupId[],
  filename = 'cannabismythen-carm-daten.json',
) {
  const indicators: Indicator[] = [
    'awareness',
    'significance',
    'correctness',
    'prevention_significance',
    'population_relevance',
  ];
  type Row = {
    mythId: number;
    statement_de: string;
    category_de: string;
    classification: string;
    classificationLabel_de: string;
    group: GroupId;
    indicator: Indicator;
    value: number | null;
  };
  const VERDICT_DE: Record<string, string> = {
    richtig: 'Richtig',
    eher_richtig: 'Eher richtig',
    eher_falsch: 'Eher falsch',
    falsch: 'Falsch',
    no_classification: 'Keine Aussage möglich',
  };
  const rows: Row[] = [];
  for (const m of myths) {
    for (const g of groupIds) {
      const metric = metrics.find(
        (mm) => mm.myth_id === m.id && mm.group_id === g,
      );
      if (!metric) continue;
      for (const ind of indicators) {
        const v = metric[ind];
        rows.push({
          mythId: m.id,
          statement_de: m.text_de,
          category_de: m.category_de,
          classification: m.correctness_class,
          classificationLabel_de: VERDICT_DE[m.correctness_class] ?? '',
          group: g,
          indicator: ind,
          value: typeof v === 'number' ? v : null,
        });
      }
    }
  }
  const payload = {
    source: SOURCE_LINE,
    exportedAt: new Date().toISOString(),
    rowCount: rows.length,
    rows,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  downloadBlob(blob, filename);
}

interface ExportChrome {
  title: string;
  subtitle: string;
  /** Verdict legend swatches — color, label pairs. */
  legend: { color: string; label: string }[];
}

export type ChartHandle = ECharts | SVGElement;

interface ChartExportOpts extends ExportChrome {
  chart: ChartHandle;
  view: string;
  indicator: Indicator;
  group: GroupId;
}

const CANVAS_PADDING = 24;
const TITLE_HEIGHT = 28;
const SUBTITLE_HEIGHT = 20;
const LEGEND_HEIGHT = 28;
const SOURCE_HEIGHT = 18;

/** Type guard distinguishing the ECharts instance from a raw SVGElement. */
function isEcharts(chart: ChartHandle): chart is ECharts {
  return (
    typeof (chart as ECharts).getDataURL === 'function' &&
    typeof (chart as { tagName?: string }).tagName !== 'string'
  );
}

/**
 * Get a PNG data URL for either an ECharts instance or a raw SVG element.
 *
 * The SVG path serialises the element, draws it onto an offscreen
 * canvas via an Image, and returns a 2× pixelRatio data URL so the
 * resulting PNG is retina-sharp.
 */
function chartToPngDataUrl(chart: ChartHandle): Promise<{ dataUrl: string; width: number; height: number }> {
  if (isEcharts(chart)) {
    const dataUrl = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' });
    // Echarts already accounts for pixelRatio; we still need to know the
    // pixel dimensions so the outer canvas can size correctly.
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ dataUrl, width: img.width, height: img.height });
      img.onerror = reject;
      img.src = dataUrl;
    });
  }
  // Raw SVG path (StripsView / SourcesStripsView).
  const svgEl = chart;
  const w = Number(svgEl.getAttribute('width')) || svgEl.clientWidth || 800;
  const h = Number(svgEl.getAttribute('height')) || svgEl.clientHeight || 500;
  // Clone + add xmlns so the serialised SVG is self-contained.
  const clone = svgEl.cloneNode(true) as SVGElement;
  if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  const xml = new XMLSerializer().serializeToString(clone);
  const svg64 = btoa(unescape(encodeURIComponent(xml)));
  const svgDataUrl = `data:image/svg+xml;base64,${svg64}`;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
      });
    };
    img.onerror = reject;
    img.src = svgDataUrl;
  });
}

/** PNG export with title, subtitle, legend, and source baked in. The chart
 *  itself is captured at 2× pixelRatio for retina screens. */
export async function downloadChartPng(opts: ChartExportOpts) {
  const { chart, title, subtitle, legend, view, indicator, group } = opts;
  const { dataUrl, width: chartW, height: chartH } = await chartToPngDataUrl(chart);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = dataUrl;
  });

  const W = chartW;
  const headerH = (TITLE_HEIGHT + SUBTITLE_HEIGHT) * 2; // *2 because pixelRatio is 2
  const footerH = (LEGEND_HEIGHT + SOURCE_HEIGHT) * 2;
  const totalW = W;
  const totalH = headerH + chartH + footerH + CANVAS_PADDING * 4;

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
  y += chartH + CANVAS_PADDING;

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

  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve();
        return;
      }
      const filename = `cannabismythen-${view}-${indicator}-${group}.png`;
      downloadBlob(blob, filename);
      resolve();
    }, 'image/png');
  });
}

/** Get a self-contained SVG string for either an ECharts instance or a
 *  raw SVG element. The Streifen / Sources views render with D3, so we
 *  serialise their live `<svg>` directly. */
function chartToSvgString(chart: ChartHandle): { svg: string; width: number; height: number } {
  if (isEcharts(chart)) {
    const renderToSvg = (chart as unknown as { renderToSVGString?: () => string }).renderToSVGString;
    const inner =
      typeof renderToSvg === 'function'
        ? renderToSvg.call(chart)
        : chart.getDataURL({ type: 'svg' });
    const innerSvg = inner.startsWith('data:')
      ? decodeURIComponent(inner.replace(/^data:image\/svg\+xml(;base64)?,/, ''))
      : inner;
    const widthMatch = innerSvg.match(/width="(\d+)"/);
    const heightMatch = innerSvg.match(/height="(\d+)"/);
    return {
      svg: innerSvg,
      width: widthMatch ? Number(widthMatch[1]) : 800,
      height: heightMatch ? Number(heightMatch[1]) : 500,
    };
  }
  // Raw SVGElement — clone and ensure xmlns + dimensions are present.
  const svgEl = chart;
  const w = Number(svgEl.getAttribute('width')) || svgEl.clientWidth || 800;
  const h = Number(svgEl.getAttribute('height')) || svgEl.clientHeight || 500;
  const clone = svgEl.cloneNode(true) as SVGElement;
  if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  return { svg: new XMLSerializer().serializeToString(clone), width: w, height: h };
}

/** SVG export — the chart itself plus header/footer text wrapped into one SVG. */
export function downloadChartSvg(opts: ChartExportOpts) {
  const { chart, title, subtitle, legend, view, indicator, group } = opts;
  const { svg: innerSvg, width: innerW, height: innerH } = chartToSvgString(chart);

  const padding = 24;
  const titleH = 28;
  const subtitleH = 20;
  const legendH = 28;
  const sourceH = 18;

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

/**
 * Generate a PNG data-URL preview thumbnail for the export dialog.
 * Same source as downloadChartPng but without baked title / legend /
 * source — those would be illegible at 120×80 anyway. Resolution is
 * intentionally low (1× pixelRatio) since the thumb is rendered at
 * roughly that size in the dialog.
 */
export async function chartPreviewDataUrl(chart: ChartHandle): Promise<string | null> {
  try {
    if (isEcharts(chart)) {
      return chart.getDataURL({ type: 'png', pixelRatio: 1, backgroundColor: '#ffffff' });
    }
    const svgEl = chart;
    const w = Number(svgEl.getAttribute('width')) || svgEl.clientWidth || 600;
    const h = Number(svgEl.getAttribute('height')) || svgEl.clientHeight || 400;
    const clone = svgEl.cloneNode(true) as SVGElement;
    if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(w));
    clone.setAttribute('height', String(h));
    const xml = new XMLSerializer().serializeToString(clone);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const svgDataUrl = `data:image/svg+xml;base64,${svg64}`;
    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = svgDataUrl;
    });
  } catch {
    return null;
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
