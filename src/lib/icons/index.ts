/**
 * Central icon registry — public re-exports.
 *
 * All consumer files should import icons via `@/lib/icons` so that a
 * single SVG / colour-token change propagates site-wide:
 *
 *   • dashboard surfaces (MythenExplorer, StripsView, SourcesStripsView,
 *     FilterBar)
 *   • Meine Interessen audience pages (AudienceHeader, AudienceHubGrid)
 *   • scrollytelling visualisations in "Über das Projekt"
 *   • factsheet panels, share cards, filter drawers
 *
 * Population groups (audiences):
 *   IconVolljaehrige, IconMinderjaehrige, IconJugendliche (= Minderjährige),
 *   IconJungeErwachsene, IconKonsumierende, IconEltern,
 *   IconLehrkraefte, IconFachkraefte
 *
 * Myth-data indicators:
 *   IconKenntnis, IconBedeutung, IconRichtigkeit, IconPraevention,
 *   IconBevoelkerungsbezug
 *
 * Source-axis indicators:
 *   IconSuche, IconWahrnehmung, IconVertrauen, IconPraevention (shared)
 *
 * Source categories:
 *   IconSrcInstitutionell, IconSrcInternet, IconSrcSozialeMedien,
 *   IconSrcTraditionelleMedien, IconSrcPrintPhysisch, IconSrcPersoenlich
 *
 * Verdicts (re-exported — not redrawn):
 *   VerdictArrow, VerdictGlyphPaths, VERDICT_GLYPHS
 *
 * Lookups (id → component / colour token):
 *   AUDIENCE_ICONS_BY_GROUP, AUDIENCE_ICONS_BY_FAQ_ID,
 *   AUDIENCE_COLOR_VAR_BY_GROUP, AUDIENCE_COLOR_VAR_BY_FAQ_ID,
 *   INDICATOR_ICONS, SOURCE_METRIC_ICONS,
 *   SOURCE_CATEGORY_ICONS, SOURCE_CATEGORY_COLOR_VAR
 */

export type { IconProps } from './audiences';

export {
  IconVolljaehrige,
  IconMinderjaehrige,
  IconJugendliche,
  IconJungeErwachsene,
  IconKonsumierende,
  IconEltern,
  IconLehrkraefte,
  IconFachkraefte,
} from './audiences';

export {
  IconKenntnis,
  IconBedeutung,
  IconRichtigkeit,
  IconPraevention,
  IconBevoelkerungsbezug,
  IconSuche,
  IconWahrnehmung,
  IconVertrauen,
} from './indicators';

export {
  IconSrcInstitutionell,
  IconSrcInternet,
  IconSrcSozialeMedien,
  IconSrcTraditionelleMedien,
  IconSrcPrintPhysisch,
  IconSrcPersoenlich,
} from './sources';

export {
  VerdictArrow,
  VerdictGlyphPaths,
  VERDICT_GLYPHS,
  NO_CLASSIFICATION_COLOR,
} from './verdicts';
export type { VerdictColorOverride } from './verdicts';

export {
  IconVerdictRankAsc,
  IconVerdictRankDesc,
} from './verdictRankSort';

export type { IconComponent, FaqAudienceId, SourceCategoryId, SourceAxisMetricId } from './lookups';
export {
  AUDIENCE_ICONS_BY_GROUP,
  AUDIENCE_ICONS_BY_FAQ_ID,
  AUDIENCE_COLOR_VAR_BY_GROUP,
  AUDIENCE_COLOR_VAR_BY_FAQ_ID,
  INDICATOR_ICONS,
  SOURCE_METRIC_ICONS,
  SOURCE_CATEGORY_ICONS,
  SOURCE_CATEGORY_COLOR_VAR,
} from './lookups';
