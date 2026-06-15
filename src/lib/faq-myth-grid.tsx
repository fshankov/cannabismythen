/**
 * Server-only: render the {% myth-priority-grid %} placeholder into a static
 * sortable myth-priority grid, data-driven from public/data/carm-data.json (the
 * authoritative CaRM dataset — the old hand-typed table had errors, e.g.
 * m37/minors 68 → real 33). Kept out of src/lib/faq.ts so `react-dom/server`
 * never reaches a client bundle (same posture as faq-verdict-pills.tsx).
 */
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import MythPriorityGrid, {
  type GridRow,
} from "@components/faq/MythPriorityGrid";
import { loadMythPopupData } from "./faq";
import { getMythMetric, getIndicatorValue } from "./dashboard/data";
import type { CarmData, GroupId } from "./dashboard/types";
// Direct import (not loadData(), which fetch()es a relative URL and fails in
// SSR). Same proven path MeineInteressenAudience.astro uses for CaRM data.
import carmDataJson from "../../public/data/carm-data.json";

const DATA = carmDataJson as unknown as CarmData;

interface GroupMeta {
  id: GroupId;
  label: string;
}

function mythIdToNumber(id: string): number {
  return parseInt(id.replace(/^m0*/i, ""), 10);
}

async function loadGrid(
  mythIds: string[],
  groups: GroupId[],
): Promise<{ rows: GridRow[]; minors: GroupMeta; consumers: GroupMeta } | null> {
  const [gMin, gKon] = groups;
  if (!gMin || !gKon) return null;

  const data = DATA;
  const popup = await loadMythPopupData();

  const rows: GridRow[] = [];
  for (const raw of mythIds) {
    const num = mythIdToNumber(raw);
    if (!Number.isFinite(num)) continue;
    const myth = data.myths.find((m) => m.id === num);
    if (!myth) continue;
    const min = getIndicatorValue(
      getMythMetric(data.metrics, num, gMin),
      "prevention_significance",
    );
    const kon = getIndicatorValue(
      getMythMetric(data.metrics, num, gKon),
      "prevention_significance",
    );
    const key = `m${num}`;
    const label =
      popup.mythIndex[raw]?.title ??
      popup.mythIndex[key]?.title ??
      popup.mythIndex[`m0${num}`]?.title ??
      (myth.text_short_de || myth.text_de);
    rows.push({ mythId: key, label, verdict: myth.correctness_class, min, kon });
  }

  // Default view: Minderjährige descending; rows missing the value sort last.
  rows.sort((a, b) => (b.min ?? -1) - (a.min ?? -1));

  const nameOf = (g: GroupId) =>
    data.groups.find((gr) => gr.id === g)?.name_de ?? g;
  return {
    rows,
    minors: { id: gMin, label: nameOf(gMin) },
    consumers: { id: gKon, label: nameOf(gKon) },
  };
}

const PLACEHOLDER_RE =
  /<div class="faq-myth-grid-placeholder"([^>]*?)>\s*<\/div>/g;

const readAttr = (attrs: string, name: string) =>
  attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? "";

/** Replace every {% myth-priority-grid %} placeholder with the static grid. */
export async function injectMythPriorityGrid(html: string): Promise<string> {
  if (!html.includes("faq-myth-grid-placeholder")) return html;

  let out = html;
  for (const match of html.matchAll(PLACEHOLDER_RE)) {
    const attrs = match[1];
    const myths = readAttr(attrs, "data-grid-myths")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const groups = (readAttr(attrs, "data-grid-groups") || "minors,consumers")
      .split(",")
      .map((s) => s.trim()) as GroupId[];
    if (myths.length === 0) continue;

    const result = await loadGrid(myths, groups);
    if (!result) continue;
    const { rows, minors, consumers } = result;

    const rendered = renderToStaticMarkup(
      createElement(MythPriorityGrid, {
        rows,
        minors,
        consumers,
        caption: `Top-Mythen nach Präventionsbedeutung: ${minors.label} und ${consumers.label}`,
      }),
    );
    out = out.replace(match[0], rendered);
  }
  return out;
}
