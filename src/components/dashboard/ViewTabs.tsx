import type { ViewTab, Lang } from '../../lib/dashboard/types';
import { t } from '../../lib/dashboard/translations';

const TABS: ViewTab[] = ['table', 'bar', 'scatter', 'lollipop', 'overview', 'circular'];

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
