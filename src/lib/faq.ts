/**
 * FAQ helpers — read the audience-first FAQ collection (faqQuestions) and the
 * audience-metadata singleton (faqAudiences), and provide convenience selectors
 * for pages and components.
 *
 * All callers should:
 *  - filter to status === "published" (handled here)
 *  - never expose internalNotes (handled here)
 */

import { reader } from "./content";

export type FaqAudienceId =
  | "eltern"
  | "jugendliche"
  | "konsumierende"
  | "lehrkraefte"
  | "fachkraefte";

export type FaqClassification =
  | "richtig"
  | "eher_richtig"
  | "eher_falsch"
  | "falsch"
  | "keine_aussage"
  | "n_a";

export type FaqVizType =
  | "none"
  | "bars-top-myths"
  | "bars-correctness"
  | "grouped-bars-groups"
  | "donut-correctness"
  | "ranking-channels"
  | "scatter-trust-usage"
  | "table-comparison";

export type FaqVizPlacement =
  | "after-lead"
  | "before-data"
  | "after-data"
  | "end";

export interface FaqVizSpec {
  vizType: FaqVizType;
  vizSource: string;
  vizDescription: string;
  /** Optional JSON blob with viz-type-specific parameters. Stage 3 reads this. */
  vizConfig: string;
  vizPlacement: FaqVizPlacement;
}

export interface FaqQuestion {
  slug: string;
  title: string;
  questionLong: string;
  audience: FaqAudienceId;
  sortOrder: number;
  classification: FaqClassification;
  classificationLabel: string;
  leadAnswer: string;
  primaryMyth: string;
  relatedMyths: string[];
  relatedQuiz: string[];
  relatedDashboard: string[];
  helpline: { label: string; title: string; url: string } | null;
  vizSpec: FaqVizSpec | null;
  /** A reader handle to the parsed Markdoc body. Call to materialize the AST. */
  answer: () => Promise<{ node: unknown }>;
}

export interface FaqAudienceMeta {
  id: FaqAudienceId;
  title: string;
  cardLabel: string;
  emoji: string;
  accentColor: string;
  description: string;
  introNote: string;
  weiterfuehrend: { label: string; url: string }[];
  helplines: { label: string; title: string; url: string }[];
}

interface FaqQuestionRaw {
  title: string;
  questionLong: string;
  audience?: string | null;
  sortOrder?: number | null;
  classification: string;
  classificationLabel?: string | null;
  leadAnswer?: string | null;
  primaryMyth?: string | null;
  relatedMyths?: readonly string[] | null;
  relatedQuiz?: readonly string[] | null;
  relatedDashboard?: readonly string[] | null;
  helplineLabel?: string | null;
  helplineTitle?: string | null;
  helplineUrl?: string | null;
  vizSpec?: {
    vizType?: string | null;
    vizSource?: string | null;
    vizDescription?: string | null;
    vizConfig?: string | null;
    vizPlacement?: string | null;
  } | null;
  status: string;
  internalNotes?: string | null;
  answer: () => Promise<{ node: unknown }>;
}

export const VALID_AUDIENCES: FaqAudienceId[] = [
  "eltern",
  "jugendliche",
  "konsumierende",
  "lehrkraefte",
  "fachkraefte",
];

function asAudience(v: string | null | undefined): FaqAudienceId | null {
  return VALID_AUDIENCES.includes(v as FaqAudienceId)
    ? (v as FaqAudienceId)
    : null;
}

const VALID_VIZ_TYPES: FaqVizType[] = [
  "none",
  "bars-top-myths",
  "bars-correctness",
  "grouped-bars-groups",
  "donut-correctness",
  "ranking-channels",
  "scatter-trust-usage",
  "table-comparison",
];

const VALID_VIZ_PLACEMENTS: FaqVizPlacement[] = [
  "after-lead",
  "before-data",
  "after-data",
  "end",
];

