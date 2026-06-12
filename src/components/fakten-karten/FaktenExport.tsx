/**
 * FaktenExport — export control for the 42-Mythen (Fakten-Karten) page.
 *
 * Mirrors the Daten-Explorer ExportDrawer (button → modal Drawer with a grid
 * of format cards), reusing the same `.carm-export-*` chrome. Offers four
 * documents:
 *   1. Liste (PDF)             — browser print → "Als PDF sichern"
 *                                (number + statement + verdict, no texts).
 *   2. Liste mit Erklärungen   — browser print → "Als PDF sichern"
 *                                (list + each myth's cardShortSummary).
 *   3. Karten (PDF · Entwurf)  — browser print → "Als PDF sichern",
 *                                front (image) + back, 3 pairs per A4 page.
 *   4. Faktenblätter (PDF)     — the complete static PDF already in /public.
 *
 * #1–#3 reflect the CURRENT selection: the `myths` prop is the parent's
 * `filteredMyths` (category + search filter applied), in myth-number order.
 * All three render into a `.fakten-print-root` portalled to <body> so the
 * `@media print` block in fakten-karten.css can hide every other body child
 * and leave only the document.
 *
 * Card FRONTS are rasterised before printing (#3): each website front face is
 * captured to a PNG via html-to-image and embedded as an <img>. Foreground
 * images always print, so the verdict gradient + arrow + white text survive
 * even when the print dialog's "Hintergrundgrafiken / Background graphics" box
 * is off (its default) — which otherwise strips the CSS gradient and leaves a
 * black-on-white front.
 *
 * German UI copy in this file is an AI draft — pending ISD review.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Download, FileText, Info, Layers, Lightbulb, List } from "lucide-react";
import Drawer from "../shared/Drawer";
import VerdictPill from "../shared/VerdictPill";
import CategoryFooter from "./CategoryFooter";
import { getVerdictVisual } from "../../lib/fakten-karten/verdict-colors";
import type { CorrectnessClass } from "../../lib/dashboard/types";
import type { FaktenCardMyth } from "./FaktenCard";

/** Static publication PDF (all 42 factsheets) — already served from /public
 *  and linked from FactsheetPanel. Card #4 is just a download link to it. */
const FACTSHEET_PDF_HREF = "/cannabismythen-mythen-faktenblaetter.pdf";
const FACTSHEET_PDF_NAME = "cannabismythen-mythen-faktenblaetter.pdf";

const VALID_VERDICTS: ReadonlySet<CorrectnessClass> = new Set([
  "richtig",
  "eher_richtig",
  "eher_falsch",
  "falsch",
  "keine_aussage_moeglich",
]);

function toVerdict(raw: string): CorrectnessClass {
  return VALID_VERDICTS.has(raw as CorrectnessClass)
    ? (raw as CorrectnessClass)
    : "keine_aussage_moeglich";
}

/** A myth as the Fakten-Karten explorer holds it — a card myth plus its
 *  category group (needed for the card-front footer in the print deck). */
export type ExportMyth = FaktenCardMyth & { categoryGroup: string };

/** Which print document is queued for the browser print dialog. */
type PrintDoc = "liste-plain" | "liste" | "karten";

interface Props {
  open: boolean;
  onClose: () => void;
  /** The current selection (parent's filteredMyths), in myth-number order. */
  myths: ExportMyth[];
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Split into rows of three — one A4 page of card pairs each. */
function chunk3<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 3) out.push(arr.slice(i, i + 3));
  return out;
}

