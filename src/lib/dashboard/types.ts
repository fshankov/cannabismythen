export type CorrectnessClass =
  | 'richtig'
  | 'eher_richtig'
  | 'eher_falsch'
  | 'falsch'
  | 'no_classification';

export type GroupId = 'adults' | 'minors' | 'consumers' | 'young_adults' | 'parents';

export type Indicator = 'awareness' | 'significance' | 'correctness' | 'prevention_significance' | 'population_relevance';

export interface Myth {
  id: number;
  text_de: string;
  text_en: string;
  text_short_de: string;
  text_short_en: string;
  classification_de: string | null;
  correctness_class: CorrectnessClass;
  scientifically_checked: boolean;
  category_id: number | null;
  category_de: string;
  category_en: string;
}

export interface Metric {
  myth_id: number;
  group_id: GroupId;
  awareness: number | null;
  significance: number | null;
  correctness: number | null;
  prevention_significance: number | null;
  /** Bevölkerungsrelevanz / population-related risk significance.
   *  Only available for adults + minors; null for consumers/young_adults/parents. */
  population_relevance: number | null;
}

export interface Group {
  id: GroupId;
  name_de: string;
  name_en: string;
  n?: number;
  description_de?: string;
  description_en?: string;
}

export interface Category {
  id: number;
  name_de: string;
  name_en: string;
}

export interface CorrectnessLabel {
  de: string;
  en: string;
}

export interface CarmData {
  myths: Myth[];
  metrics: Metric[];
  groups: Group[];
  categories: Category[];
  correctness_classes: Record<CorrectnessClass, CorrectnessLabel>;
}

export type ViewTab = 'balken' | 'table' | 'bar' | 'scatter' | 'lollipop' | 'overview' | 'circular' | 'ladder' | 'strips' | 'sources';

/** Information-sources Streifen view — pivot mirrors the Mythen-Streifen idiom.
 *  - 'metric' → 4 strips (Suche / Wahrnehmung / Vertrauen / Prävention),
 *               picker selects a Bevölkerungsgruppe.
 *  - 'group'  → 5 strips (Volljährige / Minderjährige / Konsument:innen /
 *               Junge Erwachsene / Eltern), picker selects an Indikator. */
export type SourcesStripsMode = 'metric' | 'group';

/** "Streifen" (strips) tab — which dimension forms the columns ("pivot").
 *  Themen is intentionally NOT a pivot: in both modes the Themen row is a
 *  multi-select filter inside the view. */
export type StripsMode = 'indicator' | 'group';
export type StripsSortAxis = Indicator | GroupId;
export type StripsSortDir = 'asc' | 'desc';

/** Balken (ranking bar) view sort options. The legacy 'category' option was
 *  retired in the unified-toolbar refactor — sort is now a simple direction
 *  toggle exposed by `<SortToggle>` in the shared dashboard toolbar. */
export type BalkenSort = 'value-desc' | 'value-asc';

/** Quiz module slugs — the 5 Themen blocks shown in StripsView */
export type QuizThemeSlug =
  | 'quiz-gefaehrlichkeit'
  | 'quiz-gesellschaft'
  | 'quiz-medizin'
  | 'quiz-risiken'
  | 'quiz-stimmung';

export type Lang = 'de' | 'en';

export type VerdictFilter = CorrectnessClass | 'all';

export type SourceMetricType = 'search' | 'perception' | 'trust' | 'prevention';
export type SourceGroupId = 'adults' | 'minors' | 'consumers' | 'young_adults' | 'parents';

export interface InformationSource {
  id: number;
  name: string;
  category: string;
  parentId: number | null;
}

export interface SourceCategory {
  id: string;
  name: string;
  color: string;
}

export interface SourceGroup {
  id: SourceGroupId;
  name: string;
}

export interface SourceMetricDef {
  label: string;
  description: string;
  unit: string;
  scale: [number, number];
  data: Record<SourceGroupId, Record<string, number>>;
}

export interface DefinitionEntry {
  label: string;
  sampleSize?: string;
  definition: string;
  scale?: string;
}

export interface DashboardDefinitions {
  groups: Partial<Record<string, DefinitionEntry>>;
  mythIndicators: Partial<Record<string, DefinitionEntry>>;
  sourcesIndicators: Partial<Record<string, DefinitionEntry>>;
}

export interface InformationSourcesData {
  sourceCategories: SourceCategory[];
  sourceGroups: SourceGroup[];
  sources: InformationSource[];
  metrics: Record<SourceMetricType, SourceMetricDef>;
}

export interface AppState {
  lang: Lang;
  view: ViewTab;
  search: string;
  groupIds: GroupId[];
  categoryIds: number[];
  indicator: Indicator;
  verdictFilter: VerdictFilter;
  selectedMythId: number | null;
  scatterX: Indicator;
  scatterY: Indicator;
  sourceMetric: SourceMetricType;
  sourceGroup: SourceGroupId;
  /** Information-sources Streifen view — pivot ('metric' or 'group'). */
  sourcesStripsMode: SourcesStripsMode;
  /** Information-sources Streifen view — categories included in the chart.
   *  Empty array = include all categories (default). */
  sourceCategoryFilter: string[];
  /** "Streifen" view — columns by indicator or by population group */
  stripsMode: StripsMode;
  /** Sort anchor: an Indicator id when stripsMode='indicator', a GroupId when 'group' */
  stripsSortAxis: StripsSortAxis | null;
  /** Sort direction for the anchor strip */
  stripsSortDir: StripsSortDir;
  /** Myth whose factsheet panel should be open. Decoupled from selectedMythId so views
   *  (e.g. Streifen) can highlight without auto-opening the factsheet. */
  factsheetMythId: number | null;
  /** "Streifen" view — Quiz themes to filter by (multi-select).
   *  Empty array = no filter (show all myths). */
  stripsThemeFilter: QuizThemeSlug[];
  /** Balken (ranking bar) view sort key. */
  balkenSort: BalkenSort;
  /** Individually selected myth IDs from the unified Filter drawer.
   *  When non-empty (alone or together with `categoryIds`), the dashboard
   *  shows only the union of "myths in selected categories" + "myths in
   *  this list". Empty array = no individual-myth restriction. */
  mythIds: number[];
}