function normalizeQuestion(slug: string, raw: FaqQuestionRaw): FaqQuestion {
  const audience = asAudience(raw.audience) ?? "eltern";

  const helpline =
    raw.helplineLabel || raw.helplineTitle || raw.helplineUrl
      ? {
          label: raw.helplineLabel ?? "",
          title: raw.helplineTitle ?? "",
          url: raw.helplineUrl ?? "",
        }
      : null;

  const rawViz = raw.vizSpec;
  const vizType =
    rawViz && VALID_VIZ_TYPES.includes(rawViz.vizType as FaqVizType)
      ? (rawViz.vizType as FaqVizType)
      : "none";
  const vizSpec: FaqVizSpec | null =
    rawViz && vizType !== "none"
      ? {
          vizType,
          vizSource: rawViz.vizSource ?? "",
          vizDescription: rawViz.vizDescription ?? "",
          vizConfig: rawViz.vizConfig ?? "",
          vizPlacement: VALID_VIZ_PLACEMENTS.includes(
            rawViz.vizPlacement as FaqVizPlacement,
          )
            ? (rawViz.vizPlacement as FaqVizPlacement)
            : "after-data",
        }
      : null;

  return {
    slug,
    title: raw.title,
    questionLong: raw.questionLong,
    audience,
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : 99,
    classification: (raw.classification as FaqClassification) ?? "n_a",
    classificationLabel: raw.classificationLabel ?? "",
    leadAnswer: raw.leadAnswer ?? "",
    primaryMyth: raw.primaryMyth ?? "",
    relatedMyths: [...(raw.relatedMyths ?? [])],
    relatedQuiz: [...(raw.relatedQuiz ?? [])],
    relatedDashboard: [...(raw.relatedDashboard ?? [])],
    helpline,
    vizSpec,
    answer: raw.answer,
  };
}

let cachedQuestions: FaqQuestion[] | null = null;

/** Load all published FAQ questions. Cached per-process in production —
 *  bypassed in dev so editor edits to .mdoc files reflect on reload. */
export async function loadAllQuestions(): Promise<FaqQuestion[]> {
  if (cachedQuestions && import.meta.env?.PROD) return cachedQuestions;
  const slugs = await reader.collections.faqQuestions.list();
  const out: FaqQuestion[] = [];
  for (const slug of slugs) {
    const entry = await reader.collections.faqQuestions.read(slug);
    if (!entry || entry.status !== "published") continue;
    out.push(normalizeQuestion(slug, entry as unknown as FaqQuestionRaw));
  }
  cachedQuestions = out;
  return out;
}

export async function getQuestionsByAudience(
  audienceId: FaqAudienceId,
): Promise<FaqQuestion[]> {
  const all = await loadAllQuestions();
  const matching = all.filter((q) => q.audience === audienceId);
  return matching.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.questionLong.localeCompare(b.questionLong, "de");
  });
}

export async function getQuestionBySlug(
  slug: string,
): Promise<FaqQuestion | null> {
  const all = await loadAllQuestions();
  return all.find((q) => q.slug === slug) ?? null;
}

let cachedAudiences: FaqAudienceMeta[] | null = null;

interface FaqAudiencesSingleton {
  audiences: readonly {
    id?: string | null;
    title?: string | null;
    cardLabel?: string | null;
    emoji?: string | null;
    accentColor?: string | null;
    description?: string | null;
    introNote?: string | null;
    weiterfuehrend?:
      | readonly { label?: string | null; url?: string | null }[]
      | null;
    helplines?:
      | readonly {
          label?: string | null;
          title?: string | null;
          url?: string | null;
        }[]
      | null;
  }[];
}

export async function getAllAudiences(): Promise<FaqAudienceMeta[]> {
  if (cachedAudiences) return cachedAudiences;
  const data = (await reader.singletons.faqAudiences.read()) as
    | FaqAudiencesSingleton
    | null;
  const out: FaqAudienceMeta[] = (data?.audiences ?? [])
    .map((a) => {
      const id = asAudience(a.id);
      if (!id) return null;
      return {
        id,
        title: a.title ?? "",
        cardLabel: a.cardLabel ?? id,
        emoji: a.emoji ?? "",
        accentColor: a.accentColor ?? "#2d6a4f",
        description: a.description ?? "",
        introNote: a.introNote ?? "",
        weiterfuehrend: (a.weiterfuehrend ?? [])
          .map((w) => ({ label: w.label ?? "", url: w.url ?? "" }))
          .filter((w) => w.url),
        helplines: (a.helplines ?? [])
          .map((h) => ({
            label: h.label ?? "",
            title: h.title ?? "",
            url: h.url ?? "",
          }))
          .filter((h) => h.url),
      } satisfies FaqAudienceMeta;
    })
    .filter((a): a is FaqAudienceMeta => a !== null);
  cachedAudiences = out;
  return out;
}

