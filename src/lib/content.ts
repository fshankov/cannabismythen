/**
 * Content utilities for querying Keystatic collections.
 *
 * This module provides helper functions for:
 * - Creating a Keystatic reader
 * - Filtering published-only content
 * - Stripping internal-only fields before rendering
 * - Sorting entries
 */

import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../keystatic.config";

/**
 * Server-side reader for Keystatic content.
 * Use this in .astro pages and API routes (NOT in client components).
 */
export const reader = createReader(process.cwd(), keystaticConfig);

/**
 * Generic entry type with at least status and internalNotes.
 */
interface ContentEntry {
  status: string;
  internalNotes?: string;
  [key: string]: unknown;
}

/**
 * Filter entries to only those with status === "published".
 */
export function filterPublished<T extends ContentEntry>(entries: T[]): T[] {
  return entries.filter((entry) => entry.status === "published");
}

/**
 * Strip internalNotes from an entry before rendering.
 * Ensures editorial notes never leak to the public site.
 */
export function stripInternal<T extends ContentEntry>(
  entry: T
): Omit<T, "internalNotes"> {
  const { internalNotes, ...publicEntry } = entry;
  return publicEntry;
}

/**
 * Load all entries from a collection, filter to published, strip internal fields.
 * Returns an array of [slug, entry] tuples.
 */
export async function getPublishedEntries(
  collectionName: keyof typeof keystaticConfig.collections
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
