/**
 * generate-factsheet-pdf.ts
 * --------------------------------------------------------------------------
 * Publication-ready PDF of all 42 cannabis-myth factsheets — the printed
 * counterpart to the website's factsheet popup. Reads each
 * `src/content/zahlen-und-fakten/mNN-*.mdoc` (whose `content` field IS the
 * CaRM final-report factsheet text, verbatim, plus the CaRM survey data
 * table), groups them by the 8 Fakten-Karten categories, and renders a
 * single self-contained HTML document that is converted to PDF via
 * headless Chromium (Playwright) with an interactive outline + hyperlinks.
 *
 * Source-of-truth + design rules: see
 * .claude/plans/create-a-publication-ready-elegant-sedgewick.md and CLAUDE.md.
 *
 * Run:  npx tsx scripts/generate-factsheet-pdf.ts            (all 42)
 *       SAMPLE=1 npx tsx scripts/generate-factsheet-pdf.ts   (cover+legend+ToC
 *                                                             + 3 myths + credits)
 * Output: _local/export/cannabismythen-mythen-faktenblaetter.pdf
 *         (+ .html alongside for inspection)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT_DIR = join(ROOT, "src/content/zahlen-und-fakten");
const ICONS_DIR = join(ROOT, "src/lib/icons/_handoff/icons");
const LOGOS_DIR = join(ROOT, "_local/design/logos");
const OUT_DIR = join(ROOT, "_local/export");
const OUT_PDF = join(OUT_DIR, "cannabismythen-mythen-faktenblaetter.pdf");
const OUT_HTML = join(OUT_DIR, "cannabismythen-mythen-faktenblaetter.html");

const SITE = "https://cannabismythen.de";
const REPORT_URL = "https://www.isd-hamburg.de/wp-content/uploads/2026/03/Abschlussbericht_CaRM_final.pdf";
const SAMPLE = !!process.env.SAMPLE;
const SAMPLE_IDS = ["m01", "m13", "m25"]; // falsch · richtig · eher_falsch

// ---------------------------------------------------------------------------
// Design tokens (mirrored from src/styles/global.css)
// ---------------------------------------------------------------------------
const VERDICTS: Record<string, { label: string; color: string; bg: string }> = {
  richtig: { label: "Richtig", color: "#047857", bg: "#ecfdf5" },
  eher_richtig: { label: "Eher richtig", color: "#4d7c0f", bg: "#f7fee7" },
  eher_falsch: { label: "Eher falsch", color: "#b45309", bg: "#fffbeb" },
  falsch: { label: "Falsch", color: "#be123c", bg: "#fff1f2" },
  keine_aussage: { label: "Keine Aussage möglich", color: "#6b7280", bg: "#f3f4f6" },
};

/**
 * Verdict glyph — generated from the canonical `verdictGlyph.tsx` spec
 * (single source of truth for every verdict arrow on the live site), NOT
 * from `_handoff/icons/verdict-*.svg` (those static exports have the
 * rotations inverted). Confirmed against public/icons/fakten-karten too:
 *   richtig → tip up · eher_richtig → up-right · eher_falsch → down-left
 *   falsch → tip down · keine_aussage → flat shadow line (no arrow)
 */
const VERDICT_GLYPHS: Record<string, { rotation: number; main: string; shadow: string } | null> = {
  richtig: { rotation: 180, main: "#047857", shadow: "#a7d3c5" },
  eher_richtig: { rotation: -135, main: "#4d7c0f", shadow: "#c2d3a3" },
  eher_falsch: { rotation: 45, main: "#b45309", shadow: "#e0b58d" },
  falsch: { rotation: 0, main: "#be123c", shadow: "#e9a8b9" },
  keine_aussage: null,
};
function verdictGlyph(cls: string): string {
  const s = VERDICT_GLYPHS[cls];
  if (!s)
    return `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16h20" stroke="#94a3b8"/></svg>`;
  return `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(${s.rotation} 12 12)"><path d="M2 16h20" stroke="${s.shadow}"/><path d="M12 2v14" stroke="${s.main}"/><path d="m5 9 7 7 7-7" stroke="${s.main}"/></g></svg>`;
}

// 8 categories in the live FaktenKartenExplorer order
const CATEGORIES: { label: string; icon: string; color: string }[] = [
  { label: "Medizinischer und therapeutischer Nutzen", icon: "fk-medizin", color: "#3b82f6" },
  { label: "Risiken für den Körper und die Entwicklung", icon: "fk-koerper", color: "#06b6d4" },
  { label: "Risiken für die psychische Gesundheit", icon: "fk-psyche", color: "#8b5cf6" },
  { label: "Einfluss auf Stimmung und Wahrnehmung", icon: "fk-stimmung", color: "#eab308" },
  { label: "Soziale Auswirkungen und Leistungsfähigkeit", icon: "fk-soziales", color: "#ec4899" },
  { label: "Risiken durch Dosierung und Qualität", icon: "fk-dosis", color: "#64748b" },
  { label: "Verbreitung in der Bevölkerung und Gesetzgebung", icon: "fk-gesetz", color: "#6366f1" },
  { label: "Allgemeine Einschätzung der Gefährlichkeit", icon: "fk-gefahr", color: "#f97316" },
];

