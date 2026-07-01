/**
 * VerdictStatement — the "title carries the verdict" pattern (v3).
 *
 * Renders a myth statement in bold + the verdict color, with a trailing
 * <VerdictArrow> glued to the last word so a line break never orphans
 * the arrow on its own line.
 *
 * Used on:
 *   - FaktenCard front face
 *   - Daten-Explorer myth-card list (MythenExplorer)
 *   - Factsheet detail page H1 (/daten-explorer/[slug].astro)
 *
 * NOT used in the quiz answer-reveal — the quiz keeps the statement
 * neutral until the user clicks so the color doesn't telegraph the
 * answer. After the reveal, two <VerdictPill> chips render "Ihre
 * Antwort" + "Wissenschaftlich" instead.
 *
 * Server-rendered React component — usable from both `.tsx` and
 * `.astro` files (Astro SSRs it without a client directive).
 */

import type { CorrectnessClass } from "../../lib/dashboard/types";
import VerdictArrow from "./VerdictArrow";

interface VerdictStatementProps {
  /** The myth statement text. Rendered as-is (German content). */
  statement: string;
  verdict: CorrectnessClass;
  /** HTML tag for the wrapper. `p` for body, `h1` / `h2` for headings. */
  as?: "p" | "h1" | "h2" | "h3" | "span";
  /** Pixel size of the trailing arrow. Defaults to ~0.82em (set via CSS). */
  arrowSize?: number;
  /** Extra class names appended to the wrapper. */
  className?: string;
}

/**
 * Splits a statement into a "head" + "tail" pair so the trailing arrow
 * can be glued to the last word with `white-space: nowrap` (preventing
 * the arrow from landing on its own line when the title wraps).
 *
 * Trailing terminal punctuation (. ? !) is stripped — the arrow IS the
 * sentence terminator on this site (Fedor 2026-05-13). Authors writing
 * "Cannabis macht abhängig." get the same visual as if they had written
 * "Cannabis macht abhängig".
 *
 * Example: "Cannabis kann zur Sucht führen."
 *   → head: "Cannabis kann zur Sucht", tail: "führen"
 *
 * Edge case: a single-word statement (no space) becomes head: "",
 * tail: <the whole word>. The component renders that as the tail only.
 */
function splitForTail(text: string): { head: string; tail: string } {
  // Strip trailing whitespace and terminal punctuation (.!?).
  const stripped = text.replace(/[\s.!?]+$/u, "");
  const lastSpace = stripped.lastIndexOf(" ");
  if (lastSpace === -1) {
    return { head: "", tail: stripped };
  }
  return {
    head: stripped.slice(0, lastSpace),
    tail: stripped.slice(lastSpace + 1),
  };
}

export default function VerdictStatement({
  statement,
  verdict,
  as = "p",
  arrowSize,
  className,
}: VerdictStatementProps) {
  const Tag = as;
  const { head, tail } = splitForTail(statement);
  const classes = ["stmt", `stmt--${verdict}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes}>
      {head && <>{head} </>}
      <span className="stmt-tail">
        {tail}
        <VerdictArrow
          verdict={verdict}
          size={arrowSize ?? 13}
          strokeWidth={2}
          className="stmt-arrow"
        />
      </span>
    </Tag>
  );
}
