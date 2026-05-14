/**
 * FaktenKartenExplorer — Main React island for the Fakten-Karten page.
 *
 * Displays all 42 myth cards in a filterable grid. Cards flip to show a
 * short evidence-based summary; a "mehr erfahren" button opens the
 * shared FactsheetPanel with the full factsheet content.
 *
 * Filtering is INLINE — a search input + categories dropdown sit
 * directly above the grid (no drawer, no slide-out). Per Fedor
 * 2026-05-14, the discoverability of always-visible filters is more
 * valuable than the visual restraint of a drawer for this surface.
 */

import { useState, useMemo, useCallback } from "react";
import FaktenCard from "./FaktenCard";
import type { FaktenCardMyth } from "./FaktenCard";
import FaktenFilterBar from "./FaktenFilterBar";
import SharedFactsheetPanel from "../shared/FactsheetPanel";
import type { MythContentEntry } from "../shared/FactsheetPanel";
import type {
  CorrectnessClass,
  MythGroupMetrics,
} from "../../lib/dashboard/types";
import { normalize } from "../../lib/text-normalize";

const VALID_VERDICTS: ReadonlySet<CorrectnessClass> = new Set([
  "richtig",
  "eher_richtig",
  "eher_falsch",
  "falsch",
  "no_classification",
]);

function toVerdict(raw: string): CorrectnessClass {
  return VALID_VERDICTS.has(raw as CorrectnessClass)
    ? (raw as CorrectnessClass)
    : "no_classification";
}

/** Category groups in display order. */
const CATEGORY_GROUPS = [
  "Medizinischer und therapeutischer Nutzen",
  "Risiken für den Körper und die Entwicklung",
  "Risiken für die psychische Gesundheit",
  "Einfluss auf Stimmung und Wahrnehmung",
  "Soziale Auswirkungen und Leistungsfähigkeit",
  "Risiken durch Dosierung und Qualität",
  "Verbreitung in der Bevölkerung und Gesetzgebung",
  "Allgemeine Einschätzung der Gefährlichkeit",
] as const;

interface MythEntry extends FaktenCardMyth {
  categoryGroup: string;
}

interface FaktenKartenExplorerProps {
  /** JSON-serialized MythEntry[] */
  myths: string;
  /** JSON-serialized Record<number, MythContentEntry> */
  mythContent: string;
  /** JSON-serialized Record<number, MythGroupMetrics>. Built at build
   *  time from `public/data/carm-data.json`. Powers the interactive
   *  bar chart inside the FactsheetPanel popup. */
  groupMetrics?: string;
}

export default function FaktenKartenExplorer({
  myths: mythsJson,
  mythContent: mythContentJson,
  groupMetrics: groupMetricsJson,
}: FaktenKartenExplorerProps) {
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [factsheetMyth, setFactsheetMyth] = useState<string | null>(null);

  const allMyths: MythEntry[] = useMemo(() => {
    try {
      return JSON.parse(mythsJson);
    } catch {
      return [];
    }
  }, [mythsJson]);

  const mythContentMap: Record<number, MythContentEntry> = useMemo(() => {
    try {
      return JSON.parse(mythContentJson);
    } catch {
      return {};
    }
  }, [mythContentJson]);

  const groupMetricsMap: Record<number, MythGroupMetrics> = useMemo(() => {
    if (!groupMetricsJson) return {};
    try {
      return JSON.parse(groupMetricsJson);
    } catch {
      return {};
    }
  }, [groupMetricsJson]);

  const toggleGroup = useCallback((group: string) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedGroups(new Set());
    setSearchQuery("");
  }, []);

  const filteredMyths = useMemo(() => {
    const q = normalize(searchQuery.trim());
    const noSelection = selectedGroups.size === 0;
    const list = allMyths.filter((m) => {
      if (q.length > 0) {
        // Search bypasses the category filter — show all title matches.
        return normalize(m.title).includes(q);
      }
      if (noSelection) return true;
      return selectedGroups.has(m.categoryGroup);
    });
    return list.sort((a, b) => a.mythNumber - b.mythNumber);
  }, [allMyths, selectedGroups, searchQuery]);

  const handleShowFactsheet = useCallback((slug: string) => {
    setFactsheetMyth(slug);
  }, []);

  const handleCloseFactsheet = useCallback(() => {
    setFactsheetMyth(null);
  }, []);

  // Find the myth for the open factsheet panel
  const openMyth = factsheetMyth
    ? allMyths.find((m) => m.slug === factsheetMyth)
    : null;

  const openMythContent = openMyth
    ? mythContentMap[openMyth.mythNumber]
    : undefined;

  return (
    <div className="fakten-explorer">
      <FaktenFilterBar
        categoryGroups={CATEGORY_GROUPS}
        myths={allMyths}
        selectedGroups={selectedGroups}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleGroup={toggleGroup}
        onReset={resetFilters}
      />

      <p className="fakten-explorer__count">
        {filteredMyths.length} Mythen{" "}
        {selectedGroups.size > 0 || searchQuery.trim().length > 0
          ? "ausgewählt"
          : "insgesamt"}
      </p>

      <div className="fakten-grid">
        {filteredMyths.map((myth) => (
          <FaktenCard
            key={myth.mythNumber}
            myth={myth}
            mythContentEntry={mythContentMap[myth.mythNumber]}
            onShowFactsheet={handleShowFactsheet}
          />
        ))}
      </div>

      {openMyth && (() => {
        // The popup heading uses the unified VerdictStatement (statement
        // with verdict color + arrow) plus the new "Wissenschaftlich:
        // <pill>" line that lives inside SharedFactsheetPanel itself.
        // We no longer pass the legacy verdictLabel / verdictAccessory
        // props — they were removed in the panel's v3 refresh.
        const verdict = toVerdict(openMyth.classification);
        return (
          <SharedFactsheetPanel
            context="fakten-karten"
            mythText={openMyth.title}
            classificationKey={verdict}
            classificationLabel={openMyth.classificationLabel}
            mythContentEntry={openMythContent}
            factsheetSlug={openMyth.slug}
            groupMetrics={groupMetricsMap[openMyth.mythNumber]}
            onClose={handleCloseFactsheet}
          />
        );
      })()}
    </div>
  );
}
