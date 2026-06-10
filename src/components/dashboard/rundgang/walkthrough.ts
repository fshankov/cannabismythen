/**
 * Rundgang walkthrough — the 4-step Driver.js tour started by clicking the
 * green "?" bookmark in the tab bar.
 *
 * It runs on the **Spannweite** ("Übersicht") view (the parent switches
 * there first), because that's the only myth view that visibly shows all
 * the controls the tour points at: the Mythen ⇄ Informationswege dataset
 * toggle, the pivot toggle + "Wert für" picker + filter/search, the
 * per-column sort + eye-off hide buttons, and clickable myth rows.
 *
 * To keep each step short + scannable, the long detail (the dataset
 * explanations in step 1, the Anwendungsbeispiele in step 2) lives in
 * collapsed **accordions** that reuse the Factsheet popup's collapsible
 * design (native <details> + the `.factsheet-panel__section*` classes).
 *
 * Plain navigation: Weiter / Zurück through steps 1–4. Step 4 is the final
 * step (its copy ends with the "Das war's…" send-off) and its button reads
 * "Erkunden" with a magnifier. Step numbers live in the titles ("n / 4")
 * with `showProgress: false`. Reuses `.carm-tour-popover` from dashboard.css.
 *
 * Inline lucide glyphs: Driver renders `description` and the footer button
 * via innerHTML, so we embed lucide SVGs (paths copied verbatim from the
 * installed `lucide-react`) to mirror the real dashboard controls.
 */
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';

/** Wrap lucide path markup in a 1em, currentColor inline SVG. */
const icon = (inner: string): string =>
  `<svg class="carm-tour-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

// lucide path data (verbatim from lucide-react).
const ICONS = {
  toggle: icon('<circle cx="15" cy="12" r="3"/><rect width="20" height="14" x="2" y="5" rx="7"/>'),
  chevronDown: icon('<path d="m6 9 6 6 6-6"/>'),
  filter: icon('<path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/>'),
  sort: icon('<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>'),
  info: icon('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'),
  eyeOff: icon('<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>'),
  search: icon('<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>'),
  scale: icon('<path d="M12 3v18"/><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"/><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M7 21h10"/>'),
  signpost: icon('<path d="M12 13v8"/><path d="M12 3v3"/><path d="M2.354 10.354a1.207 1.207 0 0 1 0-1.708l2.06-2.06A2 2 0 0 1 5.828 6h12.344a2 2 0 0 1 1.414.586l2.06 2.06a1.207 1.207 0 0 1 0 1.708l-2.06 2.06a2 2 0 0 1-1.414.586H5.828a2 2 0 0 1-1.414-.586z"/>'),
  lightbulb: icon('<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>'),
} as const;

/** A Factsheet-style collapsible (native <details>) so each step stays
 *  short — the detail is one click away. Mirrors FactsheetPanel's
 *  "Verwandte Mythen" markup; styled by `.factsheet-panel__section*`. */
// `name` makes the accordions within a step mutually exclusive (only one
// open at a time) so the popover height stays bounded — opening one closes
// the others. Steps render one at a time, so a single shared name is safe.
const accordion = (iconSvg: string, title: string, body: string): string =>
  `<details name="carm-rundgang-acc" class="factsheet-panel__section factsheet-panel__section--collapsible">` +
  `<summary class="factsheet-panel__section-toggle">` +
  `<span class="factsheet-panel__section-title">${iconSvg} ${title}</span>` +
  `<span class="factsheet-panel__chevron" aria-hidden="true">&#9662;</span>` +
  `</summary>` +
  `<div class="factsheet-panel__section-content">${body}</div>` +
  `</details>`;

