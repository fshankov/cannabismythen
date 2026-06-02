import type { ECharts } from 'echarts';
import type { CarmData, CorrectnessClass, GroupId, Indicator, Myth } from './types';
import { exportCSV } from './data';

const SOURCE_LINE = 'Datenquelle: CaRM-Studie, ISD Hamburg, 2024–2025 · cannabismythen.de';
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

/* ========================================================================
   CAR-4 (Harald 2026-05-28) — German-readable, filter-aware export
   filenames. Replaces the old dev-style `cannabismythen-<view>-<eng>-<eng>`
   literals. Shape:
     cannabismythen_<view>_<indikator>_<zielgruppe>[_<mythos>]_<YYYY-MM-DD>.<ext>
   - PNG/SVG (a single chart slice) carry indikator + zielgruppe.
   - CSV/JSON span all five indicators, so they OMIT the indikator block
     and use `daten-explorer` as the <view> token; the fully-unfiltered
     dump uses `rohdaten` in place of the myth segment.
   ===================================================================== */

/** Indicator → German filename token (matches the on-screen column
 *  labels; `correctness` → `richtigkeit` per Fedor 2026-05-29). */
const INDICATOR_FILE_DE: Record<Indicator, string> = {
  awareness: 'kenntnis',
  significance: 'bedeutung',
  correctness: 'richtigkeit',
  prevention_significance: 'praeventionsbedeutung',
  population_relevance: 'bevoelkerungsrelevanz',
};

/** Group → German filename token (ASCII-folded). */
const GROUP_FILE_DE: Record<GroupId, string> = {
  adults: 'erwachsene',
  minors: 'minderjaehrige',
  consumers: 'konsumierende',
  young_adults: 'junge-erwachsene',
  parents: 'eltern',
};

/** Lowercase, ASCII-fold (ü→ue, ä→ae, ö→oe, ß→ss), collapse non-alnum
 *  runs to single hyphens. Used for the myth-title slug. */
