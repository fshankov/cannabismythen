import { useState } from 'react';
import { MehrPopover } from './MehrPopover';
import type { TeamMember, NamedExpert } from './types';

interface Props {
  teamMembers: ReadonlyArray<TeamMember>;
  namedExperts: ReadonlyArray<NamedExpert>;
  landesstellenCredit: string;
}

type OpenTarget =
  | { kind: 'team'; member: TeamMember }
  | { kind: 'expert'; expert: NamedExpert }
  | null;

/** Initials for a named expert (e.g. "Dr. Jens Kalke" → "JK"). */
function expertInitials(fullName: string): string {
  const parts = fullName.replace(/^Dr\.\s+/, '').split(/\s+/);
  return parts.map((p) => p[0]).join('').slice(0, 3).toUpperCase();
}

export function VizTeamRow({
  teamMembers,
  namedExperts,
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
      <p className="viz-team__funder">ISD Hamburg · Gefördert vom BIöG</p>

      <section className="viz-team__experts" aria-label="Befragte Präventionsexpert:innen">
        <h4 className="viz-team__experts-title">Befragte Präventionsexpert:innen</h4>
        <ul className="viz-team__expert-avatars">
          {namedExperts.map((e, i) => (
            <li key={e.fullName} style={{ listStyle: 'none' }}>
              <button
                type="button"
                className="viz-team__expert-avatar"
                style={{ animationDelay: `${i * 80}ms` }}
                aria-label={`${e.fullName}, ${e.affiliation} — Details öffnen`}
                onClick={() => setOpen({ kind: 'expert', expert: e })}
              >
                <span className="viz-team__expert-avatar-initials">
                  {expertInitials(e.fullName)}
                </span>
                <span className="viz-team__expert-avatar-name">{e.fullName}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="viz-team__landesstellen">{landesstellenCredit}</p>
      </section>

      <MehrPopover
        open={open !== null}
        onClose={() => setOpen(null)}
        title={
          open?.kind === 'team'
            ? open.member.fullName
            : open?.kind === 'expert'
              ? open.expert.fullName
              : ''
        }
        subtitle={
          open?.kind === 'team'
            ? `${open.member.role} · ${open.member.affiliation}`
            : open?.kind === 'expert'
              ? open.expert.affiliation
              : undefined
        }
      >
        {open?.kind === 'team' && <p>{open.member.bio}</p>}
        {open?.kind === 'expert' && <p>{open.expert.context}</p>}
      </MehrPopover>
    </div>
  );
}
