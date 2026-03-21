import type { AppState, ViewTab, GroupId, Indicator, Lang, VerdictFilter, CorrectnessClass } from './types';

const ALL_GROUP_IDS: GroupId[] = ['adults', 'minors', 'consumers', 'young_adults', 'parents'];
const ALL_INDICATORS: Indicator[] = ['awareness', 'significance', 'correctness', 'prevention_significance'];
const ALL_VIEWS: ViewTab[] = ['table', 'bar', 'scatter', 'lollipop'];
const ALL_VERDICTS: CorrectnessClass[] = ['richtig', 'eher_richtig', 'eher_falsch', 'falsch', 'no_classification'];

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
  lollipopIndicator: 'awareness',
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
  if (state.lollipopIndicator && state.lollipopIndicator !== DEFAULTS.lollipopIndicator)
    params.set('li', state.lollipopIndicator);
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

  const li = params.get('li');
  if (ALL_INDICATORS.includes(li as Indicator)) state.lollipopIndicator = li as Indicator;

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