function slugifyAscii(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Today as YYYY-MM-DD (local). */
function isoDateStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Myth segment: 1 selected → `m<NN>-<slug>`; a strict subset → `<n>-mythen`;
 *  full deck / unknown → '' (caller decides on `rohdaten`). */
function mythSegment(myths: Myth[], totalMyths?: number): string {
  if (myths.length === 1) {
    const m = myths[0];
    return `m${String(m.id).padStart(2, '0')}-${slugifyAscii(m.text_short_de)}`;
  }
  if (totalMyths && myths.length > 0 && myths.length < totalMyths) {
    return `${myths.length}-mythen`;
  }
  return '';
}

export interface ExportFilenameOpts {
  /** 'chart' = PNG/SVG (indicator-specific slice); 'data' = CSV/JSON
   *  (spans all indicators). */
  kind: 'chart' | 'data';
  ext: string;
  view: string;
  indicator?: Indicator;
  group?: GroupId;
  myths: Myth[];
  /** Full myth count for "is this the whole deck?" detection. */
  totalMyths?: number;
}

export function buildExportFilename(opts: ExportFilenameOpts): string {
  const { kind, ext, view, indicator, group, myths, totalMyths } = opts;
  const date = isoDateStamp();
  const myth = mythSegment(myths, totalMyths);

  if (kind === 'chart') {
    const ind = indicator ? INDICATOR_FILE_DE[indicator] : '';
    const grp = group ? GROUP_FILE_DE[group] : '';
    const parts = ['cannabismythen', view, ind, grp, myth, date].filter(Boolean);
    return `${parts.join('_')}.${ext}`;
  }

  // kind === 'data' (CSV/JSON) — spans all indicators, omit the indikator
  // block. No myth filter → `rohdaten`; otherwise the myth segment.
  const grp = group ? GROUP_FILE_DE[group] : '';
  const datasetSeg = myth || 'rohdaten';
  const parts = ['cannabismythen', 'daten-explorer', grp, datasetSeg, date].filter(Boolean);
  return `${parts.join('_')}.${ext}`;
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
 *
 * TODO (D2, Asana 1215204492126785) — once ISD approves the
 * Information-Sources export, add `downloadFullSourcesCSV` /
 * `downloadFullSourcesJSON` here, keyed by source_id × source_metric ×
 * group, using the same `buildExportFilename` convention with
 * view='sources'. Blocked on ISD sign-off; do not implement until then.
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
    keine_aussage_moeglich: 'Keine Aussage möglich',
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
  /** Verdict legend entries. `verdict` (when set) triggers the
   *  verdict-arrow glyph rendering — matching the on-page Punktwolke /
   *  Spannweite arrow language. `color` is the line/swatch fallback. */
  legend: { color: string; label: string; verdict?: CorrectnessClass }[];
}

export type ChartHandle = ECharts | SVGElement;

interface ChartExportOpts extends ExportChrome {
  chart: ChartHandle;
  view: string;
  indicator: Indicator;
  group: GroupId;
  /** Filtered myth list + full count — drive the German filename's myth
   *  segment (CAR-4). Optional so legacy callers still compile; when
   *  omitted the filename omits the myth block. */
  myths?: Myth[];
  totalMyths?: number;
}

const CANVAS_PADDING = 24;
const TITLE_HEIGHT = 28;
const SUBTITLE_HEIGHT = 20;
const LEGEND_HEIGHT = 28;
const SOURCE_HEIGHT = 18;

/** Verdict-arrow glyph colours (foreground + shadow) and rotation —
 *  must mirror `verdictArrowSymbols.tsx` exactly so the PNG legend
 *  reads identically to the on-page glyphs. */
const VERDICT_GLYPH_GEOMETRY: Record<CorrectnessClass, { fg: string; shadow: string; rotation: number }> = {
  richtig:           { fg: '#047857', shadow: '#a7d3c5', rotation: Math.PI }, // 180°
  eher_richtig:      { fg: '#4d7c0f', shadow: '#c2d3a3', rotation: -3 * Math.PI / 4 }, // -135°
  eher_falsch:       { fg: '#b45309', shadow: '#e0b58d', rotation: Math.PI / 4 }, // 45°
  falsch:            { fg: '#be123c', shadow: '#e9a8b9', rotation: 0 },
  keine_aussage_moeglich: { fg: '#6b7280', shadow: '#94a3b8', rotation: 0 },
};

/** Draw a verdict-arrow glyph centred at (cx, cy) on a 2D canvas. Size
 *  is the rendered glyph diameter in canvas pixels. Geometry mirrors
 *  the 24×24 viewBox of `verdictArrowSymbols.tsx`. */
function drawVerdictGlyph(
  ctx: CanvasRenderingContext2D,
  verdict: CorrectnessClass,
  cx: number,
  cy: number,
  size: number,
): void {
  const { fg, shadow, rotation } = VERDICT_GLYPH_GEOMETRY[verdict];
  const scale = size / 24;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.translate(-12, -12); // viewBox origin
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Shadow horizontal line at y=16.
  ctx.beginPath();
  ctx.moveTo(2, 16);
  ctx.lineTo(22, 16);
  ctx.strokeStyle = shadow;
  ctx.stroke();

  if (verdict !== 'keine_aussage_moeglich') {
    // Shaft.
    ctx.beginPath();
    ctx.moveTo(12, 2);
    ctx.lineTo(12, 16);
    ctx.strokeStyle = fg;
    ctx.stroke();
    // Chevron.
    ctx.beginPath();
    ctx.moveTo(5, 9);
    ctx.lineTo(12, 16);
    ctx.lineTo(19, 9);
    ctx.stroke();
  }
  ctx.restore();
}

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
  revealExportOnly(clone);
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
  const { chart, title, subtitle, legend, view, indicator, group, myths, totalMyths } = opts;
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

  // Legend: verdict-arrow glyphs (when `verdict` is set) or colour
  // swatches (fallback). Same visual language as the on-page Punktwolke
  // / Spannweite marker so the legend reads as the site, not as a
  // generic chart key.
  let lx = CANVAS_PADDING * 2;
  ctx.font = '22px "Segoe UI", system-ui, sans-serif';
  const glyphSize = 28; // rendered diameter on-canvas (*2 for retina)
  for (const item of legend) {
    if (item.verdict) {
      drawVerdictGlyph(ctx, item.verdict, lx + glyphSize / 2, y + 4 + glyphSize / 2, glyphSize);
    } else {
      ctx.fillStyle = item.color;
      ctx.fillRect(lx, y + 4, 24, 24);
    }
    ctx.fillStyle = '#1a1a2e';
    const labelX = lx + glyphSize + 10;
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
      const filename = buildExportFilename({
        kind: 'chart', ext: 'png', view, indicator, group,
        myths: myths ?? [], totalMyths,
      });
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
  revealExportOnly(clone);
  return { svg: new XMLSerializer().serializeToString(clone), width: w, height: h };
}

/**
 * Session 4b (BugHerd #55): the StripsView and SourcesStripsView render
 * column headers as absolutely-positioned HTML overlays *outside* the
 * SVG, and value pills only render when a myth/source is in focus. Both
 * are invisible to the SVG serializer, so the exported PNG/SVG was
 * showing empty header rectangles and no per-dot values.
 *
 * Fix: those views now render in-SVG mirrors of the headers + per-dot
 * value labels inside `<g data-export-only="true">` groups, hidden in
 * normal viewing via inline `style="display: none"`. This helper walks
 * the export clone and removes that inline style so the elements paint
 * into the canvas / serialised SVG.
 *
 * Why inline style and not CSS: the CSS class scope doesn't apply to a
 * detached clone fed to an offscreen Image, and stylesheets aren't
 * carried into the serialised SVG body. Inline style is the only signal
 * that survives both rendering paths.
 */
function revealExportOnly(root: SVGElement): void {
  const exportEls = root.querySelectorAll<SVGElement>('[data-export-only="true"]');
  exportEls.forEach((el) => {
    // Some browsers serialise `style.display` cleared as an empty
    // attribute; setting via removeProperty is the cleanest.
    el.style.removeProperty('display');
    el.removeAttribute('display');
  });
}

/** SVG export — the chart itself plus header/footer text wrapped into one SVG. */
export function downloadChartSvg(opts: ChartExportOpts) {
  const { chart, title, subtitle, legend, view, indicator, group, myths, totalMyths } = opts;
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
  const filename = buildExportFilename({
    kind: 'chart', ext: 'svg', view, indicator, group,
    myths: myths ?? [], totalMyths,
  });
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