// Audience rows (--cmi-pop-* colour + locked pop-* icon). Order matters:
// "Junge Erwachsene" must be tested before "Erwachsene/Volljährige".
const AUDIENCES: { match: RegExp; color: string; icon: string }[] = [
  { match: /^junge\s*erwachsene/i, color: "#14b8a6", icon: "pop-junge-erwachsene" },
  { match: /^(erwachsene|volljährige)/i, color: "#475569", icon: "pop-volljaehrige" },
  { match: /^minderjährige/i, color: "#f59e0b", icon: "pop-minderjaehrige" },
  { match: /^konsum/i, color: "#16a34a", icon: "pop-konsumierende" },
  { match: /^eltern/i, color: "#8b5cf6", icon: "pop-eltern" },
];
function audience(label: string): { color: string; icon: string } {
  return AUDIENCES.find((a) => a.match.test(label.trim())) ?? { color: "#94a3b8", icon: "" };
}

// Data-table value cells use the dashboard's 7-band heatmap (--band-0..6),
// thresholds from src/lib/dashboard/lesebeispiel-bands.ts. Locked indicator
// icons (src/lib/icons/_handoff/icons) head each of the 5 value columns.
const BAND_THRESHOLDS = [11, 26, 38, 63, 75, 90];
const BAND_COLORS = ["#cfe5ff", "#b6d4ff", "#d2dfff", "#ecdcd2", "#ffcfb8", "#ffb19a", "#ff8a7e"];
function bandColor(v: number): string {
  let i = 0;
  while (i < BAND_THRESHOLDS.length && v >= BAND_THRESHOLDS[i]) i++;
  return BAND_COLORS[i];
}
// indicator icon + short label + unit per value column, in .mdoc column order
const INDICATORS = [
  { icon: "myth-kenntnis", label: "Kenntnis", unit: "%" },
  { icon: "myth-bedeutung", label: "Bedeutung", unit: "Punkte" },
  { icon: "myth-richtigkeit", label: "Richtigkeit", unit: "Punkte" },
  { icon: "myth-praevention", label: "Prävention", unit: "Punkte" },
  { icon: "myth-bevoelkerungsbezug", label: "Bev. Relevanz", unit: "Punkte" },
];

// Canonical indicator descriptions — VERBATIM from the live tool's pop-ups
// (src/lib/dashboard/translations.ts `indicator.*.description`). Rendered as a
// compact key under each table.
const INDICATOR_DEFS: { icon: string; label: string; def: string }[] = [
  { icon: "myth-kenntnis", label: "Kenntnis", def: "Anteil der Befragten, die den Mythos kennen (0–100 %). Höher = bekannter." },
  { icon: "myth-bedeutung", label: "Bedeutung", def: "Subjektive Wichtigkeit des Mythos für den eigenen Umgang mit Cannabis (0–100 Punkte). Nur bei Personen erhoben, die den Mythos kennen." },
  { icon: "myth-richtigkeit", label: "Richtigkeit", def: "Übereinstimmung der Einschätzung mit der wissenschaftlichen Klassifikation (0–100 Punkte). Höher = treffender." },
  { icon: "myth-praevention", label: "Prävention", def: "Kombination aus Bedeutung und Fehleinschätzung (0–100 Punkte). Höher = größerer Präventionsbedarf." },
  { icon: "myth-bevoelkerungsbezug", label: "Bevölkerungsrelevanz", def: "Bevölkerungsbezogene Risikobedeutung (0–100 Punkte) — kombiniert die individuelle Präventionsbedeutung mit dem Verbreitungsgrad des Mythos. Nur für Volljährige (18–70) und Minderjährige (16–17) erhoben." },
];


