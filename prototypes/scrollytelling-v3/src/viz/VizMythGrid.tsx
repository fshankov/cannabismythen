import type { CarmData } from '../data/types';
import { sortedMyths } from '../data/carmData';

interface Props {
  data: CarmData;
}

function themeColorFor(catId: number | null): string {
  if (catId === null) return 'var(--bg-elev)';
  const idx = ((catId - 1) % 9) + 1;
  return `var(--theme-${idx})`;
}

export function VizMythGrid({ data }: Props) {
  const myths = sortedMyths(data).slice(0, 42);

  // Build a list of unique categories that appear, in order of first appearance.
  const seenCats = new Set<number>();
  const orderedCats: { id: number; name: string }[] = [];
  for (const m of myths) {
    if (m.category_id !== null && !seenCats.has(m.category_id)) {
      seenCats.add(m.category_id);
      const cat = data.categories.find((c) => c.id === m.category_id);
      orderedCats.push({
        id: m.category_id,
        name: cat?.name_de ?? `Kategorie ${m.category_id}`,
      });
    }
  }

  return (
    <div className="viz">
      <div className="viz-grid" role="img" aria-label="42 Cannabis-Mythen, sortiert nach Themenfeld">
        {myths.map((m) => (
          <div
            key={m.id}
            className="viz-grid__cell viz-grid__cell--themed"
            style={{ backgroundColor: themeColorFor(m.category_id) }}
            title={m.text_de}
          >
            {m.text_short_de}
          </div>
        ))}
      </div>
      <div className="viz-grid__theme-legend" aria-label="Themenfelder">
        <span className="viz-grid__theme-legend-title">Themenfelder:</span>
        {orderedCats.map((c) => (
          <span key={c.id} className="viz-grid__theme-chip">
            <span
              className="viz-grid__theme-swatch"
              style={{ background: themeColorFor(c.id) }}
              aria-hidden="true"
            />
            {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}