export async function getAudience(
  audienceId: FaqAudienceId,
): Promise<FaqAudienceMeta | null> {
  const all = await getAllAudiences();
  return all.find((a) => a.id === audienceId) ?? null;
}

/**
 * Pre-rendered factsheet HTML + classification metadata, mirroring the
 * MythContentEntry interface from src/components/shared/FactsheetPanel.tsx.
 * Imported lazily by the popup-data builder so the type stays in one place.
 */
export interface FaqMythContentEntry {
  html: string;
  title: string;
  classification: string;
  classificationLabel: string;
  refCount: number;
  /** Resolved related-myth refs (travel pipeline 4B, 2026-05-23). Mirrors
   *  the same field on `MythContentEntry` in FactsheetPanel.tsx so a single
   *  popup component handles both popup contexts. */
  relatedMyths?: RelatedMythRef[];
  /** FAQ-backlink refs (travel pipeline 4C, 2026-05-23). Same mirror. */
  faqBacklinks?: FaqBacklink[];
}

export interface RelatedMythRef {
  mythId: string;
  mythNumber: number;
  title: string;
  classification: string;
}

export interface FaqBacklink {
  slug: string;
  title: string;
  audience: string;
  href: string;
}

/** Compact metadata for one myth, populates the popup header. */
export interface FaqMythPopupIndexEntry {
  mythNumber: number;
  title: string;
  classification: string;
  classificationLabel: string;
  slug: string;
}

export interface FaqMythPopupData {
  /** Keyed by myth ID ("m22"). */
  mythIndex: Record<string, FaqMythPopupIndexEntry>;
  /** Keyed by mythNumber (22). Matches the shape FactsheetPanel expects. */
  mythContentMap: Record<number, FaqMythContentEntry>;
  /**
   * Replace `__FAQ_MYTH_TITLE:mNN__` placeholders left by the
   * {% factsheet-link %} Markdoc tag with each myth's cleaned statement.
   */
  resolveTitlesInHtml(html: string): string;
}

/** Strip "Mythos NN:" prefix and trailing terminal punctuation — same
 *  cleanup Fakten-Karten and Daten-Explorer apply to factsheet titles. */
function cleanMythTitle(raw: string): string {
  return raw
    .replace(/^Mythos\s+\d+(?:\/\d+)?:\s*/i, "")
    .replace(/[.!?]+$/u, "")
    .trim();
}

let cachedPopupData: FaqMythPopupData | null = null;

/**
 * Build the data the FAQ popup host needs: an index of myth IDs → header
 * metadata, a map of pre-rendered factsheet HTML, and a placeholder-resolver
 * that swaps `__FAQ_MYTH_TITLE:mNN__` sentinels for actual statements.
 *
 * Cached for the build process — same approach Fakten-Karten + Daten-Explorer
 * use. Group-metric data is intentionally NOT bundled here; callers that
 * need the interactive group-bars chart inside the panel can pass it
 * separately (we keep this helper small).
 */
