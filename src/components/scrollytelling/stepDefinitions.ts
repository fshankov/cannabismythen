/**
 * Structural definitions for the /ueber-uns/ scrollytelling. These are the
 * code-coupled pairs (vizName, gridMode, etc.) that drive which React viz
 * renders per step. Editorial German content is paired by index from the
 * Keystatic singleton `ueberUnsScrolly` (src/content/ueber-uns-scrolly.yaml).
 *
 * The structural definitions stay in code because:
 *  - `vizName` selects between React components — editors don't choose this
 *  - `gridMode` / `sampleRankedMode` are state-machine identifiers consumed
 *    by viz components; renaming them would silently break the runtime
 *  - `chips.popoverKey` is matched against React state keys in the viewer
 */

import type { SampleRankedMode, VizName } from './types';

export interface StepChip {
  label: string;
  popoverKey: 'methodik';
}

export interface StepStructure {
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  vizName: VizName;
  gridMode?: 'themed' | 'classified';
  sampleRankedMode?: SampleRankedMode;
  chips?: StepChip[];
}

export const STEP_DEFINITIONS: StepStructure[] = [
  { stepNumber: 1, vizName: 'timeline' },
  { stepNumber: 2, vizName: 'peopleVoices' },
  { stepNumber: 3, vizName: 'mythGrid', gridMode: 'themed' },
  { stepNumber: 4, vizName: 'mythGrid', gridMode: 'classified' },
  {
    stepNumber: 5,
    vizName: 'sampleAndRanked',
    sampleRankedMode: 'sample',
    chips: [{ label: 'Mehr zur Methodik', popoverKey: 'methodik' }],
  },
  { stepNumber: 6, vizName: 'sampleAndRanked', sampleRankedMode: 'ranked-1' },
  { stepNumber: 7, vizName: 'sourcesStrips' },
  { stepNumber: 8, vizName: 'sourcesStrips' },
  { stepNumber: 9, vizName: 'ctaGrid' },
  { stepNumber: 10, vizName: 'teamRow' },
];
