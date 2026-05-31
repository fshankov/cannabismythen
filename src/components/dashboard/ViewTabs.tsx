import type { ViewTab, Lang } from '../../lib/dashboard/types';
import { t, type TranslationKey } from '../../lib/dashboard/translations';
import TabsBar, { type TabDef } from '../shared/TabsBar';
import { ChartBarIcon, Grid3x3Icon, Table2Icon } from '../../lib/icons/viewTypeIcons';

// Public tab order — split into LEFT (myth views) and RIGHT (source
// views) groups. Each group is preceded by a permanent "Mythen" /
// "Quellen" label (rendered in MythenExplorer), so the tabs themselves
// only need the view type. (The Rundgang is not a tab — it's the yellow
// "?" bookmark rendered directly in MythenExplorer's tab bar.)
const TABS_LEFT: ViewTab[] = ['balken', 'spannweite', 'table'];
const TABS_RIGHT: ViewTab[] = ['sources', 'sources2', 'sources_table'];
const TABS: ViewTab[] = [...TABS_LEFT, ...TABS_RIGHT];

// Leading view-type glyph per data view (2026-05-30, Fedor). The same
// three view types appear in both groups, so Balken/Übersicht/Tabelle
// each map to one icon, mirrored across the Mythen (left) and Quellen
// (right) groups. Colour is set per group in the render body below.
const VIEW_ICON: Partial<Record<ViewTab, typeof ChartBarIcon>> = {
  balken: ChartBarIcon,
  spannweite: Grid3x3Icon,
  table: Table2Icon,
  sources: ChartBarIcon,
  sources2: Grid3x3Icon,
  sources_table: Table2Icon,
};
// Always-on wayfinding accent for the leading icon: emerald = Mythen
// views, blue = Quellen views (Fedor 2026-05-30). Emerald reuses the
// site's `--classification-richtig` brand green.
const MYTHEN_ICON_COLOR = '#047857';
const QUELLEN_ICON_COLOR = '#3b82f6';

// Short, group-relative visible labels — the permanent "Mythen"/"Quellen"
// group label supplies the context, so each tab shows only its view type
// (and collapses to just its icon on narrow screens). The full name
// ("Mythen-Balken" …) is kept as the button's aria-label.
const SHORT_LABEL: Partial<Record<ViewTab, string>> = {
  balken: 'Balken',
  spannweite: 'Übersicht',
  table: 'Tabelle',
  sources: 'Balken',
  sources2: 'Übersicht',
  sources_table: 'Tabelle',
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
  /** Which slice to render. Defaults to all tabs (back-compat). Pass
   *  `group="left"` / `group="right"` twice from `MythenExplorer` to get
   *  the Mythen / Quellen split. */
  group?: 'left' | 'right' | 'all';
}

export default function ViewTabs({ view, lang, onChange, group = 'all' }: Props) {
  // Pick the slice for this render: LEFT (myth views), RIGHT (source
  // views), or all (back-compat).
  const slice =
    group === 'left' ? TABS_LEFT :
    group === 'right' ? TABS_RIGHT :
    TABS;

  const tabDefs: TabDef<ViewTab>[] = slice.map((tab) => {
    const key = TAB_LABEL_KEY[tab];
    const fullLabel = key ? t(key, lang) : tab;
    const ViewIcon = VIEW_ICON[tab];
    const iconColor = TABS_LEFT.includes(tab) ? MYTHEN_ICON_COLOR : QUELLEN_ICON_COLOR;
    return {
      key: tab,
      label: SHORT_LABEL[tab] ?? fullLabel,
      // Keep the full, unambiguous name for assistive tech (the visible
      // short label leans on the adjacent group label for context).
      ariaLabel: fullLabel,
      icon: ViewIcon ? (
        <ViewIcon size={15} aria-hidden="true" style={{ color: iconColor }} />
      ) : undefined,
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
