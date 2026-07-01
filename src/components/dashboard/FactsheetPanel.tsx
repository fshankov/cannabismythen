/**
 * Dashboard FactsheetPanel — Thin wrapper around the shared FactsheetPanel.
 * (Decision G: Merged into shared component)
 */

import SharedFactsheetPanel from "../shared/FactsheetPanel";
import type { MythContentEntry } from "../shared/FactsheetPanel";
import type { Myth, MythGroupMetrics } from "../../lib/dashboard/types";
import { t, type TranslationKey } from "../../lib/dashboard/translations";
import VerdictArrowWithInfo from "./VerdictArrowWithInfo";

export type { MythContentEntry };

interface FactsheetPanelProps {
  myth: Myth;
  mythContentEntry?: MythContentEntry;
  factsheetSlug?: string;
  /** Per-Zielgruppe metric slice for the open myth. Forwarded to the
   *  shared panel which renders the interactive bar chart in place of
   *  the legacy "Daten nach Zielgruppen" markdown table. */
  groupMetrics?: MythGroupMetrics;
  onClose: () => void;
  /** Travel pipeline 4B (2026-05-23) — click a related-myth row inside
   *  the popup's "Verwandte Mythen" section to swap the panel to that
   *  myth without closing first. Parent's `selectMyth` dispatch does the
   *  state update. */
  onSelectRelatedMyth?: (mythNumber: number) => void;
}

export default function FactsheetPanel({
  myth,
  mythContentEntry,
  factsheetSlug,
  groupMetrics,
  onClose,
  onSelectRelatedMyth,
}: FactsheetPanelProps) {
  // Canonical verdict label — the conversational `classificationLabel`
  // on the .mdoc is intentionally bypassed (Stage 1 of the
  // Daten-Explorer refactor unified verdict copy across the site).
  const canonicalLabel = t(
    `verdict.${myth.correctness_class}` as TranslationKey,
    "de",
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
      verdictAccessory={
        <VerdictArrowWithInfo
          verdict={myth.correctness_class}
          size={14}
          strokeWidth={2.25}
        />
      }
      groupMetrics={groupMetrics}
      onClose={onClose}
      onSelectRelatedMyth={onSelectRelatedMyth}
    />
  );
}
