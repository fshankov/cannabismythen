import type { CSSProperties } from 'react';

interface Props {
  className?: string;
  /** When set, the glyph is exposed to assistive tech with this label;
   *  otherwise it's decorative (aria-hidden). */
  title?: string;
  style?: CSSProperties;
}

/**
 * Rundgang bookmark glyph — a tab-topped ribbon: the TOP two corners are
 * rounded with the same 8 px radius as the Daten-Explorer's data tabs, and
 * the BOTTOM is a V-notch "bookmark" tail. Yellow fill, black "?".
 *
 * Used in two places so they read as the same object:
 *   1. the dashboard's far-upper-right Rundgang affordance (fused into the
 *      panel's flat top-right corner), and
 *   2. inline in the Daten-Explorer intro paragraph ("Der Rundgang 🔖 …").
 *
 * viewBox is 40×52: body y=0..40, notch apex at y=40, tails at y=52.
 */
export default function RundgangBookmark({ className, title, style }: Props) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 40 52"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 0 H32 A8 8 0 0 1 40 8 V52 L20 40 L0 52 V8 A8 8 0 0 1 8 0 Z"
        fill="#facc15"
      />
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="23"
        fontWeight="800"
        fill="#1a1a2e"
        fontFamily="'Inter Variable', 'Inter', system-ui, sans-serif"
      >
        ?
      </text>
    </svg>
  );
}
