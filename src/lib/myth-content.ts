/**
 * Build-time helper that produces the `Record<mythNumber, MythContentEntry>`
 * map every popup surface (Daten-Explorer, Fakten-Karten, Quiz, Meine
 * Interessen) ships into its React island via JSON.
 *
 * Why this lives outside each .astro: prior to travel-pipeline Stage 4B/4C
 * (2026-05-23) each callsite duplicated the same Markdoc-render + clean-title
 * loop. With Related Myths + FAQ backlinks now part of the entry, the loop
 * grew long enough that duplicating it five times invited drift. One helper
 * keeps the popup data shape canonical across surfaces.
 *
 * The helper does TWO passes:
 *   1. Build a `mythId → {mythNumber, title, classification}` index so we can
 *      resolve `relatedMyths` (which the .mdoc stores as ["m04","m12"]) into
 *      concrete `RelatedMythRef` objects with title + verdict.
 *   2. For each published myth: render the Markdoc body, clean the title,
 *      pull related-myth refs from the pass-1 index, fetch FAQ backlinks via
 *      `getQuestionsForMyth`, and emit a `MythContentEntry`.
 *
 * The pass-1 index avoids 42 × 42 lookups (every myth's related list against
 * every other myth's metadata) — we build it once and reuse for every entry.
 */

import Markdoc from "@markdoc/markdoc";
import { reader, getPublishedEntries } from "./content";
import { getQuestionsForMyth } from "./faq";
import type {
  MythContentEntry,
  RelatedMythRef,
  FaqBacklink,
} from "../components/shared/FactsheetPanel";

/** Strip the "Mythos N:" prefix and trailing terminal punctuation so the
 *  popup title reads as a clean statement. Mirrors the rule each .astro
 *  callsite used to inline. */
function cleanMythTitle(raw: string): string {
  return raw
    .replace(/^Mythos\s+\d+(?:\/\d+)?:\s*/i, "")
    .replace(/[.!?]+$/u, "");
}

interface RelatedIndexEntry {
  mythNumber: number;
  title: string;
  classification: string;
}

/**
 * Returns a `Record<mythNumber, MythContentEntry>` ready to JSON-serialize
 * and pass into any popup surface. Internally:
 *   - skips entries missing `mythNumber` or `mythId`
 *   - swallows per-myth Markdoc render errors (so a single broken .mdoc
 *     doesn't take down the whole map)
 *   - returns an empty `[]` for relatedMyths / faqBacklinks when the
 *     source data is empty (callers can still rely on the field existing)
 */
export async function buildMythContentMap(): Promise<
  Record<number, MythContentEntry>
> {
  const entries = await getPublishedEntries("zahlenUndFakten");

  // Pass 1: assemble the related-myth resolution index.
  const relatedIndex = new Map<string, RelatedIndexEntry>();
  for (const [, entry] of entries) {
    const e = entry as {
      mythNumber?: number;
      mythId?: string;
      title?: string;
      classification?: string;
    };
    if (!e.mythNumber || !e.mythId || !e.title) continue;
    relatedIndex.set(e.mythId, {
      mythNumber: e.mythNumber,
      title: cleanMythTitle(e.title),
      classification: e.classification ?? "",
    });
  }

  // Pass 2: render each myth + attach related + backlink refs.
  const map: Record<number, MythContentEntry> = {};
  for (const [slug, entry] of entries) {
    const e = entry as {
      mythNumber?: number;
      mythId?: string;
      classification?: string;
      classificationLabel?: string;
    };
    if (!e.mythNumber) continue;

    try {
      const full = await reader.collections.zahlenUndFakten.read(slug);
      if (!full || !full.content) continue;
      const { node } = await full.content();
      const html = Markdoc.renderers.html(Markdoc.transform(node));
      const refCount = (html.match(/<li>/g) || []).length;
      const title = cleanMythTitle((full.title as string) ?? "");

      // Resolve related-myth IDs against the pass-1 index.
      const rawRelated = ((full as { relatedMyths?: readonly string[] })
        .relatedMyths ?? []) as readonly string[];
      const relatedMyths: RelatedMythRef[] = [];
      for (const rid of rawRelated) {
        const info = relatedIndex.get(rid);
        if (!info) continue;
        relatedMyths.push({
          mythId: rid,
          mythNumber: info.mythNumber,
          title: info.title,
          classification: info.classification,
        });
      }

      // FAQ backlinks via the existing lib/faq.ts helper. Pass the
      // mythId string ("m04") — the helper normalises internally.
      const backlinkQs = e.mythId ? await getQuestionsForMyth(e.mythId) : [];
      const faqBacklinks: FaqBacklink[] = backlinkQs.map((q) => ({
        slug: q.slug,
        title: q.questionLong || q.title,
        audience: q.audience,
        href: `/meine-interessen/${q.audience}/#frage-${q.slug}`,
      }));

      map[e.mythNumber] = {
        html,
        title,
        classification:
          (full as { classification?: string }).classification ?? "",
        classificationLabel:
          (full as { classificationLabel?: string }).classificationLabel ?? "",
        refCount,
        relatedMyths,
        faqBacklinks,
      };
    } catch {
      // If a single factsheet fails to render, skip it rather than
      // crashing the whole page. Same swallow each .astro used to do.
    }
  }

  return map;
}

/**
 * Quiz callsite variant — same data, keyed by mythId string ("m04") instead
 * of mythNumber. QuizPlayer's content map is `Record<string, MythContentEntry>`.
 */
export async function buildMythContentMapByMythId(): Promise<
  Record<string, MythContentEntry>
> {
  const numbered = await buildMythContentMap();
  const byMythId: Record<string, MythContentEntry> = {};
  for (const [mythNumber, entry] of Object.entries(numbered)) {
    const id = `m${String(mythNumber).padStart(2, "0")}`;
    byMythId[id] = entry;
  }
  return byMythId;
}
