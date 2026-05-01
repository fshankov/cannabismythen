import { MapPin } from 'lucide-react';
import type { ViewTab, Lang } from '../../lib/dashboard/types';
import { t, type TranslationKey } from '../../lib/dashboard/translations';

// Public tab order — Balken / Streifen / Tabelle ╎ Informationsquellen.
// The visual divider before `sources` signals the IA shift from
// "visualisation type" to "content type". Old views (bar/scatter/lollipop/
// overview/circular/ladder) stay registered in MythenExplorer so legacy
// share-links keep resolving; url-state.ts redirects retired ones to balken.
const TABS: ViewTab[] = ['balken', 'strips', 'table', 'sources'];

const TAB_LABEL_KEY: Record<ViewTab, TranslationKey | null> = {
  balken: 'view.balken',
  strips: 'view.streifen',
  table: 'view.tabelle',
  sources: 'view.quellen',
  // Retired views — never shown in the tab bar; keys present so the type
  // remains exhaustive and url-state redirects don't crash on lookup.
  bar: null,
  scatter: null,
  lollipop: null,
  overview: null,
  circular: null,
  ladder: null,
};

interface Props {
  view: ViewTab;
  lang: Lang;
  onChange: (v: ViewTab) => void;
  /** Click handler for the Rundgang chip on the right of the tabs row.
   *  Stage 1 of the Daten-Explorer refactor moved the Rundgang trigger
   *  out of the floating <Fab> and the StickyToolbar's end slot into
   *  here so all tab-level affordances live in one row. */
  onRundgang?: () => void;
}

export default function ViewTabs({ view, lang, onChange, onRundgang }: Props) {
  return (
    <nav className="tabs-bar" role="tablist" aria-label="Visualization type">
      {TABS.map((tab) => {
        const key = TAB_LABEL_KEY[tab];
        const label = key ? t(key, lang) : tab;
        const isLast = tab === 'sources';
        return (
          <button
            key={tab}
            className={`tab-btn ${view === tab ? 'active' : ''}${isLast ? ' tab-btn--after-divider' : ''}`}
            role="tab"
            aria-selected={view === tab}
            onClick={() => onChange(tab)}
          >
            {label}
          </button>
        );
      })}
      {onRundgang && (
        <button
          type="button"
          className="tabs-bar__rundgang"
          onClick={onRundgang}
          aria-label={t('rundgang.label', lang)}
        >
          <MapPin size={14} strokeWidth={2} aria-hidden="true" />
          <span className="tabs-bar__rundgang-label">
            {t('rundgang.label', lang)}
          </span>
        </button>
      )}
    </nav>
  );
}
