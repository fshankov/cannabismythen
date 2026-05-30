/**
 * RundgangPanel — the intro/overview shown when the far-right "Rundgang"
 * tab is active (`state.view === 'rundgang'`). It replaces the old
 * first-visit welcome modal: instead of interrupting, it's a calm "home
 * base" that explains the two data domains (Mythen vs. Informationsquellen,
 * both from the CaRM study) and the shared controls, then offers a short
 * guided walkthrough.
 *
 * Purely presentational — all behaviour lives in the parent:
 *   - `onStart`   → switch to Spannweite + drive the Driver.js walkthrough
 *   - `onExplore` → jump straight into the data (Balken)
 *
 * German only for now, matching the rest of the dashboard.
 */
import { PlayCircle, ArrowRight, BarChart3, Radio } from 'lucide-react';

interface Props {
  onStart: () => void;
  onExplore: () => void;
}

export default function RundgangPanel({ onStart, onExplore }: Props) {
  return (
    <section className="carm-rundgang-panel" aria-labelledby="carm-rundgang-title">
      <p className="carm-rundgang-panel__eyebrow">Rundgang</p>
      <h2 id="carm-rundgang-title" className="carm-rundgang-panel__title">
        Zwei Datensichten – eine Studie
      </h2>
      <p className="carm-rundgang-panel__lede">
        Der Daten-Explorer zeigt Ergebnisse der CaRM-Studie: 42 Cannabis-Mythen
        und die Wege, auf denen sich Menschen informieren. Du erkundest sie aus
        zwei Blickwinkeln:
      </p>

      <div className="carm-rundgang-panel__domains">
        <div className="carm-rundgang-panel__domain">
          <div className="carm-rundgang-panel__domain-head">
            <BarChart3 size={20} strokeWidth={1.75} aria-hidden="true" />
            <h3 className="carm-rundgang-panel__domain-title">Mythen</h3>
          </div>
          <p className="carm-rundgang-panel__domain-tabs">
            Balken · Spannweite · Tabelle
          </p>
          <p className="carm-rundgang-panel__domain-text">
            Wie <strong>bekannt</strong>, <strong>wichtig</strong> und{' '}
            <strong>richtig beurteilt</strong> die 42 Aussagen in jeder
            Zielgruppe sind.
          </p>
        </div>

        <div className="carm-rundgang-panel__domain">
          <div className="carm-rundgang-panel__domain-head">
            <Radio size={20} strokeWidth={1.75} aria-hidden="true" />
            <h3 className="carm-rundgang-panel__domain-title">Informationsquellen</h3>
          </div>
          <p className="carm-rundgang-panel__domain-tabs">
            Informationsquellen · …2 · Quellen-Tabelle
          </p>
          <p className="carm-rundgang-panel__domain-text">
            Welche Wege die Zielgruppen <strong>nutzen</strong>, welchen sie{' '}
            <strong>vertrauen</strong> und worüber sie Gesundheitsinfos{' '}
            <strong>wahrnehmen</strong>.
          </p>
        </div>
      </div>

      <p className="carm-rundgang-panel__shared">
        In jeder Sicht wählst du Zielgruppe und Indikatoren, kannst sortieren,
        Spalten ausblenden, filtern und einzelne Mythen für das vollständige
        Fact-Sheet öffnen.
      </p>

      <div className="carm-rundgang-panel__actions">
        <button
          type="button"
          className="carm-rundgang-panel__cta carm-rundgang-panel__cta--primary"
          onClick={onStart}
        >
          <PlayCircle size={18} strokeWidth={2} aria-hidden="true" />
          Geführten Rundgang starten
        </button>
        <button
          type="button"
          className="carm-rundgang-panel__cta carm-rundgang-panel__cta--ghost"
          onClick={onExplore}
        >
          Direkt loslegen
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
