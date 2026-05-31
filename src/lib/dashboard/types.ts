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

/** A myth's per-group metric slice, ready for the FactsheetGroupBars
 *  component inside the shared FactsheetPanel.
 *
 *  Built at build-time from `public/data/carm-data.json` (fakten-karten,
 *  quiz pages) or sliced from already-loaded CarmData (daten-explorer)
 *  and passed through as a JSON prop. Replaces the static "Daten nach
 *  Zielgruppen" markdown table that used to live in each myth's `.mdoc`.
 *  See `src/components/shared/FactsheetGroupBars.tsx`. */
export type MythGroupMetrics = Pick<
  Metric,
  | 'group_id'
  | 'awareness'
  | 'significance'
  | 'correctness'
  | 'prevention_significance'
  | 'population_relevance'
>[];

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

export type ViewTab = 'balken' | 'table' | 'bar' | 'scatter' | 'lollipop' | 'overview' | 'circular' | 'ladder' | 'strips' | 'spannweite' | 'sources' | 'sources2' | 'sources_table';

/** Spannweite view sort key (post-2026-05-22 verdict-rank revival).
 *  - 'a-z' — alphabetical by short text. Lives in the MYTHEN column
 *    header (upper-LEFT).
 *  - 'value-asc' / 'value-desc' — per-column numeric sort. The column
 *    whose values drive the sort is stored separately in
 *    `spannweiteSortColumn`.
 *  - 'verdict-asc' / 'verdict-desc' — sort by the scientific verdict
 *    band (richtig → falsch ascending; falsch → richtig descending),
 *    with an A-Z tie-break. Triggered by the verdict-rank button in
 *    the MYTHEN column header (top-RIGHT). */
export type SpannweiteSort =
  | 'a-z'
  | 'value-asc'
  | 'value-desc'
  | 'verdict-asc'
  | 'verdict-desc';

/** Informationsquellen-Spannweite view sort key.
 *  - 'a-z' — alphabetical by source name.
 *  - 'value-asc' / 'value-desc' — per-column numeric sort. The column
 *    whose values drive the sort is stored separately in
 *    `sourcesSpannweiteSortColumn`. Nulls always sort last.
 *  - 'category-asc' / 'category-desc' (2026-05-23) — group sources by
 *    their information-source category in the canonical taxonomy order
 *    (institutional → internet → social_media → traditional_media →
 *    print_physical → personal), with alphabetical within-category
 *    tie-break. Mirrors the verdict-rank affordance on the myth views. */
export type SourcesSpannweiteSort =
  | 'a-z'
  | 'value-asc'
  | 'value-desc'
  | 'category-asc'
  | 'category-desc';

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

/** Balken view sort options (Spannweite parity, post-2026-05-22).
 *  - 'a-z' — alphabetical by the myth's short text (default).
 *  - 'value-asc' / 'value-desc' — by the active indicator's value.
 *  - 'verdict-asc' / 'verdict-desc' — by scientific verdict band
 *    (richtig → falsch / falsch → richtig). */
export type BalkenSort =
  | 'a-z'
  | 'value-asc'
  | 'value-desc'
  | 'verdict-asc'
  | 'verdict-desc';

/** Quiz module slugs — the 5 Themen blocks shown in StripsView.
 *  Renamed in Session 1 of 2026-05 to match the docx 5-cat taxonomy. */
export type QuizThemeSlug =
  | 'quiz-gefaehrlichkeit'
  | 'quiz-medizinischer-nutzen'
  | 'quiz-risiken-koerper-psyche'
  | 'quiz-soziales-bevoelkerung'
  | 'quiz-stimmung-wahrnehmung';

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
  /** Information-sources Streifen view — parent source IDs to narrow to.
   *  Empty array = no source-level restriction (default). When set, only
   *  the listed parent sources (and their channel children) render.
   *  Composes with `sourceCategoryFilter` (intersection). Added in
   *  Session 4b (BugHerd #53) so users can drill from a category into a
   *  specific source like "Influencer:innen" or "Suchmaschinen". */
  sourceSubFilter: number[];
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
  /** Spannweite view sort key. */
  spannweiteSort: SpannweiteSort;
  /** Spannweite view: when `spannweiteSort` is 'value-asc' or
   *  'value-desc', the column ID (indicator slug or group slug) whose
   *  values drive the row ordering. null otherwise. */
  spannweiteSortColumn: string | null;
  /** Informationsquellen-Spannweite view sort key. */
  sourcesSpannweiteSort: SourcesSpannweiteSort;
  /** Informationsquellen-Spannweite view: when sort is 'value-asc' or
   *  'value-desc', the column ID (SourceMetricType when pivot is 'metric',
   *  SourceGroupId when pivot is 'group') driving the row ordering.
   *  null otherwise. */
  sourcesSpannweiteSortColumn: string | null;
  /** Informationsquellen-Spannweite view: parent source IDs currently
   *  expanded to show their child sub-sources. */
  sourcesSpannweiteExpanded: number[];
  /** Individually selected myth IDs from the unified Filter drawer.
   *  When non-empty (alone or together with `categoryIds`), the dashboard
   *  shows only the union of "myths in selected categories" + "myths in
   *  this list". Empty array = no individual-myth restriction. */
  mythIds: number[];
  /** Universal myth-search query (added 2026-05-22). When non-empty,
   *  the dashboard hides any myth whose `text_de` AND `text_short_de`
   *  don't include the query as a case-insensitive substring. Persists
   *  in the URL via `?q=…` so deep-links re-apply the search. */
  searchQuery: string;
  /** Source-side search query (Fedor 2026-05-25 PM). Separate field
   *  from `searchQuery` so the user's myth-search query is preserved
   *  when switching to a source view and back. The toolbar input
   *  auto-scopes by the active view — myth views write to
   *  `searchQuery`, source views write to `sourcesSearchQuery`.
   *  Persists in the URL via `?qs=…`. */
  sourcesSearchQuery: string;
}
