/**
 * Quiz theme metadata — single source of truth for the /quiz/ index tiles.
 *
 * Each entry maps a quiz module slug to a Lucide icon and a theme key.
 * The theme key drives the per-card CSS (`quiz-select-card--{theme}`)
 * in src/styles/quiz.css, which paints the saturated solid-or-gradient
 * background and the matching CTA text color, per the 2026-05-28 Figma
 * "Design-Preferences" refresh (node 427:2548).
 *
 * Theme keys: green, blue, purple, gradient, indigo, yellow.
 *
 * `count` is the number of myths in the theme's deck — surfaced in
 * the subline copy "{count} Fragen, die deine Perspektive auf
 * Cannabis verändern könnten." on the tile.
 *
 * Adding a new quiz module: add an entry here, then add a static
 * theme in src/components/quiz/quizData.ts and a tile in
 * src/pages/quiz/index.astro (the page picks meta up automatically).
 */

import {
  BriefcaseMedical,
  Brain,
  Meh,
  UsersRound,
  ShieldAlert,
  Dices,
  CircleAlert,
  type LucideIcon,
} from 'lucide-react';

export type QuizThemeKey =
  | 'green'
  | 'blue'
  | 'purple'
  | 'gradient'
  | 'indigo'
  | 'yellow';

export interface QuizThemeMetaEntry {
  /** Lucide icon component, rendered top-left at 56 px white. */
  icon: LucideIcon;
  /** Theme key — maps to `.quiz-select-card--{theme}` in quiz.css. */
  theme: QuizThemeKey;
  /** Number of myths in the deck — surfaced in the subline copy. */
  count: number;
  /** Short display title for the /quiz/ index tile. Overrides the
      descriptive entry.title from the .mdoc so the tile stays
      punchy while quiz pages keep the long descriptive heading. */
  shortTitle: string;
}

export const QUIZ_THEME_META: Record<string, QuizThemeMetaEntry> = {
  'quiz-medizinischer-nutzen': {
    icon: BriefcaseMedical,
    theme: 'blue',
    count: 7,
    shortTitle: 'Medizinischer Nutzen',
  },
  'quiz-risiken-koerper-psyche': {
    icon: Brain,
    theme: 'purple',
    count: 10,
    shortTitle: 'Risiken Körper & Psyche',
  },
  'quiz-stimmung-wahrnehmung': {
    icon: Meh,
    theme: 'yellow',
    count: 6,
    shortTitle: 'Stimmung & Wahrnehmung',
  },
  'quiz-soziales-bevoelkerung': {
    // handoff `quiz-soziales` → UsersRound (people), distinct from the
    // Landmark used for fakten-karten "Gesetz". 2026-05-30 icon sync.
    icon: UsersRound,
    theme: 'indigo',
    count: 10,
    shortTitle: 'Soziales & Bevölkerung',
  },
  'quiz-gefaehrlichkeit': {
    icon: ShieldAlert,
    theme: 'green',
    count: 7,
    shortTitle: 'Gefährlichkeit',
  },
  'quiz-schnellcheck': {
    icon: Dices,
    theme: 'gradient',
    count: 7,
    shortTitle: 'Schnellcheck',
  },
};

/** Lookup with a safe neutral fallback for unrecognised quiz slugs. */
export function getQuizThemeMeta(slug: string): QuizThemeMetaEntry {
  return (
    QUIZ_THEME_META[slug] ?? {
      icon: CircleAlert,
      theme: 'blue',
      count: 7,
      shortTitle: 'Quiz',
    }
  );
}