export async function loadMythPopupData(): Promise<FaqMythPopupData> {
  if (cachedPopupData && import.meta.env?.PROD) return cachedPopupData;

  const Markdoc = (await import("@markdoc/markdoc")).default;
  const slugs = await reader.collections.zahlenUndFakten.list();

  const mythIndex: Record<string, FaqMythPopupIndexEntry> = {};
  const mythContentMap: Record<number, FaqMythContentEntry> = {};
  const titleById = new Map<string, string>();

  type EntryShape = {
    mythId?: string | null;
    mythNumber?: number | null;
    title?: string | null;
    classification?: string | null;
    classificationLabel?: string | null;
    relatedMyths?: readonly string[] | null;
    content?: () => Promise<{ node: unknown }>;
  };

  // Two-pass build (travel pipeline 4B/4C, 2026-05-23). Pass 1 reads every
  // entry into a cached list and populates the mythIndex / titleById
  // lookup; pass 2 renders content and resolves relatedMyths against the
  // now-complete mythIndex. A single-pass version would silently drop a
  // related-myth ref whenever the iteration order put the related myth
  // after its referencer (filesystem order is not guaranteed).
  const cached: { slug: string; e: EntryShape; mythNumber: number; cleanTitle: string }[] = [];
  for (const slug of slugs) {
    const entry = await reader.collections.zahlenUndFakten.read(slug);
    if (!entry || entry.status !== "published") continue;
    const e = entry as EntryShape;
    const mythNumber =
      typeof e.mythNumber === "number"
        ? e.mythNumber
        : (() => {
            const m = slug.match(/^m(\d+)/);
            return m ? parseInt(m[1], 10) : null;
          })();
    if (!mythNumber || !Number.isFinite(mythNumber)) continue;

    const id = `m${mythNumber}`;
    const cleanTitle = cleanMythTitle(e.title ?? id);

    mythIndex[id] = {
      mythNumber,
      title: cleanTitle,
      classification: e.classification ?? "",
      classificationLabel: e.classificationLabel ?? "",
      slug,
    };
    // Also index zero-padded form ("m01" alongside "m1") so editor entries
    // with either convention resolve.
    if (mythNumber < 10) {
      mythIndex[`m0${mythNumber}`] = mythIndex[id];
    }
    titleById.set(id, cleanTitle);
    if (mythNumber < 10) titleById.set(`m0${mythNumber}`, cleanTitle);

    cached.push({ slug, e, mythNumber, cleanTitle });
  }

  for (const { e, mythNumber, cleanTitle } of cached) {
    if (!e.content) continue;
    try {
      const { node } = await e.content();
      const html = Markdoc.renderers.html(
        // The factsheet body uses default Markdoc nodes only; no custom
        // tags here, so an empty config works.
        Markdoc.transform(node as never),
      );
      const refMatch = html.match(/<li>/g);

      const rawRelated = (e.relatedMyths ?? []) as readonly string[];
      const relatedMyths: RelatedMythRef[] = [];
      for (const rid of rawRelated) {
        const indexEntry = mythIndex[rid] ?? mythIndex[normalizeMythId(rid)];
        if (!indexEntry) continue;
        relatedMyths.push({
          mythId: rid,
          mythNumber: indexEntry.mythNumber,
          title: indexEntry.title,
          classification: indexEntry.classification,
        });
      }

      const backlinkQs = e.mythId ? await getQuestionsForMyth(e.mythId) : [];
      const faqBacklinks: FaqBacklink[] = backlinkQs.map((q) => ({
        slug: q.slug,
        title: q.questionLong || q.title,
        audience: q.audience,
        href: `/meine-interessen/${q.audience}/#frage-${q.slug}`,
      }));

      mythContentMap[mythNumber] = {
        html,
        title: cleanTitle,
        classification: e.classification ?? "",
        classificationLabel: e.classificationLabel ?? "",
        refCount: refMatch ? refMatch.length : 0,
        relatedMyths,
        faqBacklinks,
      };
    } catch {
      // If a factsheet fails to render, skip its popup body — the link
      // still works, just without pre-rendered content.
    }
  }

  function resolveTitlesInHtml(html: string): string {
    return html.replace(/__FAQ_MYTH_TITLE:(m\d+)__/g, (_full, rawId: string) => {
      const norm = normalizeMythId(rawId);
      const title = titleById.get(norm) ?? titleById.get(rawId);
      // Fallback: show the raw id if no title (e.g. m99 reference to a
      // myth that doesn't exist) so an editor catches it during review.
      return title ?? rawId;
    });
  }

  cachedPopupData = { mythIndex, mythContentMap, resolveTitlesInHtml };
  return cachedPopupData;
}

/**
 * Resolve a myth ID like "m22" or "m6" to a factsheet slug
 * ("m22-einstiegsdroge"). Reads the zahlenUndFakten collection at build time.
 */
let cachedMythSlugMap: Map<string, string> | null = null;

export async function getMythIdToSlugMap(): Promise<Map<string, string>> {
  if (cachedMythSlugMap) return cachedMythSlugMap;
  const slugs = await reader.collections.zahlenUndFakten.list();
  const map = new Map<string, string>();
  for (const slug of slugs) {
    const entry = await reader.collections.zahlenUndFakten.read(slug);
    if (!entry || entry.status !== "published") continue;
    const e = entry as { mythId?: string | null; mythNumber?: number | null };
    // Prefer the mythId (string "m22") if present.
    if (e.mythId) {
      const norm = normalizeMythId(e.mythId);
      if (norm) map.set(norm, slug);
    }
    // Fallback: extract the myth number from the slug prefix (e.g. "m31"
    // from "m31-entspannt"). Used when mythId is missing on the entry.
    const prefixMatch = slug.match(/^m(\d+)/);
    if (prefixMatch) {
      const num = parseInt(prefixMatch[1], 10);
      if (Number.isFinite(num)) {
        map.set(`m${num}`, slug);
        map.set(`m${num.toString().padStart(2, "0")}`, slug);
      }
    }
  }
  cachedMythSlugMap = map;
  return map;
}

