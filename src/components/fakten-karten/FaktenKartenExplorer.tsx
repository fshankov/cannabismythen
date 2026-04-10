/**
 * FaktenKartenExplorer — Main React island for the Fakten-Karten page.
 *
 * Displays all 42 myth cards in a filterable grid, grouped by categoryGroup.
 * Cards flip to show a short evidence-based summary; a "mehr erfahren" button
 * opens the shared FactsheetPanel with the full factsheet content.
 */

import { useState, useMemo, useCallback } from "react";
import FaktenCard from "./FaktenCard";
import type { FaktenCardMyth } from "./FaktenCard";
import SharedFactsheetPanel from "../shared/FactsheetPanel";
import type { MythContentEntry } from "../shared/FactsheetPanel";

/** Category groups in display order */
const CATEGORY_GROUPS = [
  "Medizinischer und therapeutischer Nutzen",
  "Risiken für den Körper und die Entwicklung",
  "Risiken für die psychische Gesundheit",
  "Einfluss auf Stimmung und Wahrnehmung",
  "Soziale Auswirkungen und Leistungsfähigkeit",
  "Risiken durch Dosierung und Qualität",
  "Verbreitung in der Bevölkerung und Gesetzgebung",
  "Allgemeine Einschätzung der Gefährlichkeit",
];

interface MythEntry extends FaktenCardMyth {
  categoryGroup: string;
}

interface FaktenKartenExplorerProps {
  /** JSON-serialized MythEntry[] */
  myths: string;
  /** JSON-serialized Record<number, MythContentEntry> */
  mythContent: string;
}

export default function FaktenKartenExplorer({
  myths: mythsJson,
  mythContent: mythContentJson,
}: FaktenKartenExplorerProps) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
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

  const filteredMyths = useMemo(() => {
    const list = activeGroup
      ? allMyths.filter((m) => m.categoryGroup === activeGroup)
      : allMyths;
    return list.sort((a, b) => a.mythNumber - b.mythNumber);
  }, [allMyths, activeGroup]);

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
      <div className="fakten-filter-bar">
        <button
          type="button"
          className={`fakten-filter-bar__btn ${activeGroup === null ? "fakten-filter-bar__btn--active" : ""}`}
          onClick={() => setActiveGroup(null)}
        >
          Alle
        </button>
        {CATEGORY_GROUPS.map((group) => (
          <button
            key={group}
            type="button"
            className={`fakten-filter-bar__btn ${activeGroup === group ? "fakten-filter-bar__btn--active" : ""}`}
            onClick={() => setActiveGroup(group)}
          >
            {group}
          </button>
        ))}
      </div>

      <p className="fakten-explorer__count">
        {filteredMyths.length} Mythen{" "}
        {activeGroup ? `in \u201E${activeGroup}\u201C` : "insgesamt"}
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

      {openMyth && (
        <SharedFactsheetPanel
          context="fakten-karten"
          mythText={openMyth.title}
          classificationKey={openMyth.classification}
          classificationLabel={openMyth.classificationLabel}
          mythContentEntry={openMythContent}
          factsheetSlug={openMyth.slug}
          onClose={handleCloseFactsheet}
        />
      )}
    </div>
  );
}
