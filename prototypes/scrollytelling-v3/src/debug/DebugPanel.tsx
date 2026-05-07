import { useEffect, useState } from 'react';
import { STEPS } from '../data/steps';

interface Props {
  activeStep: number;
}

export function DebugPanel({ activeStep }: Props) {
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 0);
  const [reduced, setReduced] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      setProgress(p);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const jumpTo = (n: number) => {
    const el = document.querySelector(`[data-step="${n}"]`) as HTMLElement | null;
    if (!el) return;
    const offset = el.offsetTop;
    window.scrollTo({ top: offset, behavior: 'smooth' });
  };

  const toggleReduced = () => {
    const next = !reduced;
    setReduced(next);
    document.documentElement.dataset.reducedMotion = next ? 'true' : 'false';
  };

  const widthClass = vw >= 1024 ? 'desktop' : vw >= 768 ? 'tablet' : 'mobile';

  return (
    <aside style={panelStyle(collapsed)}>
      <button onClick={() => setCollapsed((v) => !v)} style={toggleStyle}>
        {collapsed ? '⤢' : '⤡'}
      </button>
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
          <div style={{ fontFamily: 'monospace', color: '#9ca3af' }}>
            Debug · {vw}×{vh} ({widthClass})
          </div>

          {/* Scroll progress */}
          <div style={progressBarStyle}>
            <div style={{ ...progressFillStyle, width: `${(progress * 100).toFixed(1)}%` }} />
            <span style={progressLabelStyle}>{(progress * 100).toFixed(0)}%</span>
          </div>

          {/* Step jumper */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {STEPS.map((s) => (
              <button
                key={s.stepNumber}
                onClick={() => jumpTo(s.stepNumber)}
                style={{
                  ...stepButtonStyle,
                  background: activeStep === s.stepNumber ? '#047857' : '#1f2937',
                  color: activeStep === s.stepNumber ? 'white' : '#cbd5e1',
                }}
                title={`Schritt ${s.stepNumber}: ${s.heading.split('\n')[0]}`}
              >
                {s.stepNumber}
              </button>
            ))}
          </div>

          {/* Active viz */}
          <div style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
            viz: {STEPS.find((s) => s.stepNumber === activeStep)?.vizName}
          </div>

          {/* Reduced-motion toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            <input type="checkbox" checked={reduced} onChange={toggleReduced} />
            reduced-motion
          </label>
        </div>
      )}
    </aside>
  );
}

const panelStyle = (collapsed: boolean): React.CSSProperties => ({
  position: 'fixed',
  bottom: 16,
  right: 16,
  zIndex: 100,
  background: 'rgba(15, 19, 24, 0.92)',
  border: '1px solid #2d3748',
  borderRadius: 8,
  padding: collapsed ? 6 : 10,
  minWidth: collapsed ? 'auto' : 200,
  maxWidth: 260,
  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  backdropFilter: 'blur(6px)',
});

const toggleStyle: React.CSSProperties = {
  position: 'absolute',
  top: 4,
  right: 4,
  background: 'transparent',
  border: 'none',
  color: '#9ca3af',
  cursor: 'pointer',
  fontSize: 14,
  padding: 2,
};

const progressBarStyle: React.CSSProperties = {
  position: 'relative',
  height: 6,
  background: '#1f2937',
  borderRadius: 3,
  overflow: 'hidden',
};
const progressFillStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  background: 'linear-gradient(to right, #047857, #4d7c0f)',
};
const progressLabelStyle: React.CSSProperties = {
  position: 'absolute',
  right: 4,
  top: -14,
  fontSize: 9,
  color: '#9ca3af',
  fontFamily: 'monospace',
};

const stepButtonStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  border: '1px solid #2d3748',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 11,
  fontFamily: 'monospace',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
