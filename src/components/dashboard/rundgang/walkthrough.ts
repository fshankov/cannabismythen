/**
 * Rundgang walkthrough — the 4-step Driver.js tour started by clicking the
 * dark-green "Rundgang" tab.
 *
 * It runs on the **Spannweite** view (the parent switches there first),
 * because that's the only myth view that visibly shows all the controls
 * the tour points at: the population/indicator picker + filter/search, the
 * per-column sort + eye-off hide buttons, and clickable myth rows.
 *
 * Anchors are stable, currently-rendered class names on the live view —
 * NOT the retired Punktwolke selectors the old tour was pinned to. Step 3
 * anchors the first *data* column header (`…__cell--header:not(…--label)`)
 * so the highlight frames both its sort button (top-left) and eye-off hide
 * button (top-right), not the myth/label column.
 *
 * Plain navigation: Weiter / Zurück through steps 1–4, then a centered
 * "Geschafft!" outro. Step numbers are written into the titles ("n / 4")
 * with `showProgress: false`, so the outro reads as a closing card rather
 * than a 5th step. Reuses the `.carm-tour-popover` styling in dashboard.css.
 */
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';

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
    doneBtnText: 'Erkunden',
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
            'Hier wählst du die <strong>Zielgruppe</strong> und den <strong>Indikator</strong>. Das <strong>ⓘ</strong> öffnet die Definition. Über <strong>Filter</strong> und <strong>Suche</strong> grenzt du auf bestimmte Mythen ein.',
        },
      },
      {
        element: '.carm-spannweite__cell--header:not(.carm-spannweite__cell--label)',
        popover: {
          title: '3 / 4 · Sortieren & ausblenden',
          description:
            'Mit dem <strong>Sortier-Symbol</strong> (oben links) ordnest du die Mythen nach dieser Spalte. Mit dem <strong>Ausblenden-Symbol</strong> (oben rechts) blendest du eine Spalte aus, die dich gerade nicht interessiert.',
        },
      },
      {
        element: '.carm-spannweite__row',
        popover: {
          title: '4 / 4 · Mythos öffnen',
          description:
            '<strong>Klick auf einen Mythos</strong> öffnet sein vollständiges <strong>Fact-Sheet</strong> mit Quellen. Dieselbe Steuerung gilt rechts für die Informationsquellen.',
        },
      },
      {
        // No `element` → Driver centers this outro card on screen.
        popover: {
          title: 'Geschafft!',
          description: 'Das war’s – jetzt bist du dran! Erkunde die Daten.',
        },
      },
    ],
  });
  return tour;
}
