import type { CarmData } from './types';
import { PathCards } from '../shared/PathCards';

/**
 * Step 10 viz — the four "next step" cards (Quiz · Fakten-Karten ·
 * Daten-Explorer · Meine Interessen). Now rendered via the shared
 * <PathCards> component (ported from the homepage FourPaths) so the
 * scrollytelling and the homepage share one card implementation + the same
 * stylesheet (home-four-paths.css, imported by the /projekt/ page). The
 * homepage's Astro markup migrates onto <PathCards> in a separate reviewed
 * pass. (Fedor review 2026-06-08 #4.)
 */
export function VizCtaGrid({ data }: { data: CarmData }) {
  return (
    <div className="viz">
      <PathCards myths={data.myths} />
    </div>
  );
}
