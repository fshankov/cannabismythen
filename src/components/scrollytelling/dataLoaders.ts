import type {
  CarmData,
  CorrectnessClass,
  GroupId,
  Indicator,
  InformationSourcesData,
  Metric,
  Myth,
  SourceMetricId,
} from "./types";
import { withBase } from "../../lib/withBase";

let cached: CarmData | null = null;
let cachedSources: InformationSourcesData | null = null;

/**
 * Load carm-data.json from public/data/. Cached after first call.
 */
export async function loadCarmData(): Promise<CarmData> {
  if (cached) return cached;
  const res = await fetch(withBase("data/carm-data.json"));
  if (!res.ok) throw new Error(`Failed to load carm-data.json: ${res.status}`);
  cached = (await res.json()) as CarmData;
  return cached;
}

/** Load information-sources.json from public/data/. */
export async function loadInformationSources(): Promise<InformationSourcesData> {
  if (cachedSources) return cachedSources;
  const res = await fetch(withBase("data/information-sources.json"));
  if (!res.ok)
    throw new Error(`Failed to load information-sources.json: ${res.status}`);
  cachedSources = (await res.json()) as InformationSourcesData;
  return cachedSources;
}

/** Look up the metric row for one myth × one group. May return null if missing. */
export function getMetric(
  data: CarmData,
  mythId: number,
  groupId: GroupId,
): Metric | null {
  return (
    data.metrics.find((m) => m.myth_id === mythId && m.group_id === groupId) ??
    null
  );
}

/** Read a single indicator value for one myth × one group. */
export function getIndicatorValue(
  data: CarmData,
  mythId: number,
  groupId: GroupId,
  indicator: Indicator,
): number | null {
  const metric = getMetric(data, mythId, groupId);
  if (!metric) return null;
  return metric[indicator];
}

/** Sort myths by category_id then id (stable thematic order). */
export function sortedMyths(data: CarmData): Myth[] {
  return [...data.myths].sort((a, b) => {
    const ca = a.category_id ?? 999;
    const cb = b.category_id ?? 999;
    if (ca !== cb) return ca - cb;
    return a.id - b.id;
  });
}

/** Active dashboard groups in display order. */
export const ACTIVE_GROUPS: GroupId[] = [
  "adults",
  "minors",
  "consumers",
  "young_adults",
  "parents",
];

// Iter-24 (2026-06-02, Harald-Backlog): canonical Zielgruppe labels
// for the /projekt/ scrolly. Matches the daten-explorer (igs.group.*
// in src/lib/dashboard/translations.ts) AND the audience picker on
// the dashboard screenshot Harald referenced — age ranges in parens,
// capital "Junge", gender-inclusive "Konsument:innen". This is the
// SINGLE SOURCE OF TRUTH for the scrollytelling left-column inline
// `{icon:KEY} <label>` text AND every right-column picker tab.
// VizSourcesStrips.tsx now imports from here instead of carrying its
// own GROUP_OPTIONS map.
export const GROUP_LABEL_DE: Record<GroupId, string> = {
  adults: "Volljährige (18–70)",
  minors: "Minderjährige (16–17)",
  consumers: "Konsument:innen",
  young_adults: "Junge Erwachsene (18–26)",
  parents: "Eltern",
};

export const INDICATOR_LABEL_DE: Record<Indicator, string> = {
  awareness: "Kenntnis",
  significance: "Bedeutung",
  correctness: "Richtigkeit",
  prevention_significance: "Präventionsbedeutung",
  population_relevance: "Bevölkerungsrelevanz",
};

/** Per-source-metric short label + body, used by the InfoDot popovers
 *  in the Step 8/9 column headers. Mirrors `cannabismythen`'s
 *  `definitions.sourcesIndicators` content; inlined here for the same
 *  Keystatic-independence reason as `INDICATOR_DEFS_DE` above. */
export const SOURCE_METRIC_DEFS_DE: Record<
  SourceMetricId,
  { label: string; body: string; scale: string }
