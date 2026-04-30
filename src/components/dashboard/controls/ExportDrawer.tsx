import { Download, FileText, FileImage } from 'lucide-react';
import type { ECharts } from 'echarts';
import type { CarmData, GroupId, Indicator, Myth } from '../../../lib/dashboard/types';
import Drawer from '../../shared/Drawer';
import { downloadFullCSV, downloadChartPng, downloadChartSvg } from '../../../lib/dashboard/export';
import { getCorrectnessColor } from '../../../lib/dashboard/colors';
import { t } from '../../../lib/dashboard/translations';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Full myth list (filtered for the current view) — used by the CSV export. */
  myths: Myth[];
  /** Full metric list. */
  metrics: CarmData['metrics'];
  /** Current group selection — first id is used for CSV columns + filename. */
  groupIds: GroupId[];
  indicator: Indicator;
  /** Slug used in PNG / SVG filenames (e.g. 'balken'). */
  view: string;
  /** Returns the active ECharts instance for image exports. May be null when
   *  the active view doesn't expose a chart (Tabelle). */
  getChart: () => ECharts | null;
  /** Chart chrome — title, subtitle, legend baked into PNG / SVG. */
  chartChrome: () => { title: string; subtitle: string };
}

const VERDICT_LEGEND = [
  { color: getCorrectnessColor('richtig'), key: 'verdict.richtig' as const },
  { color: getCorrectnessColor('eher_richtig'), key: 'verdict.eher_richtig' as const },
  { color: getCorrectnessColor('eher_falsch'), key: 'verdict.eher_falsch' as const },
  { color: getCorrectnessColor('falsch'), key: 'verdict.falsch' as const },
];

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
  const legend = VERDICT_LEGEND.map((v) => ({ color: v.color, label: t(v.key, 'de') }));

  const handleCsv = () => {
    downloadFullCSV(myths, metrics, groupIds);
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

  const hasChart = !!getChart();

  return (
    <Drawer open={open} onClose={onClose} side="right" size="md" title={t('export.title', 'de')}>
      <ul className="carm-export-list" role="list">
        <li>
          <button type="button" className="carm-export-row" onClick={handleCsv}>
            <span className="carm-export-row__icon" aria-hidden="true">
              <FileText size={20} strokeWidth={2} />
            </span>
            <span className="carm-export-row__text">
              <span className="carm-export-row__title">{t('export.csv.title', 'de')}</span>
              <span className="carm-export-row__desc">{t('export.csv.desc', 'de')}</span>
            </span>
            <Download size={18} strokeWidth={2} aria-hidden="true" className="carm-export-row__cta" />
          </button>
        </li>
        <li>
          <button
            type="button"
            className="carm-export-row"
            onClick={handlePng}
            disabled={!hasChart}
          >
            <span className="carm-export-row__icon" aria-hidden="true">
              <FileImage size={20} strokeWidth={2} />
            </span>
            <span className="carm-export-row__text">
              <span className="carm-export-row__title">{t('export.png.title', 'de')}</span>
              <span className="carm-export-row__desc">{t('export.png.desc', 'de')}</span>
            </span>
            <Download size={18} strokeWidth={2} aria-hidden="true" className="carm-export-row__cta" />
          </button>
        </li>
        <li>
          <button
            type="button"
            className="carm-export-row"
            onClick={handleSvg}
            disabled={!hasChart}
          >
            <span className="carm-export-row__icon" aria-hidden="true">
              <FileImage size={20} strokeWidth={2} />
            </span>
            <span className="carm-export-row__text">
              <span className="carm-export-row__title">{t('export.svg.title', 'de')}</span>
              <span className="carm-export-row__desc">{t('export.svg.desc', 'de')}</span>
            </span>
            <Download size={18} strokeWidth={2} aria-hidden="true" className="carm-export-row__cta" />
          </button>
        </li>
      </ul>
    </Drawer>
  );
}
