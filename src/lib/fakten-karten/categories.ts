/**
 * Fakten-Karten category metadata — single source of truth.
 *
 * Maps each `categoryGroup` string (as stored on the myth .mdoc files
 * and on the runtime MythEntry) to:
 *   - slug:   lowercase ASCII identifier (reserved for a future
 *             "shareable category URL" feature; not used by the UI today).
 *   - icon:   the Lucide-React component to render in card footers
 *             and dropdown rows.
 *   - strip:  saturated color (Tailwind xxx-500). Used for the 6-px
 *             left-edge stripe on each card — small enough that
 *             saturated colors read well at a glance.
 *   - label:  darker shade (Tailwind xxx-700). Used for the small
 *             icon + category-name label at the bottom of each card
 *             and in the Kategorien dropdown rows, where smaller
 *             elements need higher contrast.
 *
 * Both colors stay in the same hue family per category so the two
 * signals (stripe + footer) feel like one design.
 *
 * Adding a new category: add a new entry here. FaktenCard.tsx and
 * FaktenFilterBar.tsx pick it up automatically.
 */

import {
  BriefcaseMedical,
  HeartPulse,
  Brain,
  Meh,
  Users,
  Scale,
  Landmark,
  CircleAlert,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryMetaEntry {
  /** ASCII slug — reserved for future per-category URL routes. */
  slug: string;
  /** Lucide icon component for the card footer + dropdown row. */
  icon: LucideIcon;
  /** Saturated Tailwind xxx-500 hex for the 6-px left-edge stripe. */
  strip: string;
  /** Darker Tailwind xxx-700 hex for the small icon + name label. */
  label: string;
}

export const CATEGORY_META: Record<string, CategoryMetaEntry> = {
  'Medizinischer und therapeutischer Nutzen': {
    slug: 'medizin',
    icon: BriefcaseMedical,
    strip: '#3b82f6', // Blue-500
    label: '#1d4ed8', // Blue-700
  },
  'Risiken für den Körper und die Entwicklung': {
    slug: 'koerper',
    icon: HeartPulse,
    strip: '#06b6d4', // Cyan-500
    label: '#0e7490', // Cyan-700
  },
  'Risiken für die psychische Gesundheit': {
    slug: 'psyche',
    icon: Brain,
    strip: '#8b5cf6', // Violet-500
    label: '#6d28d9', // Violet-700
  },
  'Einfluss auf Stimmung und Wahrnehmung': {
    slug: 'stimmung',
    icon: Meh,
    strip: '#eab308', // Yellow-500
    label: '#a16207', // Yellow-700
  },
  'Soziale Auswirkungen und Leistungsfähigkeit': {
    slug: 'sozial',
    icon: Users,
    strip: '#ec4899', // Pink-500
    label: '#be185d', // Pink-700
  },
  'Risiken durch Dosierung und Qualität': {
    slug: 'dosis',
    icon: Scale,
    strip: '#64748b', // Slate-500
    label: '#334155', // Slate-700
  },
  'Verbreitung in der Bevölkerung und Gesetzgebung': {
    slug: 'gesetz',
    icon: Landmark,
    strip: '#6366f1', // Indigo-500
    label: '#4338ca', // Indigo-700
  },
  'Allgemeine Einschätzung der Gefährlichkeit': {
    slug: 'gefahr',
    icon: CircleAlert,
    strip: '#f97316', // Orange-500
    label: '#c2410c', // Orange-700
  },
};

/** Lookup with a safe neutral fallback for unrecognised categories. */
export function getCategoryMeta(categoryGroup: string): CategoryMetaEntry {
  return (
    CATEGORY_META[categoryGroup] ?? {
      slug: 'sonstige',
      icon: CircleAlert,
      strip: '#94a3b8', // Slate-400 — neutral fallback
      label: '#475569', // Slate-600
    }
  );
}
