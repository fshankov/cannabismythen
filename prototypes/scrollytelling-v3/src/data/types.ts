/**
 * Type subset copied verbatim from /src/lib/dashboard/types.ts.
 * Keep in sync with the main repo when porting back. Do NOT extend without
 * re-syncing the main repo's types.ts.
 */

export type CorrectnessClass =
  | 'richtig'
  | 'eher_richtig'
  | 'eher_falsch'
  | 'falsch'
  | 'no_classification';

export type GroupId = 'adults' | 'minors' | 'consumers' | 'young_adults' | 'parents';

export type Indicator =
  | 'awareness'
  | 'significance'
  | 'correctness'
  | 'prevention_significance'
  | 'population_relevance';

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

/* ───── Information sources (mirrors src/lib/dashboard/types.ts) ───── */

export type SourceCategoryId =
  | 'institutional'
  | 'internet'
  | 'social_media'
  | 'traditional_media'
  | 'print_physical'
  | 'personal';

export interface SourceCategory {
  id: SourceCategoryId | string;
  name: string;
  color: string;
}

export interface SourceGroup {
  id: GroupId;
  name: string;
}

export interface InformationSource {
  id: number;
  name: string;
  category: SourceCategoryId | string;
  parentId: number | null;
}

export type SourceMetricId = 'search' | 'perception' | 'trust' | 'prevention';

export interface SourceMetricDef {
  label: string;
  description: string;
  unit: string;
  scale: [number, number];
  data: Record<GroupId, Record<string, number>>;
}

export interface InformationSourcesData {
  sourceCategories: SourceCategory[];
  sourceGroups: SourceGroup[];
  sources: InformationSource[];
  metrics: Record<SourceMetricId, SourceMetricDef>;
}

/* ───── Prototype-only additions (not in main repo) ───── */

/** Step 6 sub-phase identifier — one per indicator, in display order. As the
 *  reader scrolls, each phase reveals one more bar in the right-hand viz. */
export type IndicatorPhase =
  | 'awareness'
  | 'significance'
  | 'correctness'
  | 'prevention_significance'
  | 'population_relevance';

/** Step 5+6 unified mode (Iter-3 shared-DOM refactor). */
export type SampleRankedMode =
  | 'sample'
  | 'ranked-1'
  | 'ranked-2'
  | 'ranked-3'
  | 'ranked-4'
  | 'ranked-5';

/** Step 7a/7b metric pairing. Iter-3 split. */
export type SourcesPair = 'search-trust' | 'perception-prevention';

/** A scrollytelling step. Source of truth lives in src/data/steps.ts. */
export interface ScrollyStep {
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  heading: string;
  bodyText: string;
  hint?: string;
  vizName:
    | 'timeline'
    | 'peopleVoices'
    | 'mythGrid'
    | 'classificationReveal'
    | 'sampleAndRanked'
    | 'sourcesStrips'
    | 'ctaGrid'
    | 'teamRow';
  /** Step 3+4: shared-DOM mode flag. */
  gridMode?: 'themed' | 'classified';
  /** Step 5+6: shared-DOM mode flag. */
  sampleRankedMode?: SampleRankedMode;
  /** Step 7a/7b: which metric pair to show. */
  sourcesPair?: SourcesPair;
  ctaLabel?: string;
  ctaUrl?: string;
}
