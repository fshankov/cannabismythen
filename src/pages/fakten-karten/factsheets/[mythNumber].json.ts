import type { APIRoute, GetStaticPaths } from "astro";
import { buildMythContentMap } from "@lib/myth-content";
import type { MythContentEntry } from "@components/shared/FactsheetPanel";

/**
 * Prerendered per-myth factsheet JSON (Audit B-05).
 *
 * At build time this emits one tiny static file per myth at
 * `/fakten-karten/factsheets/<mythNumber>.json`. The Fakten-Karten island
 * fetches only the open myth's factsheet on demand instead of the page
 * inlining all 42 rendered factsheets into the initial HTML document.
 *
 * `buildMythContentMap()` runs once in getStaticPaths (not per file), so the
 * 42 outputs share a single render pass. Path ends in `.json`, so the edge
 * password middleware (src/middleware.ts) lets it through ungated.
 */
export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const map = await buildMythContentMap();
  return Object.entries(map).map(([mythNumber, entry]) => ({
    params: { mythNumber },
    props: { entry },
  }));
};

export const GET: APIRoute = ({ props }) => {
  const { entry } = props as { entry: MythContentEntry };
  return new Response(JSON.stringify(entry), {
    headers: { "Content-Type": "application/json" },
  });
};
