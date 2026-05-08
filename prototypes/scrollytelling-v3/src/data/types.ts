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

/* ───── Prototype-only additions (not in main repo) ───── */

/** Step 6 sub-phase identifier — drives heatmap recolor. */
export type IndicatorPhase = 'awareness' | 'correctness' | 'prevention_significance';

/** A scrollytelling step. Source of truth lives in src/data/steps.ts. */
export interface ScrollyStep {
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  heading: string;
  bodyText: string;
  hint?: string;
  vizName:
    | 'timeline'
    | 'peopleVoices'
    | 'mythGrid'
    | 'classificationReveal'
    | 'sampleAndIndicators'
    | 'indicatorRanked'
    | 'trustScatter'
    | 'ctaGrid'
    | 'teamRow';
  ctaLabel?: string;
  ctaUrl?: string;
}