export function normalizeMythId(raw: string): string {
  const m = raw.trim().match(/^m?(\d+)$/i);
  if (!m) return "";
  return `m${parseInt(m[1], 10)}`;
}

/** Given a list of myth ids, resolve them to factsheet URLs (skips unknowns). */
export async function resolveMythLinks(
  ids: readonly string[],
): Promise<{ id: string; slug: string; url: string }[]> {
  const map = await getMythIdToSlugMap();
  const out: { id: string; slug: string; url: string }[] = [];
  for (const raw of ids) {
    const id = normalizeMythId(raw);
    if (!id) continue;
    const slug = map.get(id);
    if (!slug) continue;
    out.push({ id, slug, url: `/daten-explorer/${slug}/` });
  }
  return out;
}

/**
 * Look up FAQ questions whose primaryMyth or relatedMyths references the given
 * myth ID. Used by the factsheet detail page to show "Diese Frage in unseren FAQ".
 */
export async function getQuestionsForMyth(
  mythId: string,
): Promise<FaqQuestion[]> {
  const norm = normalizeMythId(mythId);
  if (!norm) return [];
  const all = await loadAllQuestions();
  return all.filter((q) => {
    if (normalizeMythId(q.primaryMyth) === norm) return true;
    return q.relatedMyths.some((m) => normalizeMythId(m) === norm);
  });
}

/** German label for each classification used in chips and pills. */
export const CLASSIFICATION_LABEL: Record<FaqClassification, string> = {
  richtig: "Richtig",
  eher_richtig: "Eher richtig",
  eher_falsch: "Eher falsch",
  falsch: "Falsch",
  keine_aussage: "Keine Aussage möglich",
  n_a: "Hintergrund",
};

/** Classification → CSS variable name (defined in global.css). */
export const CLASSIFICATION_VAR: Record<FaqClassification, string> = {
  richtig: "--classification-richtig",
  eher_richtig: "--classification-eher-richtig",
  eher_falsch: "--classification-eher-falsch",
  falsch: "--classification-falsch",
  keine_aussage: "--classification-keine-aussage",
  n_a: "--classification-keine-aussage",
};

/**
 * Default URL label for a Dashboard-Verweis dropdown value.
 *
 * Stage 5 of the Daten-Explorer refactor renamed the public route
 * to `/daten-explorer/`. The map below is keyed by the NEW URLs.
 * Editor entries written against the old URLs (`/zahlen-und-fakten/`)
 * still resolve to the same label via the legacy aliases — both keys
 * fall back to the same German label so old Keystatic content keeps
 * rendering its caption correctly.
 */
export function dashboardLinkLabel(url: string): string {
  const map: Record<string, string> = {
    "/daten-explorer/": "Daten-Explorer",
    "/daten-explorer/informationswege/": "Dashboard: Informationswege",
    "/daten-explorer/praeventionsbedeutung/": "Dashboard: Präventionsbedeutung",
    "/daten-explorer/praeventionspotential/": "Dashboard: Präventionspotential",
    "/daten-explorer/bevoelkerungsrelevanz/": "Dashboard: Bevölkerungsrelevanz",
    "/daten-explorer/zielgruppen/": "Dashboard: Zielgruppenvergleich",
    "/daten-explorer/minderjaehrige/": "Dashboard: Minderjährige",
    // Legacy keys — keep so editor content authored before Stage 5
    // doesn't lose its caption when an old URL is still in a CMS
    // record. The middleware 301-redirects the URL itself anyway.
    "/zahlen-und-fakten/": "Daten-Explorer",
    "/zahlen-und-fakten/informationswege/": "Dashboard: Informationswege",
    "/zahlen-und-fakten/praeventionsbedeutung/": "Dashboard: Präventionsbedeutung",
    "/zahlen-und-fakten/praeventionspotential/": "Dashboard: Präventionspotential",
    "/zahlen-und-fakten/bevoelkerungsrelevanz/": "Dashboard: Bevölkerungsrelevanz",
    "/zahlen-und-fakten/zielgruppen/": "Dashboard: Zielgruppenvergleich",
    "/zahlen-und-fakten/minderjaehrige/": "Dashboard: Minderjährige",
  };
  return map[url] ?? "Dashboard";
}
