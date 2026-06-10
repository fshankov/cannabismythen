/**
 * ExportDrawer — the Daten-Explorer download dialog.
 *
 * A single view (no tabs) presenting four formats as a 2×2 grid:
 *   - PNG (Bild)   — the live chart at 2× (image export)
 *   - SVG (Vektor) — the live chart as vector (image export)
 *   - Excel        — the complete CaRM workbook, a static file in public/
 *   - CSV          — the current filtered selection as a table
 *
 * PNG/SVG carry a thumbnail of the live chart so the user sees exactly
 * what they'll download; in Tabelle view (no chart) both are disabled and
 * a note points the user to a chart view. Excel and CSV are always
 * available. Excel is a native `<a download>` to a static asset (mirrors
 * the PDF download in FactsheetPanel); the other three run through the
 * exporters in `lib/dashboard/export.ts`.
 *
 * Drawer variant is `'modal'` (centered on desktop ≥1024px, max-width
 * 720px; bottom-sheet on mobile <1024px).
 *
 * Filenames:
 *   - cannabismythen-{view}-{indicator}-{group}.{png|svg}
 *   - cannabismythen-{…}.csv
 *   - cannabismythen-daten.xlsx (static)
 */

import { useEffect, useMemo, useState } from 'react';
import { Download, FileImage, FileSpreadsheet, Table } from 'lucide-react';
import type { CarmData, GroupId, Indicator, Myth } from '../../../lib/dashboard/types';
import Drawer from '../../shared/Drawer';
import {
  downloadFullCSV,
  downloadChartPng,
  downloadChartSvg,
  chartPreviewDataUrl,
  buildExportFilename,
  type ChartHandle,
} from '../../../lib/dashboard/export';
import { getCorrectnessColor } from '../../../lib/dashboard/colors';
import { t } from '../../../lib/dashboard/translations';

/** Static CaRM workbook served from public/ (the file is maintained by hand). */
const EXCEL_HREF = '/cannabismythen-daten.xlsx';
const EXCEL_FILENAME = 'cannabismythen-daten.xlsx';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Full myth list (filtered for the current view) — used by the CSV export. */
  myths: Myth[];
  /** Full metric list. */
  metrics: CarmData['metrics'];
  /** Current group selection — first id is used for image / CSV filenames. */
  groupIds: GroupId[];
  indicator: Indicator;
  /** Slug used in PNG / SVG filenames (e.g. 'balken', 'strips', 'sources'). */
  view: string;
  /** Full myth count (unfiltered) — lets the export filename detect the
   *  "whole deck" case (→ `rohdaten`) vs a filtered subset (CAR-4). */
  totalMyths?: number;
  /** Returns the active chart handle for image exports. May be `null` when
   *  the active view doesn't expose a chart (Tabelle). */
  getChart: () => ChartHandle | null;
  /** Chart chrome — title + subtitle baked into PNG / SVG. */
  chartChrome: () => { title: string; subtitle: string };
}

const VERDICT_LEGEND = [
  { verdict: 'richtig' as const, color: getCorrectnessColor('richtig'), key: 'verdict.richtig' as const },
  { verdict: 'eher_richtig' as const, color: getCorrectnessColor('eher_richtig'), key: 'verdict.eher_richtig' as const },
  { verdict: 'eher_falsch' as const, color: getCorrectnessColor('eher_falsch'), key: 'verdict.eher_falsch' as const },
  { verdict: 'falsch' as const, color: getCorrectnessColor('falsch'), key: 'verdict.falsch' as const },
];

