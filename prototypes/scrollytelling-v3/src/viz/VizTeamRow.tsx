interface Member {
  initials: string;
  fullName: string;
  color: string;
}

const TEAM: Member[] = [
  { initials: 'CS', fullName: 'Christian Schütze', color: '#6366f1' },
  { initials: 'BS', fullName: 'Dr. Bernd Schulte', color: '#14b8a6' },
  { initials: 'SB', fullName: 'Dr. Sven Buth', color: '#f97316' },
  { initials: 'PD', fullName: 'Dr. Peter Degkwitz', color: '#a855f7' },
  { initials: 'MR', fullName: 'Moritz Rosenkranz', color: '#eab308' },
  { initials: 'HL', fullName: 'Harald Lahusen', color: '#10b981' },
];

export function VizTeamRow() {
  return (
    <div className="viz viz-team">
      <div className="viz-team__avatars" aria-label="Forschungsteam">
        {TEAM.map((m) => (
          <span
            key={m.initials}
            className="viz-team__avatar"
            style={{ background: m.color }}
            title={m.fullName}
            role="img"
            aria-label={m.fullName}
          >
            {m.initials}
          </span>
        ))}
      </div>
      <p className="viz-team__caption">
        Institut für interdisziplinäre Sucht- und Drogenforschung Hamburg
      </p>
      <p className="viz-team__funder">Mai 2026 · Gefördert vom BIÖG</p>
    </div>
  );
}
