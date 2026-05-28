/**
 * CategoryFooter — "icon + category name" label.
 *
 * Two tones:
 *   - "default": category-colored icon + text (CATEGORY_META.label).
 *     Used inside the Kategorien filter dropdown.
 *   - "on-color": white icon + text. Used at the bottom of the
 *     verdict-colored card front, where category color would clash
 *     with the gradient background.
 */

import { getCategoryMeta } from "../../lib/fakten-karten/categories";

interface Props {
  categoryGroup: string;
  /** Lucide icon pixel size. Defaults: 13 for "default", 24 for "on-color". */
  iconSize?: number;
  className?: string;
  tone?: "default" | "on-color";
}

export default function CategoryFooter({
  categoryGroup,
  iconSize,
  className,
  tone = "default",
}: Props) {
  const meta = getCategoryMeta(categoryGroup);
  const Icon = meta.icon;
  const effectiveIconSize = iconSize ?? (tone === "on-color" ? 24 : 13);
  const classes = [
    "fakten-card-cat",
    tone === "on-color" ? "fakten-card-cat--on-color" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span
      className={classes}
      style={tone === "on-color" ? undefined : { color: meta.label }}
      aria-label={`Kategorie: ${categoryGroup}`}
    >
      <Icon size={effectiveIconSize} strokeWidth={2} aria-hidden="true" />
      <span className="fakten-card-cat__name">{categoryGroup}</span>
    </span>
  );
}
