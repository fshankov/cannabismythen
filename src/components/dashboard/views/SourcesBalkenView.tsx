/**
 * SourcesBalkenView — Balken-style overview of information sources.
 *
 * Travel pipeline 2026-05-23 — Stage 3B. Replaces SourcesStripsView in the
 * right-side first tab so Mythen and Quellen share the same visual idiom
 * (grid + lollipop bar + sortable column headers).
 *
 * Differences from the LEFT BalkenView (which renders Myth × indicator):
 *   - rows are top-level information sources (parentId === null)
 *   - one value column = active SourceMetricType × active SourceGroupId
 *   - bar/dot colored via the source's category accent (no verdict)
 *   - label cell shows source category icon + name (no verdict arrow)
 *   - sort = A-Z (default) or value-asc / value-desc
 *   - getSvgElement() returns null — export route still hooks the ref
 *     but produces no chart image for this view (a follow-up sub-PR
 *     wires the export pipeline if needed).
 *
 * Toolbar pickers (metric + group) are owned by the existing
 * dashboard ToolbarRow when rendered for the sources tab — this
 * view reads state.sourceMetric / state.sourceGroup directly.
 */
import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo,
  useRef, useState,
} from 'react';
import type {
  AppState, InformationSourcesData,
  SourceGroupId, SourceMetricType,
} from '../../../lib/dashboard/types';
import {
  GridDataHeader, GridLabelHeader,
} from '../grid';
import DataPicker, { type DataPickerOption } from '../controls/DataPicker';
import {
  AUDIENCE_ICONS_BY_GROUP,
  SOURCE_CATEGORY_ICONS, SOURCE_METRIC_ICONS,
  type SourceCategoryId,
} from '../../../lib/icons/lookups';

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  /** Reserved for future shared-toolbar slot. Currently unused in this view
   *  — the metric + group pickers live in the parent ToolbarRow. */
  sharedActions?: unknown;
  /** Definitions singleton — kept for prop-shape parity with the other
   *  source views even though we don't read it here yet (metric labels
   *  come from translations). */
  definitions?: unknown;
}

export interface SourcesBalkenViewHandle {
  /** No SVG export for this view yet. Returns null so the export pipeline
   *  treats sources as "image not available" rather than crashing. */
  getSvgElement: () => SVGSVGElement | null;
}

type SortMode = 'a-z' | 'value-asc' | 'value-desc';

/** Label for the active source metric — shows in the data column header. */
const METRIC_LABELS: Record<SourceMetricType, string> = {
  search: 'Suche',
  perception: 'Wahrnehmung',
  trust: 'Vertrauen',
  prevention: 'Prävention',
};

/** Label for the active group — used inside the column header tooltip
 *  and the value-cell aria-label. */
const GROUP_LABELS: Record<SourceGroupId, string> = {
  adults: 'Erwachsene (18–70)',
  minors: 'Minderjährige (16–17)',
  consumers: 'Konsumierende',
  young_adults: 'Junge Erwachsene (18–26)',
  parents: 'Eltern',
};

/** Source-category CSS color tokens (defined in dashboard.css). Fallback
 *  is the neutral keine-aussage grey so a missing category still renders. */
const CATEGORY_COLORS: Record<SourceCategoryId, string> = {
  institutional: 'var(--source-institutionell, #4b6cb7)',
  internet: 'var(--source-internet, #2d8da4)',
  social_media: 'var(--source-soziale-medien, #b15edb)',
  traditional_media: 'var(--source-traditionelle, #c97a3d)',
  print_physical: 'var(--source-print, #8b7355)',
  personal: 'var(--source-persoenlich, #d04a4a)',
};

const METRIC_OPTIONS: DataPickerOption<SourceMetricType>[] = [
  { value: 'search', label: 'Suche', Icon: SOURCE_METRIC_ICONS.search },
  { value: 'perception', label: 'Wahrnehmung', Icon: SOURCE_METRIC_ICONS.perception },
  { value: 'trust', label: 'Vertrauen', Icon: SOURCE_METRIC_ICONS.trust },
  { value: 'prevention', label: 'Prävention', Icon: SOURCE_METRIC_ICONS.prevention },
];

