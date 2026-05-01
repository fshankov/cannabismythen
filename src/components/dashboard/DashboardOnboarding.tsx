/**
 * DashboardOnboarding — first-visit guidance for the Streifen view.
 *
 * Layered design (research-backed):
 *   1. A centered modal overlay appears once on first load of view=strips
 *      AND any time the persistent "Rundgang" pill is pressed. Card floats
 *      above the dashboard with a dim backdrop — never pushes content down.
 *      Mobile (<= 640 px) flips to a bottom-sheet that slides up.
 *   2. From the modal the user picks: 4-step Driver.js tour, mini-map, or
 *      dismiss + self-explore.
 *   3. The "Rundgang" pill is portalled into the .tabs-bar flex row so it
 *      sits inline with the visualization tabs.
 *
 * A11y: role=dialog + aria-modal, Escape closes, click-on-backdrop closes,
 * focus moves to the close button on open and returns to the trigger on
 * close, body scroll is locked while open.
 *
 * Persistence: dismissal is stored in localStorage["carm-onboarding-strips-v1"].
 * Bumping the suffix (-v2, -v3) re-triggers the welcome card after major UI
 * changes so we can re-onboard returning users when the dashboard evolves.
 *
 * German only for now. EN strings can be added via lib/dashboard/translations.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, PlayCircle, X } from 'lucide-react';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const STORAGE_KEY = 'carm-onboarding-strips-v1';

type Mode = 'closed' | 'welcome' | 'minimap';

export interface DashboardOnboardingHandle {
  /** Open the welcome card. Used by the always-visible Rundgang button in
   *  the tabs row, regardless of the currently active view. */
  open: () => void;
}

interface Props {
  /** Only render the onboarding affordances when the Streifen view is active. */
  active: boolean;
  /** Bumping this counter opens the welcome card. The parent owns the
   *  trigger (so the Rundgang button in the tabs row can live on every
   *  tab) and just needs to increment to invoke us. */
  openTrigger?: number;
}

/**
 * Tour stops are anchored to existing class names in the dashboard so we
 * don't need to inject extra DOM. If a future refactor renames any of
 * these, update both here AND in the StripsView component.
 */
const TOUR_SELECTORS = {
  tabs: '.tabs-bar',
  pivotRows: '.strips-row-wrap',
  chart: '.strips-svg-v3',
  catPills: '.strips-cat-pills',
  utilityBar: '.utility-bar--bottom',
} as const;

