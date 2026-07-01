/**
 * Content utilities for querying Keystatic collections.
 *
 * Provides a server-side Keystatic reader and a helper that lists every
 * published entry in a collection with internal-only fields stripped.
 */

import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../keystatic.config";

/**
 * Server-side reader for Keystatic content.
 * Use this in .astro pages and API routes (NOT in client components).
 */
export const reader = createReader(process.cwd(), keystaticConfig);

interface ContentEntry {
  status: string;
  internalNotes?: string;
  [key: string]: unknown;
}

/**
 * Load all entries from a collection, filter to published, strip internal fields.
 * Returns an array of [slug, entry] tuples.
 */
export async function getPublishedEntries(
  collectionName: keyof typeof keystaticConfig.collections,
) {
  const allSlugs = await reader.collections[collectionName].list();
  const entries: [string, Record<string, unknown>][] = [];

  for (const slug of allSlugs) {
    const entry = await reader.collections[collectionName].read(slug);
    if (entry && entry.status === "published") {
      const { internalNotes, ...publicEntry } = entry as ContentEntry;
      entries.push([slug, publicEntry]);
    }
  }

  return entries;
}
