import type { ViewTab, Lang } from '../../lib/dashboard/types';
import { t, type TranslationKey } from '../../lib/dashboard/translations';
import TabsBar, { type TabDef } from '../shared/TabsBar';

// Public tab order — split into LEFT (myth views) and RIGHT (source
// views) groups per the 2026-05-28 designer brief (Figma node 403:1976).
// The two groups carry different inactive backgrounds (#eeeee9 vs.
// #f2f2f2) and are separated visually by flex-1 spacers in
// MythenExplorer's `.carm-explorer__tab-bar` row.
const TABS_LEFT: ViewTab[] = ['balken', 'spannweite', 'table'];
const TABS_RIGHT: ViewTab[] = ['sources', 'sources2', 'sources_table'];
const TABS: ViewTab[] = [...TABS_LEFT, ...TABS_RIGHT];

/** "Tabelle" and "Quellen-Tabelle" carry a fixed 163 px width per the
 *  brief — the other tabs size to content. The modifier is applied
 *  through the TabsBar primitive's per-tab `className` slot. */
const TAB_FIXED_WIDTH: Partial<Record<ViewTab, true>> = {
  table: true,
  sources_table: true,
};

const TAB_LABEL_KEY: Record<ViewTab, TranslationKey | null> = {
  balken: 'view.balken',
  spannweite: 'view.spannweite',
  table: 'view.tabelle',
  sources: 'view.quellen',
  sources2: 'view.quellen2',
  sources_table: 'view.quellen-tabelle',
  // Retired views — never shown in the tab bar; keys present so the type
  // remains exhaustive and url-state redirects don't crash on lookup.
  strips: null,
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
  /** Which slice to render. Defaults to all tabs (back-compat). The
   *  designer brief (2026-05-28, Figma node 403:1976) splits the tab
   *  bar into LEFT myth views + RIGHT source views with flex-1
   *  spacers between them; pass `group="left"` / `group="right"`
   *  twice from `MythenExplorer` to get the split. */
  group?: 'left' | 'right' | 'all';
  /** Kept for back-compat with any caller still passing the prop. The
   *  Rundgang trigger now lives inside the toolbar as the green
   *  teardrop badge — see `.carm-rundgang-badge` in MythenExplorer.tsx. */
  onRundgang?: () => void;
}

export default function ViewTabs({ view, lang, onChange, group = 'all' }: Props) {
  // Pick the slice for this render: LEFT (myth views), RIGHT (source
  // views), or both (back-compat).
  const slice =
    group === 'left' ? TABS_LEFT :
    group === 'right' ? TABS_RIGHT :
    TABS;

  const tabDefs: TabDef<ViewTab>[] = slice.map((tab) => {
    const key = TAB_LABEL_KEY[tab];
    return {
      key: tab,
      label: key ? t(key, lang) : tab,
      className: TAB_FIXED_WIDTH[tab] ? 'carm-explorer__tab-btn--fixed' : undefined,
    };
  });

  return (
    <TabsBar<ViewTab>
      tabs={tabDefs}
      activeKey={view}
      onChange={onChange}
      ariaLabel={group === 'right' ? 'Quellen-Ansicht wählen' : 'Mythos-Ansicht wählen'}
    />
  );
}
