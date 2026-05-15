/**
 * CategoryFooter — small "icon + category name" label rendered at the
 * bottom of each FaktenCard and inside each Kategorien-dropdown row.
 *
 * Reads from the single CATEGORY_META map so the visual language on the
 * card and in the filter dropdown stays in lockstep. Color (xxx-700)
 * matches the same hue family as the card's left-edge stripe (xxx-500)
 * so the two signals feel like one design.
 */

import { getCategoryMeta } from "../../lib/fakten-karten/categories";

interface Props {
  categoryGroup: string;
  /** Optional override for the size of the Lucide icon (px). */
  iconSize?: number;
  /** Optional extra className appended to the wrapper. */
  className?: string;
}

export default function CategoryFooter({
  categoryGroup,
  iconSize = 13,
  className,
}: Props) {
  const meta = getCategoryMeta(categoryGroup);
  const Icon = meta.icon;
  const classes = ["fakten-card-cat", className].filter(Boolean).join(" ");
  return (
    <span
      className={classes}
      style={{ color: meta.label }}
      aria-label={`Kategorie: ${categoryGroup}`}
    >
      <Icon size={iconSize} strokeWidth={2} aria-hidden="true" />
      <span className="fakten-card-cat__name">{categoryGroup}</span>
    </span>
  );
}
