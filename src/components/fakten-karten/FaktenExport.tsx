/**
 * FaktenExport — export control for the 42-Mythen (Fakten-Karten) page.
 *
 * Mirrors the Daten-Explorer ExportDrawer (button → modal Drawer with a grid
 * of format cards), reusing the same `.carm-export-*` chrome. Offers four
 * documents:
 *   1. Liste (PNG)             — html-to-image snapshot of the Liste view.
 *   2. Liste mit Erklärungen   — browser print → "Als PDF sichern"
 *                                (list + each myth's cardShortSummary).
 *   3. Karten (PDF · Entwurf)  — browser print → "Als PDF sichern",
 *                                front + back, one card per A4 page (DRAFT).
 *   4. Faktenblätter (PDF)     — the complete static PDF already in /public.
 *
 * #1–#3 reflect the CURRENT selection: the `myths` prop is the parent's
 * `filteredMyths` (category + search filter applied), in myth-number order.
 * #2/#3 render into a `.fakten-print-root` that is portalled to <body> so the
 * `@media print` block in fakten-karten.css can hide every other body child
 * and leave only the document. #1 captures a fixed-width, off-screen replica
 * of <FaktenListView> so the snapshot matches the on-screen list exactly and
 * works from either the Karten or Liste view.
 *
 * German UI copy in this file is an AI draft — pending ISD review.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Download, FileImage, FileText, Layers } from "lucide-react";
import Drawer from "../shared/Drawer";
import FaktenListView from "./FaktenListView";
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

interface Props {
  open: boolean;
  onClose: () => void;
  /** The current selection (parent's filteredMyths), in myth-number order. */
  myths: ExportMyth[];
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function FaktenExport({ open, onClose, myths }: Props) {
  // Off-screen <FaktenListView> replica — the html-to-image capture target.
  const listShotRef = useRef<HTMLDivElement>(null);
  // Which print document is currently being sent to the browser print dialog.
  const [printDoc, setPrintDoc] = useState<null | "liste" | "karten">(null);
  // PNG capture in flight — disables the card so it can't be double-fired.
  const [busy, setBusy] = useState(false);

  const empty = myths.length === 0;

  // #1 — PNG snapshot of the Liste view (current selection).
  const handleListPng = async () => {
    const node = listShotRef.current;
    if (!node) return;
    setBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `cannabismythen-42-mythen-liste_${todayStamp()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      /* capture failed — nothing actionable to surface in the dialog */
    } finally {
      setBusy(false);
      onClose();
    }
  };

  // #2 / #3 — close the drawer, then mount the print document and open the
  // browser print dialog (effect below). The user picks "Als PDF sichern".
  const startPrint = (doc: "liste" | "karten") => {
    onClose();
    setPrintDoc(doc);
  };

  useEffect(() => {
    if (!printDoc) return;
    const prevTitle = document.title;
    // Browsers seed the "Save as PDF" filename from document.title.
    document.title =
      printDoc === "liste"
        ? `cannabismythen-42-mythen-liste-erklaerungen_${todayStamp()}`
        : `cannabismythen-42-mythen-karten_${todayStamp()}`;
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
        <p className="carm-export-intro">
          Wähle ein Format. Die ersten drei zeigen deine aktuelle Auswahl
          {empty ? "" : ` (${myths.length})`}; die Faktenblätter enthalten alle
          42 Mythen ausführlich.
        </p>

        <div className="carm-export-grid">
          <ExportCard
            icon={<FileImage size={28} strokeWidth={1.75} />}
            title="Liste (PNG)"
            desc="Die Mythen-Liste als Bild — wie in der Listenansicht."
            onClick={handleListPng}
            disabled={busy || empty}
          />
          <ExportCard
            icon={<FileText size={28} strokeWidth={1.75} />}
            title="Liste mit Erklärungen (PDF)"
            desc="Liste mit den Kurztexten der Karten. Öffnet den Druckdialog → „Als PDF sichern“."
            onClick={() => startPrint("liste")}
            disabled={empty}
          />
          <ExportCard
            icon={<Layers size={28} strokeWidth={1.75} />}
            title="Karten (PDF · Entwurf)"
            desc="Alle Karten mit Vorder- und Rückseite, eine pro Seite — zur Vorbereitung von Präventionsstunden. Öffnet den Druckdialog."
            onClick={() => startPrint("karten")}
            disabled={empty}
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

        <p className="carm-export-note">
          Tipp: „Liste mit Erklärungen“ und „Karten“ öffnen den Druckdialog —
          dort als Ziel „Als PDF speichern“ wählen.
        </p>
      </Drawer>

      {/* #1 capture source — off-screen replica of the Liste view. Mounted
          only while the drawer is open (when a PNG might be requested). */}
      {open && (
        <div className="fakten-export-offscreen" aria-hidden="true">
          <div ref={listShotRef} className="fakten-export-listshot">
            <FaktenListView myths={myths} />
          </div>
        </div>
      )}

      {/* #2 / #3 print document — portalled to <body> so the @media print
          block can hide every other body child and leave only this. */}
      {printDoc &&
        createPortal(
          <div className="fakten-print-root">
            {printDoc === "liste" ? (
              <PrintListe myths={myths} />
            ) : (
              <PrintKarten myths={myths} />
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

/* ── Print document #2: Liste mit Erklärungen ─────────────────────────── */

function PrintListe({ myths }: { myths: ExportMyth[] }) {
  return (
    <div className="fk-print fk-print--liste">
      <header className="fk-print__head">
        <h1 className="fk-print__title">42 Mythen — Liste mit Erklärungen</h1>
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
              <p className="fk-print-list__summary">
                {m.cardShortSummary || m.cardSummary}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ── Print document #3: Karten (front + back per page) · DRAFT ─────────── */

function PrintKarten({ myths }: { myths: ExportMyth[] }) {
  return (
    <div className="fk-print fk-print--karten">
      {myths.map((m) => {
        const verdict = toVerdict(m.classification);
        const visual = getVerdictVisual(verdict);
        return (
          <section key={m.mythNumber} className="fk-print-card">
            <span className="fk-print-card__draft">Entwurf · Layout-Vorschlag</span>
            <div
              className="fk-print-card__front"
              style={{ backgroundImage: visual.gradient }}
            >
              <span className="fk-print-card__num">Mythos {m.mythNumber}</span>
              <p className="fk-print-card__statement">{m.title}</p>
              <CategoryFooter categoryGroup={m.categoryGroup} tone="on-color" />
            </div>
            <div className="fk-print-card__back">
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
  );
}
