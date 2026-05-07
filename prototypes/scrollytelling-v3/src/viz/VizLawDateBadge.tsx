import { useEffect, useState } from 'react';

interface Props { active: boolean; }

export function VizLawDateBadge({ active }: Props) {
  const [showSponsors, setShowSponsors] = useState(false);

  useEffect(() => {
    if (!active) {
      setShowSponsors(false);
      return;
    }
    const t = setTimeout(() => setShowSponsors(true), 600);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div className="viz viz-law">
      <div
        style={{
          opacity: active ? 1 : 0.3,
          transform: active ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <div className="viz-law__date">April 2024</div>
        <div className="viz-law__law">Konsumcannabisgesetz · KCanG</div>
      </div>
      <div
        className="viz-law__sponsors"
        style={{
          opacity: showSponsors ? 1 : 0,
          transform: showSponsors ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
        }}
      >
        <span className="viz-law__sponsor">ISD Hamburg</span>
        <span className="viz-law__sponsor">Gefördert vom BIÖG</span>
      </div>
    </div>
  );
}
