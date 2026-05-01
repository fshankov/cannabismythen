import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Share2, Download, Filter, Maximize2, Minimize2,
  Eye, TrendingUp, Target, Shield, Globe,
  Users, Baby, Cannabis, GraduationCap, UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  CarmData,
  AppState,
  ViewTab,
  Myth,
  VerdictFilter,
  GroupId,
  Indicator,
  DashboardDefinitions,
} from '../../lib/dashboard/types';
import {
  loadData,
  filterMyths,
  exportCSV,
  correctGroupsForIndicator,
  getDisabledGroupsForIndicator,
} from '../../lib/dashboard/data';
import { t, type TranslationKey } from '../../lib/dashboard/translations';
import { urlToState, getDefaultState, pushState } from '../../lib/dashboard/url-state';
import FilterBar from './FilterBar';
import ViewTabs from './ViewTabs';
import VerdictTags from './VerdictTags';
import TableView from './views/TableView';
import ScatterView from './views/ScatterView';
import LollipopView from './views/LollipopView';
import OverviewView from './views/OverviewView';
import CircularView from './views/CircularView';
import LadderView from './views/LadderView';
import StripsView, { type StripsViewHandle } from './views/StripsView';
import SourcesStripsView, { type SourcesStripsViewHandle } from './views/SourcesStripsView';
import BalkenView, { type BalkenViewHandle } from './views/BalkenView';
import type { ChartHandle } from '../../lib/dashboard/export';
import VerdictLegend from './controls/VerdictLegend';
import FilterDrawer from './controls/FilterDrawer';
import ExportDrawer from './controls/ExportDrawer';
import DataPicker, { type DataPickerOption } from './controls/DataPicker';
import MythosSearchChip from './controls/MythosSearchChip';
import ToolbarRow from './controls/ToolbarRow';
import FactsheetPanel from './FactsheetPanel';
import DashboardOnboarding from './DashboardOnboarding';
import type { MythContentEntry } from './FactsheetPanel';

const INDICATORS: Indicator[] = [
  'awareness',
  'significance',
  'correctness',
  'prevention_significance',
  'population_relevance',
];

const GROUPS: GroupId[] = [
  'adults',
  'minors',
  'consumers',
  'young_adults',
  'parents',
];

/** Icons mirror the Streifen view's INDICATOR_ICONS / GROUP_ICONS so
 *  the same indicator/group reads identically across every dashboard
 *  tab. */
const INDICATOR_ICONS: Record<Indicator, LucideIcon> = {
  awareness: Eye,
  significance: TrendingUp,
  correctness: Target,
  prevention_significance: Shield,
  population_relevance: Globe,
};

const GROUP_ICONS: Record<GroupId, LucideIcon> = {
  adults: Users,
  minors: Baby,
  consumers: Cannabis,
  young_adults: GraduationCap,
  parents: UsersRound,
};

export type { MythContentEntry };

interface Props {
  /** Map of myth ID → factsheet page slug */
  mythSlugs?: Record<number, string>;
  /** JSON-serialised Record<mythId, MythContentEntry> of pre-rendered factsheet HTML */
  mythContent?: string;
  /** JSON-serialised DashboardDefinitions from dashboard-definitionen.json */
  definitions?: string;
  /** JSON-serialised Record<mythId, themeSlug> mapping each myth to its
   *  Quiz theme (quiz-medizin / quiz-risiken / etc). Used by the
   *  Streifen view for the Themen filter / Themen pivot mode. */
  mythThemes?: string;
}