> = {
  search: {
    label: "Suche",
    body:
      "Anteil der Befragten, die bei dieser Quelle aktiv nach " +
      "Informationen über Cannabis suchen.",
    scale: "0–100 % der Zielgruppe",
  },
  trust: {
    label: "Vertrauen",
    body:
      "Wie sehr vertraut die Zielgruppe den Informationen, die sie bei " +
      "dieser Quelle erhält?",
    scale: "0–100 Punkte",
  },
  perception: {
    label: "Wahrnehmung",
    body:
      "Anteil der Befragten, die Informationen über Cannabis von dieser " +
      "Quelle wahrnehmen — auch ohne aktive Suche.",
    scale: "0–100 % der Zielgruppe",
  },
  prevention: {
    label: "Prävention",
    body:
      "Wahrnehmung × Vertrauen. Das Präventionspotenzial einer Quelle: " +
      "der größte Hebel liegt dort, wo Reichweite und Glaubwürdigkeit " +
      "zusammenfallen.",
    scale: "0–100 Punkte",
  },
};

/* ──────────────────────────────────────────────────────────────────
 * Iter-11: shared verdict + theme helpers.
 *
 * Both VizMythGrid (right viz column, classified + themed modes) and
 * ScrollytellingViewer (left text column, in-body legends rendered
 * when step.gridMode is set) consume the same category list, colour
 * tokens, and verdict counts. Hoisting these here keeps one source
 * of truth for the Step 3 + Step 4 visuals.
 * ────────────────────────────────────────────────────────────────── */

/** Per-verdict CSS-var lookup. Hex tokens live in global.css; this
 *  map just hands them out for inline-style backgrounds (e.g. the
 *  classified grid cell + the in-body verdict puck). */
export const VERDICT_COLOR: Record<CorrectnessClass, string> = {
  richtig: "var(--classification-richtig)",
  eher_richtig: "var(--classification-eher-richtig)",
  eher_falsch: "var(--classification-eher-falsch)",
  falsch: "var(--classification-falsch)",
  keine_aussage_moeglich: "var(--classification-keine-aussage)",
};

/** Step 4 / in-body legend uses the canonical verdict names (richtig,
 *  eher richtig, …) — not the "stimmt / stimmt nicht" pill-phrasing
 *  used in dashboard filters. Per Fedor's Iter-11 clarification. */
export const VERDICT_LABEL_DE: Record<CorrectnessClass, string> = {
  richtig: "richtig",
  eher_richtig: "eher richtig",
  eher_falsch: "eher falsch",
  falsch: "falsch",
  keine_aussage_moeglich: "keine Aussage möglich",
};

/** Display order — falsch → richtig (matches the daten-explorer
 *  filter row site-wide). `keine_aussage_moeglich` lands last. */
export const VERDICT_ORDER: CorrectnessClass[] = [
  "falsch",
  "eher_falsch",
  "eher_richtig",
  "richtig",
  "keine_aussage_moeglich",
];

/** Override for the verdict glyph when it renders ON a verdict-colored
 *  background (classified grid cell, verdict puck). White stroke on
 *  top of the background colour. */
export const ON_VERDICT_BG_GLYPH = {
  main: "#ffffff",
  shadow: "rgba(255, 255, 255, 0.55)",
} as const;

/** Dark themed-cell background per category. The integer category_id
 *  is mapped onto a 9-step palette of muted darks (themes 1-9). */
export function themeColorFor(catId: number | null): string {
  if (catId === null) return "var(--bg-elev)";
  const idx = ((catId - 1) % 9) + 1;
  return `var(--theme-${idx})`;
}

/** Palette B — calmer, desaturated category accents tuned for the forest
 *  scrolly backdrop (white icons sit on these). Keyed by German category
 *  name. Scoped to the scrollytelling; the site-wide category palette
 *  (CATEGORY_META / --cmi-fk-*) is unchanged. (Fedor review 2026-06-08 #3.) */
export const SCROLLY_CATEGORY_ACCENT: Record<string, string> = {
  "Medizinischer und therapeutischer Nutzen": "#3f6fa3",
  "Risiken für den Körper und die Entwicklung": "#2f8a8f",
  "Risiken für die psychische Gesundheit": "#6f5aa6",
  "Einfluss auf Stimmung und Wahrnehmung": "#b08a3e",
  "Soziale Auswirkungen und Leistungsfähigkeit": "#a85a86",
  "Risiken durch Dosierung und Qualität": "#5b6b78",
  "Verbreitung in der Bevölkerung und Gesetzgebung": "#5660a8",
  "Allgemeine Einschätzung der Gefährlichkeit": "#b06a3e",
};

