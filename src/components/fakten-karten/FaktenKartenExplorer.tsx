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

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
  /** JSON-serialized Record<number, MythGroupMetrics>. Built at build
   *  time from `public/data/carm-data.json`. Powers the interactive
   *  bar chart inside the FactsheetPanel popup. */
  groupMetrics?: string;
}

export default function FaktenKartenExplorer({
  myths: mythsJson,
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
  /** Lazily-fetched factsheet content, keyed by mythNumber (Audit B-05).
   *  Populated on first popup open from the prerendered per-myth JSON
   *  endpoints; cached so reopening a myth never refetches. */
  const [contentCache, setContentCache] = useState<
    Record<number, MythContentEntry>
  >({});

  const allMyths: MythEntry[] = useMemo(() => {
    try {
      return JSON.parse(mythsJson);
    } catch {
      return [];
    }
  }, [mythsJson]);

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

  /** True while WE own a pushed history entry for the open popup, so close
   *  knows whether to step back (consistent URL + stack) or just clear
   *  inline (deep-link landing, where Back should leave the page). */
  const pushedHistoryRef = useRef(false);

  const handleShowFactsheet = useCallback((slug: string) => {
    setFactsheetMyth(slug);
    // Push a history entry so mobile Back closes the popup and the open myth
    // is deep-linkable via ?myth=<slug> (Audit B-02 / Nielsen #3).
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("myth", slug);
      window.history.pushState({ factsheetMyth: slug }, "", url);
      pushedHistoryRef.current = true;
    } catch {
      /* history API unavailable — popup still works, just no URL sync */
    }
  }, []);

  const handleCloseFactsheet = useCallback(() => {
    // If we own a pushed entry, step back so the URL + history stack stay
    // consistent (the popstate handler clears the panel). Otherwise (e.g. a
    // deep-link landing) clear inline and strip the ?myth param.
    if (pushedHistoryRef.current && window.history.state?.factsheetMyth) {
      window.history.back();
      return;
    }
    setFactsheetMyth(null);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("myth")) {
        url.searchParams.delete("myth");
        window.history.replaceState(null, "", url);
      }
    } catch {
      /* ignore */
    }
  }, []);

  /** Swap the open popup to a related myth (Audit B-08). Reuses
   *  handleShowFactsheet so the swap pushes a history entry — Back then
   *  steps back through the chain of myths the user followed. */
  const handleSelectRelatedMyth = useCallback(
    (mythNumber: number) => {
      const target = allMyths.find((m) => m.mythNumber === mythNumber);
      if (target) handleShowFactsheet(target.slug);
    },
    [allMyths, handleShowFactsheet],
  );

  // Sync popup state to Back / Forward navigation (Audit B-02).
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const slug = (e.state && e.state.factsheetMyth) || null;
      setFactsheetMyth(slug);
      pushedHistoryRef.current = !!slug;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Deep-link: open the popup if the page loads with ?myth=<slug>. Uses
  // replaceState (not push) so the first Back leaves the page as expected
  // rather than dropping into a phantom popup entry.
  useEffect(() => {
    try {
      const slug = new URL(window.location.href).searchParams.get("myth");
      if (slug && allMyths.some((m) => m.slug === slug)) {
        setFactsheetMyth(slug);
        window.history.replaceState(
          { factsheetMyth: slug },
          "",
          window.location.href,
        );
        pushedHistoryRef.current = false;
      }
    } catch {
      /* ignore */
    }
  }, [allMyths]);

  // Find the myth for the open factsheet panel
  const openMyth = factsheetMyth
    ? allMyths.find((m) => m.slug === factsheetMyth)
    : null;

  // Lazily fetch the open myth's factsheet HTML (Audit B-05). Until it
  // arrives, the panel renders its fallback (statement + verdict + data
  // bars + PDF) — the heavy prose sections fill in once the tiny static
  // JSON resolves. Cached per mythNumber so reopening never refetches.
  useEffect(() => {
    if (!openMyth) return;
    const n = openMyth.mythNumber;
    if (contentCache[n]) return;
    let cancelled = false;
    fetch(`/fakten-karten/factsheets/${n}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<MythContentEntry>) : null))
      .then((entry) => {
        if (!cancelled && entry) {
          setContentCache((prev) => (prev[n] ? prev : { ...prev, [n]: entry }));
        }
      })
      .catch(() => {
        /* network/parse error — panel keeps its fallback rendering */
      });
    return () => {
      cancelled = true;
    };
  }, [openMyth, contentCache]);

  const openMythContent = openMyth
    ? contentCache[openMyth.mythNumber]
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
        <FaktenListView myths={filteredMyths} onShowFactsheet={handleShowFactsheet} />
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
            onSelectRelatedMyth={handleSelectRelatedMyth}
          />
        );
      })()}
    </div>
  );
}
