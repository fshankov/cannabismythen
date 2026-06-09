import type { TeamMember } from './types';
import { withBase } from '../../lib/withBase';

interface Props {
  teamMembers: ReadonlyArray<TeamMember>;
  landesstellenCredit: string;
}

// CAR-?? (2026-05-30): the per-member bio popover was removed — the
// team row is now a static credit display. Avatars are non-interactive
// (no MehrPopover, no `useState` for an open target, no `<button>`
// element). The full bios live in the team listing on /projekt/team.

/**
 * VizTeamRow — Step 11 (Iter-15 layout, 2026-05-29).
 *
 * Compact stack so the viz block stays shorter than the left text
 * column:
 *   • 6 team initials at the top
 *   • Project caption "Die CaRM-Studie — …"
 *   • A 2-column institution row: each column has its institution
 *     LOGO centered above its name ("ISD Hamburg" / "Gefördert vom
 *     BIÖG") so the visual cue and the credit pair up explicitly
 *   • Landesstellen small-print credit
 *
 * The `namedExperts` section was deleted in Iter-14 (CAR-21); the
 * `OpenTarget` discriminated union therefore only carries the `team`
 * branch.
 *
 * English gloss (per CLAUDE.md German-content rule):
 *   "Die CaRM-Studie — Cannabiskonsum: Risiken und Mythen"
 *     → "The CaRM study — Cannabis use: Risks and myths"
 *   "Gefördert vom BIÖG"
 *     → "Funded by BIÖG"
 */
export function VizTeamRow({
  teamMembers,
  landesstellenCredit,
}: Props) {
  return (
    <div className="viz viz-team">
      <ul className="viz-team__avatars" aria-label="Projektteam">
        {teamMembers.map((m, i) => (
          <li key={m.initials} style={{ listStyle: 'none' }}>
            <div
              className="viz-team__avatar"
              style={{
                background: m.color,
                animationDelay: `${i * 80}ms`,
              }}
              aria-label={`${m.fullName}, ${m.role}, ${m.affiliation}`}
            >
              <span className="viz-team__avatar-initials">{m.initials}</span>
              <span className="viz-team__avatar-name">{m.fullName}</span>
            </div>
          </li>
        ))}
      </ul>

      <p className="viz-team__caption">
        Die CaRM-Studie — Cannabiskonsum: Risiken und Mythen
      </p>

      {/* Iter-15: 2-column institution block. Each column = link
          wrapper containing the logo (centered, ~44 px) plus the
          institution credit line directly underneath. */}
      <div className="viz-team__institutions" aria-label="Studienpartner">
        <a
          href="https://www.isd-hamburg.de/"
          target="_blank"
          rel="noopener"
          className="viz-team__institution"
          aria-label="Institut für interdisziplinäre Sucht- und Drogenforschung (ISD) Hamburg — Webseite öffnen"
        >
          {/* Full ISD logo (mark + name baked in) — no text label below,
              it would duplicate the wordmark (Fedor 2026-06-09). */}
          <img
            src={withBase('logos/isd-hamburg-neg.svg')}
            alt="ISD Hamburg"
            className="viz-team__logo"
          />
        </a>
        <a
          href="https://www.bioeg.de/"
          target="_blank"
          rel="noopener"
          className="viz-team__institution"
          aria-label="Bundesinstitut für Öffentliche Gesundheit (BIÖG) — Webseite öffnen"
        >
          {/* Full BIÖG logo (mark + name baked in) — no text label below. */}
          <img
            src={withBase('logos/bioeg-neg.svg')}
            alt="Bundesinstitut für Öffentliche Gesundheit (BIÖG)"
            className="viz-team__logo"
          />
        </a>
      </div>

      <p className="viz-team__landesstellen">{landesstellenCredit}</p>
    </div>
  );
}
