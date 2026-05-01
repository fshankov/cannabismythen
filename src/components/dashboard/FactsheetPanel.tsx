/**
 * Dashboard FactsheetPanel — Thin wrapper around the shared FactsheetPanel.
 * (Decision G: Merged into shared component)
 */

import SharedFactsheetPanel from '../shared/FactsheetPanel';
import type { MythContentEntry } from '../shared/FactsheetPanel';
import type { Myth } from '../../lib/dashboard/types';
import { t, type TranslationKey } from '../../lib/dashboard/translations';

export type { MythContentEntry };

interface FactsheetPanelProps {
  myth: Myth;
  mythContentEntry?: MythContentEntry;
  factsheetSlug?: string;
  onClose: () => void;
}

export default function FactsheetPanel({
  myth,
  mythContentEntry,
  factsheetSlug,
  onClose,
}: FactsheetPanelProps) {
  // Canonical verdict label — the conversational `classificationLabel`
  // on the .mdoc is intentionally bypassed (Stage 1 of the
  // Daten-Explorer refactor unified verdict copy across the site).
  const canonicalLabel = t(
    `verdict.${myth.correctness_class}` as TranslationKey,
    'de',
  );

  return (
    <SharedFactsheetPanel
      context="dashboard"
      mythText={myth.text_de}
      classificationKey={myth.correctness_class}
      classificationLabel={canonicalLabel}
      mythContentEntry={mythContentEntry}
      factsheetSlug={factsheetSlug}
      verdictLabel="Wissenschaftliches Urteil:"
      onClose={onClose}
    />
  );
}