const GROUP_OPTIONS: DataPickerOption<SourceGroupId>[] = [
  { value: 'adults', label: 'Erwachsene (18–70)', Icon: AUDIENCE_ICONS_BY_GROUP.adults },
  { value: 'minors', label: 'Minderjährige (16–17)', Icon: AUDIENCE_ICONS_BY_GROUP.minors },
  { value: 'consumers', label: 'Konsumierende', Icon: AUDIENCE_ICONS_BY_GROUP.consumers },
  { value: 'young_adults', label: 'Junge Erwachsene (18–26)', Icon: AUDIENCE_ICONS_BY_GROUP.young_adults },
  { value: 'parents', label: 'Eltern', Icon: AUDIENCE_ICONS_BY_GROUP.parents },
];

const SourcesBalkenView = forwardRef<SourcesBalkenViewHandle, Props>(
  function SourcesBalkenView({ state, update }, ref) {
    const selectedMetric: SourceMetricType = state.sourceMetric;
    const selectedGroup: SourceGroupId = state.sourceGroup;

    useImperativeHandle(ref, () => ({
      getSvgElement: () => null,
    }));

    // ── Source data — same fetch pattern SourcesStripsView uses. ──────
    const [sourceData, setSourceData] = useState<InformationSourcesData | null>(null);
    useEffect(() => {
      let cancelled = false;
      fetch('/data/information-sources.json')
        .then((r) => r.json() as Promise<InformationSourcesData>)
        .then((d) => { if (!cancelled) setSourceData(d); })
        .catch(() => undefined);
      return () => { cancelled = true; };
    }, []);

    // Sort lives locally in this view — no URL state hook needed for the
    // first iteration. (URL persistence can ride atop a future sub-PR.)
    const [sort, setSort] = useState<SortMode>('a-z');

    /** Top-level sources only (children render inside SourcesSpannweiteView
     *  and the matrix tab; this Balken overview keeps the row count
     *  scannable). */
    const rows = useMemo(() => {
      if (!sourceData) return [];
      const metricDef = sourceData.metrics[selectedMetric];
      if (!metricDef) return [];
      const valueMap = metricDef.data[selectedGroup] ?? {};
      return sourceData.sources
        .filter((s) => s.parentId === null)
        .map((src) => {
          const raw = valueMap[String(src.id)];
          return {
            source: src,
            value: typeof raw === 'number' ? raw : null,
            categoryId: src.category as SourceCategoryId,
          };
        });
    }, [sourceData, selectedMetric, selectedGroup]);

    const sortedRows = useMemo(() => {
      const arr = [...rows];
      const cmpAz = (a: typeof arr[number], b: typeof arr[number]) =>
        a.source.name.localeCompare(b.source.name, 'de');
      if (sort === 'value-asc' || sort === 'value-desc') {
        const dir = sort === 'value-asc' ? 1 : -1;
        arr.sort((a, b) => {
          if (a.value === null && b.value === null) return cmpAz(a, b);
          if (a.value === null) return 1;
          if (b.value === null) return -1;
          if (a.value !== b.value) return dir * (a.value - b.value);
          return cmpAz(a, b);
        });
      } else {
        arr.sort(cmpAz);
      }
      return arr;
    }, [rows, sort]);

    const handleValueSortClick = useCallback(() => {
      if (sort === 'value-asc') setSort('value-desc');
      else if (sort === 'value-desc') setSort('value-asc');
      else setSort('value-asc');
    }, [sort]);

    // ── Hover state for a lightweight tooltip line. ───────────────────
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    if (!sourceData) {
      return (
        <div className="carm-balken-view">
          <p className="carm-spannweite__no-data" role="status">
            Daten werden geladen…
          </p>
        </div>
      );
    }

    if (rows.length === 0) {
      return (
        <div className="carm-balken-view">
          <p className="carm-spannweite__no-data" role="status">
            Keine Informationsquellen für die aktuelle Auswahl.
          </p>
        </div>
      );
    }

    const isAzActive = sort === 'a-z';
    const isSortCol = sort === 'value-asc' || sort === 'value-desc';
    const isAsc = sort === 'value-asc';
    const MetricIcon = SOURCE_METRIC_ICONS[selectedMetric];
    const metricLabel = METRIC_LABELS[selectedMetric];
    const groupLabel = GROUP_LABELS[selectedGroup];
    const fullLabel = `${metricLabel} — ${groupLabel}`;

    const gridTemplate = `var(--carm-spannweite-label-col) minmax(0, 1fr)`;

    return (
      <div className="carm-spannweite carm-balken-view carm-sources-balken" ref={wrapperRef}>
        {/* Top picker row — Indikator + Bevölkerungsgruppe. Mirrors the
            LEFT Balken toolbar so the sources tab feels like the same
            tool, just pivoted to source rows. */}
        <div className="carm-toolbar-row carm-sources-balken__toolbar">
          <div className="carm-toolbar-row__pickers">
            <div className="carm-toolbar-row__picker">
              <DataPicker
                caption="Indikator"
                value={selectedMetric}
                options={METRIC_OPTIONS}
                onChange={(v) => update('sourceMetric', v)}
                aria-label="Indikator auswählen"
              />
            </div>
            <div className="carm-toolbar-row__picker">
              <DataPicker
                caption="Bevölkerungsgruppe"
                value={selectedGroup}
                options={GROUP_OPTIONS}
                onChange={(v) => update('sourceGroup', v)}
                aria-label="Bevölkerungsgruppe auswählen"
              />
            </div>
          </div>
        </div>

        <div
          className="carm-spannweite__scroller"
          style={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
          <div
            className="carm-spannweite__grid"
            style={{ gridTemplateColumns: gridTemplate }}
            role="grid"
          >
            {/* Label header — A-Z only (no verdict-rank, sources have no verdict). */}
            <div
              className="carm-spannweite__cell carm-spannweite__cell--header carm-spannweite__cell--label"
              role="columnheader"
            >
              <GridLabelHeader
                labelText="Informationsquellen"
                isAzActive={isAzActive}
                azTooltip="Alphabetisch sortieren"
                onAzClick={() => setSort('a-z')}
              />
            </div>

            {/* Data column header — value-asc / value-desc sort. */}
            <div
              className="carm-spannweite__cell carm-spannweite__cell--header"
              role="columnheader"
            >
              <GridDataHeader
                Icon={MetricIcon}
                label={metricLabel}
                fullLabel={fullLabel}
                hideLabel=""
                onHide={() => undefined}
                isSortActive={isSortCol}
                sortDir={isAsc ? 'asc' : 'desc'}
                sortTooltip={
                  !isSortCol
                    ? `Nach ${metricLabel} sortieren`
                    : isAsc
                    ? `${metricLabel}: aufsteigend`
                    : `${metricLabel}: absteigend`
                }
                onSortClick={handleValueSortClick}
              />
            </div>

            {/* Body rows. */}
            {sortedRows.map((row, rowIdx) => {
              const { source, value, categoryId } = row;
              const isHover = hoveredId === source.id;
              const accent = CATEGORY_COLORS[categoryId] ?? 'var(--color-text-muted, #6b7280)';
              const CategoryIcon = SOURCE_CATEGORY_ICONS[categoryId];
              const clamped = value === null ? 0 : Math.max(0, Math.min(100, value));
              return (
                <div
                  key={`row-${source.id}`}
                  className={`carm-spannweite__row${isHover ? ' is-hover' : ''}${rowIdx % 2 === 0 ? '' : ' is-alt'}`}
                  role="row"
                  style={{ gridColumn: `1 / span 2`, gridTemplateColumns: gridTemplate }}
                  onMouseEnter={() => setHoveredId(source.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  tabIndex={0}
                >
                  <div
                    className="carm-spannweite__cell carm-spannweite__cell--label carm-sources-balken__label"
                    role="rowheader"
                  >
                    {CategoryIcon && (
                      <span
                        className="carm-sources-balken__cat-icon"
                        aria-hidden="true"
                        style={{ color: accent }}
                      >
                        <CategoryIcon size={16} strokeWidth={1.75} />
                      </span>
                    )}
                    <span className="carm-sources-balken__name">{source.name}</span>
                  </div>
                  <div
                    className="carm-spannweite__cell carm-spannweite__cell--plot"
                    role="gridcell"
                    aria-label={
                      value !== null
                        ? `${metricLabel} — ${source.name}: ${Math.round(value)} %`
                        : `${metricLabel} — ${source.name}: keine Daten`
                    }
                    title={
                      value !== null
                        ? `${source.name}\n${fullLabel}: ${Math.round(value)} %`
                        : `${source.name}\n${fullLabel}: keine Daten`
                    }
                  >
                    <div className="carm-spannweite__plot">
                      {value === null ? (
                        <span className="carm-spannweite__no-data" aria-hidden="true">
                          k. A.
                        </span>
                      ) : (
                        <>
                          <div
                            className="carm-spannweite__bar"
                            style={{ width: `${clamped}%`, background: accent }}
                            aria-hidden="true"
                          />
                          <div
                            className="carm-spannweite__dot"
                            style={{ left: `${clamped}%`, background: accent, color: '#ffffff' }}
                            aria-hidden="true"
                          >
                            {Math.round(value)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  },
);

export default SourcesBalkenView;
