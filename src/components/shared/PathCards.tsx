/**
 * PathCards — the four "next step" cards (Quiz · Fakten-Karten ·
 * Daten-Explorer · Meine Interessen), ported to React from the homepage
 * FourPathsBlock so the SAME card chrome + mini-previews can be used inside
 * the React scrollytelling island (Step 10 of /projekt/).
 *
 * Styling is shared: this renders the exact `.path-card` / `.quiz-preview`
 * / `.fakten-preview` / `.daten-preview` / `.meine-preview` class names from
 * `src/styles/home-four-paths.css` (imported by the page), so editing that
 * stylesheet updates both surfaces. The homepage's Astro markup is slated to
 * migrate onto this component in a separate, reviewed pass (Fedor 2026-06-08).
 *
 * Differences vs the homepage Astro version (intentional, low-risk):
 *  - the Fakten preview myths are derived client-side from the carm-data the
 *    scrollytelling already loads, instead of being threaded as props.
 */
import { useEffect, useRef } from 'react';
import type { CarmData, CorrectnessClass } from '../scrollytelling/types';
import { getVerdictVisual } from '../../lib/fakten-karten/verdict-colors';
import { AUDIENCE_ICONS_BY_FAQ_ID } from '../../lib/icons/lookups';
import type { FaqAudienceId } from '../../lib/icons/lookups';
import { withBase } from '../../lib/withBase';

interface Tile {
  mod: 'quiz' | 'fakten' | 'daten' | 'meine';
  title: string;
  description: string;
  url: string;
}

// Content mirrors src/content/four-paths.yaml (the homepage source). When the
// homepage migrates onto this component, these become props off that singleton.
// Order matters: the 2×2 column-classes are 1,2,1,2 and the scroll-reveal staggers
// by array index, so this order IS the landing/nav reading order
// (42 Mythen · Quiz / Meine Interessen · Daten-Explorer).
const TILES: Tile[] = [
  { mod: 'fakten', title: 'Fakten-Karten', description: 'Alle 42 Mythen auf Karten zum Umdrehen: vorn der Mythos, hinten die wissenschaftliche Einordnung.', url: withBase('fakten-karten/') },
  { mod: 'quiz', title: 'Quiz', description: '6 Quiz, thematisch sortiert — teste dein Wissen in wenigen Minuten.', url: withBase('quiz/') },
  { mod: 'meine', title: 'Meine Interessen', description: 'Fragen und Fakten, aufbereitet für 5 Zielgruppen: Eltern, Jugendliche, Konsumierende, Lehrkräfte und Fachkräfte.', url: withBase('meine-interessen/eltern/') },
  { mod: 'daten', title: 'Daten-Explorer', description: 'Wer glaubt was? Welche Informationswege werden genutzt? — bis zu 5 Indikatoren für 5 Zielgruppen im Vergleich.', url: withBase('daten-explorer/') },
];

// Per-topic icons (Lucide 24×24 path data, drawn in currentColor → white badge).
const ICONS: Record<string, string> = {
  quiz: `<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/>`,
  fakten: `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>`,
  daten: `<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/>`,
  meine: `<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>`,
};

