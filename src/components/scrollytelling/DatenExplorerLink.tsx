/**
 * DatenExplorerLink — ghost-button anchor that opens the cannabismythen
 * Daten-Explorer with the right per-step deep-link.
 *
 * Iter-14 (Harald review): four buttons, one under each of Steps 6, 7,
 * 8, 9. Iter-21: now in-site (relative, same-tab) since this lives in
 * the cannabismythen app itself rather than the standalone prototype.
 *
 * Targets:
 *   Step 6 → /daten-explorer/                       (default Balken landing)
 *   Step 7 → /daten-explorer/?indicator=praevention (Präventionsbedeutung)
 *   Step 8 → /daten-explorer/?view=quellen2         (Sources Spannweite)
 *   Step 9 → /daten-explorer/?view=quellen2         (same — both source steps
 *                                                    share the destination)
 *
 * German URL slugs (`praevention`, `quellen2`) match `cannabismythen/src/lib/
 * dashboard/url-state.ts` (VIEW_DE + INDICATOR_DE maps).
 */

interface Target {
  href: string;
  label: string;
}

/** English gloss (for editorial review): "More in the Daten-Explorer →" */
const LABEL_DE = 'Mehr im Daten-Explorer';

const TARGETS: Record<6 | 7 | 8 | 9, Target> = {
  6: {
    href: '/daten-explorer/',
    label: LABEL_DE,
  },
  7: {
    href: '/daten-explorer/?indicator=praevention',
    label: LABEL_DE,
  },
  8: {
    href: '/daten-explorer/?view=quellen2',
    label: LABEL_DE,
  },
  9: {
    href: '/daten-explorer/?view=quellen2',
    label: LABEL_DE,
  },
};

interface Props {
  /** Step number (6, 7, 8, or 9). Picks the right URL preset. */
  step: 6 | 7 | 8 | 9;
  /** Compact inline variant — smaller padding/font so the pill fits
   *  on a 28 px Balken row (Steps 6/7) or inline at the right end of
   *  the sources legend (Steps 8/9). Iter-18. */
  compact?: boolean;
  /** Shorter label for the compact variant ("Daten-Explorer" instead
   *  of "Mehr im Daten-Explorer"). Defaults to false (full label). */
  shortLabel?: boolean;
}

export default function DatenExplorerLink({ step, compact, shortLabel }: Props) {
  const target = TARGETS[step];
  const label = shortLabel ? 'Daten-Explorer' : target.label;
  return (
    <a
      className={`scrolly-de-link${compact ? ' scrolly-de-link--compact' : ''}`}
      href={target.href}
    >
      {label} →
    </a>
  );
}
