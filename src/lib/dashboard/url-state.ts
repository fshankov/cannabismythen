import type {
  AppState,
  ViewTab,
  GroupId,
  Indicator,
  Lang,
  VerdictFilter,
  CorrectnessClass,
  SourceMetricType,
  SourceGroupId,
  SourcesStripsMode,
  StripsMode,
  StripsSortAxis,
  StripsSortDir,
  QuizThemeSlug,
  BalkenSort,
  SpannweiteSort,
  SourcesSpannweiteSort,
} from './types';

const ALL_GROUP_IDS: GroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];
const ALL_INDICATORS: Indicator[] = ['awareness', 'significance', 'correctness', 'prevention_significance', 'population_relevance'];
const ALL_VIEWS: ViewTab[] = ['balken', 'table', 'bar', 'scatter', 'lollipop', 'overview', 'circular', 'ladder', 'strips', 'spannweite', 'sources', 'sources2', 'sources_table'];
const ALL_VERDICTS: CorrectnessClass[] = ['richtig', 'eher_richtig', 'eher_falsch', 'falsch', 'no_classification'];
const ALL_SOURCE_METRICS: SourceMetricType[] = ['search', 'perception', 'trust', 'prevention'];
const ALL_SOURCE_GROUPS: SourceGroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];
const ALL_SOURCES_STRIPS_MODES: SourcesStripsMode[] = ['metric', 'group'];
const ALL_SOURCE_CATEGORIES = ['institutional', 'internet', 'social_media', 'traditional_media', 'print_physical', 'personal'];
const ALL_STRIPS_MODES: StripsMode[] = ['indicator', 'group'];
const ALL_QUIZ_THEME_SLUGS: QuizThemeSlug[] = ['quiz-gefaehrlichkeit', 'quiz-medizinischer-nutzen', 'quiz-risiken-koerper-psyche', 'quiz-soziales-bevoelkerung', 'quiz-stimmung-wahrnehmung'];
const ALL_STRIPS_SORT_AXES: StripsSortAxis[] = [...ALL_INDICATORS, ...ALL_GROUP_IDS] as StripsSortAxis[];
const ALL_STRIPS_DIRS: StripsSortDir[] = ['asc', 'desc'];
const ALL_BALKEN_SORTS: BalkenSort[] = [
  'a-z', 'value-asc', 'value-desc', 'verdict-asc', 'verdict-desc',
];
const ALL_SPANNWEITE_SORTS: SpannweiteSort[] = [
  'a-z', 'value-asc', 'value-desc', 'verdict-asc', 'verdict-desc',
];
const ALL_SOURCES_SPANNWEITE_SORTS: SourcesSpannweiteSort[] = [
  'a-z', 'value-asc', 'value-desc', 'category-asc', 'category-desc',
];

/** Public view aliases. The four published tabs use German URL keys; legacy/internal
 *  views keep their English name (and emit it back on round-trip). */
const VIEW_DE: Partial<Record<ViewTab, string>> = {
  balken: 'balken',
  strips: 'streifen',
  spannweite: 'spannweite',
  table: 'tabelle',
  sources: 'quellen',
  sources2: 'quellen2',
  sources_table: 'quellen-tabelle',
};
const VIEW_FROM_DE: Record<string, ViewTab> = Object.fromEntries(
  Object.entries(VIEW_DE).map(([k, v]) => [v as string, k as ViewTab]),
);

const INDICATOR_DE: Record<Indicator, string> = {
  awareness: 'kenntnis',
  significance: 'bedeutung',
  correctness: 'richtigkeit',
  prevention_significance: 'praevention',
  population_relevance: 'bevoelkerungsrelevanz',
};
const INDICATOR_FROM_DE: Record<string, Indicator> = Object.fromEntries(
  Object.entries(INDICATOR_DE).map(([k, v]) => [v, k as Indicator]),
);

const GROUP_DE: Record<GroupId, string> = {
  adults: 'erwachsene',
  minors: 'minderjaehrige',
  consumers: 'konsumierende',
  young_adults: 'junge',
  parents: 'eltern',
};
const GROUP_FROM_DE: Record<string, GroupId> = Object.fromEntries(
  Object.entries(GROUP_DE).map(([k, v]) => [v, k as GroupId]),
);