export default function FaktenExport({ open, onClose, myths }: Props) {
  // Which print document is currently being sent to the browser print dialog.
  const [printDoc, setPrintDoc] = useState<PrintDoc | null>(null);
  // Card-front capture in flight — disables the Karten card meanwhile.
  const [busy, setBusy] = useState(false);
  // Off-screen front faces to rasterise (mounted only during a capture).
  const [shotMyths, setShotMyths] = useState<ExportMyth[]>([]);
  // Captured front-face PNGs (data URLs), index-aligned with `myths`.
  const [fronts, setFronts] = useState<string[]>([]);
  const shotRef = useRef<HTMLDivElement>(null);

  const empty = myths.length === 0;

  // Mount the off-screen front faces, wait for them to paint + their arrow
  // images to decode, then rasterise each front to a PNG data URL.
  const captureFronts = async (): Promise<string[]> => {
    setShotMyths(myths);
    let root: HTMLDivElement | null = null;
    for (let i = 0; i < 60; i++) {
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      const el = shotRef.current;
      if (el && el.querySelectorAll(".fk-shot-front").length >= myths.length) {
        root = el;
        break;
      }
    }
    if (!root) {
      setShotMyths([]);
      return myths.map(() => "");
    }
    await Promise.all(
      Array.from(root.querySelectorAll("img")).map((img) =>
        (img as HTMLImageElement).decode().catch(() => undefined),
      ),
    );
    const { toPng } = await import("html-to-image");
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(".fk-shot-front"));
    const urls: string[] = [];
    for (const node of nodes) {
      try {
        urls.push(await toPng(node, { pixelRatio: 2, cacheBust: true }));
      } catch {
        urls.push("");
      }
    }
    setShotMyths([]);
    return urls;
  };

  // Close the drawer, then mount the print document + open the print dialog
  // (effect below). The user picks "Als PDF sichern".
  const startPrint = (doc: "liste-plain" | "liste") => {
    onClose();
    setPrintDoc(doc);
  };

  // Karten: rasterise the fronts first (so colours always print), then print.
  const startKarten = async () => {
    if (empty || busy) return;
    setBusy(true);
    try {
      const urls = await captureFronts();
      setFronts(urls);
      onClose();
      setPrintDoc("karten");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!printDoc) return;
    const prevTitle = document.title;
    // Browsers seed the "Save as PDF" filename from document.title.
    const stamp = todayStamp();
    document.title =
      printDoc === "karten"
        ? `cannabismythen-42-mythen-karten_${stamp}`
        : printDoc === "liste"
          ? `cannabismythen-42-mythen-liste-erklaerungen_${stamp}`
          : `cannabismythen-42-mythen-liste_${stamp}`;
    document.body.classList.add("cm-printing");

    const cleanup = () => {
      document.body.classList.remove("cm-printing");
      document.title = prevTitle;
      setPrintDoc(null);
    };
    window.addEventListener("afterprint", cleanup, { once: true });

    // Let the portalled document paint before opening the print dialog.
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => window.print()),
    );

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("afterprint", cleanup);
    };
  }, [printDoc]);

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        variant="modal"
        title="Mythen exportieren"
      >
        <div className="carm-export-callouts">
          <p className="carm-export-callout">
            <Lightbulb size={17} strokeWidth={1.9} aria-hidden="true" />
            <span>
              Du exportierst deine aktuelle Auswahl
              {empty ? "" : ` (${myths.length})`} — die Mythen aus der Karten-
              oder Listenansicht. Die „Faktenblätter“ enthalten dagegen immer
              alle 42 Mythen.
            </span>
          </p>
          <p className="carm-export-callout">
            <Info size={17} strokeWidth={1.9} aria-hidden="true" />
            <span>
              „Liste“ und „Karten“ öffnen den Druckdialog deines Browsers.
              Stelle dort als Ziel (bzw. Drucker) „Als PDF speichern“ ein und
              bestätige mit „Speichern“ — die Auswahl wird als PDF-Datei
              gesichert statt ausgedruckt.
            </span>
          </p>
        </div>

        <div className="carm-export-grid">
          <ExportCard
            icon={<List size={28} strokeWidth={1.75} />}
            title="Liste (PDF)"
            desc="Kompakte Mythen-Liste — Nummer, Aussage und Einordnung. Öffnet den Druckdialog → „Als PDF speichern“."
            onClick={() => startPrint("liste-plain")}
            disabled={empty}
          />
          <ExportCard
            icon={<FileText size={28} strokeWidth={1.75} />}
            title="Liste mit Erklärungen (PDF)"
            desc="Liste mit den Kurztexten der Karten. Öffnet den Druckdialog → „Als PDF speichern“."
            onClick={() => startPrint("liste")}
            disabled={empty}
          />
          <ExportCard
            icon={<Layers size={28} strokeWidth={1.75} />}
            title="Karten (PDF · Entwurf)"
            desc={
              busy
                ? "Karten werden vorbereitet …"
                : "Alle Karten mit Vorder- und Rückseite, drei pro Seite — zur Vorbereitung von Präventionsstunden. Öffnet den Druckdialog."
            }
            onClick={startKarten}
            disabled={empty || busy}
          />
          <ExportCard
            icon={<FileText size={28} strokeWidth={1.75} />}
            title="Faktenblätter (PDF)"
            desc="Alle 42 ausführlichen Faktenblätter (3,6 MB)."
            href={FACTSHEET_PDF_HREF}
            downloadName={FACTSHEET_PDF_NAME}
            onClick={onClose}
          />
        </div>
      </Drawer>

      {/* Off-screen front faces — rasterised to PNGs for the Karten deck so
          the verdict colours always print. Mounted only during a capture. */}
      {shotMyths.length > 0 && (
        <div className="fakten-export-shots" aria-hidden="true" ref={shotRef}>
          {shotMyths.map((m) => (
            <ShotFront key={m.mythNumber} myth={m} />
          ))}
        </div>
      )}

      {/* #1–#3 print document — portalled to <body> so the @media print
          block can hide every other body child and leave only this. */}
      {printDoc &&
        createPortal(
          <div className="fakten-print-root">
            {printDoc === "karten" ? (
              <PrintKarten myths={myths} fronts={fronts} />
            ) : (
              <PrintListe myths={myths} withSummaries={printDoc === "liste"} />
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

/* ── Export card (mirrors ExportDrawer's ExportCard) ──────────────────── */

interface ExportCardProps {
  title: string;
  desc: string;
  icon: ReactNode;
  /** When set, the card renders as a download `<a>` (static factsheet PDF). */
  href?: string;
  downloadName?: string;
  disabled?: boolean;
  onClick?: () => void;
}

function ExportCard({
  title,
  desc,
  icon,
  href,
  downloadName,
  disabled,
  onClick,
}: ExportCardProps) {
  const body = (
    <>
      <span
        className="carm-export-card__media carm-export-card__media--icon"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="carm-export-card__text">
        <span className="carm-export-card__title">{title}</span>
        <span className="carm-export-card__desc">{desc}</span>
      </span>
      <span className="carm-export-card__cta" aria-hidden="true">
        <Download size={16} strokeWidth={2} />
      </span>
    </>
  );

  if (href) {
    return (
      <a
        className="carm-export-card"
        href={href}
        download={downloadName}
        onClick={onClick}
      >
        {body}
      </a>
    );
  }

  return (
    <button
      type="button"
      className="carm-export-card"
      onClick={onClick}
      disabled={disabled}
    >
      {body}
    </button>
  );
}

/* ── Off-screen capture: a faithful, flip-free copy of the website front
   face, sized to the Figma 320×500 frame so cqi/% chrome resolves exactly
   as on the live card. html-to-image rasterises `.fk-shot-front`. ─────── */

function ShotFront({ myth }: { myth: ExportMyth }) {
  const verdict = toVerdict(myth.classification);
  const visual = getVerdictVisual(verdict);
  const arrowStyle: CSSProperties = {
    top: visual.arrowFrame.top,
    left: visual.arrowFrame.left,
    width: visual.arrowFrame.width,
    height: visual.arrowFrame.height,
  };
  return (
    <div className="fk-shot-cell">
      <div className="fakten-card">
        <div className="fakten-card__inner">
          <div
            className="fakten-card__face fakten-card__face--front fk-shot-front"
            style={{ backgroundImage: visual.gradient }}
          >
            <span className="fakten-card__bg-arrow" style={arrowStyle} aria-hidden="true">
              <img src={visual.arrowSrc} alt="" />
            </span>
            <div className="fakten-card__face-body">
              <p className="fakten-card__statement">{myth.title}</p>
              <CategoryFooter categoryGroup={myth.categoryGroup} tone="on-color" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Print document #1 / #2: Liste (optionally with explanations) ──────── */

function PrintListe({
  myths,
  withSummaries,
}: {
  myths: ExportMyth[];
  withSummaries: boolean;
}) {
  return (
    <div className="fk-print fk-print--liste">
      <header className="fk-print__head">
        <h1 className="fk-print__title">
          42 Mythen — Liste{withSummaries ? " mit Erklärungen" : ""}
        </h1>
        <p className="fk-print__source">
          Cannabis: Mythen &amp; Evidenz · cannabismythen.de · Datenbasis:
          CaRM-Studie, ISD Hamburg
        </p>
      </header>
      <ol className="fk-print-list">
        {myths.map((m) => {
          const verdict = toVerdict(m.classification);
          return (
            <li
              key={m.mythNumber}
              className="fk-print-list__item"
              data-classification={verdict}
            >
              <div className="fk-print-list__row">
                <span className="fk-print-list__num">{m.mythNumber}</span>
                <span className="fk-print-list__statement">{m.title}</span>
                <span className="fk-print-list__verdict">
                  <VerdictPill verdict={verdict} size="sm" />
                </span>
              </div>
              {withSummaries && (
                <p className="fk-print-list__summary">
                  {m.cardShortSummary || m.cardSummary}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ── Print document #3: Karten — 3 front+back pairs per A4 page · DRAFT ── */

function PrintKarten({
  myths,
  fronts,
}: {
  myths: ExportMyth[];
  fronts: string[];
}) {
  const pages = chunk3(myths.map((m, i) => ({ m, front: fronts[i] ?? "" })));
  return (
    <div className="fk-print fk-print--karten">
      {pages.map((page, pi) => (
        <div className="fk-print-page" key={pi}>
          <div className="fk-print-page__head">Entwurf · Layout-Vorschlag</div>
          {page.map(({ m, front }) => {
            const verdict = toVerdict(m.classification);
            const visual = getVerdictVisual(verdict);
            return (
              <section key={m.mythNumber} className="fk-print-card">
                {front ? (
                  <img className="fk-print-card__front-img" src={front} alt="" />
                ) : (
                  <div className="fk-print-card__front-img" />
                )}
                <div className="fk-print-card__back">
                  <span className="fk-print-card__back-num">
                    Mythos {m.mythNumber}
                  </span>
                  <p
                    className="fk-print-card__back-title"
                    style={{ color: visual.headingColor }}
                  >
                    {m.shortLabel || m.title}
                  </p>
                  <span className="fk-print-card__back-badge">
                    <VerdictPill verdict={verdict} size="sm" />
                  </span>
                  <p className="fk-print-card__summary">
                    {m.cardShortSummary || m.cardSummary}
                  </p>
                </div>
              </section>
            );
          })}
        </div>
      ))}
    </div>
  );
}
