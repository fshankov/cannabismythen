import type { AppState, ViewTab, GroupId, Indicator, Lang, VerdictFilter, CorrectnessClass, SourceMetricType, SourceGroupId, SourcesV2Mode, SourcesV2Sort, StripsMode, StripsSortAxis, StripsSortDir, SelbsttestTheme } from './types';

const ALL_GROUP_IDS: GroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];
const ALL_INDICATORS: Indicator[] = ['awareness', 'significance', 'correctness', 'prevention_significance', 'population_relevance'];
const ALL_VIEWS: ViewTab[] = ['table', 'bar', 'scatter', 'lollipop', 'overview', 'circular', 'ladder', 'strips', 'strips_groups', 'sources', 'sources_v2'];
const ALL_V2_MODES: SourcesV2Mode[] = ['dumbbell', 'multiples', 'matrix'];
const ALL_V2_SORTS: SourcesV2Sort[] = ['prevention', 'gap'];
const ALL_VERDICTS: CorrectnessClass[] = ['richtig', 'eher_richtig', 'eher_falsch', 'falsch', 'no_classification'];
const ALL_SOURCE_METRICS: SourceMetricType[] = ['search', 'perception', 'trust', 'prevention'];
const ALL_SOURCE_GROUPS: SourceGroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];
const ALL_STRIPS_MODES: StripsMode[] = ['indicator', 'group'];
const ALL_SELBSTTEST_THEMES: SelbsttestTheme[] = ['quiz-gefaehrlichkeit', 'quiz-gesellschaft', 'quiz-medizin', 'quiz-risiken', 'quiz-stimmung'];
const ALL_STRIPS_SORT_AXES: StripsSortAxis[] = [...ALL_INDICATORS, ...ALL_GROUP_IDS] as StripsSortAxis[];
const ALL_STRIPS_DIRS: StripsSortDir[] = ['asc', 'desc'];

const DEFAULTS: AppState = {
  lang: 'de',
  view: 'table',
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
  sourcesV2Mode: 'dumbbell',
  sourcesV2Sort: 'prevention',
  sourcesV2Group: 'adults',
  sourcesV2Expanded: [],
  stripsMode: 'indicator',
  stripsSortAxis: 'awareness',
  stripsSortDir: 'desc',
  factsheetMythId: null,
  stripsThemeFilter: [],
};

export function stateToUrl(state: Partial<AppState>): string {
  const params = new URLSearchParams();
  if (state.lang && state.lang !== DEFAULTS.lang) params.set('lang', state.lang);
  if (state.view && state.view !== DEFAULTS.view) params.set('view', state.view);
  if (state.search) params.set('q', state.search);
  if (state.groupIds && JSON.stringify(state.groupIds) !== JSON.stringify(DEFAULTS.groupIds))
    params.set('groups', state.groupIds.join(','));
  if (state.categoryIds && state.categoryIds.length > 0)
    params.set('cats', state.categoryIds.join(','));
  if (state.indicator && state.indicator !== DEFAULTS.indicator)
    params.set('ind', state.indicator);
  if (state.verdictFilter && state.verdictFilter !== 'all')
    params.set('vf', state.verdictFilter);
  if (state.selectedMythId) params.set('myth', String(state.selectedMythId));
  if (state.scatterX && state.scatterX !== DEFAULTS.scatterX) params.set('sx', state.scatterX);
  if (state.scatterY && state.scatterY !== DEFAULTS.scatterY) params.set('sy', state.scatterY);
  if (state.sourceMetric && state.sourceMetric !== DEFAULTS.sourceMetric)
    params.set('sm', state.sourceMetric);
  if (state.sourceGroup && state.sourceGroup !== DEFAULTS.sourceGroup)
    params.set('sg', state.sourceGroup);
  if (state.sourcesV2Mode && state.sourcesV2Mode !== DEFAULTS.sourcesV2Mode)
    params.set('v2m', state.sourcesV2Mode);
  if (state.sourcesV2Sort && state.sourcesV2Sort !== DEFAULTS.sourcesV2Sort)
    params.set('v2s', state.sourcesV2Sort);
  if (state.sourcesV2Group && state.sourcesV2Group !== DEFAULTS.sourcesV2Group)
    params.set('v2g', state.sourcesV2Group);
  if (state.sourcesV2Expanded && state.sourcesV2Expanded.length > 0)
    params.set('v2x', state.sourcesV2Expanded.join(','));
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

  const view = params.get('view');
  if (ALL_VIEWS.includes(view as ViewTab)) state.view = view as ViewTab;

  const q = params.get('q');
  if (q) state.search = q;

  const groups = params.get('groups');
  if (groups) {
    state.groupIds = groups.split(',').filter((g) => ALL_GROUP_IDS.includes(g as GroupId)) as GroupId[];
  }

  const cats = params.get('cats');
  if (cats) state.categoryIds = cats.split(',').map(Number).filter((n) => !isNaN(n));

  const ind = params.get('ind');
  if (ALL_INDICATORS.includes(ind as Indicator)) state.indicator = ind as Indicator;

  const vf = params.get('vf');
  if (vf === 'all' || ALL_VERDICTS.includes(vf as CorrectnessClass))
    state.verdictFilter = vf as VerdictFilter;

  const myth = params.get('myth');
  if (myth) state.selectedMythId = Number(myth) || null;

  const sx = params.get('sx');
  if (ALL_INDICATORS.includes(sx as Indicator)) state.scatterX = sx as Indicator;

  const sy = params.get('sy');
  if (ALL_INDICATORS.includes(sy as Indicator)) state.scatterY = sy as Indicator;

  const sm = params.get('sm');
  if (ALL_SOURCE_METRICS.includes(sm as SourceMetricType)) state.sourceMetric = sm as SourceMetricType;

  const sg = params.get('sg');
  if (ALL_SOURCE_GROUPS.includes(sg as SourceGroupId)) state.sourceGroup = sg as SourceGroupId;

  const v2m = params.get('v2m');
  if (ALL_V2_MODES.includes(v2m as SourcesV2Mode)) state.sourcesV2Mode = v2m as SourcesV2Mode;

  const v2s = params.get('v2s');
  if (ALL_V2_SORTS.includes(v2s as SourcesV2Sort)) state.sourcesV2Sort = v2s as SourcesV2Sort;

  const v2g = params.get('v2g');
  if (ALL_SOURCE_GROUPS.includes(v2g as SourceGroupId)) state.sourcesV2Group = v2g as SourceGroupId;

  const v2x = params.get('v2x');
  if (v2x) state.sourcesV2Expanded = v2x.split(',').map(Number).filter((n) => !isNaN(n));

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
      .filter((s) => ALL_SELBSTTEST_THEMES.includes(s as SelbsttestTheme)) as SelbsttestTheme[];
  }

  return state;
}

export function getDefaultState(): AppState {
  return { ...DEFAULTS };
}

export function pushState(state: Partial<AppState>) {
  if (typeof window === 'undefined') return;
  const url = stateToUrl(state);
  window.history.replaceState(null, '', url || window.location.pathname);
}
