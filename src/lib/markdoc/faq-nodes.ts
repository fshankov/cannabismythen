/**
 * Custom Markdoc tags for FAQ answer bodies.
 *
 * The HTML renderer emits these as plain HTML wrappers with data-* attributes.
 * Where applicable (Phase 2 visualisations), a small client-side hydrator on
 * the audience page swaps these placeholders for React chart islands.
 *
 * Tags:
 *   {% factsheet-link id="m22" /%}
 *     → inline pill linking to /daten-explorer/<slug>
 *   {% data-callout label="… der Volljährigen" value="10,0 %" /%}
 *     → big-number callout for inline statistics
 *   {% top-myths-bars groupA="minors" topN=5 /%}
 *   {% top-myths-compare groupA="adults" groupB="consumers" topN=10 /%}
 *   {% top-channels-bars groupA="minors" /%}
 *   {% top-channels-compare groupA="minors" groupB="parents" topN=8 /%}
 *   {% kr-mini myth="m26" /%}
 *
 * The viz tags render as placeholder cards in the static HTML; a
 * `<FaqVizHydrator client:visible />` island looks them up and swaps them in
 * the browser.
 */

import Markdoc, {
  type Schema,
  type RenderableTreeNode,
} from "@markdoc/markdoc";

/**
 * Sentinel emitted by the {% factsheet-link %} tag. The page-level post-
 * processor (resolveFactsheetLinkPlaceholders in src/lib/faq.ts) swaps it
 * for the cleaned myth statement at build time. Format: __FAQ_MYTH_TITLE:mNN__
 */
const MYTH_TITLE_PLACEHOLDER = (id: string) => `__FAQ_MYTH_TITLE:${id}__`;

const factsheetLink: Schema = {
  attributes: {
    id: { type: String, required: true },
    label: { type: String, required: false },
    // BugHerd 4.5 (2026-06-03, ISD) — optional Lesart marker for the
    // Konsumierende-vs-Minderjährige comparison tables. "shared" → green dot
    // (myth appears in both Top-10 rankings); "diff" → red dot (>15-point
    // Richtigkeit difference between the two groups). Default: no marker.
    mark: { type: String, required: false },
  },
  selfClosing: true,
  transform(node) {
    const id = String(node.attributes.id ?? "").trim();
    // If the editor passed an explicit `label`, use it verbatim. Otherwise
    // emit a sentinel that the audience page replaces with the actual myth
    // statement (e.g. "Cannabis ist eine Einstiegsdroge") once we have
    // build-time access to the zahlenUndFakten collection.
    const visibleText = node.attributes.label
      ? String(node.attributes.label)
      : MYTH_TITLE_PLACEHOLDER(id);
    const mark = String(node.attributes.mark ?? "").trim();
    const markClass =
      mark === "shared"
        ? " faq-myth-link--shared"
        : mark === "diff"
        ? " faq-myth-link--diff"
        : "";
    // <button> not <a>: the popup host (MythPopupHost.tsx) listens for
    // clicks on [data-faq-myth-id] and opens the shared FactsheetPanel
    // (same slide-in popup used in Daten-Explorer / Quiz / Fakten-Karten).
    return new Markdoc.Tag(
      "button",
      {
        type: "button",
        class: `faq-myth-link${markClass}`,
        "data-faq-myth-id": id,
        "aria-haspopup": "dialog",
      },
      [visibleText],
    );
  },
};

const dataCallout: Schema = {
  attributes: {
    label: { type: String, required: true },
    value: { type: String, required: true },
    note: { type: String, required: false },
  },
  selfClosing: true,
  transform(node) {
    const label = String(node.attributes.label);
    const value = String(node.attributes.value);
    const note = node.attributes.note ? String(node.attributes.note) : null;
    const children: RenderableTreeNode[] = [
      new Markdoc.Tag("div", { class: "faq-callout__value" }, [value]),
      new Markdoc.Tag("div", { class: "faq-callout__label" }, [label]),
    ];
    if (note) {
      children.push(
        new Markdoc.Tag("div", { class: "faq-callout__note" }, [note]),
      );
    }
    return new Markdoc.Tag(
      "div",
      { class: "faq-callout", role: "figure" },
      children,
    );
  },
};