export default function MythenExplorer({ mythSlugs, mythContent, definitions, mythThemes }: Props) {
  const [data, setData] = useState<CarmData | null>(null);
  const [state, setState] = useState<AppState>(() => {
    const defaults = getDefaultState();
    defaults.lang = 'de';
    const fromUrl = urlToState();
    const merged = { ...defaults, ...fromUrl, lang: 'de' as const };
    // Apply the population_relevance group constraint up-front so deep-links
    // like ?indicator=bevoelkerungsrelevanz&group=eltern don't flicker.
    merged.groupIds = correctGroupsForIndicator(merged.indicator, merged.groupIds);
    return merged;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [exportDrawerOpen, setExportDrawerOpen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const balkenRef = useRef<BalkenViewHandle>(null);
  const stripsRef = useRef<StripsViewHandle>(null);
  const sourcesRef = useRef<SourcesStripsViewHandle>(null);

  /**
   * `getActiveChart()` — the canonical lookup the ExportDrawer uses to
   * grab a chart handle for image export. Returns:
   *   - balken  → ECharts instance via BalkenView's imperative handle
   *   - strips  → live `<svg>` from StripsView (D3-rendered)
   *   - sources → live `<svg>` from SourcesStripsView (D3-rendered)
   *   - table   → null (Tabelle has no visualisation)
   */
  const getActiveChart = useCallback((): ChartHandle | null => {
    switch (state.view) {
      case 'balken':
        return balkenRef.current?.getEchartsInstance() ?? null;
      case 'strips':
        return stripsRef.current?.getSvgElement() ?? null;
      case 'sources':
        return sourcesRef.current?.getSvgElement() ?? null;
      case 'table':
      default:
        return null;
    }
  }, [state.view]);

  /** Active count of non-default filters (Mythos category + verdict + search +
   *  non-default sort). Drives the badge on the Filter button. */
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (state.categoryIds.length > 0) n += 1;
    if (state.verdictFilter !== 'all') n += 1;
    if (state.search.trim().length > 0) n += 1;
    if (state.balkenSort !== 'value-desc') n += 1;
    return n;
  }, [state.categoryIds, state.verdictFilter, state.search, state.balkenSort]);

  const disabledGroups = useMemo(
    () => getDisabledGroupsForIndicator(state.indicator),
    [state.indicator],
  );

  /** Views that share the new sticky toolbar + verdict legend chrome. */
  const isModernView = state.view === 'balken' || state.view === 'table';

  // Parse pre-rendered myth content passed as JSON from Astro
  const mythContentMap: Record<number, MythContentEntry> = useMemo(() => {
    if (!mythContent) return {};
    try {
      return JSON.parse(mythContent);
    } catch {
      return {};
    }
  }, [mythContent]);

  // Parse dashboard definitions passed as JSON from Astro
  const defs: DashboardDefinitions | null = useMemo(() => {
    if (!definitions) return null;
    try {
      return JSON.parse(definitions);
    } catch {
      return null;
    }
  }, [definitions]);

  // Parse mythId → Quiz theme slug map
  const mythThemeMap: Record<number, string> = useMemo(() => {
    if (!mythThemes) return {};
    try {
      return JSON.parse(mythThemes);
    } catch {
      return {};
    }
  }, [mythThemes]);

  // Build myth slug map from props
  const mythSlugMap = useMemo(() => {
    if (!mythSlugs) return undefined;
    return new Map(Object.entries(mythSlugs).map(([id, slug]) => [Number(id), slug]));
  }, [mythSlugs]);

  useEffect(() => {
    loadData().then(setData);
  }, []);

  useEffect(() => {
    pushState(state);
  }, [state]);

  // Population_relevance is null for consumers/young_adults/parents. If the
  // user (or a deep-link) lands on an invalid combination, snap groupIds back
  // to a valid set and surface a German snackbar.
  useEffect(() => {
    const corrected = correctGroupsForIndicator(state.indicator, state.groupIds);
    if (corrected !== state.groupIds) {
      setState((prev) => ({ ...prev, groupIds: corrected }));
      setSnackbar(t('igs.disabled.snackbar', 'de'));
    }
  }, [state.indicator, state.groupIds]);

  useEffect(() => {
    if (!snackbar) return;
    const id = setTimeout(() => setSnackbar(null), 4000);
    return () => clearTimeout(id);
  }, [snackbar]);

  // (Pivot is now driven by an in-view 'Vergleichen nach:' toggle inside
  // the Streifen tab — no view↔mode auto-sync needed.)

  const update = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const filteredMyths = useMemo(() => {
    if (!data) return [];
    return filterMyths(data.myths, state.categoryIds, state.verdictFilter);
  }, [data, state.categoryIds, state.verdictFilter]);

  const handleShareLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const handleDownloadCSV = useCallback(() => {
    if (!data) return;
    const csv = exportCSV(filteredMyths, data.metrics, state.groupIds, 'de');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cannabis-myths-${state.indicator}.csv`;
    link.click();
  }, [data, filteredMyths, state.groupIds, state.indicator]);

  const handleFullscreen = useCallback(() => {
    if (!isFullscreen && chartRef.current) {
      chartRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // selectMyth is the "open factsheet" action passed to all views.
  // It sets BOTH the highlight (selectedMythId) and the factsheet open state
  // (factsheetMythId). The Streifen view, however, uses update('selectedMythId', …)
  // for its stage-1 highlight and only calls selectMyth for stage 2.
  const selectMyth = useCallback((id: number | null) => {
    setState((prev) => ({ ...prev, selectedMythId: id, factsheetMythId: id }));
  }, []);

  // Closing the factsheet keeps the highlight intact, so users can read the
  // inline values (Streifen view) without losing context.
  const closeFactsheet = useCallback(() => {
    setState((prev) => ({ ...prev, factsheetMythId: null }));
  }, []);

  const factsheetMyth: Myth | null = useMemo(() => {
    if (!data || !state.factsheetMythId) return null;
    return data.myths.find((m) => m.id === state.factsheetMythId) || null;
  }, [data, state.factsheetMythId]);

  if (!data) {
    return <div className="carm-loading">Daten werden geladen…</div>;
  }

  return (
    <div className="carm-explorer">
      {/* The redundant "Cannabis Mythen Explorer" header was removed in
          Stage 1 of the Daten-Explorer refactor — the global nav already
          labels the page, and the tab bar communicates view state. */}
      <div className="app-layout">
        {/* First-visit guidance for the Streifen view: welcome card +
            opt-in 4-step Driver.js tour + persistent "Hilfe" button.
            Mounts only when view='strips' so it doesn't interfere with
            the other 10 visualizations. */}
        <DashboardOnboarding active={state.view === 'strips'} />

        <ViewTabs
          view={state.view}
          lang={'de'}
          onChange={(v: ViewTab) => update('view', v)}
          onRundgang={() => {
            // Placeholder until the cross-view Driver.js tour is wired.
            // The Streifen tour stays reachable via DashboardOnboarding.
            // eslint-disable-next-line no-console
            console.info('Rundgang TBD');
          }}
        />

        {isModernView && (() => {
          // Stage 2 — every modern tab (Balken, Tabelle) renders the
          // shared `<ToolbarRow>` chrome built from `<DataPicker>` and
          // `<PivotToggle>`. Streifen and Sources own their own
          // toolbars and render them inside the chart-area.
          const indicatorOptions: DataPickerOption<Indicator>[] = INDICATORS.map(
            (ind) => {
              const def = defs?.mythIndicators?.[ind];
              return {
                value: ind,
                label: t(`indicator.${ind}.short` as TranslationKey, 'de'),
                Icon: INDICATOR_ICONS[ind],
                definition: def
                  ? {
                      title: def.label,
                      text: def.definition,
                      scale: def.scale,
                      sampleSize: def.sampleSize,
                    }
                  : undefined,
              };
            },
          );

          const groupOptions: DataPickerOption<GroupId>[] = GROUPS.map((g) => {
            const def = defs?.groups?.[g];
            return {
              value: g,
              label: t(`igs.group.${g}` as TranslationKey, 'de'),
              Icon: GROUP_ICONS[g],
              disabled: disabledGroups.includes(g),
              disabledReason: t('igs.disabled.popRel', 'de'),
              definition: def
                ? {
                    title: def.label,
                    text: def.definition,
                    sampleSize: def.sampleSize,
                  }
                : undefined,
            };
          });

          // Tabelle gets a 3rd picker for the science-verdict filter —
          // the inline `<select className="verdict-header-select">`
          // inside the table header is replaced by this so the column
          // header stays clean (Stage 2, issue #13 in the plan).
          const VERDICTS: VerdictFilter[] = [
            'all',
            'richtig',
            'eher_richtig',
            'eher_falsch',
            'falsch',
            'no_classification',
          ];
          const verdictOptions: DataPickerOption<VerdictFilter>[] = VERDICTS.map(
            (v) => ({
              value: v,
              label:
                v === 'all'
                  ? t('verdict.all', 'de')
                  : t(`verdict.${v}` as TranslationKey, 'de'),
            }),
          );

          const groupValue: GroupId = state.groupIds[0] ?? 'adults';

          return (
            <ToolbarRow
              aria-label={t('filter.title', 'de')}
              pickers={[
                <DataPicker<Indicator>
                  key="indicator"
                  caption={t('igs.indicator.legend', 'de')}
                  value={state.indicator}
                  options={indicatorOptions}
                  onChange={(v) => update('indicator', v)}
                  aria-label={t('igs.indicator.legend', 'de')}
                  lang="de"
                />,
                <DataPicker<GroupId>
                  key="group"
                  caption={t('igs.group.legend', 'de')}
                  value={groupValue}
                  options={groupOptions}
                  onChange={(v) => update('groupIds', [v])}
                  aria-label={t('igs.group.legend', 'de')}
                  lang="de"
                />,
                ...(state.view === 'table'
                  ? [
                      <DataPicker<VerdictFilter>
                        key="verdict"
                        caption={t('detail.verdict', 'de')}
                        value={state.verdictFilter}
                        options={verdictOptions}
                        onChange={(v) => update('verdictFilter', v)}
                        aria-label={t('detail.verdict', 'de')}
                        lang="de"
                      />,
                    ]
                  : []),
              ]}
              actions={
                <>
                  {/* Stage 4 — search chip surfaces only on Balken +
                      Tabelle. Streifen has its own dot-driven search;
                      Sources operates on a different data set. */}
                  <MythosSearchChip
                    myths={data.myths}
                    onSelectMyth={selectMyth}
                  />
                  <button
                    type="button"
                    className="carm-btn carm-btn--ghost"
                    onClick={() => setFilterDrawerOpen(true)}
                    aria-label={t('filter.button', 'de')}
                  >
                    <Filter size={14} strokeWidth={2} aria-hidden="true" />
                    {t('filter.button', 'de')}
                    {activeFilterCount > 0 && (
                      <span
                        className="carm-btn__badge"
                        aria-label={`${activeFilterCount} aktiv`}
                      >
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="carm-btn carm-btn--ghost"
                    onClick={() => setExportDrawerOpen(true)}
                    aria-label={t('export.button', 'de')}
                  >
                    <Download size={14} strokeWidth={2} aria-hidden="true" />
                    {t('export.button', 'de')}
                  </button>
                </>
              }
            />
          );
        })()}

        {state.view !== 'sources' && !isModernView && (
          <FilterBar
            state={state}
            data={data}
            update={update}
            definitions={defs}
            // Streifen tab ships its own pivot toggle + selectors + categories
            // dropdown, so collapse the FilterBar's redundant sections.
            hideIndicators={state.view === 'strips'}
            hideGroups={state.view === 'strips'}
            hideCategories={state.view === 'strips'}
          />
        )}

        {/* Legacy utility bar (share/CSV/fullscreen) for the older views.
            Modern views (balken, table) use the StickyToolbar + ExportDrawer. */}
        {!isModernView && state.view !== 'strips' && state.view !== 'sources' && (
          <div className="utility-bar">
            <div className="utility-buttons">
              <button className="util-btn" onClick={handleShareLink}>
                <Share2 size={13} strokeWidth={2} aria-hidden="true" />
                {copied ? t('util.copied', 'de') : t('util.share', 'de')}
              </button>
              <button className="util-btn" onClick={handleDownloadCSV}>
                <Download size={13} strokeWidth={2} aria-hidden="true" />
                CSV
              </button>
              <button className="util-btn" onClick={handleFullscreen}>
                {isFullscreen
                  ? <Minimize2 size={13} strokeWidth={2} aria-hidden="true" />
                  : <Maximize2 size={13} strokeWidth={2} aria-hidden="true" />
                }
                {isFullscreen ? t('util.exitFullscreen', 'de') : t('util.fullscreen', 'de')}
              </button>
            </div>
          </div>
        )}

        {state.view !== 'strips' && state.view !== 'sources' && (
          <p className="howto-microcopy">{t(`howto.${state.view}` as never, 'de')}</p>
        )}

        <div
          className={`chart-area${isFullscreen ? ' fullscreen' : ''}${isModernView ? ' chart-area--with-legend' : ''}`}
          ref={chartRef}
        >
          {/* Mobile verdict legend strip — modern views only. */}
          {isModernView && (
            <div className="chart-area__legend chart-area__legend--mobile">
              <VerdictLegend variant="strip" />
            </div>
          )}

          <div className="chart-area__chart">
            {state.view === 'sources' ? (
              <SourcesStripsView
                ref={sourcesRef}
                state={state}
                update={update}
                definitions={defs}
                onOpenExport={() => setExportDrawerOpen(true)}
              />
            ) : filteredMyths.length === 0 ? (
              <div className="no-results">{t('misc.noResults', 'de')}</div>
            ) : (
              <>
                {state.view === 'balken' && (
                  <BalkenView
                    ref={balkenRef}
                    myths={filteredMyths}
                    metrics={data.metrics}
                    state={state}
                    update={update}
                    onSelectMyth={selectMyth}
                    onResetFilters={() => {
                      // Stage 4 — single-shot recovery: clear every
                      // filter slot the active filter count tracks
                      // so the empty-state CTA always exits the
                      // "over-filtered to nothing" trap.
                      setState((prev) => ({
                        ...prev,
                        categoryIds: [],
                        verdictFilter: 'all',
                        search: '',
                        balkenSort: 'value-desc',
                      }));
                    }}
                  />
                )}
                {state.view === 'table' && (
                  <TableView myths={filteredMyths} metrics={data.metrics} state={state} update={update} onSelectMyth={selectMyth} />
                )}
                {state.view === 'scatter' && (
                  <ScatterView myths={filteredMyths} metrics={data.metrics} state={state} update={update} onSelectMyth={selectMyth} />
                )}
                {state.view === 'lollipop' && (
                  <LollipopView myths={filteredMyths} metrics={data.metrics} groups={data.groups} state={state} update={update} onSelectMyth={selectMyth} />
                )}
                {state.view === 'overview' && (
                  <OverviewView myths={filteredMyths} metrics={data.metrics} state={state} update={update} onSelectMyth={selectMyth} categories={data.categories} />
                )}
                {state.view === 'circular' && (
                  <CircularView myths={filteredMyths} metrics={data.metrics} state={state} groups={data.groups} onSelectMyth={selectMyth} />
                )}
                {state.view === 'ladder' && (
                  <LadderView myths={filteredMyths} metrics={data.metrics} groups={data.groups} state={state} update={update} onSelectMyth={selectMyth} />
                )}
                {state.view === 'strips' && (
                  <StripsView
                    ref={stripsRef}
                    myths={filteredMyths}
                    metrics={data.metrics}
                    groups={data.groups}
                    categories={data.categories}
                    state={state}
                    update={update}
                    onSelectMyth={selectMyth}
                    definitions={defs}
                    mythThemes={mythThemeMap}
                    mythContentMap={mythContentMap}
                    onOpenExport={() => setExportDrawerOpen(true)}
                  />
                )}
              </>
            )}
          </div>

          {/* Desktop verdict legend sidebar — modern views only. */}
          {isModernView && (
            <aside className="chart-area__legend chart-area__legend--sidebar" aria-label={t('verdict.legend.title', 'de')}>
              <VerdictLegend variant="sidebar" />
            </aside>
          )}
        </div>

        {!isModernView && state.view !== 'sources' && state.view !== 'strips' && (
          <VerdictTags lang={'de'} verdictFilter={state.verdictFilter} onChange={(f: VerdictFilter) => update('verdictFilter', f)} />
        )}

        {/* Utility buttons after the chart area on strips tabs and the
            Informationsquellen tab, with a gap above. */}
        {(state.view === 'strips' || state.view === 'sources') && (
          <div className="utility-bar utility-bar--bottom">
            <div className="utility-buttons">
              <button className="util-btn" onClick={handleShareLink}>
                <Share2 size={13} strokeWidth={2} aria-hidden="true" />
                {copied ? t('util.copied', 'de') : t('util.share', 'de')}
              </button>
              <button className="util-btn" onClick={handleDownloadCSV}>
                <Download size={13} strokeWidth={2} aria-hidden="true" />
                CSV
              </button>
              <button className="util-btn" onClick={handleFullscreen}>
                {isFullscreen
                  ? <Minimize2 size={13} strokeWidth={2} aria-hidden="true" />
                  : <Maximize2 size={13} strokeWidth={2} aria-hidden="true" />
                }
                {isFullscreen ? t('util.exitFullscreen', 'de') : t('util.fullscreen', 'de')}
              </button>
            </div>
          </div>
        )}
      </div>

      {factsheetMyth && (
        <FactsheetPanel
          myth={factsheetMyth}
          mythContentEntry={mythContentMap[factsheetMyth.id]}
          factsheetSlug={mythSlugMap?.get(factsheetMyth.id)}
          onClose={closeFactsheet}
        />
      )}

      {isModernView && (
        <FilterDrawer
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          state={state}
          update={update}
          myths={data.myths}
          categories={data.categories}
          onSelectMyth={selectMyth}
        />
      )}

      {/* ExportDrawer renders on every tab in Stage 3 — Tabelle still
          opens it (Daten tab works), Visualisierung disables there. */}
      <ExportDrawer
        open={exportDrawerOpen}
        onClose={() => setExportDrawerOpen(false)}
        myths={filteredMyths}
        metrics={data.metrics}
        groupIds={state.groupIds}
        indicator={state.indicator}
        view={state.view}
        getChart={getActiveChart}
        chartChrome={() => {
          // Per-tab chart chrome. Streifen + Sources have their own
          // titles; Balken keeps the existing label; Tabelle never
          // calls this (no visualisation), but we return something
          // sensible to satisfy the type.
          const indicatorLabel = t(`indicator.${state.indicator}`, 'de');
          const groupLabel = t(
            `igs.group.${state.groupIds[0] ?? 'adults'}` as TranslationKey,
            'de',
          );
          if (state.view === 'strips') {
            return {
              title: 'Mythen-Streifen',
              subtitle: `${indicatorLabel} · ${groupLabel}`,
            };
          }
          if (state.view === 'sources') {
            return {
              title: 'Informationsquellen',
              subtitle: '',
            };
          }
          return {
            title: t('balken.title', 'de'),
            subtitle: `${indicatorLabel} · ${groupLabel}`,
          };
        }}
      />

      {snackbar && (
        <div className="carm-snackbar" role="status" aria-live="polite">
          {snackbar}
        </div>
      )}
    </div>
  );
}
