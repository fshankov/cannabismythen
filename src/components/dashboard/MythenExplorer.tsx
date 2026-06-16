import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  Download, Filter, Search, X,
  Eye, TrendingUp, Target, Shield, Globe,
  Baby, Cannabis, GraduationCap, UsersRound, Signpost,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { IconVolljaehrige } from '../../lib/icons/audiences';
import type {
  CarmData,
  AppState,
  ViewTab,
  Myth,
  VerdictFilter,
  GroupId,
  Indicator,
  DashboardDefinitions,
  InformationSourcesData,
} from '../../lib/dashboard/types';
import {
  loadData,
  filterMyths,
  correctGroupsForIndicator,
  getDisabledGroupsForIndicator,
} from '../../lib/dashboard/data';
import { t, type TranslationKey } from '../../lib/dashboard/translations';
import { urlToState, getDefaultState, pushState } from '../../lib/dashboard/url-state';
import { buildWalkthrough } from './rundgang/walkthrough';
import RundgangBookmark from './RundgangBookmark';
import PivotToggle from './controls/PivotToggle';
import InfoTooltip from './InfoTooltip';
import VerdictArrow from '../shared/VerdictArrow';
import FilterBar from './FilterBar';
import ViewTabs from './ViewTabs';
import VerdictTags from './VerdictTags';
import TableView, { type TableViewHandle } from './views/TableView';
import ScatterView from './views/ScatterView';
import LollipopView from './views/LollipopView';
import OverviewView from './views/OverviewView';
import CircularView from './views/CircularView';
import LadderView from './views/LadderView';
import StripsView, { type StripsViewHandle } from './views/StripsView';
import SpannweiteView, { type SpannweiteViewHandle } from './views/SpannweiteView';
import SourcesStripsView, { type SourcesStripsViewHandle } from './views/SourcesStripsView';
import SourcesBalkenView, { type SourcesBalkenViewHandle } from './views/SourcesBalkenView';
import SourcesSpannweiteView, { type SourcesSpannweiteViewHandle } from './views/SourcesSpannweiteView';
import SourcesTableView, { type SourcesTableViewHandle } from './views/SourcesTableView';
import BalkenView, { type BalkenViewHandle } from './views/BalkenView';
import type { ChartHandle } from '../../lib/dashboard/export';
import FilterDrawer from './controls/FilterDrawer';
import ExportDrawer from './controls/ExportDrawer';
import DataPicker, { type DataPickerOption } from './controls/DataPicker';
import ToolbarRow from './controls/ToolbarRow';
import StripsToolbar from './controls/StripsToolbar';
import SpannweiteToolbar from './controls/SpannweiteToolbar';
import SourcesSpannweiteToolbar from './controls/SourcesSpannweiteToolbar';
import SourcesBalkenToolbar from './controls/SourcesBalkenToolbar';
import FactsheetPanel from './FactsheetPanel';
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
  // Custom 3-figure icon (one front + two lowered back figures) replaces
  // the single Lucide Users glyph — Erwachsene/Volljährige reads as a
  // population group, not a lone person. SVG source in audiences.tsx.
  adults: IconVolljaehrige as unknown as LucideIcon,
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
   *  Quiz theme (quiz-medizinischer-nutzen / quiz-risiken-koerper-psyche / etc). Used by the
   *  Streifen view for the Themen filter / Themen pivot mode. */
  mythThemes?: string;
}