// ---------------------------------------------------------------------------
// Asset loaders
// ---------------------------------------------------------------------------
function fontFace(file: string, family: string, style: string, weight: string): string {
  const b64 = readFileSync(file).toString("base64");
  return `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
}

function svg(name: string): string {
  const p = join(ICONS_DIR, `${name}.svg`);
  if (!existsSync(p)) {
    console.warn(`  ! missing icon ${name}.svg`);
    return "";
  }
  return readFileSync(p, "utf8").trim();
}

function logoSvg(file: string): string {
  const p = join(LOGOS_DIR, file);
  if (!existsSync(p)) {
    console.warn(`  ! missing logo ${file}`);
    return "";
  }
  return readFileSync(p, "utf8").replace(/<\?xml[\s\S]*?\?>/, "").replace(/<!DOCTYPE[\s\S]*?>/, "").trim();
}

// ---------------------------------------------------------------------------
// Inline markdown → HTML (verbatim text, light formatting only)
// ---------------------------------------------------------------------------
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(text: string): string {
  let t = esc(text);
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*([^*]+?)\*/g, "<em>$1</em>");
  // citation markers like [1, 2] or [3-6] → superscript
  t = t.replace(/\[(\d[\d\s,–-]*)\]/g, '<sup class="cite">[$1]</sup>');
  return t;
}

// ---------------------------------------------------------------------------
// .mdoc parsing
// ---------------------------------------------------------------------------
type Section = { heading: string; lines: string[] };
interface Myth {
  id: string;
  number: number;
  slug: string;
  title: string; // "Mythos N: <statement>"
  classification: string;
  verdictSentence: string;
  categoryGroup: string;
  sections: Section[];
}

function parseMdoc(file: string): Myth | null {
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  const fm = parseYaml(m[1]) as Record<string, any>;
  if (fm.status !== "published") return null;
  const body = m[2];

  // plain verdict sentence from the `> **Einordnung: x** — sentence` blockquote
  const bq = body.match(/^>\s*\*\*Einordnung:[^*]*\*\*\s*[—-]\s*(.+)$/m);
  const verdictSentence = (fm.classificationLabel || (bq ? bq[1].trim() : "")) as string;

  // split body into `## ` sections
  const sections: Section[] = [];
  let cur: Section | null = null;
  for (const line of body.split("\n")) {
    const h = line.match(/^##\s+(.*)$/);
    if (h) {
      cur = { heading: h[1].trim(), lines: [] };
      sections.push(cur);
    } else if (cur) {
      cur.lines.push(line);
    }
  }

  return {
    id: fm.mythId,
    number: Number(fm.mythNumber),
    slug: basename(file).replace(/\.mdoc$/, ""),
    title: String(fm.title),
    classification: String(fm.classification),
    verdictSentence,
    categoryGroup: String(fm.categoryGroup),
    sections,
  };
}

function findSection(m: Myth, pred: (h: string) => boolean): Section | undefined {
  return m.sections.find((s) => pred(s.heading));
}

// renderers for the fixed section shapes ------------------------------------
function renderParagraphs(lines: string[]): string {
  const paras: string[] = [];
  let buf: string[] = [];
  for (const l of lines) {
    if (l.trim() === "") {
      if (buf.length) { paras.push(buf.join(" ")); buf = []; }
    } else {
      buf.push(l.trim());
    }
  }
  if (buf.length) paras.push(buf.join(" "));
  return paras.map((p) => `<p>${inline(p)}</p>`).join("\n");
}

function renderBullets(lines: string[]): string {
  const items: string[] = [];
  for (const l of lines) {
    const b = l.match(/^[-*]\s+(.*)$/);
    if (b) items.push(b[1].trim());
    else if (l.trim() && items.length) items[items.length - 1] += " " + l.trim();
  }
  if (!items.length) return "";
  return `<ul class="erkenntnisse">${items.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`;
}

function renderReferences(lines: string[]): string {
  const refs: { n: string; text: string }[] = [];
  for (const l of lines) {
    const r = l.match(/^(\d+)\.\s+(.*)$/);
    if (r) refs.push({ n: r[1], text: r[2].trim() });
    else if (l.trim() && refs.length) refs[refs.length - 1].text += " " + l.trim();
  }
  if (!refs.length) return "";
  return `<ol class="references">${refs
    .map((r) => `<li><span class="ref-n">${r.n}.</span> <span class="ref-t">${inline(r.text)}</span></li>`)
    .join("")}</ol>`;
}

function renderDataTable(lines: string[]): string {
  const rows = lines
    .filter((l) => l.trim().startsWith("|"))
    .map((l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()));
  if (rows.length < 3) return "";
  const body = rows.slice(2); // skip header + separator rows; we relabel headers ourselves

  const thead = `<thead><tr>
    <th class="col-aud">Zielgruppe</th>
    ${INDICATORS.map(
      (ind) => `<th><span class="ind-ic">${svg(ind.icon)}</span><span class="ind-lb">${esc(ind.label)}</span><span class="ind-unit">${esc(ind.unit)}</span></th>`,
    ).join("")}
  </tr></thead>`;

  const tbody = `<tbody>${body
    .map((r) => {
      const aud = audience(r[0]);
      const audCell = `<td class="aud"><span class="aud-ic">${svg(aud.icon)}</span>${esc(r[0])}</td>`;
      const valCells = r
        .slice(1, 6)
        .map((c) => {
          const num = parseFloat(c.replace(",", "."));
          // missing values render as the popup's "k. A." (keine Angabe), not "—"
          if (Number.isNaN(num)) return `<td class="na">k. A.</td>`;
          // rounded integers, no decimals (units live in the column headers)
          const rounded = Math.round(num);
          return `<td class="val" style="background:${bandColor(rounded)}">${rounded}</td>`;
        })
        .join("");
      return `<tr>${audCell}${valCells}</tr>`;
    })
    .join("")}</tbody>`;
  return `<table class="data-table">${thead}${tbody}</table>`;
}

// Compact indicator key shown under each data table — canonical definitions.
function renderIndicatorKey(): string {
  const items = INDICATOR_DEFS.map(
    (d) =>
      `<div class="ind-def"><span class="ind-def-ic">${svg(d.icon)}</span><span><strong>${esc(d.label)}</strong> — ${esc(d.def)}</span></div>`,
  ).join("");
  return `<div class="ind-defs">${items}</div>`;
}

// ---------------------------------------------------------------------------
// Page builders
// ---------------------------------------------------------------------------
function renderMyth(myth: Myth, cat: { label: string; icon: string; color: string }): string {
  const v = VERDICTS[myth.classification] ?? VERDICTS.keine_aussage;
  const statement = myth.title.replace(/^Mythos\s+\d+:\s*/i, "");
  const ein = findSection(myth, (h) => h === "Einordnung");
  const syn = findSection(myth, (h) => h === "Synthese");
  const erk = findSection(myth, (h) => /zentrale erkenntnisse/i.test(h));
  const dat = findSection(myth, (h) => /^Daten nach Zielgruppen/i.test(h));
  const ref = findSection(myth, (h) => /^Referenzen/i.test(h));

  const onlineUrl = `${SITE}/daten-explorer/?mythos=${myth.number}`;

  return `
<section class="myth" id="${myth.id}">
  <div class="myth-kicker" style="color:${cat.color}">
    <span class="kicker-icon">${svg(cat.icon)}</span><span>${esc(cat.label)}</span>
  </div>
  <div class="myth-head">
    <h2 class="myth-statement"><a class="myth-link" href="${onlineUrl}">${esc(statement)}</a> <span class="vbadge" style="background:${v.bg};color:${v.color};border-color:${v.color}40"><span class="vbadge-icon">${verdictGlyph(myth.classification)}</span><span class="vbadge-label">${v.label}</span></span></h2>
  </div>

  ${ein ? `<div class="sec"><div class="sec-h">Einordnung</div>${renderParagraphs(ein.lines)}</div>` : ""}
  ${syn ? `<div class="sec sec-synthese" style="border-color:${v.color}"><div class="sec-h">Synthese</div>${renderParagraphs(syn.lines)}</div>` : ""}
  ${erk ? `<div class="sec"><div class="sec-h">Zentrale Erkenntnisse</div>${renderBullets(erk.lines)}</div>` : ""}
  ${dat ? `<div class="sec sec-data"><div class="sec-h">Daten nach Zielgruppen</div>${renderDataTable(dat.lines)}${renderIndicatorKey()}</div>` : ""}
  ${ref ? `<div class="sec sec-ref"><div class="sec-h">Referenzen</div>${renderReferences(ref.lines)}</div>` : ""}
</section>`;
}

function renderCategoryDivider(
  cat: { label: string; icon: string; color: string },
  myths: Myth[],
  index: number,
): string {
  const list = myths
    .map((m) => {
      const statement = m.title.replace(/^Mythos\s+\d+:\s*/i, "");
      return `<li><a href="#${m.id}"><span class="mini-glyph">${verdictGlyph(m.classification)}</span><span class="mini-st">${esc(statement)}</span></a></li>`;
    })
    .join("");
  return `
<section class="cat-divider" id="cat-${index}">
  <div class="cat-band" style="--cat:${cat.color}">
    <div class="cat-icon-lg" style="color:${cat.color}">${svg(cat.icon)}</div>
    <div class="cat-meta">
      <div class="cat-eyebrow" style="color:${cat.color}">Kategorie ${index} von 8</div>
      <h1 class="cat-title">${esc(cat.label)}</h1>
      <div class="cat-count">${myths.length} ${myths.length === 1 ? "Mythos" : "Mythen"}</div>
    </div>
  </div>
  <ul class="cat-list">${list}</ul>
</section>`;
}

function renderIntro(): string {
  // Cover/Deckblatt — team text verbatim (_local/research/sammlung fact-sheets
  // einleitung.docx). Q&A headings are styled divs (not <h2>) so they stay out
  // of the PDF outline. The Abschlussbericht link sits on the word „hier".
  const arrowKey = [
    ["richtig", "Richtig"],
    ["eher_richtig", "Eher richtig"],
    ["eher_falsch", "Eher falsch"],
    ["falsch", "Falsch"],
    ["keine_aussage", "Keine Aussage möglich"],
  ]
    .map(
      ([k, label]) =>
        `<span class="akey-item"><span class="akey-glyph">${verdictGlyph(k)}</span>${label}</span>`,
    )
    .join("");
  return `
<section class="intro">
  <div class="intro-head">
    <div class="wordmark">Cannabis: <em>Mythen</em> &amp; Evidenz</div>
    <div class="intro-sub">42 Fact-Sheets zu den in Deutschland relevanten Cannabismythen</div>
  </div>
  <div class="intro-body">
    <div class="qa-h">Was kann man erfahren?</div>
    <p class="qa-p">Der wissenschaftliche Faktencheck zu jedem einzelnen Mythos: Sein Hintergrund wird eingeordnet, die wichtigsten Fakten aus der Forschung werden zusammengestellt und in eine stark verdichtete Synthese der Fakten zusammengeführt (Stand: Sommer 2025). Zu jedem Mythos wird eine vierstufige Kurzklassifikation vorgenommen: richtig, eher richtig, eher falsch, falsch. Sie berücksichtigt auch die Qualität der wissenschaftlichen Datenlage. In zwei Fällen konnte keine Kurzklassifikationen vorgenommen werden. Die einbezogenen wissenschaftlichen Quellen, die diese Urteile tragen und die präsentierten Fakten liefern, werden angegeben.</p>
    <p class="qa-p">Aber wie weit verbreitet sind die Mythen in Deutschland? Wie wichtig sind sie für spezifische Gruppen? Wie richtig (oder falsch) werden sie in diesen beurteilt? Wie hoch ist der Präventionsbedarf für die Mythen in diesen Gruppen oder sogar in der erwachsenen bzw. minderjährigen Bevölkerung insgesamt? – Darüber gibt die jeweils ergänzte Kurztabelle zu den empirischen Ergebnissen der durchgeführten Befragungen Auskunft (Stand: Sommer 2025).</p>

    <div class="qa-h">Wie sind die Ergebnisse zu Stande gekommen?</div>
    <p class="qa-p">Genauere Hinweise zum methodischen Vorgehen des Forschungsprojektes CaRM finden sich im Projekt-Abschlussbericht, der zum Download auf der Internetseite des Instituts für interdisziplinäre Sucht- und Drogenforschung zur Verfügung steht. Er kann <a class="doclink" href="${REPORT_URL}">hier</a> heruntergeladen werden.</p>

    <div class="qa-h">An wen richten sich die Fact-Sheets?</div>
    <p class="qa-p">Die Fact-Sheets sind für alle gedacht, die ihr eigenes Hintergrundwissen erweitern oder prüfen wollen. Oder aktuelle Anknüpfungspunkte in die Literatur zur Evidenz suchen (Forschende). Aber auch für diejenigen, die das Wissen weitergeben wollen, z. B. Lehr- und Fachkräfte oder auch Journalist:innen.</p>
    <p class="qa-p">Für den schnellen Überblick sind die Kurzklassifikationen (von grün nach rot, richtig bis falsch) und die Werte in den Tabellen (von blau nach rot, niedrig bis hoch) farblich markiert.</p>
    <p class="qa-p">Verweise <span class="cite-demo">[1, 2]</span> in den Texten beziehen sich auf die Referenzen am Ende jedes Mythos.</p>
  </div>
  <div class="intro-foot">
    <div class="akey-label">Wissenschaftliche Einordnung</div>
    <div class="arrow-key">${arrowKey}</div>
  </div>
</section>`;
}

function renderToc(byCat: { cat: any; myths: Myth[]; index: number }[]): string {
  const groups = byCat
    .map(({ cat, myths, index }) => {
      const items = myths
        .map((m) => {
          const statement = m.title.replace(/^Mythos\s+\d+:\s*/i, "");
          return `<li><a href="#${m.id}"><span class="toc-glyph">${verdictGlyph(m.classification)}</span><span class="toc-st">${esc(statement)}</span></a></li>`;
        })
        .join("");
      return `<div class="toc-group">
        <a class="toc-cat" href="#cat-${index}" style="color:${cat.color}"><span class="toc-cat-icon">${svg(cat.icon)}</span><span>${esc(cat.label)}</span></a>
        <ul class="toc-items">${items}</ul>
      </div>`;
    })
    .join("");
  return `
<section class="toc page-break">
  <div class="page-title">Inhalt</div>
  <div class="toc-groups">${groups}</div>
</section>`;
}

function renderCredits(): string {
  return `
<section class="credits page-break">
  <div class="page-title">Über dieses Dokument</div>
  <p>Die Faktenblätter fassen Ergebnisse des Forschungsprojekts <strong>„Cannabiskonsum&nbsp;– Risiken und Mythen" (CaRM)</strong> zusammen. Grundlage sind die wissenschaftliche Auseinandersetzung mit den Prüfthesen sowie Bevölkerungsbefragungen in Deutschland.</p>

  <div class="credits-block">
    <div class="credits-h">Herausgeber</div>
    <p><strong>Institut für interdisziplinäre Sucht- und Drogenforschung (ISD)</strong><br/>Kleine Brunnenstraße 13, 22765 Hamburg</p>
    <div class="credits-h">Autoren</div>
    <p>Christian Schütze, Dr. Bernd Schulte, Dr. Sven Buth, Dr. Peter Degkwitz, Dr. Moritz Rosenkranz, Harald Lahusen</p>
    <div class="credits-h">Förderung</div>
    <p>Gefördert vom Bundesinstitut für Öffentliche Gesundheit (BIÖG) im Auftrag des Bundesministeriums für Gesundheit.</p>
  </div>

  <div class="credits-logos">
    <span class="brand brand-isd">${logoSvg("! ISD_Logo_RZ_neu.svg")}</span>
    <span class="brand brand-bioeg">${logoSvg("BIOEG_Logo_DE_RGB_pos.svg")}</span>
  </div>
</section>`;
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------
function css(fonts: string): string {
  return `
${fonts}
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --text:#1a1a2e;--text-2:#4a5568;--muted:#718096;--accent:#2d6a4f;
  --border:#e2e8f0;--border-strong:#cbd5e1;--surface:#ffffff;--bg-soft:#f8fafc;
}
html{font-family:'InterVar','Inter',system-ui,sans-serif;color:var(--text);font-size:10.5pt;line-height:1.55;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
body{background:#fff;}
h1,h2,h3{font-family:'InterVar',sans-serif;letter-spacing:-0.012em;line-height:1.18;font-weight:700;}
em{font-style:italic;}
strong{font-weight:650;}
a{color:inherit;text-decoration:none;}
sup.cite{font-size:0.62em;color:var(--accent);font-weight:600;vertical-align:super;line-height:0;white-space:nowrap;}

/* icons */
.icon svg,.kicker-icon svg,.vbadge-icon svg,.toc-glyph svg,.mini-glyph svg{width:1.05em;height:1.05em;display:block;}
.kicker-icon svg{width:1.15em;height:1.15em;}
.ind-ic svg,.aud-ic svg{width:15px;height:15px;display:block;}
.cat-icon-lg svg{width:60px;height:60px;}

/* page flow */
section{break-inside:auto;}
.page-break,.myth,.cat-divider{break-before:page;}

/* ---- COVER / Deckblatt (team prose + arrow key) ---- */
.intro{min-height:242mm;display:flex;flex-direction:column;padding-top:10mm;}
.wordmark{font-family:'SourceSerif',Georgia,serif;font-weight:700;font-size:30pt;line-height:1.08;color:var(--text);}
.wordmark em{font-style:italic;color:var(--accent);}
.intro-sub{font-size:12.5pt;color:var(--text-2);margin-top:8px;font-weight:500;}
.intro-body{margin-top:8mm;}
.qa-h{font-family:'InterVar',sans-serif;font-weight:700;font-size:13pt;letter-spacing:-0.01em;color:var(--accent);margin:15px 0 5px;}
.qa-p{font-size:10pt;line-height:1.55;color:var(--text-2);margin:5px 0;}
.doclink{color:var(--text);text-decoration:underline;font-weight:600;}
.intro-foot{margin-top:auto;border-top:2px solid var(--border);padding-top:12px;}
.akey-label{font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--muted);margin-bottom:8px;}
.arrow-key{display:flex;flex-wrap:wrap;gap:5px 16px;align-items:center;font-size:9pt;font-weight:600;color:var(--text-2);}
.akey-item{display:inline-flex;align-items:center;gap:5px;}
.akey-glyph{display:inline-flex;}.akey-glyph svg{width:14px;height:14px;}

/* generic front pages */
.page-title{font-family:'InterVar';font-weight:700;font-size:21pt;letter-spacing:-0.02em;margin-bottom:10px;}
.credits p{margin:7px 0;color:var(--text-2);}
.sec-h,.credits-h{font-family:'InterVar',sans-serif;font-weight:700;letter-spacing:-0.01em;line-height:1.2;}
.cite-demo{color:var(--accent);font-weight:600;}

/* badges */
.vbadge{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:999px;border:1px solid;font-weight:650;font-size:9pt;letter-spacing:0;white-space:nowrap;vertical-align:middle;}
.vbadge-icon svg{width:13px;height:13px;}
.myth-link{color:inherit;text-decoration:none;}

/* ---- TOC (2 columns, one page) ---- */
.toc-groups{column-count:2;column-gap:16px;margin-top:6px;}
.toc-group{break-inside:avoid;-webkit-column-break-inside:avoid;margin-bottom:9px;}
.toc-cat{display:flex;align-items:center;gap:7px;font-weight:700;font-size:9.8pt;padding-bottom:4px;border-bottom:1.5px solid var(--border);margin-bottom:4px;}
.toc-cat-icon svg{width:15px;height:15px;}
.toc-items{list-style:none;display:flex;flex-direction:column;gap:2px;}
.toc-items a{display:grid;grid-template-columns:13px 1fr;align-items:start;gap:6px;font-size:8.4pt;line-height:1.25;color:var(--text);padding:1px 0;break-inside:avoid;}
.toc-glyph{margin-top:1px;}.toc-glyph svg{width:12px;height:12px;}
.toc-st{color:var(--text);}

/* ---- CATEGORY DIVIDER ---- */
.cat-divider{display:flex;flex-direction:column;justify-content:center;min-height:225mm;position:relative;}
.cat-band{display:flex;align-items:center;gap:20px;padding:22px 24px;border-radius:16px;background:color-mix(in srgb,var(--cat) 8%,#fff);border:1px solid color-mix(in srgb,var(--cat) 28%,#fff);border-left:7px solid var(--cat);}
.cat-icon-lg{flex:0 0 auto;}
.cat-eyebrow{font-weight:700;font-size:9.5pt;text-transform:uppercase;letter-spacing:0.06em;}
.cat-title{font-size:22pt;font-weight:700;letter-spacing:-0.012em;margin:4px 0 6px;text-wrap:balance;}
.cat-count{color:var(--muted);font-weight:600;font-size:10.5pt;}
.cat-list{list-style:none;margin-top:22px;display:flex;flex-direction:column;gap:7px;}
.cat-list a{display:grid;grid-template-columns:18px 1fr;align-items:baseline;gap:11px;padding:7px 2px;border-bottom:1px solid var(--border);font-size:10.5pt;}
.mini-glyph{align-self:center;}.mini-glyph svg{width:15px;height:15px;}
.mini-st{color:var(--text);}

/* ---- MYTH PAGE ---- */
.myth{padding-top:1mm;position:relative;}
.myth-kicker{display:flex;align-items:center;gap:7px;font-weight:700;font-size:9pt;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;}
.kicker-icon{display:flex;}
.myth-head{break-inside:avoid;break-after:avoid;border-bottom:2px solid var(--border);padding-bottom:12px;margin-bottom:13px;}
.myth-statement{font-size:18pt;font-weight:700;letter-spacing:-0.012em;line-height:1.32;color:var(--text);}
.myth-statement .vbadge{position:relative;top:-2px;}

.sec{margin-bottom:13px;}
.sec .sec-h{font-size:11.5pt;color:var(--text);margin-bottom:5px;padding-left:9px;border-left:3px solid var(--border-strong);}
.sec p{margin:5px 0;color:var(--text-2);}
.sec-synthese{background:var(--bg-soft);border:1px solid var(--border);border-left:4px solid;border-radius:9px;padding:11px 14px;}
.sec-synthese .sec-h{border:0;padding:0;}
.sec-synthese p{color:var(--text);font-weight:480;}
ul.erkenntnisse{list-style:none;display:flex;flex-direction:column;gap:6px;margin-top:4px;}
ul.erkenntnisse li{position:relative;padding-left:16px;color:var(--text-2);font-size:10pt;line-height:1.5;break-inside:avoid;}
ul.erkenntnisse li::before{content:"";position:absolute;left:2px;top:7px;width:5px;height:5px;border-radius:50%;background:var(--accent);}

/* data table — dashboard heatmap (band cells) + locked indicator/group icons */
.sec-data{break-inside:avoid;}
.data-table{width:100%;border-collapse:separate;border-spacing:2px;font-size:9pt;margin-top:6px;font-variant-numeric:tabular-nums;}
.data-table th{vertical-align:bottom;padding:3px 4px 6px;font-weight:600;font-size:8pt;color:var(--text-2);text-align:center;}
.data-table th.col-aud{text-align:left;vertical-align:bottom;}
.data-table th .ind-ic{display:flex;justify-content:center;color:var(--text-2);margin-bottom:3px;}
.data-table th .ind-lb{display:block;color:var(--text);font-weight:650;}
.data-table th .ind-unit{display:block;font-size:7pt;font-weight:500;color:var(--muted);margin-top:1px;}
.data-table td{padding:5px 6px;text-align:center;border-radius:5px;}
.data-table td.aud{text-align:left;font-weight:600;color:var(--text);white-space:nowrap;font-size:8.6pt;}
.data-table td.aud .aud-ic{display:inline-flex;vertical-align:middle;margin-right:6px;color:var(--text-2);}
.data-table td.val{font-weight:650;color:#1f2937;}
.data-table td.na{color:var(--muted);font-size:8.4pt;}
.data-cap{font-size:8pt;color:var(--muted);margin-top:7px;line-height:1.45;}
/* indicator key under each table (canonical definitions) */
.ind-defs{margin-top:9px;display:flex;flex-direction:column;gap:3px;}
.ind-def{display:grid;grid-template-columns:13px 1fr;gap:6px;font-size:7.6pt;line-height:1.4;color:var(--text-2);break-inside:avoid;}
.ind-def-ic{color:var(--text-2);margin-top:1.5px;}
.ind-def-ic svg{width:12px;height:12px;display:block;}
.ind-def strong{color:var(--text);font-weight:650;}

/* references */
.sec-ref .sec-h{margin-bottom:7px;}
ol.references{list-style:none;display:flex;flex-direction:column;gap:3px;}
ol.references li{display:grid;grid-template-columns:20px 1fr;gap:6px;font-size:7.8pt;line-height:1.4;color:var(--muted);break-inside:avoid;}
.ref-n{color:var(--text-2);font-weight:600;text-align:right;font-variant-numeric:tabular-nums;}

/* ---- CREDITS ---- */
.credits-block{margin:14px 0;}
.credits-block .credits-h{font-size:11pt;margin:13px 0 3px;color:var(--accent);}
.credits-logos{display:flex;align-items:center;gap:44px;margin:22px 0;padding:22px 2px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.credits-logos .brand-isd svg{height:56px;width:auto;display:block;}
.credits-logos .brand-bioeg svg{height:74px;width:auto;display:block;}
.credits-url{font-size:11pt;font-weight:600;}
.credits-url a{color:var(--accent);}
.credits-fine{font-size:8.5pt;color:var(--muted);margin-top:14px;}
`;
}

function headerFooter() {
  const footer = `<div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:7pt;color:#9aa3af;width:100%;padding:0 14mm;display:flex;justify-content:space-between;align-items:center;">
    <span>Cannabis: Mythen &amp; Evidenz · cannabismythen.de</span>
    <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`;
  const header = `<div style="width:100%;height:0;"></div>`;
  return { header, footer };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n📄 Generating myth-factsheet PDF${SAMPLE ? " (SAMPLE mode)" : ""}…`);

  // load + parse myths
  const { readdirSync } = await import("node:fs");
  const files = readdirSync(CONTENT_DIR)
    .filter((f) => /^m\d+.*\.mdoc$/.test(f))
    .map((f) => join(CONTENT_DIR, f));
  let myths = files.map(parseMdoc).filter((m): m is Myth => !!m);
  myths.sort((a, b) => a.number - b.number);
  if (SAMPLE) myths = myths.filter((m) => SAMPLE_IDS.includes(m.id));
  console.log(`   ${myths.length} myths loaded`);

  // group by category (preserve CATEGORIES order; skip empty)
  const byCat = CATEGORIES.map((cat, i) => ({
    cat,
    index: i + 1,
    myths: myths.filter((m) => m.categoryGroup === cat.label).sort((a, b) => a.number - b.number),
  })).filter((g) => g.myths.length > 0);

  // sanity: warn on any myth whose categoryGroup didn't match
  const matched = new Set(byCat.flatMap((g) => g.myths.map((m) => m.id)));
  myths.filter((m) => !matched.has(m.id)).forEach((m) => console.warn(`  ! ${m.id} categoryGroup unmatched: "${m.categoryGroup}"`));

  // fonts
  const fonts = [
    fontFace(join(ROOT, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2"), "InterVar", "normal", "100 900"),
    fontFace(join(ROOT, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-italic.woff2"), "InterVar", "italic", "100 900"),
    fontFace(join(ROOT, "node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-700-normal.woff2"), "SourceSerif", "normal", "700"),
    fontFace(join(ROOT, "node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-700-italic.woff2"), "SourceSerif", "italic", "700"),
  ].join("\n");

  // assemble body
  const parts: string[] = [renderIntro(), renderToc(byCat)];
  for (const { cat, myths: cm, index } of byCat) {
    parts.push(renderCategoryDivider(cat, cm, index));
    for (const m of cm) parts.push(renderMyth(m, cat));
  }
  parts.push(renderCredits());

  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"/>
<title>Cannabis: Mythen & Evidenz — Faktenblätter</title>
<style>${css(fonts)}</style></head><body>${parts.join("\n")}</body></html>`;

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_HTML, html, "utf8");
  console.log(`   HTML → ${OUT_HTML} (${(html.length / 1024 / 1024).toFixed(1)} MB)`);

  // render PDF
  console.log("   launching Chromium…");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  const { header, footer } = headerFooter();
  await page.pdf({
    path: OUT_PDF,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: header,
    footerTemplate: footer,
    margin: { top: "13mm", bottom: "15mm", left: "14mm", right: "14mm" },
    tagged: true,
    outline: true,
  });
  await browser.close();

  // Rebuild the bookmark outline with clean titles (Mythos N: … nested under
  // the 8 categories). Chromium's auto-outline has correct destinations but
  // mangles titles at soft-wrap boundaries; the Python helper fixes them
  // positionally. Falls back silently to Chromium's outline if it can't run.
  const outline = {
    front: [
      { title: "Einführung", page: 0 },
      { title: "Inhalt", page: 1 },
    ],
    items: byCat.flatMap(({ cat, myths: cm }) => [
      { level: 1, title: cat.label },
      ...cm.map((m) => ({ level: 2, title: m.title.replace(/^Mythos\s+\d+:\s*/i, "") })),
    ]),
    back: [{ title: "Über dieses Dokument", page: -1 }],
  };
  try {
    const { execFileSync } = await import("node:child_process");
    const jsonPath = join(OUT_DIR, ".outline.json");
    writeFileSync(jsonPath, JSON.stringify(outline), "utf8");
    const out = execFileSync(
      "python3",
      [join(__dirname, "fix-pdf-outline.py"), OUT_PDF, jsonPath, OUT_PDF],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    console.log(`   ${out.trim()}`);
  } catch (e: any) {
    console.warn(`   ⚠ outline polish skipped (${e.message?.split("\n")[0] ?? e}); using Chromium outline`);
  }

  console.log(`   ✅ PDF → ${OUT_PDF}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
