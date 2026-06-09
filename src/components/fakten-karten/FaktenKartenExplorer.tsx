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
import FaktenListView from "./FaktenListView";
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
  "keine_aussage_moeglich",
]);

function toVerdict(raw: string): CorrectnessClass {
  return VALID_VERDICTS.has(raw as CorrectnessClass)
    ? (raw as CorrectnessClass)
    : "keine_aussage_moeglich";
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
  shortLabel: string;
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
  /** Individual myths the user has ticked in the search autocomplete
   *  dropdown. AND-composed with selectedGroups (see filteredMyths). */
  const [selectedMyths, setSelectedMyths] = useState<Set<number>>(
    () => new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [factsheetMyth, setFactsheetMyth] = useState<string | null>(null);
  const [view, setView] = useState<"karten" | "liste">("karten");

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

  const toggleMyth = useCallback((mythNumber: number) => {
    setSelectedMyths((prev) => {
      const next = new Set(prev);
      if (next.has(mythNumber)) next.delete(mythNumber);
      else next.add(mythNumber);
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedGroups(new Set());
    setSelectedMyths(new Set());
    setSearchQuery("");
  }, []);

  /** Clear search text + myth ticks together.
   *  Called by the X button in FaktenFilterBar so that clearing the
   *  input always resets the grid fully (no invisible lingering ticks).
   *  Category group ticks are left untouched. */
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSelectedMyths(new Set());
  }, []);

  /** Filter logic:
   *
   *  - No ticks, no text  → all 42 visible.
   *  - Text only          → live text filter on all 42 (preview before ticking).
   *  - Category ticks     → myths in those categories; text further narrows.
   *  - Myth ticks         → only those myths shown; text ignored for grid
   *                         (text is for discovering/adding more in the panel,
   *                         not for filtering out explicitly chosen myths).
   *  - Both tick types    → intersection (AND); see empty-state msg below.
   */
  const filteredMyths = useMemo(() => {
    const q = normalize(searchQuery.trim());
    const hasGroupTicks = selectedGroups.size > 0;
    const hasMythTicks = selectedMyths.size > 0;
    const list = allMyths.filter((m) => {
      if (hasMythTicks && !selectedMyths.has(m.mythNumber)) return false;
      if (hasGroupTicks && !selectedGroups.has(m.categoryGroup)) return false;
      // Text narrows the grid only when no myth-ticks are active.
      // With myth-ticks the grid is an explicit selection; text is for
      // the autocomplete panel (adding more), not for removing chosen myths.
      if (!hasMythTicks && q.length > 0 && !normalize(m.title).includes(q)) return false;
      return true;
    });
    return list.sort((a, b) => a.mythNumber - b.mythNumber);
  }, [allMyths, selectedGroups, selectedMyths, searchQuery]);

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
        selectedMyths={selectedMyths}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={clearSearch}
        onToggleGroup={toggleGroup}
        onToggleMyth={toggleMyth}
        onReset={resetFilters}
        view={view}
        onSetView={setView}
      />

      {filteredMyths.length === 0 ? (
        <p className="fakten-empty">
          {selectedGroups.size > 0 && selectedMyths.size > 0
            ? /* "No overlap — the selected myths are not in the selected categories." */
              "Keine Übereinstimmung — die gewählten Mythen gehören nicht zu den gewählten Kategorien."
            : "Keine Treffer für die aktuelle Auswahl."}{" "}
          <button
            type="button"
            className="fakten-empty__reset"
            onClick={resetFilters}
          >
            Filter zurücksetzen
          </button>
        </p>
      ) : view === "liste" ? (
        <FaktenListView myths={filteredMyths} />
      ) : (
        <div className="fakten-grid">
          {filteredMyths.map((myth) => (
            <FaktenCard
              key={myth.mythNumber}
              myth={myth}
              categoryGroup={myth.categoryGroup}
              onShowFactsheet={handleShowFactsheet}
              isActive={factsheetMyth === myth.slug}
            />
          ))}
        </div>
      )}

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