// Quiz preview: four verdict answer-buttons (no labels). Verbatim SVGs.
const QUIZ_OPTIONS: { value: string; svg: string }[] = [
  { value: 'richtig', svg: `<svg width="30" height="22" viewBox="0 0 30 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M28.2041 1.39285L1.3916 1.39286" stroke="#A7D3C5" stroke-width="2.78333" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.7979 20.1604L14.7978 1.39168" stroke="#047857" stroke-width="2.78333" stroke-linecap="round" stroke-linejoin="round"/><path d="M24.1826 10.7776L14.7982 1.39324L5.41386 10.7776" stroke="#047857" stroke-width="2.78333" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
  { value: 'eher_falsch', svg: `<svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32.2303 13.271L13.271 32.2303" stroke="#E0B58D" stroke-width="2.78333" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.47932 9.47998L22.7508 22.7515" stroke="#B45309" stroke-width="2.78333" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.7508 9.47803V22.7495H9.47929" stroke="#B45309" stroke-width="2.78333" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
  { value: 'eher_richtig', svg: `<svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32.2303 20.351L13.271 1.39168" stroke="#C2D3A3" stroke-width="2.78333" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.47932 24.142L22.7508 10.8705" stroke="#4D7C0F" stroke-width="2.78333" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.7508 24.144V10.8724H9.47929" stroke="#4D7C0F" stroke-width="2.78333" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
  { value: 'falsch', svg: `<svg width="26" height="22" viewBox="0 0 26 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.2666 18.8793C0.567207 18.8798 0 19.4464 0 20.1459C0 20.8454 0.567207 21.4121 1.2666 21.4125L24.2705 21.4125C24.9703 21.4125 25.5371 20.8457 25.5371 20.1459C25.5371 19.4462 24.9703 18.8793 24.2705 18.8793L1.2666 18.8793Z" fill="#E9A8B9"/><path d="M12.771 1.26703L12.771 19.3997" stroke="#BE123C" stroke-width="2.53404" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.8223 10.3315L12.771 19.3978L4.71974 10.3315" stroke="#BE123C" stroke-width="2.53404" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
];

// Fakten preview: inlined direction arrows per verdict (strokes draw beyond
// their viewBox, so they're inlined rather than <img> to allow overflow).
const FAKTEN_ARROWS: Record<string, { viewBox: string; inner: string }> = {
  richtig: { viewBox: '0 0 181 186', inner: `<path d="M164.999 15.531L-55 15.531" stroke="currentColor" stroke-opacity="0.44" stroke-width="31.0587" stroke-linecap="round" stroke-linejoin="round"/><path d="M54.9953 169.529L54.9953 15.5297" stroke="currentColor" stroke-width="31.0587" stroke-linecap="round" stroke-linejoin="round"/><path d="M131.999 92.529L54.9996 15.5293L-22.0001 92.529" stroke="currentColor" stroke-width="31.0587" stroke-linecap="round" stroke-linejoin="round"/>` },
  eher_falsch: { viewBox: '0 0 188 280', inner: `<path d="M15.9356 264.456L171.498 108.893" stroke="currentColor" stroke-opacity="0.44" stroke-width="31.0587" stroke-linecap="round" stroke-linejoin="round"/><path d="M-15.1731 77.7784L93.7209 186.672" stroke="currentColor" stroke-width="31.0587" stroke-linecap="round" stroke-linejoin="round"/><path d="M-15.1759 186.676H93.7181V77.7816" stroke="currentColor" stroke-width="31.0587" stroke-linecap="round" stroke-linejoin="round"/>` },
  eher_richtig: { viewBox: '0 0 190 280', inner: `<path d="M17.9356 15.5294L173.498 171.092" stroke="currentColor" stroke-opacity="0.44" stroke-width="31.0587" stroke-linecap="round" stroke-linejoin="round"/><path d="M-13.1731 202.207L95.7209 93.3129" stroke="currentColor" stroke-width="31.0587" stroke-linecap="round" stroke-linejoin="round"/><path d="M-13.1759 93.3096H95.7181V202.204" stroke="currentColor" stroke-width="31.0587" stroke-linecap="round" stroke-linejoin="round"/>` },
  falsch: { viewBox: '0 0 181 186', inner: `<path d="M164.999 169.527L-55 169.527" stroke="currentColor" stroke-opacity="0.44" stroke-width="31.0587" stroke-linecap="round" stroke-linejoin="round"/><path d="M54.9953 15.5293L54.9953 169.529" stroke="currentColor" stroke-width="31.0587" stroke-linecap="round" stroke-linejoin="round"/><path d="M131.999 92.5293L54.9996 169.529L-22.0001 92.5293" stroke="currentColor" stroke-width="31.0587" stroke-linecap="round" stroke-linejoin="round"/>` },
};

// Daten preview: Balken bars with idle + hover values — matches FourPathsBlock.astro.
const DATEN_BARS = [
  { accent: '#047857', idle: 42, hover: 57 },
  { accent: '#b45309', idle: 28, hover: 28 },
  { accent: '#047857', idle: 31, hover: 14 },
  { accent: '#4d7c0f', idle: 49, hover: 64 },
];

const FAKTEN_SPECTRUM: CorrectnessClass[] = ['falsch', 'eher_falsch', 'eher_richtig', 'richtig'];

interface Props {
  /** carm-data myths — used to derive one short representative myth per
   *  verdict for the Fakten-Karten preview spectrum. */
  myths: CarmData['myths'];
  /** How many cards (0–4) are currently visible. Drives scroll-driven
   *  staggered reveal on the /projekt/ scrollytelling (Step 10). Default
   *  4 = all cards shown (homepage usage). */
  revealedCards?: number;
}

export function PathCards({ myths, revealedCards = 4 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Daten-Explorer bar tween — mirrors FourPathsBlock.astro's inline script.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const preview = container.querySelector<HTMLElement>('.daten-preview');
    if (!preview) return;
    const card = preview.closest<HTMLElement>('.path-card') ?? preview;
    interface DBar { wash: HTMLElement | null; circle: HTMLElement | null; idle: number; hover: number; cur: number; }
    const bars: DBar[] = Array.from(preview.querySelectorAll<HTMLElement>('.daten-bar')).map(bar => ({
      wash: bar.querySelector<HTMLElement>('.daten-bar__wash'),
      circle: bar.querySelector<HTMLElement>('.daten-bar__circle'),
      idle: Number(bar.dataset.idle),
      hover: Number(bar.dataset.hover),
      cur: Number(bar.dataset.idle),
    }));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const apply = (b: DBar, v: number) => {
      if (b.wash) b.wash.style.width = v + '%';
      if (b.circle) { b.circle.style.left = v + '%'; b.circle.textContent = String(Math.round(v)); }
    };
    const tween = (toHover: boolean) => {
      cancelAnimationFrame(raf);
      const starts = bars.map(b => b.cur);
      const targets = bars.map(b => toHover ? b.hover : b.idle);
      if (reduce) { bars.forEach((b, i) => { b.cur = targets[i]; apply(b, b.cur); }); return; }
      const t0 = performance.now();
      const step = (now: number) => {
        const e = ease(Math.min((now - t0) / 480, 1));
        bars.forEach((b, i) => { b.cur = lerp(starts[i], targets[i], e); apply(b, b.cur); });
        if (e < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const onEnter = () => tween(true);
    const onLeave = () => tween(false);
    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mouseleave', onLeave);
    return () => { cancelAnimationFrame(raf); card.removeEventListener('mouseenter', onEnter); card.removeEventListener('mouseleave', onLeave); };
  }, []);

  const faktenCards = FAKTEN_SPECTRUM.map((v) => {
    const pool = myths.filter((m) => m.correctness_class === v);
    if (pool.length === 0) return null;
    const shortest = pool
      .slice()
      .sort((a, b) => (a.text_short_de ?? a.text_de).length - (b.text_short_de ?? b.text_de).length)[0];
    return {
      verdict: v,
      text: shortest.text_short_de ?? shortest.text_de,
      gradient: getVerdictVisual(v).gradient,
      arrow: FAKTEN_ARROWS[v],
    };
  }).filter((x): x is { verdict: CorrectnessClass; text: string; gradient: string; arrow: { viewBox: string; inner: string } } => x !== null);

  const audiences = Object.keys(AUDIENCE_ICONS_BY_FAQ_ID) as FaqAudienceId[];

  return (
    <div className="path-cards" ref={containerRef}>
      {TILES.map((c, i) => (
        <a
          key={c.mod}
          className={`path-card path-card--${c.mod}`}
          href={c.url}
          style={{
            opacity: i < revealedCards ? 1 : 0,
            transform: i < revealedCards ? 'translateY(0)' : 'translateY(14px)',
            transition: `opacity 480ms ease ${i * 110}ms, transform 480ms cubic-bezier(0.22,1,0.36,1) ${i * 110}ms`,
            pointerEvents: i < revealedCards ? undefined : 'none',
          }}
        >
          <span className="path-card__go" aria-hidden="true">
            <span className="path-card__go-label">Anzeigen</span>
            <svg className="path-card__go-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
          </span>
          <span className="path-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="17.5" height="17.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ICONS[c.mod] }} />
          </span>
          <h3 className="path-card__title">{c.title}</h3>
          <p className="path-card__body">{c.description}</p>

          {c.mod === 'quiz' && (
            <div className="quiz-preview" aria-hidden="true">
              {QUIZ_OPTIONS.map((o) => (
                <span key={o.value} className={`quiz-preview__btn quiz-preview__btn--${o.value}`} dangerouslySetInnerHTML={{ __html: o.svg }} />
              ))}
            </div>
          )}

          {c.mod === 'fakten' && (
            <div className="fakten-preview" aria-hidden="true">
              {faktenCards.map((fc) => (
                <span key={fc.verdict} className={`fk-mini fk-mini--${fc.verdict}`} style={{ backgroundImage: fc.gradient }}>
                  <span className="fk-mini__statement">{fc.text}</span>
                  <svg className="fk-mini__arrow" viewBox={fc.arrow.viewBox} fill="none" preserveAspectRatio="xMidYMid meet" dangerouslySetInnerHTML={{ __html: fc.arrow.inner }} />
                </span>
              ))}
            </div>
          )}

          {c.mod === 'daten' && (
            <div className="daten-preview" aria-hidden="true">
              <div className="daten-chart">
                <div className="daten-chart__axis">
                  <span className="daten-chart__tick" data-pos="0"></span>
                  <span className="daten-chart__tick" data-pos="25"></span>
                  <span className="daten-chart__tick" data-pos="50"></span>
                  <span className="daten-chart__tick" data-pos="75"></span>
                  <span className="daten-chart__tick" data-pos="100"></span>
                </div>
                {DATEN_BARS.map((b, i) => (
                  <div key={i} className="daten-bar" data-idle={b.idle} data-hover={b.hover}>
                    <span className="daten-bar__wash" style={{ width: `${b.idle}%`, background: b.accent }} />
                    <span className="daten-bar__circle" style={{ left: `${b.idle}%`, background: b.accent }}>{b.idle}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {c.mod === 'meine' && (
            <div className="meine-preview" aria-hidden="true">
              {audiences.map((id) => {
                const Icon = AUDIENCE_ICONS_BY_FAQ_ID[id];
                return (
                  <span key={id} className="audience-dot">
                    {Icon && <Icon />}
                  </span>
                );
              })}
            </div>
          )}
        </a>
      ))}
    </div>
  );
}

export default PathCards;
