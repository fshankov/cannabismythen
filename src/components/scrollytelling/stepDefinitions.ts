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
}

// Iter-10 — the indicator story is now split across TWO steps:
//   Step 6 reveals the 3 raw indicators (Kenntnis, Bedeutung, Richtigkeit)
//   Step 7 adds the 2 derived synthesis indicators (Präventionsbedeutung,
//          Bevölkerungsrisiko)
// Both share the `sampleAndRanked` viz family so the strips animate in
// across the step boundary without a remount. Sources, CTA and Team
// shift down by 1.
export const STEP_DEFINITIONS: StepStructure[] = [
  { stepNumber: 1,  vizName: 'timeline' },
  { stepNumber: 2,  vizName: 'peopleVoices' },
  { stepNumber: 3,  vizName: 'mythGrid', gridMode: 'themed' },
  { stepNumber: 4,  vizName: 'mythGrid', gridMode: 'classified' },
  { stepNumber: 5,  vizName: 'sampleAndRanked', sampleRankedMode: 'sample' },
  { stepNumber: 6,  vizName: 'sampleAndRanked', sampleRankedMode: 'ranked-3' },
  { stepNumber: 7,  vizName: 'sampleAndRanked', sampleRankedMode: 'ranked-5' },
  { stepNumber: 8,  vizName: 'sourcesStrips' },
  { stepNumber: 9,  vizName: 'sourcesStrips' },
  { stepNumber: 10, vizName: 'ctaGrid' },
  { stepNumber: 11, vizName: 'teamRow' },
];
