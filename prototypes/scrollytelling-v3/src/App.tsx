import { useEffect, useState } from 'react';
import { ScrollytellingViewerV3 } from './ScrollytellingViewerV3';
import { DebugPanel } from './debug/DebugPanel';
import { loadCarmData } from './data/carmData';
import type { CarmData } from './data/types';
import { STEPS } from './data/steps';

export function App() {
  const [data, setData] = useState<CarmData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    loadCarmData().then(setData).catch((e: Error) => setError(e.message));
  }, []);

  // Sync DebugPanel's activeStep with the IntersectionObserver-driven viewer
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const active = document.querySelector('.scrolly__step--active');
      if (active) {
        const n = Number(active.getAttribute('data-step'));
        if (!Number.isNaN(n)) setActiveStep(n);
      }
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (error) {
    return (
      <div style={{ padding: 32, color: '#be123c' }}>
        <h1>carm-data.json failed to load</h1>
        <p>{error}</p>
        <p style={{ color: '#9ca3af' }}>
          Check that public/carm-data.json exists. Re-run:
          <br />
          <code style={{ fontFamily: 'monospace' }}>
            cp ../../public/data/carm-data.json public/carm-data.json
          </code>
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 32, color: '#9ca3af' }}>
        <p>Lade carm-data.json …</p>
      </div>
    );
  }

  return (
    <>
      <header style={headerStyle}>
        <strong>Scrollytelling v3 — Prototype</strong>
        <span style={{ color: '#9ca3af', marginLeft: 12 }}>
          {STEPS.length} Schritte · {data.myths.length} Mythen · {data.metrics.length} Datenpunkte
        </span>
      </header>
      <ScrollytellingViewerV3 data={data} />
      <DebugPanel activeStep={activeStep} />
      <footer style={footerStyle}>
        <p>
          Standalone-Prototyp, nicht Teil der Live-Site. Iteriere hier, port Phase D in
          <code> src/components/scrollytelling/</code> einbauen.
        </p>
      </footer>
    </>
  );
}

const headerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 50,
  background: 'rgba(15, 19, 24, 0.85)',
  backdropFilter: 'blur(8px)',
  padding: '8px 16px',
  borderBottom: '1px solid #2d3748',
  fontSize: 13,
  fontFamily: 'monospace',
  color: '#e5e7eb',
};

const footerStyle: React.CSSProperties = {
  padding: '32px 16px 80px',
  textAlign: 'center',
  fontSize: 12,
  color: '#9ca3af',
};
