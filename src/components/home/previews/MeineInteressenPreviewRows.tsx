import type { CSSProperties } from "react";
import {
  AUDIENCE_ICONS_BY_FAQ_ID,
  AUDIENCE_COLOR_VAR_BY_FAQ_ID,
} from "../../../lib/icons/lookups";
import type { FaqAudienceId } from "../../../lib/icons/lookups";

export interface AudienceRow {
  id: FaqAudienceId;
  label: string;
}

interface Props {
  audiences: ReadonlyArray<AudienceRow>;
}

// Static preview for the Meine-Interessen tile: the five audience groups as
// colour-coded rows (group icon + label), each in its own audience colour —
// a glanceable echo of the "/meine-interessen/" audience picker. No animation,
// no client JS (Astro renders this to static HTML).
export default function MeineInteressenPreviewRows({ audiences }: Props) {
  return (
    <ul className="meine-rows" aria-hidden="true">
      {audiences.map((a) => {
        const Icon = AUDIENCE_ICONS_BY_FAQ_ID[a.id];
        const colorVar = AUDIENCE_COLOR_VAR_BY_FAQ_ID[a.id];
        return (
          <li
            className="meine-row"
            key={a.id}
            style={
              {
                ["--audience-color" as string]: `var(${colorVar})`,
              } as CSSProperties
            }
          >
            <span className="meine-row__icon">
              {Icon ? <Icon size={18} aria-hidden /> : null}
            </span>
            <span className="meine-row__label">{a.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
