import { useState } from 'react';
import { MehrPopover } from './MehrPopover';
import type { TeamMember } from './types';
import { withBase } from '../../lib/withBase';

interface Props {
  teamMembers: ReadonlyArray<TeamMember>;
  landesstellenCredit: string;
}

type OpenTarget = { kind: 'team'; member: TeamMember } | null;

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
  const [open, setOpen] = useState<OpenTarget>(null);

  return (
    <div className="viz viz-team">
      <ul className="viz-team__avatars" aria-label="Projektteam">
        {teamMembers.map((m, i) => (
          <li key={m.initials} style={{ listStyle: 'none' }}>
            <button
              type="button"
              className="viz-team__avatar"
              style={{
                background: m.color,
                animationDelay: `${i * 80}ms`,
              }}
              aria-label={`${m.fullName}, ${m.role}, ${m.affiliation} — Details öffnen`}
              onClick={() => setOpen({ kind: 'team', member: m })}
            >
              <span className="viz-team__avatar-initials">{m.initials}</span>
              <span className="viz-team__avatar-name">{m.fullName}</span>
            </button>
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
          <img
            src={withBase('logos/isd-hamburg.svg')}
            alt=""
            className="viz-team__logo"
            aria-hidden="true"
          />
          <span className="viz-team__institution-label">ISD Hamburg</span>
        </a>
        <a
          href="https://www.bioeg.de/"
          target="_blank"
          rel="noopener"
          className="viz-team__institution"
          aria-label="Bundesinstitut für Öffentliche Gesundheit (BIÖG) — Webseite öffnen"
        >
          <img
            src={withBase('logos/bioeg.svg')}
            alt=""
            className="viz-team__logo"
            aria-hidden="true"
          />
          <span className="viz-team__institution-label">Gefördert vom BIÖG</span>
        </a>
      </div>

      <p className="viz-team__landesstellen">{landesstellenCredit}</p>

      <MehrPopover
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.kind === 'team' ? open.member.fullName : ''}
        subtitle={
          open?.kind === 'team'
            ? `${open.member.role} · ${open.member.affiliation}`
            : undefined
        }
      >
        {open?.kind === 'team' && <p>{open.member.bio}</p>}
      </MehrPopover>
    </div>
  );
}
