/**
 * Rundgang walkthrough — the hybrid, 4-step Driver.js tour launched from
 * the RundgangPanel's "Geführten Rundgang starten" button.
 *
 * It runs on the **Spannweite** view (the parent switches there first),
 * because that's the only myth view that visibly shows all the controls
 * the tour points at: the population/indicator picker, per-column sort +
 * hide buttons, and clickable myth rows.
 *
 * Anchors are stable, currently-rendered class names on the live view —
 * NOT the retired Punktwolke selectors the old tour was pinned to. That
 * staleness is exactly why the previous onboarding broke after the tab
 * reorg, so we deliberately target classes that exist on Spannweite.
 *
 * "Hybrid" = mostly guided popovers, but steps 2 and 3 are "try it"
 * steps: the parent watches `state` and calls `tour.moveNext()` when the
 * user performs the action (picks a group / sorts a column). "Weiter"
 * always works too, so the tour never traps anyone.
 *
 * Step numbering is manual ("n / 4") with `showProgress: false`, so the
 * final centered "Geschafft!" card reads as an outro rather than a 5th
 * step. Reuses the `.carm-tour-popover` styling kept in dashboard.css.
 */
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export interface WalkthroughCallbacks {
  /** Fired on each step highlight with its 0-based index. The parent
   *  snapshots `state` here to detect the "try it" actions (step 1 =
   *  pick group/indicator, step 2 = sort a column). */
  onHighlighted?: (index: number) => void;
  /** Fired once when the tour ends — via the X, Escape, or the final
   *  "Erkunden" button. Used to persist the first-visit flag + clear the
   *  parent's tour ref. */
  onDestroy?: () => void;
}

export function buildWalkthrough({ onHighlighted, onDestroy }: WalkthroughCallbacks): Driver {
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
    onHighlighted: (_element, _step, opts) => {
      onHighlighted?.(opts?.state?.activeIndex ?? tour.getActiveIndex() ?? 0);
    },
    // Driver fires onDestroyStarted on X / Escape / finishing the last
    // step; we must call destroy() ourselves or the popover lingers.
    onDestroyStarted: () => {
      onDestroy?.();
      tour.destroy();
    },
    steps: [
      {
        element: '.carm-explorer__tab-bar',
        popover: {
          title: '1 / 4 · Zwei Sichten, eine Studie',
          description:
            'Oben wechselst du die Sicht: links die <strong>Mythen</strong> (Balken, Spannweite, Tabelle), rechts die <strong>Informationsquellen</strong>. Alle Werte stammen aus der CaRM-Befragung.',
        },
      },
      {
        element: '.carm-toolbar-row',
        popover: {
          title: '2 / 4 · Zielgruppe & Indikator',
          description:
            'Hier wählst du die <strong>Zielgruppe</strong> und den <strong>Indikator</strong> (z. B. Kenntnis). Das <strong>ⓘ</strong> öffnet die Definition mit Skala und Stichprobe.<br><em>Probier’s: wähle eine Gruppe.</em>',
        },
      },
      {
        element: '.carm-spannweite__col-sort-btn',
        popover: {
          title: '3 / 4 · Sortieren, ausblenden, filtern',
          description:
            'Mit dem <strong>Sortier-Symbol</strong> ordnest du nach einer Spalte, mit <strong>Ausblenden</strong> versteckst du Spalten. Über <strong>Filter</strong> und <strong>Suche</strong> grenzt du auf bestimmte Mythen ein.<br><em>Probier’s: sortiere eine Spalte.</em>',
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