const DEFAULTS: AppState = {
  lang: 'de',
  view: 'balken',
  groupIds: ['adults'],
  categoryIds: [],
  indicator: 'awareness',
  verdictFilter: 'all',
  selectedMythId: null,
  scatterX: 'awareness',
  scatterY: 'prevention_significance',
  sourceMetric: 'prevention',
  sourceGroup: 'adults',
  // v5 (2026-05-26) — pivot semantics swapped: the toggle label now
  // names the PICKER dimension, columns are the OTHER dimension.
  // Defaults set to 'group' so first-load preserves the historical
  // visual (5 indicator columns on Mythen, 4 metric columns on
  // Quellen). The "Gruppen" toggle is active by default, picker = group.
  sourcesStripsMode: 'group',
  sourceCategoryFilter: [],
  sourceSubFilter: [],
  stripsMode: 'group',
  stripsSortAxis: 'awareness',
  stripsSortDir: 'desc',
  factsheetMythId: null,
  stripsThemeFilter: [],
  balkenSort: 'a-z',
  spannweiteSort: 'a-z',
  spannweiteSortColumn: null,
  sourcesSpannweiteSort: 'a-z',
  sourcesSpannweiteSortColumn: null,
  sourcesSpannweiteExpanded: [],
  mythIds: [],
  searchQuery: '',
  sourcesSearchQuery: '',
};

