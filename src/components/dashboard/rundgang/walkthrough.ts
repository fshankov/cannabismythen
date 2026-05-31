/**
 * Rundgang walkthrough — the 4-step Driver.js tour started by clicking the
 * yellow "?" help circle in the tab bar.
 *
 * It runs on the **Spannweite** view (the parent switches there first),
 * because that's the only myth view that visibly shows all the controls
 * the tour points at: the pivot toggle + "Wert für" picker + filter/search,
 * the per-column sort + eye-off hide buttons, and clickable myth rows.
 *
 * Anchors are stable, currently-rendered class names on the live view —
 * NOT the retired Punktwolke selectors the old tour was pinned to. Step 3
 * anchors the first *data* column header (`…__cell--header:not(…--label)`)
 * so the highlight frames both its sort button (top-left) and eye-off hide
 * button (top-right), not the myth/label column.
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
} as const;

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
            'Oben wechselst du die Sicht: links die <strong>Mythen</strong> (Balken, Spannweite, Tabelle), rechts die <strong>Informationsquellen</strong> – zwei Datensätze aus derselben Studie.<br><br><strong>Mythen:</strong> wie bekannt und wichtig die 42 Aussagen sind und wie richtig die Zielgruppen sie beurteilen.<br><strong>Informationsquellen:</strong> welche Wege die Zielgruppen nutzen, welchen sie vertrauen und worüber sie Gesundheitsinfos wahrnehmen.<br><br>Alle Werte stammen aus der CaRM-Befragung.',
        },
      },
      {
        element: '.carm-toolbar-row',
        popover: {
          title: '2 / 4 · Zielgruppe, Indikator & Filter',
          description:
            `Hier stellst du die Sicht ein: mit dem <strong>Umschalter</strong> ${ICONS.toggle} wechselst du zwischen Indikatoren und Gruppen, und unter <strong>Wert für</strong> ${ICONS.chevronDown} wählst du den konkreten Wert. Über <strong>Filter</strong> ${ICONS.filter} und die Suche grenzt du auf bestimmte Mythen ein.`,
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
            '<strong>Klick auf einen Mythos</strong> öffnet sein vollständiges <strong>Fact-Sheet</strong>.<br>Dieselbe Steuerung gilt rechts für die Informationsquellen.<br><br>Das war’s – jetzt bist du dran! Erkunde die Daten.',
        },
      },
    ],
  });
  return tour;
}
