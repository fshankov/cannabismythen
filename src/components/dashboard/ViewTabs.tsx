import type { ViewTab, Lang } from '../../lib/dashboard/types';
import { t } from '../../lib/dashboard/translations';

// Tab order: Lollipop / Indikatoren / Gruppen / Tabelle / Quellen / Quellen V2.
// Bar/Scatter/Übersicht/Circular/Indikator-Leiter were removed from the public
// nav per UX feedback. The view components stay registered in MythenExplorer so
// existing share-links (?view=bar etc.) keep resolving — only the tab buttons
// are gone, not the views themselves.
const TABS: ViewTab[] = ['lollipop', 'strips', 'strips_groups', 'table', 'sources', 'sources_v2'];

interface Props {
  view: ViewTab;
  lang: Lang;
  onChange: (v: ViewTab) => void;
}

export default function ViewTabs({ view, lang, onChange }: Props) {
  return (
    <nav className="tabs-bar" role="tablist" aria-label="Visualization type">
      {TABS.map((tab) => (
        <button
          key={tab}
          className={`tab-btn ${view === tab ? 'active' : ''}`}
          role="tab"
          aria-selected={view === tab}
          onClick={() => onChange(tab)}
        >
          {t(`view.${tab}` as any, lang)}
        </button>
      ))}
    </nav>
  );
}
