/**
 * Lowercase + NFD-decompose + strip combining diacritics. Used by drawer
 * search inputs so "Erkältung" matches "erkaltung" and "Repräsentation"
 * matches "Reprasentation". German + Romance languages both benefit.
 *
 * Extracted from FilterDrawer.tsx so the Fakten-Karten drawer can share
 * the same matching semantics.
 */
export function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
