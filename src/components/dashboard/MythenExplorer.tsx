import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Share2, Download, Maximize2, Minimize2 } from 'lucide-react';
import type {
  CarmData,
  AppState,
  ViewTab,
  Myth,
  VerdictFilter,
  DashboardDefinitions,
} from '../../lib/dashboard/types';
import { loadData, filterMyths, exportCSV } from '../../lib/dashboard/data';
import { t } from '../../lib/dashboard/translations';
import { urlToState, getDefaultState, pushState } from '../../lib/dashboard/url-state';
import FilterBar from './FilterBar';
import ViewTabs from './ViewTabs';
import VerdictTags from './VerdictTags';
import TableView from './views/TableView';
import BarView from './views/BarView';
import ScatterView from './views/ScatterView';
import LollipopView from './views/LollipopView';
import OverviewView from './views/OverviewView';
import CircularView from './views/CircularView';
import LadderView from './views/LadderView';
import StripsView from './views/StripsView';
import InformationSourcesView from './views/InformationSourcesView';
import InformationSourcesV2View from './views/InformationSourcesV2View';
import FactsheetPanel from './FactsheetPanel';
import type { MythContentEntry } from './FactsheetPanel';

export type { MythContentEntry };

interface Props {
  /** Map of myth ID → factsheet page slug */
  mythSlugs?: Record<number, string>;
  /** JSON-serialised Record<mythId, MythContentEntry> of pre-rendered factsheet HTML */
  mythContent?: string;
  /** JSON-serialised DashboardDefinitions from dashboard-definitionen.json */
  definitions?: string;
}

