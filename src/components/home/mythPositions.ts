// ── MythPosition ────────────────────────────────────────────────────────────
// Per-myth layout slot for the interactive hero (floating myth field).
// Mirrors the curated positions from the handoff prototype 1:1 so the
// component renders pixel-to-pixel against the standalone HTML preview.
//
//   x, y   — percentage of the hero box (top-left origin)
//   r      — rotation in degrees applied to the span (separate from drift)
//   size   — base font-size in px; auto-scaled down for long titles
//   weight — font-weight (400 / 500 / 600 / 700)
export interface MythPosition {
  x: number;
  y: number;
  r: number;
  size: number;
  weight: number;
}

// ── HeroMyth seed (matches the prototype's 18-myth sparse layout) ───────────
// `text` + `classification` are the editorial side, kept here as a seed so
// the hero ships out of the box. When the CMS gets a `floatingMyths` schema
// these fields move to Keystatic; `position` stays here (it's design data,
// not content).
export interface HeroMythSeed {
  id: string;
  text: string;
  classification:
    "richtig" | "eher_richtig" | "eher_falsch" | "falsch" | "keine_aussage";
  position: MythPosition;
}

export const HERO_MYTHS: HeroMythSeed[] = [
  {
    id: "h01",
    text: "Cannabis ist ein Allheilmittel",
    classification: "falsch",
    position: { x: 4, y: 11, r: -2, size: 26, weight: 700 },
  },
  {
    id: "h02",
    text: "Cannabis macht nicht abhängig",
    classification: "falsch",
    position: { x: 58, y: 7, r: 1, size: 19, weight: 600 },
  },
  {
    id: "h03",
    text: "Konsum beeinträchtigt die Kognition",
    classification: "richtig",
    position: { x: 43, y: 9, r: 2, size: 15, weight: 400 },
  },
  {
    id: "h04",
    text: "Cannabis verursacht Krebs",
    classification: "falsch",
    position: { x: 29, y: 20, r: -2, size: 17, weight: 400 },
  },
  {
    id: "h05",
    text: "Cannabis ist eine Einstiegsdroge",
    classification: "eher_falsch",
    position: { x: 71, y: 16, r: 2, size: 18, weight: 400 },
  },
  {
    id: "h06",
    text: "Cannabis wirkt gegen Schmerzen",
    classification: "eher_richtig",
    position: { x: 3, y: 31, r: 1, size: 22, weight: 400 },
  },
  {
    id: "h07",
    text: "Jüngere sind stärker gefährdet",
    classification: "richtig",
    position: { x: 67, y: 30, r: -2, size: 19, weight: 500 },
  },
  {
    id: "h08",
    text: "Konsum verursacht Psychosen",
    classification: "eher_richtig",
    position: { x: 1, y: 47, r: 3, size: 17, weight: 400 },
  },
  {
    id: "h09",
    text: "Cannabis wirkt gegen Angst",
    classification: "eher_falsch",
    position: { x: 79, y: 44, r: -1, size: 20, weight: 400 },
  },
  {
    id: "h10",
    text: "Cannabis führt nicht zum Tod",
    classification: "eher_richtig",
    position: { x: 82, y: 55, r: 2, size: 15, weight: 600 },
  },
  {
    id: "h11",
    text: "Cannabis hilft beim Abnehmen",
    classification: "falsch",
    position: { x: 4, y: 62, r: -2, size: 19, weight: 600 },
  },
  {
    id: "h12",
    text: "Konsum schadet den Atemwegen",
    classification: "eher_richtig",
    position: { x: 63, y: 66, r: 1, size: 18, weight: 400 },
  },
  {
    id: "h13",
    text: "Cannabis macht antriebslos",
    classification: "eher_falsch",
    position: { x: 27, y: 69, r: -1, size: 16, weight: 400 },
  },
  {
    id: "h14",
    text: "Konsum schädigt den Fötus",
    classification: "richtig",
    position: { x: 8, y: 83, r: 2, size: 19, weight: 400 },
  },
  {
    id: "h15",
    text: "Cannabis gefährdet im Verkehr",
    classification: "richtig",
    position: { x: 64, y: 84, r: -2, size: 19, weight: 400 },
  },
  {
    id: "h16",
    text: "Cannabis ist harmlos",
    classification: "falsch",
    position: { x: 42, y: 91, r: 1, size: 24, weight: 700 },
  },
  {
    id: "h17",
    text: "Mischkonsum ist besonders riskant",
    classification: "richtig",
    position: { x: 79, y: 77, r: 1, size: 15, weight: 500 },
  },
  {
    id: "h18",
    text: "Cannabis macht kreativ",
    classification: "falsch",
    position: { x: 17, y: 91, r: -2, size: 16, weight: 400 },
  },
];
