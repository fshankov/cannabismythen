/**
 * Quiz theme metadata — single source of truth for the /quiz/ index tiles.
 *
 * Mirrors the shape of `src/lib/fakten-karten/categories.ts` so the two
 * products share a visual vocabulary (Lucide icon + xxx-500 stripe +
 * xxx-700 label) and a single user reading "blue = medical" carries
 * across both pages.
 *
 * Where a quiz theme maps 1:1 to a Fakten-Karten category the hue is
 * inherited (Medizin=Blue, Stimmung=Yellow, Gefahr=Orange). For the
 * two combined themes the dominant source hue is used (Risiken
 * Körper+Psyche → Psyche-Violet; Soziales+Bevölkerung → Gesetz-Indigo).
 * Schnellcheck is the cross-thematic wildcard; its stripe is a
 * gradient rendered in CSS (see `.quiz-select-card--featured` rule in
 * `src/styles/quiz.css`), so the `strip` value here is only a
 * fallback used if the gradient rule is overridden.
 *
 * Reserved hues (no-fly zone): emerald, lime, amber, rose — these are
 * the verdict-signaling colors used inside the quiz cards themselves.
 *
 * `count` is the number of myths in the theme's deck and drives the
 * `data-deck` ladder (≤6→1, 7–9→2, ≥10→3) used by the deck
 * pseudo-elements behind each tile.
 *
 * Adding a new quiz module: add an entry here, then add a static
 * theme in `src/components/quiz/quizData.ts` and a tile in
 * `src/pages/quiz/index.astro` (the page picks meta up automatically
 * from this map).
 */

import {
  BriefcaseMedical,
  Brain,
  Meh,
  Landmark,
  ShieldAlert,
  Dices,
  CircleAlert,
  type LucideIcon,
} from 'lucide-react';

export interface QuizThemeMetaEntry {
  /** Lucide icon component, rendered centered at ~44 px. */
  icon: LucideIcon;
  /** Saturated Tailwind xxx-500 hex for the top band. */
  strip: string;
  /** Darker Tailwind xxx-700 hex for the icon tint. */
  label: string;
  /** Number of myths in the deck — drives `data-deck` thickness. */
  count: number;
  /** Featured (wildcard) tile gets the dashed border + Mix chip. */
  featured?: boolean;
}

export const QUIZ_THEME_META: Record<string, QuizThemeMetaEntry> = {
  'quiz-medizinischer-nutzen': {
    icon: BriefcaseMedical,
    strip: '#3b82f6', // Blue-500
    label: '#1d4ed8', // Blue-700
    count: 7,
  },
  'quiz-risiken-koerper-psyche': {
    icon: Brain,
    strip: '#8b5cf6', // Violet-500
    label: '#6d28d9', // Violet-700
    count: 10,
  },
  'quiz-stimmung-wahrnehmung': {
    icon: Meh,
    strip: '#eab308', // Yellow-500
    label: '#a16207', // Yellow-700
    count: 6,
  },
  'quiz-soziales-bevoelkerung': {
    icon: Landmark,
    strip: '#6366f1', // Indigo-500
    label: '#4338ca', // Indigo-700
    count: 10,
  },
  'quiz-gefaehrlichkeit': {
    icon: ShieldAlert,
    strip: '#f97316', // Orange-500
    label: '#c2410c', // Orange-700
    count: 7,
  },
  'quiz-schnellcheck': {
    icon: Dices,
    // Fallback only — the featured rule in quiz.css paints a
    // 5-stop gradient across the band.
    strip: '#64748b', // Slate-500
    label: '#334155', // Slate-700
    count: 7,
    featured: true,
  },
};

/** Lookup with a safe neutral fallback for unrecognised quiz slugs. */
export function getQuizThemeMeta(slug: string): QuizThemeMetaEntry {
  return (
    QUIZ_THEME_META[slug] ?? {
      icon: CircleAlert,
      strip: '#94a3b8', // Slate-400 — neutral fallback
      label: '#475569', // Slate-600
      count: 7,
    }
  );
}
