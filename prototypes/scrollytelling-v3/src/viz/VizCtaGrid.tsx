import { BarChart3, Brain, ListChecks, ScrollText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Cta {
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
}

const CTAS: Cta[] = [
  {
    title: '42 Faktenkarten',
    desc: 'Wissenschaftliche Klassifikation, Quellen und Erklärungen je Mythos.',
    href: '/fakten-karten/',
    icon: ScrollText,
  },
  {
    title: 'Quiz',
    desc: 'Wie steht dein Wissen im Vergleich zur Bevölkerungsbefragung?',
    href: '/quiz/',
    icon: Brain,
  },
  {
    title: 'Daten-Explorer',
    desc: 'Vier Sichten: allg. Publikum · Eltern · Fachkräfte · Forschung.',
    href: '/daten-explorer/',
    icon: BarChart3,
  },
  {
    title: 'Meine Interessen',
    desc: 'FAQ, sortiert nach Themen und Zielgruppen.',
    href: '/meine-interessen/',
    icon: ListChecks,
  },
];

export function VizCtaGrid() {
  return (
    <div className="viz">
      <div className="viz-cta">
        {CTAS.map((c, i) => {
          const Icon = c.icon;
          return (
            <a
              key={c.href}
              className="viz-cta__card"
              href={c.href}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="viz-cta__card-icon" aria-hidden="true">
                <Icon size={56} strokeWidth={1.5} />
              </span>
              <span className="viz-cta__card-title">{c.title}</span>
              <span className="viz-cta__card-desc">{c.desc}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
