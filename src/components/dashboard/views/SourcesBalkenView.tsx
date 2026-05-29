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
import type { ReactNode } from 'react';
import type {
  AppState, InformationSourcesData,
  SourceGroupId, SourceMetricType,
} from '../../../lib/dashboard/types';
import {
  GridDataHeader, GridLabelHeader,
  BalkenBar, SourcesHoverTooltip,
} from '../grid';
import DataPicker, { type DataPickerOption } from '../controls/DataPicker';
import { t } from '../../../lib/dashboard/translations';
import {
  AUDIENCE_ICONS_BY_GROUP,
  SOURCE_CATEGORY_ICONS, SOURCE_METRIC_ICONS,
  type SourceCategoryId,
} from '../../../lib/icons/lookups';
import { filterSourcesBySearch } from '../../../lib/dashboard/data';
import { getCategoryColor } from '../../../lib/dashboard/colors';

interface Props {
  state: AppState;
  update: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  /** Right-aligned toolbar actions (search input, Exportieren, Rundgang
   *  badge). Threaded from MythenExplorer's `sharedActions`; on source
   *  views the Filter button is omitted (myth filter doesn't apply). */
  sharedActions?: ReactNode;
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

/** Category color now lives in `src/lib/dashboard/colors.ts`
 *  (`SOURCE_CATEGORY_COLORS` + `getCategoryColor`) so the BalkenBar
 *  primitive and the SourcesHoverTooltip share a single source of
 *  truth with the CSS-side `--source-*` tokens in global.css. */

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
  function SourcesBalkenView({ state, update, sharedActions }, ref) {
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
     *  scannable). Universal source search (Fedor 2026-05-25 PM,
     *  item F) filters by source.name before mapping. */
    const rows = useMemo(() => {
      if (!sourceData) return [];
      const metricDef = sourceData.metrics[selectedMetric];
      if (!metricDef) return [];
      const valueMap = metricDef.data[selectedGroup] ?? {};
      const topLevel = sourceData.sources.filter((s) => s.parentId === null);
      const searched = filterSourcesBySearch(topLevel, state.sourcesSearchQuery);
      return searched.map((src) => {
        const raw = valueMap[String(src.id)];
        return {
          source: src,
          value: typeof raw === 'number' ? raw : null,
          categoryId: src.category as SourceCategoryId,
        };
      });
    }, [sourceData, selectedMetric, selectedGroup, state.sourcesSearchQuery]);

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

    // ── Hover state (Spannweite-style rich card via SourcesHoverTooltip,
    //    2026-05-26). Mirrors BalkenView's handleHover pattern: clamp
    //    the X position so the 360 px-wide card never extends past the
    //    viewport edge near the left/right gutter. ─────────────────────
    const [hoveredSourceId, setHoveredSourceId] = useState<number | null>(null);
    const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // v3 (2026-05-26): width bumped from 360 → 420 to match the
    // actual `.carm-spannweite__tooltip { max-width: 420px }` CSS rule.
    // The old 360 underestimate caused the left half of the tooltip
    // to spill past the viewport on long source names ("Fernsehen
    // (Info- / Diskussionssendungen)") when hovering near the left
    // edge. Margin 12 → 24 matches BalkenView's breathing room.
    const TOOLTIP_MAX_W = 420;
    const VIEWPORT_MARGIN = 24;
    const handleHover = useCallback(
      (sourceId: number, e: React.MouseEvent) => {
        setHoveredSourceId(sourceId);
        const halfW = TOOLTIP_MAX_W / 2;
        const minX = halfW + VIEWPORT_MARGIN;
        const maxX =
          (typeof window !== 'undefined' ? window.innerWidth : 1280) -
          halfW -
          VIEWPORT_MARGIN;
        const clampedX = Math.max(minX, Math.min(maxX, e.clientX));
        setHoverPos({ x: clampedX, y: e.clientY });
      },
      [],
    );
    const handleLeave = useCallback(() => {
      setHoveredSourceId(null);
      setHoverPos(null);
    }, []);

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
        {/* Top picker row — uses the same translation keys + captions as
            the LEFT Balken toolbar (Indikatoren / Gruppe per 2026-05-28
            rename) so the sources tab feels like the same tool, just
            pivoted to source rows. The right-side actions slot
            (search + Exportieren + Rundgang badge) comes from the parent
            via `sharedActions`. */}
        <div className="carm-toolbar-row carm-sources-balken__toolbar">
          <div className="carm-toolbar-row__pickers">
            <div className="carm-toolbar-row__picker">
              <DataPicker
                caption={t('igs.indicator.legend', state.lang)}
                value={selectedMetric}
                options={METRIC_OPTIONS}
                onChange={(v) => update('sourceMetric', v)}
                aria-label={t('igs.indicator.legend', state.lang)}
              />
            </div>
            <div className="carm-toolbar-row__picker">
              <DataPicker
                caption={t('igs.group.legend', state.lang)}
                value={selectedGroup}
                options={GROUP_OPTIONS}
                onChange={(v) => update('sourceGroup', v)}
                aria-label={t('igs.group.legend', state.lang)}
              />
            </div>
          </div>
          {sharedActions && (
            <div className="carm-toolbar-row__actions">{sharedActions}</div>
          )}
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
              const isHover = hoveredSourceId === source.id;
              const accent = getCategoryColor(categoryId);
              const CategoryIcon = SOURCE_CATEGORY_ICONS[categoryId];
              return (
                <div
                  key={`row-${source.id}`}
                  className={`carm-spannweite__row${isHover ? ' is-hover' : ''}${rowIdx % 2 === 0 ? '' : ' is-alt'}`}
                  role="row"
                  style={{ gridColumn: `1 / span 2`, gridTemplateColumns: gridTemplate }}
                  onMouseLeave={handleLeave}
                  tabIndex={0}
                >
                  <div
                    className="carm-spannweite__cell carm-spannweite__cell--label carm-sources-balken__label"
                    role="rowheader"
                    onMouseEnter={(e) => handleHover(source.id, e)}
                    onMouseMove={(e) => handleHover(source.id, e)}
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
                    onMouseEnter={(e) => handleHover(source.id, e)}
                    onMouseMove={(e) => handleHover(source.id, e)}
                  >
                    <BalkenBar value={value} accent={accent} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spannweite-style rich hover card. Replaces the previous
            native title= attribute so Quellen Balken now matches the
            hover quality of Mythen Balken / Spannweite. */}
        {hoveredSourceId !== null && hoverPos && (() => {
          const hovered = sortedRows.find((r) => r.source.id === hoveredSourceId);
          if (!hovered) return null;
          return (
            <SourcesHoverTooltip
              source={hovered.source}
              sourceData={sourceData}
              metric={selectedMetric}
              group={selectedGroup}
              x={hoverPos.x}
              y={hoverPos.y}
            />
          );
        })()}
      </div>
    );
  },
);

export default SourcesBalkenView;