export default function ExportDrawer({
  open,
  onClose,
  myths,
  metrics,
  groupIds,
  indicator,
  view,
  totalMyths,
  getChart,
  chartChrome,
}: Props) {
  const legend = useMemo(
    () => VERDICT_LEGEND.map((v) => ({
      verdict: v.verdict,
      color: v.color,
      label: t(v.key, 'de'),
    })),
    [],
  );
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  // Whenever the dialog opens or the active chart changes, regenerate
  // the preview thumbnail. ECharts and the D3 SVGs both work here.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const chart = getChart();
    if (!chart) {
      setPreviewDataUrl(null);
      return;
    }
    chartPreviewDataUrl(chart).then((url) => {
      if (!cancelled) setPreviewDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [open, getChart]);

  const hasChart = !!getChart();

  const handlePng = () => {
    const chart = getChart();
    if (!chart) return;
    const { title, subtitle } = chartChrome();
    downloadChartPng({
      chart,
      title,
      subtitle,
      legend,
      view,
      indicator,
      group: groupIds[0] ?? 'adults',
      myths,
      totalMyths,
    });
    onClose();
  };

  const handleSvg = () => {
    const chart = getChart();
    if (!chart) return;
    const { title, subtitle } = chartChrome();
    downloadChartSvg({
      chart,
      title,
      subtitle,
      legend,
      view,
      indicator,
      group: groupIds[0] ?? 'adults',
      myths,
      totalMyths,
    });
    onClose();
  };

  const handleCsv = () => {
    downloadFullCSV(
      myths, metrics, groupIds,
      buildExportFilename({
        kind: 'data', ext: 'csv', view, group: groupIds[0] ?? 'adults',
        myths, totalMyths,
      }),
    );
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      variant="modal"
      title={t('export.title', 'de')}
    >
      <p className="carm-export-intro">{t('export.intro', 'de')}</p>

      <div className="carm-export-grid">
        {/* Image exports — capture the live chart. Disabled in Tabelle. */}
        <ExportCard
          disabled={!hasChart}
          previewDataUrl={previewDataUrl}
          previewAlt={t('export.preview.label', 'de')}
          fallbackIcon={<FileImage size={28} strokeWidth={1.75} />}
          title={t('export.png.title', 'de')}
          desc={t('export.png.desc', 'de')}
          onClick={handlePng}
        />
        <ExportCard
          disabled={!hasChart}
          previewDataUrl={previewDataUrl}
          previewAlt={t('export.preview.label', 'de')}
          fallbackIcon={<FileImage size={28} strokeWidth={1.75} />}
          title={t('export.svg.title', 'de')}
          desc={t('export.svg.desc', 'de')}
          onClick={handleSvg}
        />
        {/* Data exports — Excel is the full static workbook, CSV the
            current filtered selection. */}
        <ExportCard
          icon={<FileSpreadsheet size={28} strokeWidth={1.75} />}
          title={t('export.excel.title', 'de')}
          desc={t('export.excel.desc', 'de')}
          href={EXCEL_HREF}
          downloadName={EXCEL_FILENAME}
          onClick={onClose}
        />
        <ExportCard
          icon={<Table size={28} strokeWidth={1.75} />}
          title={t('export.csv.title', 'de')}
          desc={t('export.csv.desc', 'de')}
          onClick={handleCsv}
        />
      </div>

      {!hasChart && (
        <p className="carm-export-note" aria-live="polite">
          {t('export.images.note', 'de')}
        </p>
      )}
    </Drawer>
  );
}

interface ExportCardProps {
  title: string;
  desc: string;
  /** Format icon for the data cards (Excel/CSV). */
  icon?: React.ReactNode;
  /** Fallback icon for the image cards when there's no preview (disabled). */
  fallbackIcon?: React.ReactNode;
  previewDataUrl?: string | null;
  previewAlt?: string;
  disabled?: boolean;
  /** When set, the card renders as a download `<a>` (Excel static file). */
  href?: string;
  downloadName?: string;
  onClick?: () => void;
}

/**
 * One card in the 2×2 export grid.
 *
 * Layout: a media block on top (live chart thumbnail for PNG/SVG, or a
 * centered format icon for Excel/CSV) with the title + 1-line description
 * below. Renders as an `<a download>` when `href` is set (Excel),
 * otherwise a `<button>`. Equal media height keeps the cards aligned.
 */
function ExportCard({
  title,
  desc,
  icon,
  fallbackIcon,
  previewDataUrl,
  previewAlt,
  disabled,
  href,
  downloadName,
  onClick,
}: ExportCardProps) {
  const media = previewDataUrl ? (
    <span className="carm-export-card__media" aria-hidden="true">
      <img src={previewDataUrl} alt={previewAlt ?? ''} loading="lazy" />
    </span>
  ) : (
    <span
      className="carm-export-card__media carm-export-card__media--icon"
      aria-hidden="true"
    >
      {icon ?? fallbackIcon}
    </span>
  );

  const body = (
    <>
      {media}
      <span className="carm-export-card__text">
        <span className="carm-export-card__title">{title}</span>
        <span className="carm-export-card__desc">{desc}</span>
      </span>
      <span className="carm-export-card__cta" aria-hidden="true">
        <Download size={16} strokeWidth={2} />
      </span>
    </>
  );

  if (href) {
    return (
      <a
        className="carm-export-card"
        href={href}
        download={downloadName}
        onClick={onClick}
      >
        {body}
      </a>
    );
  }

  return (
    <button
      type="button"
      className="carm-export-card"
      onClick={onClick}
      disabled={disabled}
    >
      {body}
    </button>
  );
}