export function buildWalkthrough(): Driver {
  const tour: Driver = driver({
    showProgress: false,
    allowClose: true,
    smoothScroll: true,
    // Guiding, not gatekeeping — keep the dashboard clickable underneath.
    stagePadding: 6,
    stageRadius: 8,
    nextBtnText: 'Weiter →',
    prevBtnText: '← Zurück',
    doneBtnText: `${ICONS.search} Erkunden`,
    popoverClass: 'carm-tour-popover',
    // NB: we intentionally do NOT call tour.refresh() on accordion toggle —
    // re-positioning made the whole popover jump. The popover is positioned
    // once and grows in place (downward); its description scrolls (with a
    // stable scrollbar gutter) so the layout never shifts.
    // Driver fires onDestroyStarted on X / Escape / finishing the last
    // step; we must call destroy() ourselves or the popover lingers.
    onDestroyStarted: () => {
      tour.destroy();
    },
    steps: [
      {
        element: '.carm-explorer__tab-bar',
        popover: {
          title: '1 / 4 · Zwei Datensätze aus der CaRM-Studie',
          description:
            `Oben <strong>wechselst du die Ansicht</strong> ${ICONS.toggle} zwischen <strong>Mythen</strong> und <strong>Informationswege</strong> — zwei Datensätze aus derselben Studie, je als Balken, Übersicht oder Tabelle.` +
            accordion(
              ICONS.scale,
              'Worum geht es bei den Mythen-Daten?',
              '<ul><li>Zu welchen Anteilen <strong>gekannt</strong>?</li><li>In welchem Ausmaß individuell <strong>bedeutsam</strong>?</li><li>In welchem Grad <strong>richtig beurteilt</strong>?</li><li>Wie weit <strong>präventiv bedeutsam</strong>?</li><li>Mit welchem <strong>Bevölkerungsrisiko</strong>?</li></ul>Nach Zielgruppe zu betrachten.',
            ) +
            accordion(
              ICONS.signpost,
              'Was steckt hinter den Informationswegen?',
              '<ul><li>Wo wird <strong>aktiv gesucht</strong>?</li><li>Wo werden Infos <strong>nebenbei wahrgenommen</strong>?</li><li>In welchem Ausmaß wird diesen Wegen <strong>vertraut</strong>?</li><li>Welche <strong>Präventionspotenziale</strong> ergeben sich?</li></ul>Nach Zielgruppe zu betrachten.',
            ) +
            `<div class="carm-tour-note">Alle Werte stammen aus der CaRM-Befragung.</div>`,
        },
      },
      {
        element: '.carm-toolbar-row',
        popover: {
          title: '2 / 4 · Zielgruppe, Indikator & Filter',
          description:
            `Hier stellst du die Ansicht ein: mit dem <strong>Umschalter</strong> ${ICONS.toggle} wechselst du zwischen Indikatoren und Gruppen, unter <strong>Wert für</strong> ${ICONS.chevronDown} wählst du je nach Ansicht die konkrete Gruppe oder den Indikator, und über <strong>Filter</strong> ${ICONS.filter} und die Suche grenzt du auf bestimmte Mythen ein.` +
            accordion(
              ICONS.lightbulb,
              'Anwendungsbeispiel 1: Welche Mythen beurteilen Erwachsene und Minderjährige häufig falsch?',
              'Du willst wissen, welche Mythen unter Erwachsenen und Minderjährigen besonders oft falsch beurteilt werden?<ol><li>Tippe auf den Reiter „Übersicht".</li><li>Schiebe den Schalter auf „Indikatoren".</li><li>Wähle unter „Wert für" <strong>Richtigkeit</strong>.</li><li>Blende die Spalten für Konsument:innen, Junge Erwachsene und Eltern aus.</li><li>Sortiere – bei den Erwachsenen oder den Minderjährigen, auf- oder absteigend.</li></ol>Nur bestimmte Mythen vergleichen? Wähle sie über den <strong>Filter</strong>-Button.',
            ) +
            accordion(
              ICONS.lightbulb,
              'Anwendungsbeispiel 2: Welche Mythen sind unter Konsumierenden besonders bekannt?',
              '<ol><li>Tippe auf den Reiter „Balken".</li><li>Wähle im ersten Dropdown <strong>Kenntnis</strong>.</li><li>Wähle im zweiten Dropdown <strong>Konsumierende</strong>.</li><li>Sortiere die Balken.</li></ol>',
            ) +
            accordion(
              ICONS.lightbulb,
              'Anwendungsbeispiel 3: Für welche Mythen besteht besonderer Präventionsbedarf bei Minderjährigen?',
              '<ol><li>Tippe auf den Reiter „Übersicht".</li><li>Schiebe den Schalter auf „Indikatoren".</li><li>Wähle unter „Wert für" <strong>Prävention</strong>.</li><li>Blende die Spalten für Erwachsene, Junge Erwachsene und Eltern aus.</li><li>Sortiere die Werte bei den Minderjährigen oder Konsumierenden.</li></ol>',
            ),
        },
      },
      {
        element: '.carm-spannweite__cell--header:not(.carm-spannweite__cell--label)',
        popover: {
          title: '3 / 4 · Sortieren & ausblenden',
          description:
            `Mit dem <strong>Sortier-Symbol</strong> ${ICONS.sort} ordnest du die Mythen nach dieser Spalte. Das ${ICONS.info} öffnet die Definition. Mit dem <strong>Ausblenden-Symbol</strong> ${ICONS.eyeOff} blendest du eine Spalte aus, die dich gerade nicht interessiert.`,
        },
      },
      {
        element: '.carm-spannweite__row',
        popover: {
          title: '4 / 4 · Mythos öffnen',
          description:
            '<strong>Klick auf einen Mythos</strong> öffnet sein vollständiges <strong>Fact-Sheet</strong>.<br>Dieselbe Steuerung gilt für die Informationswege.<br><br>Das war’s – jetzt bist du dran! Erkunde die Daten.',
        },
      },
    ],
  });
  return tour;
}
