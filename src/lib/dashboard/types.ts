export type CorrectnessClass =
  | 'richtig'
  | 'eher_richtig'
  | 'eher_falsch'
  | 'falsch'
  | 'no_classification';

export type GroupId = 'adults' | 'minors' | 'consumers' | 'young_adults' | 'parents';

export type Indicator = 'awareness' | 'significance' | 'correctness' | 'prevention_significance';

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
}

export interface Group {
  id: GroupId;
  name_de: string;
  name_en: string;
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

export type ViewTab = 'table' | 'bar' | 'scatter' | 'lollipop';

export type Lang = 'de' | 'en';

export type VerdictFilter = CorrectnessClass | 'all';

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
  lollipopIndicator: Indicator;
}
