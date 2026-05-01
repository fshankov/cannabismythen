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
} from './types';

const ALL_GROUP_IDS: GroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];
const ALL_INDICATORS: Indicator[] = ['awareness', 'significance', 'correctness', 'prevention_significance', 'population_relevance'];
const ALL_VIEWS: ViewTab[] = ['balken', 'table', 'bar', 'scatter', 'lollipop', 'overview', 'circular', 'ladder', 'strips', 'sources'];
const ALL_VERDICTS: CorrectnessClass[] = ['richtig', 'eher_richtig', 'eher_falsch', 'falsch', 'no_classification'];
const ALL_SOURCE_METRICS: SourceMetricType[] = ['search', 'perception', 'trust', 'prevention'];
const ALL_SOURCE_GROUPS: SourceGroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];
const ALL_SOURCES_STRIPS_MODES: SourcesStripsMode[] = ['metric', 'group'];
const ALL_SOURCE_CATEGORIES = ['institutional', 'internet', 'social_media', 'traditional_media', 'print_physical', 'personal'];
const ALL_STRIPS_MODES: StripsMode[] = ['indicator', 'group'];
const ALL_QUIZ_THEME_SLUGS: QuizThemeSlug[] = ['quiz-gefaehrlichkeit', 'quiz-gesellschaft', 'quiz-medizin', 'quiz-risiken', 'quiz-stimmung'];
const ALL_STRIPS_SORT_AXES: StripsSortAxis[] = [...ALL_INDICATORS, ...ALL_GROUP_IDS] as StripsSortAxis[];
const ALL_STRIPS_DIRS: StripsSortDir[] = ['asc', 'desc'];
const ALL_BALKEN_SORTS: BalkenSort[] = ['value-desc', 'value-asc', 'category'];

/** Public view aliases. The four published tabs use German URL keys; legacy/internal
 *  views keep their English name (and emit it back on round-trip). */
const VIEW_DE: Partial<Record<ViewTab, string>> = {
  balken: 'balken',
  strips: 'streifen',
  table: 'tabelle',
  sources: 'quellen',
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
  search: '',
  groupIds: ['adults'],
  categoryIds: [],
  indicator: 'awareness',
  verdictFilter: 'all',
  selectedMythId: null,
  scatterX: 'awareness',
  scatterY: 'prevention_significance',
  sourceMetric: 'prevention',
  sourceGroup: 'adults',
  sourcesStripsMode: 'metric',
  sourceCategoryFilter: [],
  stripsMode: 'indicator',
  stripsSortAxis: 'awareness',
  stripsSortDir: 'desc',
  factsheetMythId: null,
  stripsThemeFilter: [],
  balkenSort: 'value-desc',
};

export function stateToUrl(state: Partial<AppState>): string {
  const params = new URLSearchParams();
  if (state.lang && state.lang !== DEFAULTS.lang) params.set('lang', state.lang);

  if (state.view && state.view !== DEFAULTS.view) {
    params.set('view', VIEW_DE[state.view] ?? state.view);
  }

  if (state.search) params.set('q', state.search);

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
    } else if (rawView === 'lollipop' || rawView === 'bar') {
      // Retired views — redirect to Balken.
      state.view = 'balken' as ViewTab;
    } else if (VIEW_FROM_DE[rawView]) {
      state.view = VIEW_FROM_DE[rawView];
    } else if (ALL_VIEWS.includes(rawView as ViewTab)) {
      state.view = rawView as ViewTab;
    }
  }

  const q = params.get('q');
  if (q) state.search = q;

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

  const myth = params.get('mythos') ?? params.get('myth');
  if (myth) state.selectedMythId = Number(myth) || null;

  const sort = params.get('sort');
  if (sort && ALL_BALKEN_SORTS.includes(sort as BalkenSort))
    state.balkenSort = sort as BalkenSort;

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
