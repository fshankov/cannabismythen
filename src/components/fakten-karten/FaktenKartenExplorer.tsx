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
import { LayoutGrid, LayoutList } from "lucide-react";
import FaktenCard from "./FaktenCard";
import type { FaktenCardMyth } from "./FaktenCard";
import FaktenFilterBar from "./FaktenFilterBar";
import FaktenListView from "./FaktenListView";
import FaktenExport from "./FaktenExport";
import PivotToggle from "../dashboard/controls/PivotToggle";
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
  /** Export drawer (button lives in the FaktenFilterBar toolbar). */
  const [exportOpen, setExportOpen] = useState(false);
  /** Becomes true once the initial URL parse (Audit B-09) has run, so the
   *  URL-write effect below doesn't clobber params before they're restored. */
  const [urlReady, setUrlReady] = useState(false);
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

  const clearGroups = useCallback(() => {
    setSelectedGroups(new Set());
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
      if (!hasMythTicks && q.length > 0 && !normalize(m.title).includes(q))
        return false;
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

  // Listen for programmatic view switches dispatched from outside the island
  // (e.g. the "Liste aller Mythen anzeigen" link in the page header).
  useEffect(() => {
    const handler = (e: Event) => {
      const v = (e as CustomEvent<string>).detail;
      if (v === "liste" || v === "karten") setView(v);
    };
    window.addEventListener("fakten:setView", handler);
    return () => window.removeEventListener("fakten:setView", handler);
  }, []);

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

  // Mount: restore state from the URL once (Audit B-02 popup + B-09 filters).
  // The popup deep-link uses replaceState (not push) so the first Back leaves
  // the page rather than dropping into a phantom popup entry.
  useEffect(() => {
    try {
      const params = new URL(window.location.href).searchParams;

      // Popup deep-link (?myth=<slug>).
      const slug = params.get("myth");
      if (slug && allMyths.some((m) => m.slug === slug)) {
        setFactsheetMyth(slug);
        window.history.replaceState(
          { factsheetMyth: slug },
          "",
          window.location.href,
        );
        pushedHistoryRef.current = false;
      }

      // View (?view=liste).
      if (params.get("view") === "liste") setView("liste");

      // Category groups (?kat=<indices into CATEGORY_GROUPS>).
      const kat = params.get("kat");
      if (kat) {
        const groups = kat
          .split(",")
          .map((t) => CATEGORY_GROUPS[Number(t)])
          .filter((g): g is (typeof CATEGORY_GROUPS)[number] => Boolean(g));
        if (groups.length) setSelectedGroups(new Set(groups));
      }

      // Ticked myths (?myths=<numbers>).
      const myths = params.get("myths");
      if (myths) {
        const valid = new Set(allMyths.map((m) => m.mythNumber));
        const nums = myths
          .split(",")
          .map(Number)
          .filter((n) => valid.has(n));
        if (nums.length) setSelectedMyths(new Set(nums));
      }

      // Search query (?q=...).
      const q = params.get("q");
      if (q) setSearchQuery(q);
    } catch {
      /* ignore */
    }
    // Initial parse done — the URL-write effect may now begin syncing.
    setUrlReady(true);
  }, [allMyths]);

  // Sync filter + view state back to the URL (Audit B-09), debounced like the
  // Daten-Explorer (src/lib/dashboard/url-state.ts). replaceState keeps the
  // history stack clean; the popup's own ?myth entry + history.state are
  // preserved so B-02 keeps working.
  useEffect(() => {
    if (!urlReady) return;
    const timer = setTimeout(() => {
      try {
        const url = new URL(window.location.href);
        const p = url.searchParams;

        if (view === "liste") p.set("view", "liste");
        else p.delete("view");

        const cats = [...selectedGroups]
          .map((g) => (CATEGORY_GROUPS as readonly string[]).indexOf(g))
          .filter((i) => i >= 0)
          .sort((a, b) => a - b);
        if (cats.length) p.set("kat", cats.join(","));
        else p.delete("kat");

        const ms = [...selectedMyths].sort((a, b) => a - b);
        if (ms.length) p.set("myths", ms.join(","));
        else p.delete("myths");

        if (searchQuery.trim()) p.set("q", searchQuery);
        else p.delete("q");

        window.history.replaceState(window.history.state, "", url);
      } catch {
        /* ignore */
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedGroups, selectedMyths, searchQuery, view, urlReady]);

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
      {/* View toggle floats ABOVE the white panel — mirrors the
          Daten-Explorer, where the Mythen/Informationswege toggle row
          sits above `.carm-explorer__panel`. Karten/Liste behaviour is
          unchanged; only its position moved out of the filter toolbar. */}
      <div className="fakten-explorer__toggle-row">
        <div className="fakten-filter-bar__view-toggle">
          <PivotToggle
            options={[
              {
                value: "karten",
                label: (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <LayoutGrid size={13} aria-hidden="true" />
                    Karten
                  </span>
                ),
              },
              {
                value: "liste",
                label: (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <LayoutList size={13} aria-hidden="true" />
                    Liste
                  </span>
                ),
              },
            ]}
            value={view}
            onChange={setView}
            aria-label="Ansicht wechseln"
          />
        </div>
      </div>

      {/* White container — same surface as the Daten-Explorer's
          `.carm-explorer__panel` (32px padding, 16px radius, soft border +
          shadow). Inside: the filter toolbar (Kategorien + Suche + Export)
          on top, then the cards/list below. */}
      <div className="fakten-explorer__panel">
        <FaktenFilterBar
          categoryGroups={CATEGORY_GROUPS}
          myths={allMyths}
          selectedGroups={selectedGroups}
          selectedMyths={selectedMyths}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={clearSearch}
          onClearGroups={clearGroups}
          onToggleGroup={toggleGroup}
          onToggleMyth={toggleMyth}
          onReset={resetFilters}
          onOpenExport={() => setExportOpen(true)}
        />

        {/* Live region — screen readers announce filtered count when filters change */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
            whiteSpace: "nowrap",
          }}
        >
          {filteredMyths.length === allMyths.length
            ? `${allMyths.length} Mythen angezeigt`
            : `${filteredMyths.length} von ${allMyths.length} Mythen gefiltert`}
        </div>

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
          <FaktenListView
            myths={filteredMyths}
            onShowFactsheet={handleShowFactsheet}
          />
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
      </div>

      <FaktenExport
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        myths={filteredMyths}
      />

      {openMyth &&
        (() => {
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
