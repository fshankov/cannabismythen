/**
 * id → icon/colour lookups.
 *
 * Maps the canonical IDs used in `dashboard/types.ts` and
 * `content/faq/audiences.yaml` to the corresponding icon component and CSS
 * custom-property name. Centralising these here means a single edit ripples
 * through dashboard, Meine Interessen, scrollytelling, and Über das Projekt.
 */

import type { ComponentType } from 'react';
import type { GroupId, Indicator } from '../dashboard/types';
import type { IconProps } from './audiences';

/** Canonical source-category IDs as used in `public/data/information-sources.json`. */
export type SourceCategoryId =
  | 'institutional'
  | 'internet'
  | 'social_media'
  | 'traditional_media'
  | 'print_physical'
  | 'personal';

import {
  IconVolljaehrige,
  IconMinderjaehrige,
  IconJungeErwachsene,
  IconKonsumierende,
  IconEltern,
  IconJugendliche,
  IconLehrkraefte,
  IconFachkraefte,
} from './audiences';

import {
  IconKenntnis,
  IconBedeutung,
  IconRichtigkeit,
  IconPraevention,
  IconBevoelkerungsbezug,
  IconSuche,
  IconWahrnehmung,
  IconVertrauen,
} from './indicators';

import {
  IconSrcInstitutionell,
  IconSrcInternet,
  IconSrcSozialeMedien,
  IconSrcTraditionelleMedien,
  IconSrcPrintPhysisch,
  IconSrcPersoenlich,
} from './sources';

export type IconComponent = ComponentType<IconProps>;

/** FAQ audience ids — mirror `audiences.yaml`. */
export type FaqAudienceId =
  | 'eltern'
  | 'jugendliche'
  | 'konsumierende'
  | 'lehrkraefte'
  | 'fachkraefte';

/* ---------- Population / audience icons ----------------------------- */

/** Dashboard-side `GroupId` → audience icon. */
export const AUDIENCE_ICONS_BY_GROUP: Record<GroupId, IconComponent> = {
  adults: IconVolljaehrige,
  minors: IconMinderjaehrige,
  consumers: IconKonsumierende,
  young_adults: IconJungeErwachsene,
  parents: IconEltern,
};

/** Meine-Interessen `FaqAudienceId` → audience icon. */
export const AUDIENCE_ICONS_BY_FAQ_ID: Record<FaqAudienceId, IconComponent> = {
  eltern: IconEltern,
  jugendliche: IconJugendliche,
  konsumierende: IconKonsumierende,
  lehrkraefte: IconLehrkraefte,
  fachkraefte: IconFachkraefte,
};

/** CSS custom-property name for each `GroupId` (dashboard accent). */
export const AUDIENCE_COLOR_VAR_BY_GROUP: Record<GroupId, string> = {
  adults: '--audience-volljaehrige',
  minors: '--audience-minderjaehrige',
  consumers: '--audience-konsumierende',
  young_adults: '--audience-junge-erwachsene',
  parents: '--audience-eltern',
};

export const AUDIENCE_COLOR_VAR_BY_FAQ_ID: Record<FaqAudienceId, string> = {
  eltern: '--audience-eltern',
  jugendliche: '--audience-jugendliche',
  konsumierende: '--audience-konsumierende',
  lehrkraefte: '--audience-lehrkraefte',
  fachkraefte: '--audience-fachkraefte',
};

/* ---------- Indicator icons ----------------------------------------- */

export const INDICATOR_ICONS: Record<Indicator, IconComponent> = {
  awareness: IconKenntnis,
  significance: IconBedeutung,
  correctness: IconRichtigkeit,
  prevention_significance: IconPraevention,
  population_relevance: IconBevoelkerungsbezug,
};

/** Source-axis indicators (Suche / Wahrnehmung / Vertrauen / Prävention). */
export type SourceAxisMetricId =
  | 'search'
  | 'perception'
  | 'trust'
  | 'prevention';

export const SOURCE_METRIC_ICONS: Record<SourceAxisMetricId, IconComponent> = {
  search: IconSuche,
  perception: IconWahrnehmung,
  trust: IconVertrauen,
  prevention: IconPraevention,
};

/* ---------- Source-category icons ----------------------------------- */

export const SOURCE_CATEGORY_ICONS: Record<SourceCategoryId, IconComponent> = {
  institutional: IconSrcInstitutionell,
  internet: IconSrcInternet,
  social_media: IconSrcSozialeMedien,
  traditional_media: IconSrcTraditionelleMedien,
  print_physical: IconSrcPrintPhysisch,
  personal: IconSrcPersoenlich,
};

export const SOURCE_CATEGORY_COLOR_VAR: Record<SourceCategoryId, string> = {
  institutional: '--source-institutionell',
  internet: '--source-internet',
  social_media: '--source-soziale-medien',
  traditional_media: '--source-traditionelle',
  print_physical: '--source-print',
  personal: '--source-persoenlich',
};
