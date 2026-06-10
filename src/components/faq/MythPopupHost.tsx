/**
 * MythPopupHost — Mount once per FAQ page. Listens for clicks on any
 * `<a data-faq-myth-id="mNN" href="/daten-explorer/…">` (rendered by the
 * `factsheet-link` Markdoc tag inside FAQ answers) and opens the shared
 * FactsheetPanel —
 * the same slide-in popup used in Daten-Explorer, Quiz, and Fakten-Karten.
 *
 * Pre-rendered factsheet HTML, group metrics, and myth metadata are passed
 * as JSON props at build time so the popup never round-trips to the network.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import SharedFactsheetPanel from "../shared/FactsheetPanel";
import type { MythContentEntry } from "../shared/FactsheetPanel";
import type {
  CorrectnessClass,
  MythGroupMetrics,
} from "../../lib/dashboard/types";

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

/** Compact metadata for one myth, used to populate the panel header. */
export interface MythPopupIndexEntry {
  mythNumber: number;
  title: string;
  classification: string;
  classificationLabel: string;
  slug: string;
}

interface MythPopupHostProps {
  /** JSON-serialized `Record<string, MythPopupIndexEntry>` keyed by mythId ("m22"). */
  mythIndex: string;
  /** JSON-serialized `Record<number, MythContentEntry>` keyed by mythNumber. */
  mythContent: string;
  /** JSON-serialized `Record<number, MythGroupMetrics>` keyed by mythNumber. */
  groupMetrics?: string;
}

export default function MythPopupHost({
  mythIndex: mythIndexJson,
  mythContent: mythContentJson,
  groupMetrics: groupMetricsJson,
}: MythPopupHostProps) {
  const [openMythId, setOpenMythId] = useState<string | null>(null);
  /** True while we own a pushed history entry for the open popup. */
  const pushedHistoryRef = useRef(false);

  const mythIndex: Record<string, MythPopupIndexEntry> = useMemo(() => {
    try {
      return JSON.parse(mythIndexJson);
    } catch {
      return {};
    }
  }, [mythIndexJson]);

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

  // Browser Back button support: when the popup is open and the user presses
  // Back, close the popup instead of leaving the page.
  useEffect(() => {
    const onPop = () => {
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        setOpenMythId(null);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Push a history entry when a myth opens so Back can close it.
  useEffect(() => {
    if (!openMythId) return;
    try {
      if (pushedHistoryRef.current) {
        // Myth swap while panel is open — replace instead of stacking entries.
        window.history.replaceState({ mythPopup: openMythId }, "");
      } else {
        window.history.pushState({ mythPopup: openMythId }, "");
        pushedHistoryRef.current = true;
      }
    } catch {
      /* history API unavailable — popup still works, just no Back support */
    }
  }, [openMythId]);

  // Document-level delegation: catch clicks on any factsheet-link trigger
  // ([data-faq-myth-id]), no matter where in the tree it lives.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      // Triggers are real <a href="/daten-explorer/…"> links now (progressive
      // enhancement — see faq-nodes.ts / FaqRelatedRail). Let the browser
      // handle modified clicks so Cmd/Ctrl/Shift/Alt-click (and middle-click,
      // which fires auxclick, not click) still open the factsheet page in a
      // new tab/window; only intercept a plain left-click to open the popup
      // in place.
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const trigger = target.closest<HTMLElement>("[data-faq-myth-id]");
      if (!trigger) return;
      const id = trigger.getAttribute("data-faq-myth-id");
      if (!id) return;
      e.preventDefault();
      setOpenMythId(id);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const handleClose = useCallback(() => {
    if (pushedHistoryRef.current && window.history.state?.mythPopup) {
      // history.back() fires popstate → onPop → setOpenMythId(null).
      window.history.back();
    } else {
      setOpenMythId(null);
    }
  }, []);

  if (!openMythId) return null;
  const meta = mythIndex[openMythId];
  if (!meta) return null;

  const verdict = toVerdict(meta.classification);
  const content = mythContentMap[meta.mythNumber];
  const groupMetrics = groupMetricsMap[meta.mythNumber];

  return (
    <SharedFactsheetPanel
      context="fakten-karten"
      mythText={meta.title}
      classificationKey={verdict}
      classificationLabel={meta.classificationLabel}
      mythContentEntry={content}
      factsheetSlug={meta.slug}
      groupMetrics={groupMetrics}
      onClose={handleClose}
    />
  );
}
