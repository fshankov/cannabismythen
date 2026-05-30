import { Compass } from 'lucide-react';
import type { ViewTab, Lang } from '../../lib/dashboard/types';
import { t, type TranslationKey } from '../../lib/dashboard/translations';
import TabsBar, { type TabDef } from '../shared/TabsBar';
import { ChartBarIcon, Grid3x3Icon, Table2Icon } from '../../lib/icons/viewTypeIcons';

// Public tab order — split into LEFT (myth views) and RIGHT (source
// views) groups per the 2026-05-28 designer brief (Figma node 403:1976).
// The two groups carry different inactive backgrounds (#eeeee9 vs.
// #f2f2f2) and are separated visually by flex-1 spacers in
// MythenExplorer's `.carm-explorer__tab-bar` row.
const TABS_LEFT: ViewTab[] = ['balken', 'spannweite', 'table'];
const TABS_RIGHT: ViewTab[] = ['sources', 'sources2', 'sources_table'];
// The Rundgang is a single, set-apart tab at the far right. It isn't a
// data view — selecting it renders the intro/overview panel.
const TABS_RUNDGANG: ViewTab[] = ['rundgang'];
const TABS: ViewTab[] = [...TABS_LEFT, ...TABS_RIGHT, ...TABS_RUNDGANG];

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
  rundgang: 'rundgang.label',
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
   *  twice from `MythenExplorer` to get the split. `group="rundgang"`
   *  renders the single far-right Rundgang tab. */
  group?: 'left' | 'right' | 'rundgang' | 'all';
  /** First-visit attention nudge — only meaningful for
   *  `group="rundgang"`. Adds the `.is-nudge` modifier (a small pulsing
   *  dot) to draw the eye to the Rundgang tab until the user opens it. */
  nudge?: boolean;
}

export default function ViewTabs({ view, lang, onChange, group = 'all', nudge = false }: Props) {
  // Pick the slice for this render: LEFT (myth views), RIGHT (source
  // views), the single Rundgang tab, or all (back-compat).
  const slice =
    group === 'left' ? TABS_LEFT :
    group === 'right' ? TABS_RIGHT :
    group === 'rundgang' ? TABS_RUNDGANG :
    TABS;

  const tabDefs: TabDef<ViewTab>[] = slice.map((tab) => {
    const key = TAB_LABEL_KEY[tab];
    const isRundgang = tab === 'rundgang';
    const ViewIcon = VIEW_ICON[tab];
    const iconColor = TABS_LEFT.includes(tab) ? MYTHEN_ICON_COLOR : QUELLEN_ICON_COLOR;
    return {
      key: tab,
      label: key ? t(key, lang) : tab,
      icon: isRundgang ? (
        <Compass size={15} strokeWidth={2} aria-hidden="true" />
      ) : ViewIcon ? (
        <ViewIcon size={15} aria-hidden="true" style={{ color: iconColor }} />
      ) : undefined,
      className: [
        TAB_FIXED_WIDTH[tab] ? 'carm-explorer__tab-btn--fixed' : '',
        isRundgang ? 'carm-explorer__tab-btn--rundgang' : '',
        isRundgang && nudge ? 'is-nudge' : '',
      ].filter(Boolean).join(' ') || undefined,
    };
  });

  return (
    <TabsBar<ViewTab>
      tabs={tabDefs}
      activeKey={view}
      onChange={onChange}
      ariaLabel={
        group === 'rundgang' ? 'Rundgang' :
        group === 'right' ? 'Quellen-Ansicht wählen' :
        'Mythos-Ansicht wählen'
      }
    />
  );
}
