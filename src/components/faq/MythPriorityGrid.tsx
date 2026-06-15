/**
 * MythPriorityGrid — a sortable "Übersicht"-style grid for FAQ answers.
 *
 * Rows = myths; columns = (1) statement + verdict, (2) Minderjährige,
 * (3) Konsumierende. Each group cell is a lollipop (dotted 0–100 axis + thin
 * stem + ValueCircle number) showing the group's Präventionsbedeutung — exactly
 * the Daten-Explorer Spannweite/Übersicht cell. Group headers carry the custom
 * population glyph + a sort button; clicking re-sorts (handled by the tiny
 * vanilla script in MeineInteressenLayout.astro). Default order = Minderjährige
 * descending (pre-sorted server-side, so it works with JS off).
 *
 * Pure SSR (no hooks): rendered to a static HTML string by
 * `src/lib/faq-myth-grid.tsx` and spliced into the answer. Reuses the
 * Daten-Explorer leaf elements (ValueCircle, VerdictArrow, AUDIENCE_ICONS_*);
 * dashboard.css isn't loaded here, so the grid/lollipop CSS is mirrored under
 * `.mi-layout .faq-myth-grid` in MeineInteressenLayout.astro.
 */
import type { CorrectnessClass, GroupId } from "@/lib/dashboard/types";
import { getCorrectnessColor } from "@/lib/dashboard/colors";
import VerdictArrow from "@components/shared/VerdictArrow";
import ValueCircle from "@components/dashboard/grid/ValueCircle";
import { DEFAULT_LABEL } from "@components/shared/VerdictPill";
import {
  AUDIENCE_ICONS_BY_GROUP,
  AUDIENCE_COLOR_VAR_BY_GROUP,
} from "@/lib/icons";

export interface GridRow {
  /** Canonical myth id, e.g. "m26" — React key + sort identity. */
  mythId: string;
  label: string;
  verdict: CorrectnessClass;
  /** Minderjährige Präventionsbedeutung (0–100) or null. */
  min: number | null;
  /** Konsumierende Präventionsbedeutung (0–100) or null. */
  kon: number | null;
}

interface GroupMeta {
  id: GroupId;
  label: string;
}

interface Props {
  /** Pre-sorted: Minderjährige descending (the default view). */
  rows: GridRow[];
  minors: GroupMeta;
  consumers: GroupMeta;
  caption: string;
}

const TICKS = [0, 25, 50, 75, 100] as const;

function Cell({ value, accent }: { value: number | null; accent: string }) {
  return (
    <div className="faq-myth-grid__plot">
      <div className="faq-myth-grid__axis" aria-hidden="true">
        {TICKS.map((p) => (
          <span
            key={p}
            className={
              p === 50
                ? "faq-myth-grid__tick faq-myth-grid__tick--mid"
                : "faq-myth-grid__tick"
            }
            style={{ left: `${p}%` }}
          />
        ))}
      </div>
      {value != null ? (
        <>
          <span
            className="faq-myth-grid__stem"
            style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: accent }}
            aria-hidden="true"
          />
          <ValueCircle value={value} accent={accent} />
        </>
      ) : (
        <span className="faq-myth-grid__nodata" aria-hidden="true">
          k. A.
        </span>
      )}
    </div>
  );
}

function GroupHeader({
  group,
  col,
  active,
}: {
  group: GroupMeta;
  col: "min" | "kon";
  active: boolean;
}) {
  const Icon = AUDIENCE_ICONS_BY_GROUP[group.id];
  const colorVar = AUDIENCE_COLOR_VAR_BY_GROUP[group.id];
  return (
    <button
      type="button"
      className={`faq-myth-grid__sort${active ? " is-active" : ""}`}
      data-col={col}
      aria-pressed={active}
      title={`Nach ${group.label} sortieren`}
    >
      <span
        className="faq-myth-grid__hicon"
        style={{ color: `var(${colorVar})` }}
        aria-hidden="true"
      >
        <Icon size={18} />
      </span>
      <span className="faq-myth-grid__hlabel">{group.label}</span>
      <span className="faq-myth-grid__arrow" aria-hidden="true">▾</span>
    </button>
  );
}

export default function MythPriorityGrid({
  rows,
  minors,
  consumers,
  caption,
}: Props) {
  return (
    <figure className="faq-myth-grid" role="group" aria-label={caption}>
      <div className="faq-myth-grid__head">
        <span className="faq-myth-grid__hcell faq-myth-grid__hcell--label">
          Mythos
        </span>
        <span className="faq-myth-grid__hcell">
          <GroupHeader group={minors} col="min" active />
        </span>
        <span className="faq-myth-grid__hcell">
          <GroupHeader group={consumers} col="kon" active={false} />
        </span>
      </div>

      <div className="faq-myth-grid__rows">
        {rows.map((row) => {
          const accent = getCorrectnessColor(row.verdict);
          return (
            <div
              className="faq-myth-grid__row"
              key={row.mythId}
              data-min={row.min ?? ""}
              data-kon={row.kon ?? ""}
            >
              <span className="faq-myth-grid__myth">
                <span className="faq-myth-grid__verdict" aria-hidden="true">
                  <VerdictArrow verdict={row.verdict} size={15} />
                </span>
                <span className="sr-only">{DEFAULT_LABEL[row.verdict]}: </span>
                {row.label}
              </span>
              <span className="faq-myth-grid__cell">
                <Cell value={row.min} accent={accent} />
              </span>
              <span className="faq-myth-grid__cell">
                <Cell value={row.kon} accent={accent} />
              </span>
            </div>
          );
        })}
      </div>

      <figcaption className="faq-myth-grid__foot">
        Präventionsbedeutung (0–100) je Zielgruppe. Spaltenkopf antippen, um nach
        einer Gruppe zu sortieren.
      </figcaption>
    </figure>
  );
}