/** Palette-B accent for a category name (legend square fill). Falls back
 *  to a neutral slate for unrecognised names. */
export function scrollyCategoryAccent(name: string): string {
  return SCROLLY_CATEGORY_ACCENT[name] ?? "#5b6b78";
}

/** Ordered, deduplicated list of categories that appear in the first
 *  42 myths (sorted-by-category-then-id). Same logic the grid uses to
 *  render the cells, so the legend matches what's on screen. */
export function orderedCategoriesFromData(
  data: CarmData,
): { id: number; name: string }[] {
  const myths = sortedMyths(data).slice(0, 42);
  const seen = new Set<number>();
  const out: { id: number; name: string }[] = [];
  for (const m of myths) {
    if (m.category_id !== null && !seen.has(m.category_id)) {
      seen.add(m.category_id);
      const cat = data.categories.find((c) => c.id === m.category_id);
      out.push({
        id: m.category_id,
        name: cat?.name_de ?? `Kategorie ${m.category_id}`,
      });
    }
  }
  return out;
}

/** Indicator definitions (label + short body + scale + sample-size hint),
 *  consumed by the InfoDot popovers inside the new Step 6/7/8/9 vizes.
 *  Mirrors what `cannabismythen` pulls from a Keystatic singleton —
 *  inlined here to keep the scrolly free of the Keystatic dependency. */
export const INDICATOR_DEFS_DE: Record<
  Indicator,
  { label: string; body: string; scale: string; sampleSize?: string }
> = {
  awareness: {
    label: "Kenntnis",
    body: "Anteil der Befragten, die diese Aussage schon einmal gehört haben.",
    scale: "0–100 % der Zielgruppe",
  },
  significance: {
    label: "Bedeutung",
    body:
      "Wie stark prägt die Aussage den eigenen Umgang mit Cannabis bei " +
      "denen, die sie kennen?",
    scale: "0–100 Punkte",
  },
  correctness: {
    label: "Richtigkeit",
    body:
      "Wie nahe liegt die Einschätzung der Befragten an der " +
      "wissenschaftlichen Klassifikation?",
    scale: "0–100 Punkte",
  },
  prevention_significance: {
    label: "Präventionsbedeutung",
    body:
      "Bedeutung × Wissenslücke. Zeigt, wo Aufklärung am meisten " +
      "Wirkung zeigt — dort, wo ein falsches Bild das Verhalten prägt.",
    scale: "0–100 Punkte",
  },
  population_relevance: {
    label: "Bevölkerungsrelevanz",
    body:
      "Präventionsbedeutung × Kenntnisanteil. Berücksichtigt die " +
      "Reichweite — ein weit bekannter Halbmythos erreicht mehr Menschen " +
      "als ein obskurer. Nur sinnvoll für Voll- und Minderjährige.",
    scale: "0–100 Punkte",
  },
};

/** Bevölkerungsrisiko has meaningful per-group data only for
 *  Voll- + Minderjährige. The other three groups inherit the
 *  Volljährige values in the JSON, which would be misleading to show. */
export const BEV_RISIKO_VALID_GROUPS: ReadonlySet<GroupId> = new Set<GroupId>([
  "adults",
  "minors",
]);

/** Value lookup that routes through the Bev.risiko validity guard:
 *  `population_relevance` × non-{adults,minors} returns null even when
 *  the JSON contains a stray value. */
export function getIndicatorValueChecked(
  data: CarmData,
  mythId: number,
  groupId: GroupId,
  indicator: Indicator,
): number | null {
  const metric = getMetric(data, mythId, groupId);
  if (!metric) return null;
  if (
    indicator === "population_relevance" &&
    !BEV_RISIKO_VALID_GROUPS.has(groupId)
  ) {
    return null;
  }
  return metric[indicator];
}

/** Verdict-count tally across the first 42 myths. Used by the in-body
 *  classified legend (Step 4). */
export function verdictCountsFromData(
  data: CarmData,
): Record<CorrectnessClass, number> {
  const counts: Record<CorrectnessClass, number> = {
    richtig: 0,
    eher_richtig: 0,
    eher_falsch: 0,
    falsch: 0,
    keine_aussage_moeglich: 0,
  };
  for (const m of sortedMyths(data).slice(0, 42)) {
    counts[m.correctness_class]++;
  }
  return counts;
}