export function stateToUrl(state: Partial<AppState>): string {
  const params = new URLSearchParams();
  if (state.lang && state.lang !== DEFAULTS.lang) params.set('lang', state.lang);

  if (state.view && state.view !== DEFAULTS.view) {
    params.set('view', VIEW_DE[state.view] ?? state.view);
  }

  if (state.groupIds && JSON.stringify(state.groupIds) !== JSON.stringify(DEFAULTS.groupIds)) {
    if (state.groupIds.length === 1) {
      params.set('group', GROUP_DE[state.groupIds[0]]);
    } else if (state.groupIds.length > 1) {
      params.set('groups', state.groupIds.join(','));
    }
  }

  if (state.categoryIds && state.categoryIds.length > 0)
    params.set('categories', state.categoryIds.join(','));

  if (state.indicator && state.indicator !== DEFAULTS.indicator)
    params.set('indicator', INDICATOR_DE[state.indicator]);

  if (state.verdictFilter && state.verdictFilter !== 'all')
    params.set('vf', state.verdictFilter);

  if (state.selectedMythId) params.set('mythos', String(state.selectedMythId));

  if (state.balkenSort && state.balkenSort !== DEFAULTS.balkenSort)
    params.set('sort', state.balkenSort);

  if (state.spannweiteSort && state.spannweiteSort !== DEFAULTS.spannweiteSort)
    params.set('spsort', state.spannweiteSort);

  if (state.spannweiteSortColumn) params.set('spcol', state.spannweiteSortColumn);

  if (state.sourcesSpannweiteSort && state.sourcesSpannweiteSort !== DEFAULTS.sourcesSpannweiteSort)
    params.set('s2sort', state.sourcesSpannweiteSort);

  if (state.sourcesSpannweiteSortColumn)
    params.set('s2col', state.sourcesSpannweiteSortColumn);

  if (state.sourcesSpannweiteExpanded && state.sourcesSpannweiteExpanded.length > 0)
    params.set('s2exp', state.sourcesSpannweiteExpanded.join(','));

  if (state.mythIds && state.mythIds.length > 0)
    params.set('myths', state.mythIds.join(','));

  // 2026-05-22: universal myth-search query. Preserve case so the
  // URL reads what the user typed; the filter logic itself is
  // case-insensitive.
  if (state.searchQuery && state.searchQuery.length > 0)
    params.set('q', state.searchQuery);

  // 2026-05-25 PM: source-side search query (paired with `q` for
  // myths). Same case-preservation rule.
  if (state.sourcesSearchQuery && state.sourcesSearchQuery.length > 0)
    params.set('qs', state.sourcesSearchQuery);

  if (state.scatterX && state.scatterX !== DEFAULTS.scatterX) params.set('sx', state.scatterX);
  if (state.scatterY && state.scatterY !== DEFAULTS.scatterY) params.set('sy', state.scatterY);
  if (state.sourceMetric && state.sourceMetric !== DEFAULTS.sourceMetric)
    params.set('sm', state.sourceMetric);
  if (state.sourceGroup && state.sourceGroup !== DEFAULTS.sourceGroup)
    params.set('sg', state.sourceGroup);
  if (state.sourcesStripsMode && state.sourcesStripsMode !== DEFAULTS.sourcesStripsMode)
    params.set('ssm', state.sourcesStripsMode);
  // (`ssc` URL param dropped in Stage 4 — subcategories always render now.)
  if (state.sourceCategoryFilter && state.sourceCategoryFilter.length > 0)
    params.set('scf', state.sourceCategoryFilter.join(','));
  // Session 4b (BugHerd #53): parent-source sub-filter inside the Quellen
  // view. Numeric IDs from /data/information-sources.json. We don't validate
  // the IDs here (range check is impractical without loading the JSON);
  // SourcesStripsView ignores any ID that doesn't resolve.
  if (state.sourceSubFilter && state.sourceSubFilter.length > 0)
    params.set('ssf', state.sourceSubFilter.join(','));
  if (state.stripsMode && state.stripsMode !== DEFAULTS.stripsMode)
    params.set('stm', state.stripsMode);
  if (state.stripsSortAxis && state.stripsSortAxis !== DEFAULTS.stripsSortAxis)
    params.set('sta', state.stripsSortAxis);
  if (state.stripsSortDir && state.stripsSortDir !== DEFAULTS.stripsSortDir)
    params.set('std', state.stripsSortDir);
  if (state.stripsThemeFilter && state.stripsThemeFilter.length > 0)
    params.set('stt', state.stripsThemeFilter.join(','));

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function urlToState(): Partial<AppState> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const state: Partial<AppState> = {};

  const lang = params.get('lang');
  if (lang === 'de' || lang === 'en') state.lang = lang as Lang;

  const rawView = params.get('view');
  if (rawView) {
    if (rawView === 'sources_v2') {
      state.view = 'sources' as ViewTab;
    } else if (
      rawView === 'lollipop' ||
      rawView === 'bar' ||
      rawView === 'balken2' ||
      rawView === 'strips'
    ) {
      // Retired views — redirect to Balken. (`balken2` was the experimental
      // text-on-bar variant, dropped 2026-05-21; `strips`/Punktwolke was
      // pulled from public tabs 2026-05-23 as part of the travel-pipeline
      // dashboard reorg, but the underlying StripsView component stays so
      // we don't lose tests or the export pipeline.)
      state.view = 'balken' as ViewTab;
    } else if (VIEW_FROM_DE[rawView]) {
      state.view = VIEW_FROM_DE[rawView];
    } else if (ALL_VIEWS.includes(rawView as ViewTab)) {
      state.view = rawView as ViewTab;
    }
  }

  // Legacy `q` param (Mythos-suchen chip, retired) is silently ignored —
  // old shared links still load, they just don't pre-fill a query.

  const groupSingular = params.get('group');
  const groupPlural = params.get('groups');
  if (groupSingular) {
    const gid =
      GROUP_FROM_DE[groupSingular] ??
      (ALL_GROUP_IDS.includes(groupSingular as GroupId) ? (groupSingular as GroupId) : null);
    if (gid) state.groupIds = [gid];
  } else if (groupPlural) {
    const ids = groupPlural
      .split(',')
      .filter((g) => ALL_GROUP_IDS.includes(g as GroupId)) as GroupId[];
    if (ids.length > 0) state.groupIds = ids;
  }

  const cats = params.get('categories') ?? params.get('cats');
  if (cats) state.categoryIds = cats.split(',').map(Number).filter((n) => !isNaN(n));

  const rawInd = params.get('indicator') ?? params.get('ind');
  if (rawInd) {
    const ind =
      INDICATOR_FROM_DE[rawInd] ??
      (ALL_INDICATORS.includes(rawInd as Indicator) ? (rawInd as Indicator) : null);
    if (ind) state.indicator = ind;
  }

  const vf = params.get('vf');
  if (vf === 'all' || ALL_VERDICTS.includes(vf as CorrectnessClass))
    state.verdictFilter = vf as VerdictFilter;

  // Travel pipeline Stage 5 (2026-05-23): `?mythos={N}` now opens the
  // myth popup as well as highlighting the row. Previously the param
  // only set selectedMythId (highlight). External links from the retired
  // /daten-explorer/m{NN}-{slug}/ pages route through this so the popup
  // greets the visitor automatically.
  const myth = params.get('mythos') ?? params.get('myth');
  if (myth) {
    const id = Number(myth) || null;
    if (id !== null) {
      state.selectedMythId = id;
      state.factsheetMythId = id;
    }
  }

  const sort = params.get('sort');
  if (sort && ALL_BALKEN_SORTS.includes(sort as BalkenSort)) {
    state.balkenSort = sort as BalkenSort;
  } else if (sort === 'category') {
    // Legacy URL — retired category-grouped sort. Snap to A-Z default.
    state.balkenSort = 'a-z';
  } else if (sort === 'verdict-rank') {
    // Old single-direction `verdict-rank` value → new `verdict-asc`
    // (richtig → falsch, matches the original behaviour).
    state.balkenSort = 'verdict-asc';
  }

  const spsort = params.get('spsort');
  if (spsort && ALL_SPANNWEITE_SORTS.includes(spsort as SpannweiteSort)) {
    state.spannweiteSort = spsort as SpannweiteSort;
  } else if (
    spsort === 'median-desc' ||
    spsort === 'z-a' ||
    spsort === 'verdict-r-to-f' ||
    spsort === 'verdict-f-to-r'
  ) {
    // Legacy URLs from earlier Spannweite iterations:
    //   - v2  'median-desc' (row-median sort)
    //   - v3.1 'z-a'        (reverse alphabetical)
    //   - v3.2 'verdict-r-to-f' / 'verdict-f-to-r' (verdict-rank,
    //          dropped in v4 when the toolbar sort group was retired)
    // All retired. Snap to default A-Z so old share-links still resolve.
    state.spannweiteSort = 'a-z';
  }

  const spcol = params.get('spcol');
  if (spcol) state.spannweiteSortColumn = spcol;

  const s2sort = params.get('s2sort');
  if (s2sort && ALL_SOURCES_SPANNWEITE_SORTS.includes(s2sort as SourcesSpannweiteSort)) {
    state.sourcesSpannweiteSort = s2sort as SourcesSpannweiteSort;
  }

  const s2col = params.get('s2col');
  if (s2col) state.sourcesSpannweiteSortColumn = s2col;

  const s2exp = params.get('s2exp');
  if (s2exp) {
    state.sourcesSpannweiteExpanded = s2exp
      .split(',')
      .map((tok) => Number.parseInt(tok, 10))
      .filter((n) => Number.isFinite(n) && n > 0);
  }

  const myths = params.get('myths');
  if (myths) {
    state.mythIds = myths
      .split(',')
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0);
  }

  const q = params.get('q');
  if (q) state.searchQuery = q;

  const qs = params.get('qs');
  if (qs) state.sourcesSearchQuery = qs;

  const sx = params.get('sx');
  if (ALL_INDICATORS.includes(sx as Indicator)) state.scatterX = sx as Indicator;

  const sy = params.get('sy');
  if (ALL_INDICATORS.includes(sy as Indicator)) state.scatterY = sy as Indicator;

  const sm = params.get('sm');
  if (ALL_SOURCE_METRICS.includes(sm as SourceMetricType)) state.sourceMetric = sm as SourceMetricType;

  const sg = params.get('sg');
  if (ALL_SOURCE_GROUPS.includes(sg as SourceGroupId)) state.sourceGroup = sg as SourceGroupId;

  const ssm = params.get('ssm');
  if (ALL_SOURCES_STRIPS_MODES.includes(ssm as SourcesStripsMode))
    state.sourcesStripsMode = ssm as SourcesStripsMode;

  // (`ssc` URL param dropped in Stage 4 of the Daten-Explorer refactor —
  //  subcategories always render now. We swallow legacy URLs by simply
  //  not parsing the param, so existing links don't 404.)

  const scf = params.get('scf');
  if (scf) {
    state.sourceCategoryFilter = scf
      .split(',')
      .filter((c) => ALL_SOURCE_CATEGORIES.includes(c));
  }

  // Session 4b (BugHerd #53): parent-source sub-filter. Parsed as numeric
  // IDs; non-numeric tokens are dropped silently.
  const ssf = params.get('ssf');
  if (ssf) {
    state.sourceSubFilter = ssf
      .split(',')
      .map((tok) => Number.parseInt(tok, 10))
      .filter((n) => Number.isFinite(n) && n > 0);
  }

  const stm = params.get('stm');
  if (ALL_STRIPS_MODES.includes(stm as StripsMode)) state.stripsMode = stm as StripsMode;

  const sta = params.get('sta');
  if (ALL_STRIPS_SORT_AXES.includes(sta as StripsSortAxis))
    state.stripsSortAxis = sta as StripsSortAxis;

  const std = params.get('std');
  if (ALL_STRIPS_DIRS.includes(std as StripsSortDir)) state.stripsSortDir = std as StripsSortDir;

  const stt = params.get('stt');
  if (stt) {
    state.stripsThemeFilter = stt
      .split(',')
      .filter((s) => ALL_QUIZ_THEME_SLUGS.includes(s as QuizThemeSlug)) as QuizThemeSlug[];
  }

  return state;
}

export function getDefaultState(): AppState {
  return { ...DEFAULTS };
}

let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingState: Partial<AppState> | null = null;

function writeImmediately(state: Partial<AppState>) {
  if (typeof window === 'undefined') return;
  const url = stateToUrl(state);
  window.history.replaceState(null, '', url || window.location.pathname);
}

/** Flush any pending debounced write. Safe to call when nothing is pending. */
export function flushPendingState() {
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    pendingTimeout = null;
  }
  if (pendingState) {
    writeImmediately(pendingState);
    pendingState = null;
  }
}

/** Sync state to URL via history.replaceState, debounced 200ms to avoid thrashing
 *  on fast-changing fields (search input, multi-select toggles). */
export function pushState(state: Partial<AppState>) {
  if (typeof window === 'undefined') return;
  pendingState = state;
  if (pendingTimeout) clearTimeout(pendingTimeout);
  pendingTimeout = setTimeout(() => {
    pendingTimeout = null;
    if (pendingState) {
      writeImmediately(pendingState);
      pendingState = null;
    }
  }, 200);
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingState);
}
