import type { ViewTab, Lang } from '../../lib/dashboard/types';
import { t, type TranslationKey } from '../../lib/dashboard/translations';
import TabsBar, { type TabDef } from '../shared/TabsBar';

// Public tab order — Balken / Spannweite / Tabelle ╎ Informationsquellen /
// Informationsquellen 2 / Quellen-Tabelle.
// (`balken2` was retired 2026-05-21; `strips`/Punktwolke retired 2026-05-23
// in travel-pipeline Stage 3A — url-state.ts redirects legacy `?view=strips`
// and `?view=balken2` URLs to balken. `sources_table` added 2026-05-23 in
// Stage 3C — a Tabelle for source data mirroring the LEFT myth Tabelle.)
const TABS: ViewTab[] = ['balken', 'spannweite', 'table', 'sources', 'sources2', 'sources_table'];

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
  /** Kept for back-compat with any caller still passing the prop. The
   *  Rundgang trigger now lives inside `<ToolbarRow>`'s actions slot as
   *  a green circular badge (see `.carm-rundgang-badge` in
   *  `MythenExplorer.tsx`'s `sharedActions`), so this prop is intentionally
   *  unused. Safe to remove from callers once they've been updated. */
  onRundgang?: () => void;
}

export default function ViewTabs({ view, lang, onChange }: Props) {
  // Build the localised tab list once per render. The underlying chrome
  // (`<TabsBar>` from `src/components/shared/TabsBar.tsx`) is shared with
  // the popup viz tabs so any future styling tweak to `.tabs-bar` /
  // `.tab-btn` propagates automatically across both surfaces.
  const tabDefs: TabDef<ViewTab>[] = TABS.map((tab) => {
    const key = TAB_LABEL_KEY[tab];
    return { key: tab, label: key ? t(key, lang) : tab };
  });

  return (
    <TabsBar<ViewTab>
      tabs={tabDefs}
      activeKey={view}
      onChange={onChange}
      ariaLabel="Visualization type"
      // Insert the 24 px gap before the first source-side tab so the
      // myth / source grouping stays visually distinct (matches the
      // pre-extraction `tab-btn--after-divider` behaviour).
      dividerBeforeKey="sources"
    />
  );
}