export default function MythenExplorer({ mythSlugs, mythContent, definitions }: Props) {
  const [data, setData] = useState<CarmData | null>(null);
  const [state, setState] = useState<AppState>(() => {
    const defaults = getDefaultState();
    defaults.lang = 'de';
    const fromUrl = urlToState();
    return { ...defaults, ...fromUrl, lang: 'de' };
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Parse pre-rendered myth content passed as JSON from Astro
  const mythContentMap: Record<number, MythContentEntry> = useMemo(() => {
    if (!mythContent) return {};
    try {
      return JSON.parse(mythContent);
    } catch {
      return {};
    }
  }, [mythContent]);

  // Parse dashboard definitions passed as JSON from Astro
  const defs: DashboardDefinitions | null = useMemo(() => {
    if (!definitions) return null;
    try {
      return JSON.parse(definitions);
    } catch {
      return null;
    }
  }, [definitions]);

  // Build myth slug map from props
  const mythSlugMap = useMemo(() => {
    if (!mythSlugs) return undefined;
    return new Map(Object.entries(mythSlugs).map(([id, slug]) => [Number(id), slug]));
  }, [mythSlugs]);

  useEffect(() => {
    loadData().then(setData);
  }, []);

  useEffect(() => {
    pushState(state);
  }, [state]);

  const update = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const filteredMyths = useMemo(() => {
    if (!data) return [];
    return filterMyths(data.myths, state.categoryIds, state.verdictFilter);
  }, [data, state.categoryIds, state.verdictFilter]);

  const handleShareLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const handleDownloadCSV = useCallback(() => {
    if (!data) return;
    const csv = exportCSV(filteredMyths, data.metrics, state.groupIds, 'de');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cannabis-myths-${state.indicator}.csv`;
    link.click();
  }, [data, filteredMyths, state.groupIds, state.indicator]);

  const handleFullscreen = useCallback(() => {
    if (!isFullscreen && chartRef.current) {
      chartRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const selectMyth = useCallback((id: number | null) => {
    setState((prev) => ({ ...prev, selectedMythId: id }));
  }, []);

  const selectedMyth: Myth | null = useMemo(() => {
    if (!data || !state.selectedMythId) return null;
    return data.myths.find((m) => m.id === state.selectedMythId) || null;
  }, [data, state.selectedMythId]);

  if (!data) {
    return <div className="carm-loading">Daten werden geladen…</div>;
  }

  return (
    <div className="carm-explorer">
      <div className="carm-explorer-header">
        <div className="carm-explorer-header-left">
          <h2 className="carm-explorer-title">{t('app.title', 'de')}</h2>
          <p className="carm-explorer-subtitle">{t('app.subtitle', 'de')}</p>
        </div>
      </div>

      <div className="app-layout">
        <ViewTabs
          view={state.view}
          lang={'de'}
          onChange={(v: ViewTab) => update('view', v)}
        />

        {state.view !== 'sources' && state.view !== 'sources_v2' && (
          <FilterBar state={state} data={data} update={update} definitions={defs} />
        )}

        <div className="utility-bar">
          <div className="utility-buttons">
            <button className="util-btn" onClick={handleShareLink}>
              <Share2 size={13} strokeWidth={2} aria-hidden="true" />
              {copied ? t('util.copied', 'de') : t('util.share', 'de')}
            </button>
            <button className="util-btn" onClick={handleDownloadCSV}>
              <Download size={13} strokeWidth={2} aria-hidden="true" />
              CSV
            </button>
            <button className="util-btn" onClick={handleFullscreen}>
              {isFullscreen
                ? <Minimize2 size={13} strokeWidth={2} aria-hidden="true" />
                : <Maximize2 size={13} strokeWidth={2} aria-hidden="true" />
              }
              {isFullscreen ? t('util.exitFullscreen', 'de') : t('util.fullscreen', 'de')}
            </button>
          </div>
        </div>

        <p className="howto-microcopy">{t(`howto.${state.view}` as any, 'de')}</p>

        <div className={`chart-area${isFullscreen ? ' fullscreen' : ''}`} ref={chartRef}>
          {state.view === 'sources' ? (
            <InformationSourcesView state={state} update={update} definitions={defs} />
          ) : state.view === 'sources_v2' ? (
            <InformationSourcesV2View state={state} update={update} definitions={defs} />
          ) : filteredMyths.length === 0 ? (
            <div className="no-results">{t('misc.noResults', 'de')}</div>
          ) : (
            <>
              {state.view === 'table' && (
                <TableView myths={filteredMyths} metrics={data.metrics} state={state} update={update} onSelectMyth={selectMyth} />
              )}
              {state.view === 'bar' && (
                <BarView myths={filteredMyths} metrics={data.metrics} state={state} onSelectMyth={selectMyth} />
              )}
              {state.view === 'scatter' && (
                <ScatterView myths={filteredMyths} metrics={data.metrics} state={state} update={update} onSelectMyth={selectMyth} />
              )}
              {state.view === 'lollipop' && (
                <LollipopView myths={filteredMyths} metrics={data.metrics} groups={data.groups} state={state} update={update} onSelectMyth={selectMyth} />
              )}
              {state.view === 'overview' && (
                <OverviewView myths={filteredMyths} metrics={data.metrics} state={state} update={update} onSelectMyth={selectMyth} categories={data.categories} />
              )}
              {state.view === 'circular' && (
                <CircularView myths={filteredMyths} metrics={data.metrics} state={state} groups={data.groups} onSelectMyth={selectMyth} />
              )}
              {state.view === 'ladder' && (
                <LadderView myths={filteredMyths} metrics={data.metrics} groups={data.groups} state={state} update={update} onSelectMyth={selectMyth} />
              )}
              {state.view === 'strips' && (
                <StripsView myths={filteredMyths} metrics={data.metrics} groups={data.groups} state={state} update={update} onSelectMyth={selectMyth} />
              )}
            </>
          )}
        </div>

        {state.view !== 'sources' && state.view !== 'sources_v2' && (
          <VerdictTags lang={'de'} verdictFilter={state.verdictFilter} onChange={(f: VerdictFilter) => update('verdictFilter', f)} />
        )}
      </div>

      {selectedMyth && (
        <FactsheetPanel
          myth={selectedMyth}
          mythContentEntry={mythContentMap[selectedMyth.id]}
          factsheetSlug={mythSlugMap?.get(selectedMyth.id)}
          onClose={() => selectMyth(null)}
        />
      )}
    </div>
  );
}
