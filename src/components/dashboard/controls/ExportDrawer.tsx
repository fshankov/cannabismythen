/**
 * ExportDrawer — OWID-style tabbed dialog (Stage 3 of the
 * Daten-Explorer refactor).
 *
 * Two tabs at the top:
 *   - Visualisierung: PNG (Bild) + SVG (Vektor) rows. Each row carries
 *     a thumbnail preview of the live chart so the user knows exactly
 *     what they're about to download. Tabelle disables both rows with
 *     a German fallback message — only Daten downloads work there.
 *   - Daten: CSV + JSON rows.
 *
 * Drawer variant is `'modal'` (centered on desktop ≥1024px, max-width
 * 720px; bottom-sheet on mobile <1024px).
 *
 * Filenames:
 *   - cannabismythen-{view}-{indicator}-{group}.{png|svg}
 *   - cannabismythen-carm-daten.{csv|json}
 *
 * The chart handle returned by `getChart()` may be either an ECharts
 * instance (Balken) or a raw SVGElement (Streifen, Sources). Tabelle
 * returns null and the Visualisierung tab disables.
 */

import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, FileImage, FileJson } from 'lucide-react';
import type { CarmData, GroupId, Indicator, Myth } from '../../../lib/dashboard/types';
import Drawer from '../../shared/Drawer';
import {
  downloadFullCSV,
  downloadFullJSON,
  downloadChartPng,
  downloadChartSvg,
  chartPreviewDataUrl,
  type ChartHandle,
} from '../../../lib/dashboard/export';
import { getCorrectnessColor } from '../../../lib/dashboard/colors';
import { t } from '../../../lib/dashboard/translations';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Full myth list (filtered for the current view) — used by the data exports. */
  myths: Myth[];
  /** Full metric list. */
  metrics: CarmData['metrics'];
  /** Current group selection — first id is used for image export filenames. */
  groupIds: GroupId[];
  indicator: Indicator;
  /** Slug used in PNG / SVG filenames (e.g. 'balken', 'strips', 'sources'). */
  view: string;
  /** Returns the active chart handle for image exports. May be `null` when
   *  the active view doesn't expose a chart (Tabelle). */
  getChart: () => ChartHandle | null;
  /** Chart chrome — title + subtitle baked into PNG / SVG. */
  chartChrome: () => { title: string; subtitle: string };
}

const VERDICT_LEGEND = [
  { color: getCorrectnessColor('richtig'), key: 'verdict.richtig' as const },
  { color: getCorrectnessColor('eher_richtig'), key: 'verdict.eher_richtig' as const },
  { color: getCorrectnessColor('eher_falsch'), key: 'verdict.eher_falsch' as const },
  { color: getCorrectnessColor('falsch'), key: 'verdict.falsch' as const },
];

type DialogTab = 'visual' | 'data';

export default function ExportDrawer({
  open,
  onClose,
  myths,
  metrics,
  groupIds,
  indicator,
  view,
  getChart,
  chartChrome,
}: Props) {
  const legend = useMemo(
    () => VERDICT_LEGEND.map((v) => ({ color: v.color, label: t(v.key, 'de') })),
    [],
  );
  const [tab, setTab] = useState<DialogTab>('visual');
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

  // Tabelle has no chart → Visualisierung tab disables. Default tab
  // resets to Daten so users don't see an empty visual tab on open.
  useEffect(() => {
    if (!open) return;
    const chart = getChart();
    setTab(chart ? 'visual' : 'data');
  }, [open, getChart]);

  const hasChart = !!getChart();

  const handleCsv = () => {
    downloadFullCSV(myths, metrics, groupIds);
    onClose();
  };

  const handleJson = () => {
    downloadFullJSON(myths, metrics, groupIds);
    onClose();
  };

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
    });
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      variant="modal"
      title={t('export.title', 'de')}
    >
      {/* Tab strip — Visualisierung | Daten. The OWID dialog uses
          plain underlined tabs at the top of the dialog body. */}
      <div
        className="carm-export-tabs"
        role="tablist"
        aria-label={t('export.title', 'de')}
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'visual'}
          className={`carm-export-tabs__tab ${tab === 'visual' ? 'active' : ''}`}
          onClick={() => setTab('visual')}
        >
          {t('export.tab.visualization', 'de')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'data'}
          className={`carm-export-tabs__tab ${tab === 'data' ? 'active' : ''}`}
          onClick={() => setTab('data')}
        >
          {t('export.tab.data', 'de')}
        </button>
      </div>

      {tab === 'visual' && (
        <ul className="carm-export-list" role="list">
          {!hasChart && (
            <li
              className="carm-export-empty"
              aria-live="polite"
            >
              {t('export.unavailable.table', 'de')}
            </li>
          )}
          <ExportRow
            disabled={!hasChart}
            previewDataUrl={previewDataUrl}
            previewAlt={t('export.preview.label', 'de')}
            icon={<FileImage size={20} strokeWidth={2} />}
            title={t('export.png.title', 'de')}
            desc={t('export.png.desc', 'de')}
            onClick={handlePng}
          />
          <ExportRow
            disabled={!hasChart}
            previewDataUrl={previewDataUrl}
            previewAlt={t('export.preview.label', 'de')}
            icon={<FileImage size={20} strokeWidth={2} />}
            title={t('export.svg.title', 'de')}
            desc={t('export.svg.desc', 'de')}
            onClick={handleSvg}
          />
        </ul>
      )}

      {tab === 'data' && (
        <ul className="carm-export-list" role="list">
          <ExportRow
            icon={<FileText size={20} strokeWidth={2} />}
            title={t('export.csv.title', 'de')}
            desc={t('export.csv.desc', 'de')}
            onClick={handleCsv}
          />
          <ExportRow
            icon={<FileJson size={20} strokeWidth={2} />}
            title={t('export.json.title', 'de')}
            desc={t('export.json.desc', 'de')}
            onClick={handleJson}
          />
        </ul>
      )}
    </Drawer>
  );
}

interface ExportRowProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
  previewDataUrl?: string | null;
  previewAlt?: string;
}

/**
 * One row inside either the Visualisierung or Daten tab.
 *
 * Layout: [thumbnail? | icon] · title + 1-line desc · download chevron.
 * Matches the Our World in Data download dialog's row geometry.
 */
function ExportRow({
  icon,
  title,
  desc,
  onClick,
  disabled,
  previewDataUrl,
  previewAlt,
}: ExportRowProps) {
  return (
    <li>
      <button
        type="button"
        className="carm-export-row"
        onClick={onClick}
        disabled={disabled}
      >
        {previewDataUrl ? (
          <span className="carm-export-row__thumb" aria-hidden="true">
            <img
              src={previewDataUrl}
              alt={previewAlt ?? ''}
              loading="lazy"
            />
          </span>
        ) : (
          <span className="carm-export-row__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="carm-export-row__text">
          <span className="carm-export-row__title">{title}</span>
          <span className="carm-export-row__desc">{desc}</span>
        </span>
        <Download
          size={18}
          strokeWidth={2}
          aria-hidden="true"
          className="carm-export-row__cta"
        />
      </button>
    </li>
  );
}
