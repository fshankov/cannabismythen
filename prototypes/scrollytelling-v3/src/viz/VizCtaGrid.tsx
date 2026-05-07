interface Cta {
  title: string;
  desc: string;
  href: string;
  glyph: string;
}

const CTAS: Cta[] = [
  {
    title: '42 Faktenkarten',
    desc: 'Wissenschaftliche Klassifikation, Quellen und Erklärungen je Mythos.',
    href: '/fakten-karten/',
    glyph: '◉',
  },
  {
    title: 'Selbsttest',
    desc: 'Wie steht dein Wissen im Vergleich zur Bevölkerungsbefragung?',
    href: '/quiz/',
    glyph: '✓',
  },
  {
    title: 'Daten-Dashboards',
    desc: 'Vier Sichten: allg. Publikum · Eltern · Fachkräfte · Forschung.',
    href: '/daten-explorer/',
    glyph: '⬢',
  },
  {
    title: 'Häufige Fragen',
    desc: 'Sortiert nach Themen und Zielgruppen.',
    href: '/haeufige-fragen/',
    glyph: '?',
  },
];

export function VizCtaGrid() {
  return (
    <div className="viz">
      <div className="viz-cta">
        {CTAS.map((c) => (
          <a key={c.href} className="viz-cta__card" href={c.href}>
            <span className="viz-cta__card-title">
              <span aria-hidden="true">{c.glyph}</span>
              {c.title}
            </span>
            <span className="viz-cta__card-desc">{c.desc}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