function safeQuery(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

export default function DashboardOnboarding({ active, openTrigger }: Props) {
  const [mode, setMode] = useState<Mode>('closed');
  const [hasSeen, setHasSeen] = useState<boolean>(true); // start true to avoid SSR flash
  /** Modal a11y refs — restore focus to the trigger on close, and focus
   *  the close button on open. */
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const isOpen = mode === 'welcome' || mode === 'minimap';

  // Read localStorage on mount — only client-side, since Astro hydrates this
  // island after first paint.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY) === 'dismissed';
      setHasSeen(seen);
      if (!seen && active) setMode('welcome');
    } catch {
      // localStorage may be disabled (private mode); treat as already-seen
      setHasSeen(true);
    }
  }, [active]);

  // The persistent "Rundgang" affordance now lives directly in <ViewTabs>
  // (always rendered, not portalled) so the previous tabs-bar lookup is
  // unnecessary. Parent calls open() via the openTrigger prop.

  const persistDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'dismissed');
    } catch {
      /* ignore — incognito etc. */
    }
    setHasSeen(true);
  }, []);

  const close = useCallback(() => {
    setMode('closed');
    persistDismiss();
  }, [persistDismiss]);

  // Parent triggers the welcome card by bumping `openTrigger`. Skip the
  // initial mount value (no auto-open until the user clicks Rundgang).
  const lastTrigger = useRef<number | undefined>(openTrigger);
  useEffect(() => {
    if (openTrigger === undefined) return;
    if (lastTrigger.current === openTrigger) return;
    lastTrigger.current = openTrigger;
    setMode('welcome');
  }, [openTrigger]);

  // ---- Modal lifecycle: Esc, body scroll lock, focus management. ----
  // When the overlay opens we (a) lock body scroll so the page underneath
  // can't move, (b) listen for Escape to dismiss, (c) move focus into the
  // dialog (close button) for keyboard + screen-reader users, and (d) on
  // close, return focus to whatever element triggered the open. All four
  // are bundled in one effect so cleanup is symmetric.
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    previouslyFocusedRef.current =
      (document.activeElement as HTMLElement | null) ?? null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener('keydown', onKey);

    // Body scroll lock — preserve any existing inline overflow so we can
    // restore it (avoids fighting other libs that touch document.body).
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('carm-modal-open');

    // Focus the close button after the next paint so the modal has been
    // mounted and is reachable by the screen reader.
    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 30);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('carm-modal-open');
      window.clearTimeout(focusTimer);
      const prev = previouslyFocusedRef.current;
      if (prev && prev.isConnected && typeof prev.focus === 'function') {
        prev.focus();
      }
      previouslyFocusedRef.current = null;
    };
  }, [isOpen, close]);

  /** Built lazily so we don't pay the Driver.js init cost unless the tour runs. */
  const buildTour = useCallback((): Driver => {
    const tour = driver({
      showProgress: true,
      allowClose: true,
      smoothScroll: true,
      // Let users still scroll & click through the dashboard during the tour
      // — we're guiding, not gatekeeping.
      stagePadding: 6,
      stageRadius: 8,
      nextBtnText: 'Weiter →',
      prevBtnText: '← Zurück',
      doneBtnText: 'Fertig',
      progressText: 'Schritt {{current}} von {{total}}',
      popoverClass: 'carm-tour-popover',
      // Driver.js fires onDestroyStarted whenever the user clicks the X,
      // presses Escape, or finishes the last step. We must call destroy()
      // ourselves — otherwise the popover stays on screen.
      onDestroyStarted: () => {
        persistDismiss();
        tour.destroy();
      },
      steps: [
        {
          element: TOUR_SELECTORS.tabs,
          popover: {
            title: '1 / 4 — Visualisierungen wechseln',
            description:
              'Hier oben wählen Sie zwischen sechs Sichten auf dieselben Daten — Lollipop, Indikatoren, Gruppen, Tabelle und zwei Quellen-Sichten. Aktiv ist gerade <strong>Indikatoren</strong>: fünf vertikale Streifen.',
          },
        },
        {
          element: TOUR_SELECTORS.pivotRows,
          popover: {
            title: '2 / 4 — Drei Filter-Reihen',
            description:
              '<strong>Themen</strong> (Quiz-Bereiche), <strong>Gruppen</strong> (Bevölkerungssegmente) und <strong>Indikatoren</strong> (Messgrößen). Eine Reihe ist die Pivot-Achse — sie bestimmt, was die fünf Streifen darstellen. Klicken Sie eine Kachel, um zu filtern. Mit dem ⓘ neben dem Label öffnen Sie die Definition.',
          },
        },
        {
          element: TOUR_SELECTORS.chart,
          popover: {
            title: '3 / 4 — 42 Mythen, fünf Streifen',
            description:
              'Jeder <strong>Punkt</strong> ist ein Mythos. Die <strong>Farbe</strong> zeigt die wissenschaftliche Einordnung (richtig → falsch). Die <strong>Höhe</strong> ist der Wert auf einer 0–100-Skala. Tippen Sie auf einen Punkt für eine Zusammenfassung — danach „Mehr" für den vollen Faktencheck mit Quellen.',
          },
        },
        {
          element: TOUR_SELECTORS.catPills,
          popover: {
            title: '4 / 4 — Nach Themengebiet filtern',
            description:
              'Diese Pills filtern auf eine der sieben Mythen-Kategorien — Medizin, Risiken, Stimmung, Dosierung, Verbreitung, Gefährlichkeit. Direkt darunter finden Sie <em>Teilen / CSV / Vollbild</em>. Der gefilterte Stand ist im URL hinterlegt — Link kopieren reicht zum Teilen.',
          },
        },
      ],
    });
    return tour;
  }, [persistDismiss]);

  const startTour = useCallback(() => {
    // Defer to next tick so the welcome card can unmount cleanly first.
    setMode('closed');
    requestAnimationFrame(() => {
      // Wait for at least the first selector before driving.
      const ready = safeQuery(TOUR_SELECTORS.tabs);
      const d = buildTour();
      if (ready) d.drive();
      else {
        // Selectors not in DOM yet — retry once after a short delay.
        setTimeout(() => d.drive(), 150);
      }
      persistDismiss();
    });
  }, [buildTour, persistDismiss]);

  // Mini-map tracks: where things live on this screen, in plain words.
  const miniMap = useMemo(
    () => [
      {
        title: 'Oben — sechs Visualisierungs-Tabs',
        body:
          'Lollipop, Indikatoren (aktiv), Gruppen, Tabelle, Informationsquellen und Quellen V2 — alle stellen dieselben Daten anders dar. „Rundgang" rechts in der Tab-Leiste öffnet diese Hilfe wieder.',
      },
      {
        title: 'Über dem Diagramm — drei Filter-Reihen',
        body:
          'Themen (5 Quiz-Bereiche), Gruppen (5 Bevölkerungssegmente), Indikatoren (5 Messgrößen). Eine Reihe ist Pivot, die anderen filtern.',
      },
      {
        title: 'Im Diagramm — 5 vertikale Streifen',
        body:
          '42 Punkte = 42 Mythen. Farbe = Einordnung (richtig / eher richtig / eher falsch / falsch). Höhe = Wert 0–100. Hover zeigt eine Verbindungslinie durch alle Streifen.',
      },
      {
        title: 'Unter dem Diagramm — Kategorien-Pills',
        body:
          'Filter auf eine der sieben Mythen-Kategorien (Medizin, Risiken, Stimmung, Dosierung, Verbreitung, Gefährlichkeit, Allgemeine Einschätzung).',
      },
      {
        title: 'Ganz unten — Teilen / CSV / Vollbild',
        body:
          'Die gefilterte Sicht steckt im URL — Link kopieren teilt sie 1:1. CSV exportiert die aktuell sichtbaren Werte. Vollbild für Beamer / Präsentation.',
      },
      {
        title: 'Die kleinen ⓘ-Symbole',
        body:
          'Jedes ⓘ neben einer Kachel oder einem Strip-Header öffnet die wissenschaftliche Definition mit Skala und Stichprobengröße.',
      },
    ],
    [],
  );

  // The welcome modal is reachable from any tab via the always-visible
  // Rundgang button (`openTrigger`). The Driver.js tour itself only makes
  // sense on the Streifen view (its selectors anchor there), so we still
  // gate `active` for first-load auto-open. When triggered from another
  // tab, the parent should switch to Streifen first; the modal is
  // tab-agnostic and renders regardless.
  if (!active && mode === 'closed') return null;

  return (
    <>
      {/* Centered modal overlay — portalled to <body> so it floats above
          the dashboard regardless of stacking context. Backdrop click +
          Esc both close. Click events inside the card are stopped from
          bubbling so the backdrop handler doesn't see them. */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="carm-onboarding-overlay"
          onClick={close}
          role="presentation"
        >
          <div
            className={[
              'carm-onboarding-card',
              'carm-onboarding-card--overlay',
              mode === 'minimap' ? 'carm-onboarding-card--minimap' : '',
            ].filter(Boolean).join(' ')}
            role="dialog"
            aria-modal="true"
            aria-labelledby={
              mode === 'welcome' ? 'carm-onboarding-title' : 'carm-minimap-title'
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeBtnRef}
              type="button"
              className="carm-onboarding-close"
              aria-label="Schließen"
              onClick={close}
            >
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </button>

            <div className="carm-onboarding-body">
              {mode === 'welcome' ? (
                <>
                  <p className="carm-onboarding-eyebrow">
                    {hasSeen ? 'Rundgang' : 'Willkommen'}
                  </p>
                  <h3
                    id="carm-onboarding-title"
                    className="carm-onboarding-title"
                  >
                    42 Mythen — wissenschaftlich eingeordnet, interaktiv erkundbar
                  </h3>
                  <p className="carm-onboarding-lede">
                    Diese Seite zeigt, wie verbreitet, wichtig und richtig 42
                    Cannabis-Aussagen in der Bevölkerung sind. Sie können nach
                    Themengebiet filtern, einzelne Mythen ansehen und die Sicht
                    teilen. Wählen Sie, wie Sie starten möchten:
                  </p>

                  <div className="carm-onboarding-actions">
                    <button
                      type="button"
                      className="carm-onboarding-action carm-onboarding-action--primary"
                      onClick={startTour}
                    >
                      <PlayCircle size={18} strokeWidth={2} aria-hidden="true" />
                      <span>
                        <strong>Kurze Tour starten</strong>
                        <small>4 Stationen · ≈ 30 Sek.</small>
                      </span>
                    </button>

                    <button
                      type="button"
                      className="carm-onboarding-action"
                      onClick={() => setMode('minimap')}
                    >
                      <MapPin size={18} strokeWidth={2} aria-hidden="true" />
                      <span>
                        <strong>Wo finde ich was?</strong>
                        <small>Übersicht aller Bereiche</small>
                      </span>
                    </button>

                    <button
                      type="button"
                      className="carm-onboarding-action carm-onboarding-action--ghost"
                      onClick={close}
                    >
                      <span>
                        <strong>Selbst erkunden</strong>
                        <small>„Rundgang" bleibt oben verfügbar</small>
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="carm-onboarding-eyebrow">Mini-Karte</p>
                  <h3
                    id="carm-minimap-title"
                    className="carm-onboarding-title"
                  >
                    Wo finde ich was auf dieser Seite?
                  </h3>

                  <ol className="carm-onboarding-minimap">
                    {miniMap.map((item) => (
                      <li key={item.title}>
                        <strong>{item.title}</strong>
                        <span>{item.body}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="carm-onboarding-actions carm-onboarding-actions--inline">
                    <button
                      type="button"
                      className="carm-onboarding-action carm-onboarding-action--primary"
                      onClick={startTour}
                    >
                      <PlayCircle size={16} strokeWidth={2} aria-hidden="true" />
                      <span>Lieber doch eine geführte Tour</span>
                    </button>
                    <button
                      type="button"
                      className="carm-onboarding-action carm-onboarding-action--ghost"
                      onClick={close}
                    >
                      <span>Schließen</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
