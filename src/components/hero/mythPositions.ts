/**
 * Visual layout data for hero block myth field.
 *
 * Each entry maps a myth ID (matching the Keystatic slug prefix) to its
 * design-managed display text and canvas position. Classifications come
 * from Keystatic at build time — only visual data lives here.
 *
 * Position units: x/y are percentages of the hero canvas (0–100).
 * Canvas reference: ~1400px wide × ~820px tall (desktop).
 * Overlap check: all bounding boxes verified clear with 12px padding.
 */
export interface MythPosition {
  id: string;
  text: string;
  x: number;   // percent from left
  y: number;   // percent from top
  r: number;   // rotation in degrees
  size: number; // font-size in px
  serif: boolean;
  weight: number;
  italic: boolean;
}

export const mythPositions: MythPosition[] = [
  // ── m01–m28 ───────────────────────────────────────────────────────────────
  { id: "m01",     text: "Cannabis ist ein Allheilmittel",      x:  2, y:  7, r: -2, size: 19, serif: false, weight: 700, italic: false },
  { id: "m02",     text: "Cannabiskonsum ist harmlos",           x: 52, y:  4, r:  1, size: 14, serif: false, weight: 400, italic: false },
  { id: "m03",     text: "Jüngere sind stärker gefährdet",       x: 22, y: 17, r: -3, size: 16, serif: false, weight: 400, italic: false },
  { id: "m04",     text: "Weniger schädlich als Alkohol",        x: 73, y: 14, r:  2, size: 18, serif: false, weight: 600, italic: false },
  { id: "m05",     text: "Cannabis ist schwer dosierbar",        x:  5, y: 29, r:  1, size: 24, serif: false, weight: 400, italic: false },
  { id: "m06",     text: "Mischkonsum ist besonders riskant",    x: 42, y: 25, r: -4, size: 15, serif: false, weight: 500, italic: false },
  { id: "m07",     text: "Zusätze erhöhen das Risiko",           x: 76, y: 32, r:  2, size: 13, serif: false, weight: 400, italic: false },
  { id: "m08",     text: "Konsum schädigt den Fötus",            x: 12, y: 46, r: -1, size: 17, serif: false, weight: 400, italic: false },
  { id: "m09",     text: "Cannabis führt nicht zum Tod",         x: 58, y: 44, r:  3, size: 16, serif: false, weight: 600, italic: false },
  { id: "m10",     text: "Cannabis wirkt gegen Schmerzen",       x: 30, y: 58, r: -2, size: 15, serif: false, weight: 400, italic: false },
  { id: "m11",     text: "Konsum bewirkt Übelkeit",              x: 80, y: 56, r: -3, size: 18, serif: false, weight: 400, italic: false },
  { id: "m12",     text: "Cannabis hemmt Entzündungen",          x:  2, y: 67, r:  2, size: 14, serif: false, weight: 400, italic: false },
  // m13 moved left to avoid m15 & m25                  was (47, 70)
  { id: "m13",     text: "Cannabiskonsum löst Spasmen",          x: 35, y: 74, r: -1, size: 19, serif: false, weight: 400, italic: false },
  { id: "m14",     text: "Cannabis schädigt das Herz",           x: 17, y: 79, r:  3, size: 16, serif: false, weight: 500, italic: false },
  { id: "m15",     text: "Konsum schadet den Atemwegen",         x: 64, y: 76, r: -2, size: 15, serif: false, weight: 400, italic: false },
  { id: "m16",     text: "Cannabis verursacht Krebs",            x: 36, y: 39, r:  1, size: 13, serif: false, weight: 400, italic: false },
  // m17 moved right to avoid left-column m08 & m24     was (16, 53)
  { id: "m17",     text: "Cannabis hilft beim Abnehmen",         x: 26, y: 50, r: -2, size: 17, serif: false, weight: 600, italic: false },
  { id: "m18",     text: "Cannabis hilft beim Schlafen",         x: 86, y: 22, r:  2, size: 14, serif: false, weight: 400, italic: false },
  { id: "m19",     text: "Konsum verändert die Wahrnehmung",     x: 44, y: 86, r: -1, size: 13, serif: false, weight: 400, italic: false },
  { id: "m20",     text: "Konsum beeinträchtigt die Kognition",  x:  7, y: 89, r:  1, size: 16, serif: false, weight: 500, italic: false },
  { id: "m21",     text: "Cannabis gefährdet im Verkehr",        x: 70, y: 87, r: -2, size: 15, serif: false, weight: 400, italic: false },
  { id: "m22",     text: "Cannabis ist eine Einstiegsdroge",     x: 31, y: 10, r:  2, size: 17, serif: false, weight: 400, italic: false },
  { id: "m23",     text: "Cannabis macht nicht abhängig",        x: 84, y:  9, r: -1, size: 13, serif: false, weight: 700, italic: false },
  { id: "m24",     text: "Konsum verursacht Psychosen",          x:  1, y: 55, r:  3, size: 15, serif: false, weight: 400, italic: false },
  // m25 moved right+up to avoid m13                    was (54, 62)
  { id: "m25",     text: "Cannabis wirkt gegen Angst",           x: 57, y: 57, r: -1, size: 18, serif: false, weight: 400, italic: false },
  { id: "m26",     text: "Cannabis hilft gegen Depressionen",    x: 23, y: 41, r:  2, size: 14, serif: false, weight: 500, italic: false },
  { id: "m27",     text: "Cannabis hilft bei ADHS",              x: 68, y: 50, r: -3, size: 12, serif: false, weight: 400, italic: false },
  { id: "m28",     text: "Cannabis macht antriebslos",           x: 40, y: 93, r:  1, size: 14, serif: false, weight: 400, italic: false },
  // ── m29–m41/42 ────────────────────────────────────────────────────────────
  { id: "m29",     text: "Konsum verbessert die Stimmung",       x: 91, y: 40, r:  2, size: 16, serif: false, weight: 400, italic: false },
  { id: "m30",     text: "Konsum führt zu Suizidgedanken",       x: 60, y: 16, r: -1, size: 13, serif: false, weight: 400, italic: false },
  { id: "m31-m32", text: "Cannabis entspannt und beruhigt",      x:  4, y: 37, r:  3, size: 18, serif: false, weight: 600, italic: false },
  // m33 moved down to avoid m09                        was (51, 48)
  { id: "m33",     text: "Cannabis macht kreativ",               x: 49, y: 52, r: -2, size: 15, serif: false, weight: 400, italic: false },
  { id: "m34",     text: "Konsum schädigt Beziehungen",          x: 78, y: 68, r:  1, size: 14, serif: false, weight: 400, italic: false },
  { id: "m35",     text: "Konsumierende missachten Regeln",      x: 15, y: 92, r: -1, size: 12, serif: false, weight: 400, italic: false },
  { id: "m36-m37", text: "Konsum senkt schulische Leistungen",   x: 50, y: 31, r:  2, size: 16, serif: false, weight: 500, italic: false },
  { id: "m38",     text: "Cannabiskonsum ist cool",              x: 88, y: 78, r: -3, size: 13, serif: false, weight: 400, italic: false },
  { id: "m39",     text: "Cannabis konsumieren viele",           x:  3, y: 73, r:  1, size: 17, serif: false, weight: 400, italic: false },
  { id: "m40",     text: "Konsum ist nun überall erlaubt",       x: 72, y:  5, r: -2, size: 15, serif: false, weight: 400, italic: false },
  { id: "m41-m42", text: "Legalisierung erhöht den Konsum",      x: 93, y: 17, r:  1, size: 13, serif: false, weight: 500, italic: false },
];
