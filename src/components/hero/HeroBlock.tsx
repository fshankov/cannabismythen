import { useRef, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { MythPosition } from "./mythPositions";

// ── Types ────────────────────────────────────────────────────────────────────

export interface HeroMyth {
  id: string;
  text: string;
  classification: string;
  position: MythPosition;
}

interface Props {
  myths: HeroMyth[];
  headline1: string;
  headline2: string;
  eyebrow: string;
}

// ── Classification colours — muted palette tuned to the dark forest-green bg ──
// Hue families (green / sage / amber / coral / slate) stay distinct from each
// other and from the #1f4f3a background without going neon.
const CLS: Record<string, { color: string; glow: string }> = {
  richtig:       { color: "#6bc4a0", glow: "rgba(107,196,160,0.35)" }, // seafoam
  eher_richtig:  { color: "#93c265", glow: "rgba(147,194,101,0.35)" }, // sage-olive
  eher_falsch:   { color: "#c8a060", glow: "rgba(200,160,96,0.30)"  }, // warm honey
  falsch:        { color: "#d17e75", glow: "rgba(209,126,117,0.35)" }, // muted coral
  keine_aussage: { color: "#8fa8bf", glow: "rgba(143,168,191,0.30)" }, // slate blue
};

// ── Font families ─────────────────────────────────────────────────────────────
const SERIF = "'DM Serif Display', Georgia, serif";
const SANS  = "'Inter Variable', 'Inter', system-ui, sans-serif";

// ── Fog blob config ───────────────────────────────────────────────────────────
const FOG_BLOBS = [
  { w: 900, h: 720, top: "-30%",  left: "-22%",  animation: "fogA 30s ease-in-out infinite 0s"  },
  { w: 760, h: 640, top: "-18%",  right: "-16%", animation: "fogB 43s ease-in-out infinite 6s"  },
  { w: 680, h: 560, bottom: "-12%", left: "12%", animation: "fogC 27s ease-in-out infinite 12s" },
  { w: 560, h: 480, top: "22%",   left: "30%",   animation: "fogD 39s ease-in-out infinite 3s"  },
  { w: 840, h: 440, bottom: "2%", right: "-18%", animation: "fogE 48s ease-in-out infinite 20s" },
  { w: 600, h: 610, top: "16%",   right: "6%",   animation: "fogF 34s ease-in-out infinite 9s"  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function HeroBlock({
  myths,
  headline1,
  headline2,
  eyebrow,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fogRef       = useRef<HTMLDivElement>(null);
  const revealRef    = useRef<HTMLDivElement>(null);

  // Detect touch-only devices on mount — disables fog & cursor effects
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  // ── 60fps cursor tracking (direct DOM, no React state) ───────────────────
  useEffect(() => {
    if (isTouch) return;
    const el = containerRef.current;
    if (!el) return;

    const REVEAL_R = 175;
    const FOG_RX   = 125;
    const FOG_RY   = 112;
    let raf: number;

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const { left, top } = el.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;

        // Soft radial mask on the reveal layer — fades out at the edges
        if (revealRef.current) {
          const rm =
            `radial-gradient(circle ${REVEAL_R}px at ${x}px ${y}px,` +
            ` black 0%, black 25%, rgba(0,0,0,0.88) 42%, rgba(0,0,0,0.55) 58%,` +
            ` rgba(0,0,0,0.18) 72%, transparent 88%)`;
          revealRef.current.style.webkitMaskImage = rm;
          revealRef.current.style.maskImage = rm;
        }

        // Gradual hole in the fog — transparent core, long soft dissolve
        if (fogRef.current) {
          const fm =
            `radial-gradient(ellipse ${FOG_RX * 2}px ${FOG_RY * 2}px at ${x}px ${y}px,` +
            ` transparent 0%, transparent 18%, rgba(0,0,0,0.06) 28%,` +
            ` rgba(0,0,0,0.22) 40%, rgba(0,0,0,0.52) 56%,` +
            ` rgba(0,0,0,0.80) 70%, black 88%)`;
          fogRef.current.style.webkitMaskImage = fm;
          fogRef.current.style.maskImage = fm;
        }
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(raf);
      if (revealRef.current) {
        const hide = "radial-gradient(circle 0px at -999px -999px, black 0%, transparent 0%)";
        revealRef.current.style.webkitMaskImage = hide;
        revealRef.current.style.maskImage = hide;
      }
      if (fogRef.current) {
        fogRef.current.style.webkitMaskImage = "unset";
        fogRef.current.style.maskImage = "unset";
      }
    };

    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [isTouch]);

  return (
    <section
      ref={containerRef}
      aria-label="Einstieg: Cannabis-Mythen und ihre Einordnung"
      style={{
        background: "#1f4f3a",
        minHeight: "560px",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Layer 1 · Dim myth field ────────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
        {myths.map(({ id, text, position: p }) => (
          <span
            key={`dim-${id}`}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: `rotate(${p.r}deg)`,
              fontSize: `${p.size}px`,
              fontFamily: SANS,
              fontStyle: "normal",
              fontWeight: p.weight,
              // Touch: visible at 35% opacity; desktop: barely visible, revealed by cursor
              color: isTouch ? "rgba(195,228,210,0.35)" : "rgba(195,228,210,0.21)",
              filter: isTouch ? "none" : "blur(4px)",
              whiteSpace: "nowrap",
              userSelect: "none",
              lineHeight: 1,
            }}
          >
            {text}
          </span>
        ))}
      </div>

      {/* ── Layer 2 · Sharp coloured myths — revealed by cursor mask ────────── */}
      {!isTouch && (
        <div
          ref={revealRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
            WebkitMaskImage:
              "radial-gradient(circle 0px at -999px -999px, black 0%, transparent 0%)",
            maskImage:
              "radial-gradient(circle 0px at -999px -999px, black 0%, transparent 0%)",
            willChange: "mask-image, -webkit-mask-image",
          }}
        >
          {myths.map(({ id, text, classification, position: p }) => {
            const c = CLS[classification] ?? CLS.keine_aussage;
            return (
              <span
                key={`reveal-${id}`}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: `rotate(${p.r}deg)`,
                  fontSize: `${p.size}px`,
                  fontFamily: SANS,
                  fontStyle: "normal",
                  fontWeight: p.weight,
                  color: c.color,
                  textShadow: `0 0 22px ${c.glow}, 0 0 8px ${c.glow}`,
                  whiteSpace: "nowrap",
                  userSelect: "none",
                  lineHeight: 1,
                  letterSpacing: "0",
                }}
              >
                {text}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Layer 3 · Animated fog blobs with cursor mask-hole ──────────────── */}
      {!isTouch && (
        <div
          ref={fogRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            pointerEvents: "none",
            willChange: "mask-image, -webkit-mask-image",
          }}
        >
          {FOG_BLOBS.map((b, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: b.w,
                height: b.h,
                top:    (b as { top?: string }).top,
                left:   (b as { left?: string }).left,
                right:  (b as { right?: string }).right,
                bottom: (b as { bottom?: string }).bottom,
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse at center," +
                  " rgba(8,24,16,0.90) 0%," +
                  " rgba(8,24,16,0.60) 35%," +
                  " rgba(8,24,16,0.25) 58%," +
                  " transparent 70%)",
                animation: b.animation,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Layer 4 · Headline (above everything) ───────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 28px",
          pointerEvents: "none",
          textAlign: "center",
        }}
      >
        {/* Background glow keeps the headline legible through the fog */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "340px",
            background:
              "radial-gradient(ellipse at center," +
              " rgba(20,56,38,0.98) 28%," +
              " rgba(20,56,38,0.70) 55%," +
              " transparent 75%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", maxWidth: "700px" }}>
          {/* Eyebrow */}
          <p
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "2.8px",
              color: "#6eaa8a",
              textTransform: "uppercase",
              marginBottom: "22px",
              marginTop: 0,
              fontFamily: SANS,
            }}
          >
            {eyebrow}
          </p>

          {/* Headline — Inter bold + DM Serif italic on two lines */}
          <h1 style={{ margin: 0, padding: 0, lineHeight: 1 }}>
            <span
              style={{
                display: "block",
                color: "#edf4f0",
                fontSize: "clamp(26px, 5vw, 46px)",
                fontWeight: 800,
                lineHeight: 1.13,
                fontFamily: SANS,
                letterSpacing: "-0.8px",
                textShadow: "0 2px 36px rgba(0,0,0,0.65)",
              }}
            >
              {headline1}
            </span>
            <span
              style={{
                display: "block",
                marginTop: "6px",
                color: "#95c4ad",
                fontSize: "clamp(25px, 4.8vw, 44px)",
                fontWeight: 400,
                lineHeight: 1.2,
                fontFamily: SERIF,
                fontStyle: "italic",
                letterSpacing: "0.4px",
                textShadow: "0 2px 36px rgba(0,0,0,0.65)",
              }}
            >
              {headline2}
            </span>
          </h1>

        </div>
      </div>

      {/* ── Scroll cue ───────────────────────────────────────────────────────── */}
      <a
        href="#main-content"
        aria-label="Zum Inhalt scrollen"
        style={{
          position: "absolute",
          bottom: "22px",
          left: "50%",
          zIndex: 25,
          animation: "heroBounce 2.6s ease-in-out infinite",
          display: "flex",
          opacity: 0.4,
          transition: "opacity 0.2s ease",
          color: "inherit",
          textDecoration: "none",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.7"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.4"; }}
      >
        <ChevronDown size={22} color="rgba(255,255,255,0.9)" />
      </a>

      {/* ── Keyframes ────────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fogA {
          0%,100% { transform: translate(0px,   0px)   scale(1);    }
          33%      { transform: translate(170px, 120px) scale(1.07); }
          66%      { transform: translate(60px, -85px)  scale(0.95); }
        }
        @keyframes fogB {
          0%,100% { transform: translate(0px,    0px)   scale(1);    }
          40%      { transform: translate(-130px, 145px) scale(1.10); }
          75%      { transform: translate(45px,   65px)  scale(0.97); }
        }
        @keyframes fogC {
          0%,100% { transform: translate(0px,    0px)   scale(1);    }
          25%      { transform: translate(105px, -95px)  scale(1.05); }
          60%      { transform: translate(-65px, -45px)  scale(1.02); }
          82%      { transform: translate(28px,   85px)  scale(0.98); }
        }
        @keyframes fogD {
          0%,100% { transform: translate(0px,   0px)   scale(1);    }
          45%      { transform: translate(-88px, -98px)  scale(1.12); }
          80%      { transform: translate(135px,  55px)  scale(0.93); }
        }
        @keyframes fogE {
          0%,100% { transform: translate(0px,    0px)   scale(1);    }
          50%      { transform: translate(-195px, -95px) scale(1.13); }
          82%      { transform: translate(-48px,   68px) scale(0.98); }
        }
        @keyframes fogF {
          0%,100% { transform: translate(0px,    0px)    scale(1);    }
          55%      { transform: translate(85px, -120px)   scale(1.06); }
        }
        @keyframes heroBounce {
          0%,100% { transform: translateX(-50%) translateY(0px); }
          50%      { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </section>
  );
}
