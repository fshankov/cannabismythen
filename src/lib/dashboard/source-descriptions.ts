/**
 * Per-category descriptions for Informationsquellen (Quellen tooltips).
 *
 * Added 2026-05-26 (v3 hover overhaul). The Quellen tooltips across all
 * three view surfaces (Balken, Spannweite, Tabelle) used to lead with
 * "Vertrauen — Erwachsene (18–70): 23 %" — a metric × group line that
 * duplicates information already visible in the cell. Replaced with a
 * category description so the reader gets context about what KIND of
 * source they're looking at before the Lesebeispiel sentence anchors
 * the magnitude.
 *
 * **AI draft of the German sentences (2026-05-26).** No pre-ship ISD
 * review (CLAUDE.md rule revised 2026-05-21: ISD reviews live), but
 * these are NEW prose synthesized from CaRM's category labels, not
 * lifted from a team-approved template. ISD should spot-check on the
 * live site. JSDoc English glosses below each entry give a non-fluent
 * reviewer the intended meaning.
 */
import type { SourceCategoryId } from "../icons/lookups";

export const SOURCE_CATEGORY_DESCRIPTIONS_DE: Record<SourceCategoryId, string> =
  {
    /** "Sources with professional or official authority — doctors,
     *  pharmacies, counselling services, public agencies." */
    institutional:
      "Quellen mit fachlicher oder amtlicher Autorität — " +
      "Ärzt:innen, Apotheken, Beratungsstellen, Behörden.",
    /** "Online sources without editorial accountability — search
     *  engines, forums, health portals." */
    internet:
      "Online-Quellen ohne redaktionelle Verantwortung — " +
      "Suchmaschinen, Foren, Gesundheitsportale.",
    /** "Social platforms with algorithmic reach — Instagram, TikTok,
     *  YouTube, X." */
    social_media:
      "Soziale Plattformen mit algorithmischer Reichweite — " +
      "Instagram, TikTok, YouTube, X.",
    /** "Traditional editorial media — TV, radio, news websites." */
    traditional_media:
      "Klassische Medien mit redaktioneller Verantwortung — " +
      "Fernsehen, Radio, Nachrichten-Websites.",
    /** "Printed or physically distributed material — Apothekenumschau,
     *  flyers, in-store info screens." */
    print_physical:
      "Gedrucktes oder physisch verteiltes Material — " +
      "Apothekenumschau, Flyer, Infoscreens.",
    /** "Personal environment without a professional background —
     *  relatives, friends, acquaintances." */
    personal:
      "Persönliches Umfeld ohne fachlichen Hintergrund — " +
      "Angehörige, Freund:innen, Bekannte.",
  };

/** Safe accessor — falls back to an empty string so callers can still
 *  render their card if a future category ID isn't yet covered. */
export function getCategoryDescription(cat: SourceCategoryId): string {
  return SOURCE_CATEGORY_DESCRIPTIONS_DE[cat] ?? "";
}
