/**
 * MythPopupHost — Mount once per FAQ page. Listens for clicks on any
 * `<button data-faq-myth-id="mNN">` (rendered by the `factsheet-link`
 * Markdoc tag inside FAQ answers) and opens the shared FactsheetPanel —
 * the same slide-in popup used in Daten-Explorer, Quiz, and Fakten-Karten.
 *
 * Pre-rendered factsheet HTML, group metrics, and myth metadata are passed
 * as JSON props at build time so the popup never round-trips to the network.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
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

  // Document-level delegation: catch clicks on any button rendered by the
  // factsheet-link Markdoc tag, no matter where in the tree it lives.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest<HTMLElement>("[data-faq-myth-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-faq-myth-id");
      if (!id) return;
      // Skip if the button is disabled or inside a regular <a> the user
      // expects to follow (defensive — we render <button>, not <a>).
      if (btn.closest("a")) return;
      e.preventDefault();
      setOpenMythId(id);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const handleClose = useCallback(() => setOpenMythId(null), []);

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