function vizPlaceholder(
  vizId: string,
  args: Record<string, string | number>,
  fallback: string,
): RenderableTreeNode {
  const dataAttrs: Record<string, string> = {
    class: "faq-viz",
    "data-faq-viz": vizId,
  };
  for (const [k, v] of Object.entries(args)) {
    dataAttrs[`data-${k.toLowerCase()}`] = String(v);
  }
  return new Markdoc.Tag("div", dataAttrs, [
    new Markdoc.Tag("div", { class: "faq-viz__fallback" }, [fallback]),
  ]);
}

const topMythsBars: Schema = {
  attributes: {
    groupA: { type: String, required: true },
    topN: { type: Number, required: false },
  },
  selfClosing: true,
  transform(node) {
    const groupA = String(node.attributes.groupA);
    const topN = Number(node.attributes.topN ?? 5);
    return vizPlaceholder(
      "top-myths-bars",
      { groupA, topN },
      `Mythen mit der höchsten Präventionsbedeutung – ${groupA}. ` +
        `Die interaktive Grafik wird im Browser geladen.`,
    );
  },
};

const topMythsCompare: Schema = {
  attributes: {
    groupA: { type: String, required: true },
    groupB: { type: String, required: true },
    topN: { type: Number, required: false },
  },
  selfClosing: true,
  transform(node) {
    const groupA = String(node.attributes.groupA);
    const groupB = String(node.attributes.groupB);
    const topN = Number(node.attributes.topN ?? 10);
    return vizPlaceholder(
      "top-myths-compare",
      { groupA, groupB, topN },
      `Vergleich der Mythen-Präventionsbedeutung: ${groupA} vs. ${groupB}. ` +
        `Die interaktive Grafik wird im Browser geladen.`,
    );
  },
};

const topChannelsBars: Schema = {
  attributes: {
    groupA: { type: String, required: true },
    topN: { type: Number, required: false },
  },
  selfClosing: true,
  transform(node) {
    const groupA = String(node.attributes.groupA);
    const topN = Number(node.attributes.topN ?? 8);
    return vizPlaceholder(
      "top-channels-bars",
      { groupA, topN },
      `Informationskanäle mit dem höchsten Präventionspotenzial – ${groupA}.`,
    );
  },
};

const topChannelsCompare: Schema = {
  attributes: {
    groupA: { type: String, required: true },
    groupB: { type: String, required: true },
    topN: { type: Number, required: false },
  },
  selfClosing: true,
  transform(node) {
    const groupA = String(node.attributes.groupA);
    const groupB = String(node.attributes.groupB);
    const topN = Number(node.attributes.topN ?? 8);
    return vizPlaceholder(
      "top-channels-compare",
      { groupA, groupB, topN },
      `Präventionspotenzial der Informationskanäle: ${groupA} vs. ${groupB}.`,
    );
  },
};

const krMini: Schema = {
  attributes: {
    myth: { type: String, required: true },
  },
  selfClosing: true,
  transform(node) {
    const myth = String(node.attributes.myth);
    return vizPlaceholder(
      "kr-mini",
      { myth },
      `Mini-Visualisierung Kenntnis × Richtigkeit für ${myth}.`,
    );
  },
};

export const faqMarkdocConfig = {
  tags: {
    "factsheet-link": factsheetLink,
    "data-callout": dataCallout,
    "top-myths-bars": topMythsBars,
    "top-myths-compare": topMythsCompare,
    "top-channels-bars": topChannelsBars,
    "top-channels-compare": topChannelsCompare,
    "kr-mini": krMini,
  },
};
