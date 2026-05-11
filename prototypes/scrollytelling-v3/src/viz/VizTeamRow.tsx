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
  { initials: 'MR', fullName: 'Dr. Moritz Rosenkranz', color: '#eab308' },
  { initials: 'HL', fullName: 'Harald Lahusen', color: '#10b981' },
];

export function VizTeamRow() {
  return (
    <div className="viz viz-team">
      <div className="viz-team__avatars" aria-label="Forschungsteam">
        {TEAM.map((m, i) => (
          <span
            key={m.initials}
            className="viz-team__avatar"
            style={{
              background: m.color,
              animationDelay: `${i * 80}ms`,
            }}
            title={m.fullName}
            tabIndex={0}
            role="img"
            aria-label={m.fullName}
          >
            <span className="viz-team__avatar-initials">{m.initials}</span>
            <span className="viz-team__avatar-name">{m.fullName}</span>
          </span>
        ))}
      </div>
      <p className="viz-team__caption">
        Die CaRM-Studie — Cannabiskonsum: Risiken und Mythen
      </p>
      <p className="viz-team__funder">ISD Hamburg · Gefördert vom BIÖG</p>
    </div>
  );
}
