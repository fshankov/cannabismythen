/**
 * Dashboard FactsheetPanel — Thin wrapper around the shared FactsheetPanel.
 * (Decision G: Merged into shared component)
 */

import SharedFactsheetPanel from '../shared/FactsheetPanel';
import type { MythContentEntry } from '../shared/FactsheetPanel';
import type { Myth } from '../../lib/dashboard/types';

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
  return (
    <SharedFactsheetPanel
      context="dashboard"
      mythText={myth.text_de}
      classificationKey={myth.correctness_class}
      classificationLabel={
        mythContentEntry?.classificationLabel ||
        myth.classification_de ||
        myth.correctness_class
      }
      mythContentEntry={mythContentEntry}
      factsheetSlug={factsheetSlug}
      verdictLabel="Wissenschaftliches Urteil:"
      onClose={onClose}
    />
  );
}
