import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  CarmData,
  AppState,
  ViewTab,
  Myth,
  VerdictFilter,
} from '../../lib/dashboard/types';
import { loadData, filterMyths, exportCSV } from '../../lib/dashboard/data';
import { t } from '../../lib/dashboard/translations';
import { urlToState, getDefaultState, pushState } from '../../lib/dashboard/url-state';
import Sidebar from './Sidebar';
import ViewTabs from './ViewTabs';
import VerdictTags from './VerdictTags';
import TableView from './views/TableView';
import BarView from './views/BarView';
import ScatterView from './views/ScatterView';
import LollipopView from './views/LollipopView';
import OverviewView from './views/OverviewView';
import CircularView from './views/CircularView';
import FactsheetPanel from './FactsheetPanel';
import type { MythContentEntry } from './FactsheetPanel';

export type { MythContentEntry };

interface Props {
  /** Map of myth ID → factsheet page slug */
  mythSlugs?: Record<number, string>;
  /** JSON-serialised Record<mythId, MythContentEntry> of pre-rendered factsheet HTML */
  mythContent?: string;
}

export default function MythenExplorer({ mythSlugs, mythContent }: Props) {
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
        <section className="chart-column">
          <ViewTabs
            view={state.view}
            lang={'de'}
            onChange={(v: ViewTab) => update('view', v)}
          />

          <div className="utility-bar">
            <div className="utility-buttons">
              <button className="util-btn" onClick={handleShareLink}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {copied ? t('util.copied', 'de') : t('util.share', 'de')}
              </button>
              <button className="util-btn" onClick={handleDownloadCSV}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                CSV
              </button>
              <button className="util-btn" onClick={handleFullscreen}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                {isFullscreen ? t('util.exitFullscreen', 'de') : t('util.fullscreen', 'de')}
              </button>
            </div>
          </div>

          <p className="howto-microcopy">{t(`howto.${state.view}` as any, 'de')}</p>

          <div className={`chart-area${isFullscreen ? ' fullscreen' : ''}`} ref={chartRef}>
            {filteredMyths.length === 0 ? (
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
              </>
            )}
          </div>

          <VerdictTags lang={'de'} verdictFilter={state.verdictFilter} onChange={(f: VerdictFilter) => update('verdictFilter', f)} />
        </section>

        <Sidebar state={state} data={data} update={update} />
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
