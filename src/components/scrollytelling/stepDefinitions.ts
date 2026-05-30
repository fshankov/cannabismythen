/**
 * Structural definitions for the /projekt/ scrollytelling. These are the
 * code-coupled pairs (vizName, gridMode, etc.) that drive which React viz
 * renders per step. Editorial German content is paired by index from the
 * Keystatic singleton `ueberUnsScrolly` (src/content/ueber-uns-scrolly.yaml).
 *
 * The structural definitions stay in code because:
 *  - `vizName` selects between React components — editors don't choose this
 *  - `gridMode` / `sampleRankedMode` are state-machine identifiers consumed
 *    by viz components; renaming them would silently break the runtime
 */

import type { SampleRankedMode, VizName } from './types';

export interface StepStructure {
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  vizName: VizName;
  gridMode?: 'themed' | 'classified';
  sampleRankedMode?: SampleRankedMode;
  /** Only set for `singleMythBalken`. 3 → Step 6, 5 → Step 7. */
  revealedRows?: 3 | 5;
}

// Iter-12 — Steps 6 + 7 swap from the parallel-coordinates "strips"
// viz (5 example myths) to a single-myth Balken stack (M28) styled
// like the Daten-Explorer's BalkenView. Step 6 shows the 3 raw
// indicators (Kenntnis, Bedeutung, Richtigkeit) as rows; Step 7
// reveals the 2 derived rows (Präventionsbedeutung, Bevölkerungsrisiko)
// with the existing reveal-stagger machinery.
//
// Steps 8 + 9 swap from the beeswarm `sourcesStrips` viz to a dark
// port of the Daten-Explorer's SourcesSpannweiteView (5 curated
// sources × 4 metric columns); the same `revealedColumns` 2 → 4
// reveal pattern carries the active vs passive split.
export const STEP_DEFINITIONS: StepStructure[] = [
  { stepNumber: 1,  vizName: 'timeline' },
  { stepNumber: 2,  vizName: 'peopleVoices' },
  { stepNumber: 3,  vizName: 'mythGrid', gridMode: 'themed' },
  { stepNumber: 4,  vizName: 'mythGrid', gridMode: 'classified' },
  { stepNumber: 5,  vizName: 'sampleAndRanked', sampleRankedMode: 'sample' },
  { stepNumber: 6,  vizName: 'singleMythBalken', revealedRows: 3 },
  { stepNumber: 7,  vizName: 'singleMythBalken', revealedRows: 5 },
  { stepNumber: 8,  vizName: 'sourcesSpannweite' },
  { stepNumber: 9,  vizName: 'sourcesSpannweite' },
  { stepNumber: 10, vizName: 'ctaGrid' },
  { stepNumber: 11, vizName: 'teamRow' },
];
