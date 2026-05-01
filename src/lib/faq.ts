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

export interface FaqQuestion {
  slug: string;
  title: string;
  questionLong: string;
  audiences: FaqAudienceId[];
  sortByAudience: { audience: FaqAudienceId; order: number }[];
  classification: FaqClassification;
  classificationLabel: string;
  leadAnswer: string;
  primaryMyth: string;
  relatedMyths: string[];
  relatedQuiz: string[];
  relatedDashboard: string[];
  helpline: { label: string; title: string; url: string } | null;
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
  audiences?: readonly string[] | null;
  sortByAudience?:
    | readonly { audience?: string | null; order?: number | null }[]
    | null;
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

function normalizeQuestion(slug: string, raw: FaqQuestionRaw): FaqQuestion {
  const audiences = (raw.audiences ?? [])
    .map((a) => asAudience(a))
    .filter((a): a is FaqAudienceId => a !== null);

  const sortByAudience = (raw.sortByAudience ?? [])
    .map((s) => ({
      audience: asAudience(s.audience),
      order: typeof s.order === "number" ? s.order : 999,
    }))
    .filter(
      (s): s is { audience: FaqAudienceId; order: number } =>
        s.audience !== null,
    );

  const helpline =
    raw.helplineLabel || raw.helplineTitle || raw.helplineUrl
      ? {
          label: raw.helplineLabel ?? "",
          title: raw.helplineTitle ?? "",
          url: raw.helplineUrl ?? "",
        }
      : null;

  return {
    slug,
    title: raw.title,
    questionLong: raw.questionLong,
    audiences,
    sortByAudience,
    classification: (raw.classification as FaqClassification) ?? "n_a",
    classificationLabel: raw.classificationLabel ?? "",
    leadAnswer: raw.leadAnswer ?? "",
    primaryMyth: raw.primaryMyth ?? "",
    relatedMyths: [...(raw.relatedMyths ?? [])],
    relatedQuiz: [...(raw.relatedQuiz ?? [])],
    relatedDashboard: [...(raw.relatedDashboard ?? [])],
    helpline,
    answer: raw.answer,
  };
}

let cachedQuestions: FaqQuestion[] | null = null;

/** Load all published FAQ questions. Cached per-process. */
export async function loadAllQuestions(): Promise<FaqQuestion[]> {
  if (cachedQuestions) return cachedQuestions;
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
  const matching = all.filter((q) => q.audiences.includes(audienceId));
  return matching.sort((a, b) => {
    const oa =
      a.sortByAudience.find((s) => s.audience === audienceId)?.order ?? 999;
    const ob =
      b.sortByAudience.find((s) => s.audience === audienceId)?.order ?? 999;
    if (oa !== ob) return oa - ob;
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
    // Combined factsheets may map two myth numbers to one slug.
    // The slug itself encodes "m31-m32-…" — capture both numbers.
    const matches = slug.match(/m(\d{2})/g);
    if (matches) {
      for (const m of matches) {
        const num = parseInt(m.slice(1), 10);
        if (Number.isFinite(num)) {
          map.set(`m${num}`, slug);
          map.set(`m${num.toString().padStart(2, "0")}`, slug);
        }
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