export default function MythenExplorer({ mythSlugs, mythContent, definitions, mythThemes }: Props) {
  const [data, setData] = useState<CarmData | null>(null);
  /** loadData() failure flag (a11y audit 2026-06-10). Without this the
   *  "Daten werden geladen…" placeholder would render forever on network
   *  failure — an infinite loading lie. With it set, the placeholder swaps
   *  to a friendly error + retry button so the user can recover. */
  const [loadError, setLoadError] = useState(false);
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
  // (Fullscreen + chartRef state were dropped along with the legacy
  // utility bar — browser-native F11 covers the same use case for
  // power users. The Link kopieren copy-feedback state lives inside
  // ExportDrawer now.)
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [exportDrawerOpen, setExportDrawerOpen] = useState(false);
  const balkenRef = useRef<BalkenViewHandle>(null);
  const stripsRef = useRef<StripsViewHandle>(null);
  const spannweiteRef = useRef<SpannweiteViewHandle>(null);
  const sourcesRef = useRef<SourcesStripsViewHandle>(null);
  const sourcesBalkenRef = useRef<SourcesBalkenViewHandle>(null);
  const sources2Ref = useRef<SourcesSpannweiteViewHandle>(null);
  const sourcesTableRef = useRef<SourcesTableViewHandle>(null);
  const tableRef = useRef<TableViewHandle>(null);

  /**
   * `getActiveChart()` — the canonical lookup the ExportDrawer uses to
   * grab a chart handle for image export. Returns:
   *   - balken  → ECharts instance via BalkenView's imperative handle
   *   - strips  → live `<svg>` from StripsView (D3-rendered)
   *   - sources → synthetic `<svg>` from SourcesBalkenView (numbered circles)
   *   - table / sources_table → synthetic table `<svg>` from (Sources)TableView
   */
  const getActiveChart = useCallback((): ChartHandle | null => {
    switch (state.view) {
      case 'balken':
        return balkenRef.current?.getSvgElement() ?? null;
      case 'strips':
        return stripsRef.current?.getSvgElement() ?? null;
      case 'spannweite':
        return spannweiteRef.current?.getSvgElement() ?? null;
      case 'sources':
        return sourcesBalkenRef.current?.getSvgElement() ?? null;
      case 'sources2':
        return sources2Ref.current?.getSvgElement() ?? null;
      case 'table':
        return tableRef.current?.getSvgElement() ?? null;
      case 'sources_table':
        return sourcesTableRef.current?.getSvgElement() ?? null;
      default:
        return null;
    }
  }, [state.view]);

  /** Filter button badge — Stage 6 v3: now reflects the TOTAL number
   *  of myths the user has narrowed to via category checkboxes +
   *  individual myth checkboxes. Selecting one category that contains
   *  6 myths shows "6", not "1". The verdict filter still adds +1
   *  because it's a categorical narrowing (not a per-myth selection).
   *  Search + sort surface as their own toolbar controls and are
   *  intentionally NOT counted. */
  const activeFilterCount = useMemo(() => {
    if (!data) return 0;
    const categoryMythIds = new Set(
      data.myths
        .filter((m) => m.category_id !== null && state.categoryIds.includes(m.category_id))
        .map((m) => m.id),
    );
    // Count individual myth selections that are NOT already covered by a selected category
    const extraMythIds = state.mythIds.filter((id) => !categoryMythIds.has(id));
    let n = categoryMythIds.size + extraMythIds.length;
    if (state.verdictFilter !== 'all') n += 1;
    return n;
  }, [data, state.categoryIds, state.mythIds, state.verdictFilter]);

  // ── Dataset pill helpers ─────────────────────────────────────────
  const SOURCES_VIEWS = new Set<ViewTab>(['sources', 'sources2', 'sources_table']);
  const isSourcesDataset = SOURCES_VIEWS.has(state.view);

  // Maps any ViewTab → its visual type (the key used by the left ViewTabs group)
  const VIEW_TYPE: Partial<Record<ViewTab, ViewTab>> = {
    balken: 'balken', spannweite: 'spannweite', table: 'table',
    sources: 'balken', sources2: 'spannweite', sources_table: 'table',
  };
  const currentViewType: ViewTab = VIEW_TYPE[state.view] ?? 'balken';

  const DATASET_VIEW: Record<string, Record<string, ViewTab>> = {
    mythen: { balken: 'balken', spannweite: 'spannweite', table: 'table' },
    informationswege: { balken: 'sources', spannweite: 'sources2', table: 'sources_table' },
  };

  const handleDatasetSwitch = (ds: 'mythen' | 'informationswege') => {
    update('view', DATASET_VIEW[ds][currentViewType]);
  };

  const handleViewTypeChange = (vt: ViewTab) => {
    const ds = isSourcesDataset ? 'informationswege' : 'mythen';
    update('view', DATASET_VIEW[ds][vt]);
  };

  const disabledGroups = useMemo(
    () => getDisabledGroupsForIndicator(state.indicator),
    [state.indicator],
  );

  /** Views that share the unified dashboard toolbar (SortToggle +
   *  Indikator + Bevölkerungsgruppe + Filter + Export). The
   *  other two tabs (`strips`, `sources`) own their own pivot/picker
   *  setup but receive the shared `actions` (Filter / Export) from
   *  this component. Myth search/selection lives inside the Filter
   *  drawer (search-at-top + category + individual-myth checkboxes). */
  const isModernView =
    state.view === 'balken' ||
    state.view === 'table';

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
    let cancelled = false;
    loadData()
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, []);

  // Informationswege dataset (information-sources.json) — loaded once here
  // and passed to all three sources views so their image export never races
  // an in-view fetch (previously each view fetched lazily on mount).
  const [sourceData, setSourceData] = useState<InformationSourcesData | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/data/information-sources.json')
      .then((r) => r.json() as Promise<InformationSourcesData>)
      .then((d) => { if (!cancelled) setSourceData(d); })
      .catch(() => undefined);
    return () => { cancelled = true; };
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

  /** Multi-key state patch — needed by FilterDrawer's `toggleCategory` /
   *  `toggleMyth` so two related fields (categoryIds + mythIds) update
   *  in one render. Two sequential `update` calls compute their `value`
   *  from the same closure-snapshot of `state`, which makes the
   *  category-myth promotion/expansion logic fragile; one `updateMany`
   *  call avoids the race entirely. */
  const updateMany = useCallback((patch: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const filteredMyths = useMemo(() => {
    if (!data) return [];
    return filterMyths(
      data.myths,
      state.categoryIds,
      state.verdictFilter,
      state.mythIds,
      state.searchQuery,
    );
  }, [data, state.categoryIds, state.mythIds, state.verdictFilter, state.searchQuery]);

  // (`handleShareLink` was inlined into `ExportDrawer`'s
  // `handleCopyLink` — the dialog manages its own "Kopiert!" feedback
  // state so the trigger lives next to the consumer.)

  // (`handleDownloadCSV` + `handleFullscreen` + the
  // `fullscreenchange` listener were dropped along with the legacy
  // utility bar. ExportDrawer's CSV row covers downloads; F11 covers
  // fullscreen.)

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

  // Per-Zielgruppe metrics for the open myth, filtered to the five
  // groups the FactsheetGroupBars chart renders. Excluded:
  // `general_population` (already filtered out of `data.metrics` by
  // loadData → EXCLUDED_GROUP_IDS).
  const factsheetGroupMetrics = useMemo(() => {
    if (!data || !factsheetMyth) return undefined;
    return data.metrics
      .filter((m) => m.myth_id === factsheetMyth.id)
      .map((m) => ({
        group_id: m.group_id,
        awareness: m.awareness,
        significance: m.significance,
        correctness: m.correctness,
        prevention_significance: m.prevention_significance,
        population_relevance: m.population_relevance,
      }));
  }, [data, factsheetMyth]);

  // ---- Rundgang: first-visit nudge + guided walkthrough ----
  // The far-right "Rundgang" tab starts a short Driver.js walkthrough
  // directly (no intro panel). A subtle nudge draws first-time visitors to
  // it until they launch it once (persisted in localStorage).
  const [rundgangSeen, setRundgangSeen] = useState(true); // start true → no SSR flash
  useEffect(() => {
    try {
      setRundgangSeen(window.localStorage.getItem('carm-rundgang-seen-v1') === '1');
    } catch {
      setRundgangSeen(true); // localStorage disabled (incognito) → treat as seen
    }
  }, []);
  const markRundgangSeen = useCallback(() => {
    setRundgangSeen(true);
    try {
      window.localStorage.setItem('carm-rundgang-seen-v1', '1');
    } catch {
      /* ignore — incognito etc. */
    }
  }, []);

  const startWalkthrough = useCallback(() => {
    markRundgangSeen();
    // The walkthrough anchors to Spannweite's controls (sort/hide/rows),
    // so switch there first, then drive once the DOM is painted.
    update('view', 'spannweite');
    requestAnimationFrame(() => {
      const tour = buildWalkthrough();
      const drive = () => tour.drive();
      // Retry once if the first anchor hasn't mounted yet (view just switched).
      if (document.querySelector('.carm-explorer__tab-bar')) drive();
      else window.setTimeout(drive, 150);
    });
  }, [update, markRundgangSeen]);

  if (!data) {
    if (loadError) {
      return (
        <div className="carm-loading" role="alert">
          <p style={{ marginBottom: 12 }}>
            Daten konnten nicht geladen werden. Bitte prüfe deine
            Internetverbindung.
          </p>
          <button
            type="button"
            onClick={() => {
              setLoadError(false);
              loadData().then(setData).catch(() => setLoadError(true));
            }}
            style={{
              padding: '8px 16px',
              background: 'var(--color-accent, #2d6a4f)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Erneut versuchen
          </button>
        </div>
      );
    }
    return <div className="carm-loading">Daten werden geladen…</div>;
  }

  /** Shared right-aligned toolbar block surfaced on every tab.
   *  Modern views (Balken, Tabelle) embed it directly in the ToolbarRow
   *  below; Streifen + Sources accept it as a prop and slot it next to
   *  their own pivot toggle so the bar stays in lockstep across tabs. */
  /** Exportieren chip — used on Streifen / Informationsquellen / Sources2
   *  / Quellen-Tabelle, where the Filter drawer targets Mythen state and
   *  doesn't apply to source/channel data. */
  const exportOnlyAction: ReactNode = (
    <button
      type="button"
      className="carm-btn carm-explorer__export"
      onClick={() => setExportDrawerOpen(true)}
      aria-label={t('export.button', 'de')}
    >
      <Download size={14} strokeWidth={2} aria-hidden="true" />
      {t('export.button', 'de')}
    </button>
  );

  /** 2026-05-22 v5: search input is inline with Filter / Export
   *  inside the toolbar. Threaded as the FIRST element so every view
   *  that consumes this slot picks it up automatically.
   *
   *  Auto-scoped by active view (Fedor 2026-05-25 PM, item F): on
   *  myth views the input filters myths via `searchQuery`; on source
   *  views (sources / sources2 / sources_table) the same input
   *  filters sources via `sourcesSearchQuery`. Both fields persist
   *  separately so switching back restores the user's prior myth
   *  query. */
  const isSourceView =
    state.view === 'sources' ||
    state.view === 'sources2' ||
    state.view === 'sources_table';
  const searchValue = isSourceView ? state.sourcesSearchQuery : state.searchQuery;
  const searchKey: keyof AppState = isSourceView ? 'sourcesSearchQuery' : 'searchQuery';
  const searchPlaceholder = isSourceView
    ? 'suchen…'
    : t('search.myths.placeholder', 'de');
  const searchAria = isSourceView
    ? 'Informationswege-Suche'
    : t('search.myths.aria', 'de');
  const searchClearAria = isSourceView
    ? 'Informationswege-Suche löschen'
    : t('search.myths.clear', 'de');
  const sharedActions: ReactNode = (
    <>
      <div className="carm-myth-search-row" role="search">
        <Search size={16} className="carm-myth-search-icon" aria-hidden="true" />
        <input
          type="search"
          className="carm-myth-search-input"
          value={searchValue}
          onChange={(e) => update(searchKey, e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchAria}
          autoComplete="off"
          spellCheck={false}
        />
        {searchValue && (
          <button
            type="button"
            className="carm-myth-search-clear"
            onClick={() => update(searchKey, '')}
            aria-label={searchClearAria}
            title={searchClearAria}
          >
            ✕
          </button>
        )}
      </div>
      {/* Filter targets myth-classification state (categoryIds, mythIds,
          verdictFilter) which doesn't apply to source-channel views.
          Hide it on Informationsquellen / Informationsquellen 2 /
          Quellen-Tabelle per Fedor's 2026-05-28 request. */}
      {!isSourceView && (
        <>
          <button
            type="button"
            className="carm-btn carm-explorer__filter"
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
          {activeFilterCount > 0 && (
            <button
              type="button"
              className="carm-explorer__filter-clear"
              aria-label="Alle Filter zurücksetzen"
              title="Alle Filter zurücksetzen"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  categoryIds: [],
                  mythIds: [],
                  verdictFilter: 'all',
                  balkenSort: 'a-z',
                  searchQuery: '',
                }))
              }
            >
              <X size={13} strokeWidth={2.5} aria-hidden="true" />
            </button>
          )}
        </>
      )}
      {exportOnlyAction}
    </>
  );

  return (
    <div className="carm-explorer">
      {/* The redundant "Cannabis Mythen Explorer" header was removed in
          Stage 1 of the Daten-Explorer refactor — the global nav already
          labels the page, and the tab bar communicates view state. */}
      <div className="app-layout">
        {/* Two-group tab bar with flex spacers (2026-05-28 designer
            brief). ViewTabs renders twice — once for LEFT myth views,
            once for RIGHT source views. The flex spacers keep the
            groups visually distinct on desktop and collapse on mobile
            via the @media (max-width: 768px) rule in dashboard.css.
            The "EXPLORE" eyebrow that the brief originally placed
            above the bar was removed 2026-05-28 PM per Fedor. */}
        <div className="carm-explorer__tab-bar">
          {/* Dataset toggle — same PivotToggle as Karten/Liste on 42-Mythen page */}
          <div className="carm-dataset-toggle">
            <PivotToggle
              options={[
                {
                  value: 'mythen',
                  label: 'Mythen',
                  info: (
                    <InfoTooltip
                      title="Mythen"
                      cardClassName="info-tooltip-card--accent"
                      titleSuffix={
                        <span className="carm-datasetinfo-verdicts" aria-hidden="true">
                          <VerdictArrow verdict="richtig" size={15} strokeWidth={2.25} />
                          <VerdictArrow verdict="eher_richtig" size={15} strokeWidth={2.25} />
                          <VerdictArrow verdict="eher_falsch" size={15} strokeWidth={2.25} />
                          <VerdictArrow verdict="falsch" size={15} strokeWidth={2.25} />
                          <VerdictArrow verdict="keine_aussage_moeglich" size={15} strokeWidth={2.25} />
                        </span>
                      }
                      definition={
                        <>
                          <ul className="info-tooltip-list">
                            <li>{t('datasetInfo.mythen.q1', 'de')}</li>
                            <li>{t('datasetInfo.mythen.q2', 'de')}</li>
                            <li>{t('datasetInfo.mythen.q3', 'de')}</li>
                            <li>{t('datasetInfo.mythen.q4', 'de')}</li>
                            <li>{t('datasetInfo.mythen.q5', 'de')}</li>
                          </ul>
                          <p className="info-tooltip-foot">{t('datasetInfo.mythen.foot', 'de')}</p>
                        </>
                      }
                    />
                  ),
                },
                {
                  value: 'informationswege',
                  label: 'Informationswege',
                  info: (
                    <InfoTooltip
                      title="Informationswege"
                      titlePrefix={
                        <Signpost size={15} strokeWidth={2} className="carm-datasetinfo-signpost" aria-hidden="true" />
                      }
                      definition={
                        <>
                          <ul className="info-tooltip-list">
                            <li>{t('datasetInfo.wege.q1', 'de')}</li>
                            <li>{t('datasetInfo.wege.q2', 'de')}</li>
                            <li>{t('datasetInfo.wege.q3', 'de')}</li>
                            <li>{t('datasetInfo.wege.q4', 'de')}</li>
                          </ul>
                          <p className="info-tooltip-foot">{t('datasetInfo.wege.foot', 'de')}</p>
                        </>
                      }
                    />
                  ),
                },
              ]}
              value={isSourcesDataset ? 'informationswege' : 'mythen'}
              onChange={(ds) => handleDatasetSwitch(ds as 'mythen' | 'informationswege')}
              aria-label="Datensatz wechseln"
            />
          </div>
          {/* Single unified view tabs */}
          <div className="carm-explorer__tabs--left is-group-active">
            <ViewTabs
              view={currentViewType}
              lang={'de'}
              group="left"
              onChange={handleViewTypeChange}
            />
          </div>
          <div className="carm-explorer__tab-spacer" aria-hidden="true" />
          <button
            type="button"
            className={`carm-explorer__rundgang-help${rundgangSeen ? '' : ' is-nudge'}`}
            onClick={startWalkthrough}
            aria-label={t('rundgang.label', 'de')}
            title={t('rundgang.label', 'de')}
          >
            <RundgangBookmark />
          </button>
        </div>

        {/* Outer white panel — wraps the toolbar + chart canvas per
            the designer brief. The top-left corner stays flat so the
            active tab merges into the panel; the other three corners
            pick up the 16 px radius. */}
        <div className="carm-explorer__panel">

        {state.view === 'balken' && (() => {
          // Balken renders the indicator + group pickers. Tabelle and
          // Spannweite share the SpannweiteToolbar (with PivotToggle)
          // farther down; Tabelle no longer goes through this block
          // (v4, 2026-05-26).
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

          const groupValue: GroupId = state.groupIds[0] ?? 'adults';

          return (
            <ToolbarRow
              aria-label={t('filter.title', 'de')}
              className="carm-toolbar-row--balken"
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
              ]}
              actions={sharedActions}
            />
          );
        })()}

        {/* Stage 6 v3: Punktwolke (Streifen) toolbar hoisted to the
            page-level wrapper so it aligns horizontally with the
            Balken / Tabelle toolbars instead of nesting inside
            chart-area like before. */}
        {state.view === 'strips' && (
          <StripsToolbar
            state={state}
            update={update}
            groups={data.groups}
            definitions={defs}
            sharedActions={sharedActions}
          />
        )}

        {/* 2026-05-29: Quellen-Balken toolbar lifted to the panel level
            (was nested inside SourcesBalkenView/chart-area, which left a
            stray border line above the filter menu). Now structurally
            identical to every other tab's toolbar. */}
        {state.view === 'sources' && (
          <SourcesBalkenToolbar
            state={state}
            update={update}
            sharedActions={sharedActions}
          />
        )}

        {(state.view === 'spannweite' || state.view === 'table') && (
          // v4 (2026-05-26): Tabelle shares the Spannweite toolbar so
          // it gets the Indikatoren ↔ Gruppen PivotToggle + "Wert für"
          // picker. State (stripsMode, indicator, groupIds[0]) is
          // shared with Spannweite — flipping the pivot on one view
          // carries over to the other.
          <SpannweiteToolbar
            state={state}
            update={update}
            groups={data.groups}
            definitions={defs}
            sharedActions={sharedActions}
          />
        )}

        {(state.view === 'sources2' || state.view === 'sources_table') && (
          // v4: Quellen-Tabelle shares the Quellen-Spannweite toolbar
          // (PivotToggle: Indikatoren ↔ Gruppen, with
          // `sourcesStripsMode` state shared across both views).
          <SourcesSpannweiteToolbar
            state={state}
            update={update}
            definitions={defs}
            // 2026-05-29: both Quellen-Übersicht (sources2) and
            // Quellen-Tabelle use the search-inclusive `sharedActions`
            // (auto-scoped "Quellen suchen" + Exportieren + Rundgang;
            // Filter is hidden on source views). Übersicht previously got
            // `exportOnlyAction` and so lacked the search input.
            sharedActions={sharedActions}
          />
        )}

        {/* Legacy <FilterBar /> rendered for the retired views
         *  (scatter / lollipop / overview / circular / ladder) so
         *  share-links still resolve. The four public tabs no longer
         *  use it — they pick up the unified Filter drawer instead. */}
        {state.view !== 'sources' &&
          state.view !== 'sources2' &&
          state.view !== 'sources_table' &&
          state.view !== 'strips' &&
          state.view !== 'spannweite' &&
          !isModernView && (
            <FilterBar
              state={state}
              data={data}
              update={update}
              definitions={defs}
            />
          )}

        {/* Legacy utility bar removed — Link kopieren is now in the
            Exportieren dialog (Daten tab); CSV / JSON / PNG / SVG live
            there too. Vollbild was dropped (browser-native F11 covers
            the same use case for the rare power user). */}

        <div
          className={`chart-area${state.view === 'strips' ? ' chart-area--strips' : ''}`}
        >
          <div className="chart-area__chart">
            {state.view === 'sources' ? (
              <SourcesBalkenView
                ref={sourcesBalkenRef}
                state={state}
                update={update}
                definitions={defs}
                sourceData={sourceData}
              />
            ) : state.view === 'sources2' ? (
              <SourcesSpannweiteView
                ref={sources2Ref}
                state={state}
                update={update}
                definitions={defs}
                sharedActions={sharedActions}
                sourceData={sourceData}
              />
            ) : state.view === 'sources_table' ? (
              <SourcesTableView
                ref={sourcesTableRef}
                state={state}
                update={update}
                definitions={defs}
                sharedActions={sharedActions}
                sourceData={sourceData}
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
                    groups={data.groups}
                    state={state}
                    update={update}
                    onSelectMyth={selectMyth}
                    definitions={defs}
                    onResetFilters={() => {
                      // Single-shot recovery: clear every filter slot
                      // the active filter count tracks so the empty
                      // state CTA always exits the "over-filtered to
                      // nothing" trap.
                      setState((prev) => ({
                        ...prev,
                        categoryIds: [],
                        mythIds: [],
                        verdictFilter: 'all',
                        balkenSort: 'a-z',
                        searchQuery: '',
                      }));
                    }}
                  />
                )}
                {state.view === 'table' && (
                  <TableView
                    ref={tableRef}
                    myths={filteredMyths}
                    metrics={data.metrics}
                    state={state}
                    update={update}
                    onSelectMyth={selectMyth}
                    definitions={defs}
                  />
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
                    state={state}
                    update={update}
                    onSelectMyth={selectMyth}
                    definitions={defs}
                    mythThemes={mythThemeMap}
                    mythContentMap={mythContentMap}
                    sharedActions={sharedActions}
                  />
                )}
                {state.view === 'spannweite' && (
                  <SpannweiteView
                    ref={spannweiteRef}
                    myths={filteredMyths}
                    metrics={data.metrics}
                    groups={data.groups}
                    state={state}
                    update={update}
                    onSelectMyth={selectMyth}
                    definitions={defs}
                    mythThemes={mythThemeMap}
                    mythContentMap={mythContentMap}
                    sharedActions={sharedActions}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {!isModernView && state.view !== 'sources' && state.view !== 'sources2' && state.view !== 'sources_table' && state.view !== 'strips' && state.view !== 'spannweite' && (
          <VerdictTags lang={'de'} verdictFilter={state.verdictFilter} onChange={(f: VerdictFilter) => update('verdictFilter', f)} />
        )}

        {/* Bottom utility bar (Link kopieren / CSV / Vollbild) was
            removed — Exportieren dialog covers Link kopieren + CSV +
            JSON + PNG + SVG; Vollbild dropped. */}
        </div>{/* /.carm-explorer__panel */}
      </div>

      {factsheetMyth && (
        <FactsheetPanel
          myth={factsheetMyth}
          mythContentEntry={mythContentMap[factsheetMyth.id]}
          factsheetSlug={mythSlugMap?.get(factsheetMyth.id)}
          groupMetrics={factsheetGroupMetrics}
          onClose={closeFactsheet}
          onSelectRelatedMyth={selectMyth}
        />
      )}

      {/* The unified Filter drawer is reachable from every tab — the
       *  Filter button in `sharedActions` toggles it. */}
      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        state={state}
        update={update}
        updateMany={updateMany}
        myths={data.myths}
        categories={data.categories}
        mythContent={mythContentMap}
      />

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
        totalMyths={data.myths.length}
        getChart={getActiveChart}
        chartChrome={() => {
          // Per-tab chart chrome — title + subtitle baked into the export.
          // Every chart-capable view (incl. both Tabelle views) hits this.
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
          if (state.view === 'spannweite') {
            return {
              title: t('spannweite.title', 'de'),
              subtitle:
                state.stripsMode === 'indicator'
                  ? t('strips.mode.indicator', 'de')
                  : t('strips.mode.group', 'de'),
            };
          }
          if (state.view === 'table') {
            return {
              title: 'Mythen-Tabelle',
              subtitle:
                state.stripsMode === 'indicator'
                  ? t('strips.mode.indicator', 'de')
                  : t('strips.mode.group', 'de'),
            };
          }
          if (state.view === 'sources' || state.view === 'sources2' || state.view === 'sources_table') {
            // Session 4b (BugHerd #55): subtitle now reflects the active
            // pivot + the picker selection so the exported chart is
            // self-describing. metric pivot → Indikatoren · {Gruppe};
            // group pivot → Gruppen · {Indikator}. Mirrors the Streifen
            // subtitle pattern. Labels are inlined here (rather than
            // reusing the dashboard-wide translation table) because the
            // sources view has its own German labels for metrics + groups
            // in `SourcesStripsView.tsx` (METRIC_LABELS / GROUP_LABELS)
            // and we want exports to match what the user sees on screen.
            const sourcesPivot = state.sourcesStripsMode;
            const SOURCES_METRIC_LABEL: Record<string, string> = {
              search: 'Suche',
              perception: 'Wahrnehmung',
              trust: 'Vertrauen',
              prevention: 'Prävention',
            };
            const SOURCES_GROUP_LABEL: Record<string, string> = {
              adults: 'Volljährige (18–70 J.)',
              minors: 'Minderjährige (16–17 J.)',
              consumers: 'Konsument:innen',
              young_adults: 'Junge Erwachsene (18–26 J.)',
              parents: 'Eltern',
            };
            const subtitle = state.view === 'sources'
              ? `${SOURCES_METRIC_LABEL[state.sourceMetric] ?? state.sourceMetric} · ${SOURCES_GROUP_LABEL[state.sourceGroup] ?? state.sourceGroup}`
              : sourcesPivot === 'metric'
              ? `Indikatoren · ${SOURCES_GROUP_LABEL[state.sourceGroup] ?? state.sourceGroup}`
              : `Gruppen · ${SOURCES_METRIC_LABEL[state.sourceMetric] ?? state.sourceMetric}`;
            return {
              title: state.view === 'sources2'
                ? t('sources2.title', 'de')
                : state.view === 'sources_table'
                ? 'Quellen-Tabelle'
                : 'Informationswege',
              subtitle,
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
