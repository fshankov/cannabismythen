import { useRef, useEffect, useState } from "react";
import { ChevronDown, Hand } from "lucide-react";
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

// ── Fog blob configs ──────────────────────────────────────────────────────────
// Desktop: full density. Mobile: reduced count + scaled down so the moving
// spotlight still reveals ~22% of the viewport (same ratio as desktop).
const FOG_BLOBS_DESKTOP = [
  { w: 900, h: 720, top: "-30%",  left: "-22%",  animation: "fogA 30s ease-in-out infinite 0s"  },
  { w: 760, h: 640, top: "-18%",  right: "-16%", animation: "fogB 43s ease-in-out infinite 6s"  },
  { w: 680, h: 560, bottom: "-12%", left: "12%", animation: "fogC 27s ease-in-out infinite 12s" },
  { w: 560, h: 480, top: "22%",   left: "30%",   animation: "fogD 39s ease-in-out infinite 3s"  },
  { w: 840, h: 440, bottom: "2%", right: "-18%", animation: "fogE 48s ease-in-out infinite 20s" },
  { w: 600, h: 610, top: "16%",   right: "6%",   animation: "fogF 34s ease-in-out infinite 9s"  },
];

const FOG_BLOBS_MOBILE = [
  { w: 560, h: 460, top: "-18%",  left: "-24%",  animation: "fogA 30s ease-in-out infinite 0s"  },
  { w: 480, h: 400, top: "18%",   right: "-22%", animation: "fogB 43s ease-in-out infinite 6s"  },
  { w: 420, h: 360, bottom: "6%", left: "-10%",  animation: "fogC 27s ease-in-out infinite 12s" },
  { w: 440, h: 380, bottom: "-10%", right: "-4%", animation: "fogE 48s ease-in-out infinite 20s" },
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
  const hintRef      = useRef<HTMLDivElement>(null);

  // Detect touch-only devices and reduced-motion preference on mount
  const [isTouch, setIsTouch] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // `?touch=1` lets us force the mobile interaction path from a desktop
    // browser for QA / screenshotting. Harmless in prod.
    const forceTouch = new URLSearchParams(window.location.search).has("touch");
    setIsTouch(forceTouch || window.matchMedia("(hover: none)").matches);
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // ── Desktop: 60fps cursor tracking (direct DOM, no React state) ──────────
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

        if (revealRef.current) {
          const rm =
            `radial-gradient(circle ${REVEAL_R}px at ${x}px ${y}px,` +
            ` black 0%, black 25%, rgba(0,0,0,0.88) 42%, rgba(0,0,0,0.55) 58%,` +
            ` rgba(0,0,0,0.18) 72%, transparent 88%)`;
          revealRef.current.style.webkitMaskImage = rm;
          revealRef.current.style.maskImage = rm;
        }

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

  // ── Mobile: auto-sweeping spotlight + tap to redirect ────────────────────
  useEffect(() => {
    if (!isTouch) return;
    const el = containerRef.current;
    if (!el) return;

    const REVEAL_R = 150;
    const FOG_RX   = 110;
    const FOG_RY   = 100;

    // Current centre (animated), target centre, and whether user is currently
    // steering manually after a tap.
    const rect0 = el.getBoundingClientRect();
    let W = rect0.width || window.innerWidth;
    let H = rect0.height || window.innerHeight;
    let cx = W * 0.5;
    let cy = H * 0.45;
    let tx = cx;
    let ty = cy;
    let manualUntil = 0; // timestamp until which auto-sweep is paused
    let raf: number;
    let startTime = performance.now();

    const paintMasks = (x: number, y: number) => {
      if (revealRef.current) {
        const rm =
          `radial-gradient(circle ${REVEAL_R}px at ${x}px ${y}px,` +
          ` black 0%, black 25%, rgba(0,0,0,0.88) 42%, rgba(0,0,0,0.55) 58%,` +
          ` rgba(0,0,0,0.18) 72%, transparent 88%)`;
        revealRef.current.style.webkitMaskImage = rm;
        revealRef.current.style.maskImage = rm;
      }
      if (fogRef.current) {
        const fm =
          `radial-gradient(ellipse ${FOG_RX * 2}px ${FOG_RY * 2}px at ${x}px ${y}px,` +
          ` transparent 0%, transparent 18%, rgba(0,0,0,0.06) 28%,` +
          ` rgba(0,0,0,0.22) 40%, rgba(0,0,0,0.52) 56%,` +
          ` rgba(0,0,0,0.80) 70%, black 88%)`;
        fogRef.current.style.webkitMaskImage = fm;
        fogRef.current.style.maskImage = fm;
      }
    };

    // Reduced motion: static centred spotlight, only updates on tap.
    if (reducedMotion) {
      paintMasks(cx, cy);
    }

    const tick = (now: number) => {
      // Resize handling — cheap each frame because getBoundingClientRect is
      // cached in the layout box and changes rarely.
      if (now - startTime > 250) {
        const r = el.getBoundingClientRect();
        W = r.width;
        H = r.height;
        startTime = now;
      }

      if (!reducedMotion && now > manualUntil) {
        // Gentle figure-eight path across the viewport. Kept slow (~14s loop)
        // so it reads as ambient, not busy.
        const t = (now / 14000) * Math.PI * 2;
        tx = W * (0.5 + 0.34 * Math.sin(t));
        ty = H * (0.46 + 0.22 * Math.sin(t * 2));
      }

      // Ease current centre toward target (critically damped-ish).
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      paintMasks(cx, cy);

      raf = requestAnimationFrame(tick);
    };

    if (!reducedMotion) {
      raf = requestAnimationFrame(tick);
    }

    // Tap / pointerdown → redirect the spotlight to the touch point,
    // pause auto-sweep for 2s, then resume drifting from there.
    const onPointerDown = (e: PointerEvent) => {
      const { left, top } = el.getBoundingClientRect();
      tx = e.clientX - left;
      ty = e.clientY - top;
      manualUntil = performance.now() + 2000;
      // Dismiss the hint permanently after first interaction.
      if (hintRef.current) {
        hintRef.current.style.opacity = "0";
        hintRef.current.style.pointerEvents = "none";
      }
      if (reducedMotion) {
        // Reduced motion: immediate snap + paint, no animation loop.
        cx = tx;
        cy = ty;
        paintMasks(cx, cy);
      }
    };

    el.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      cancelAnimationFrame(raf);
    };
  }, [isTouch, reducedMotion]);

  // ── Auto-dismiss the hint on mobile after 6 seconds even without a tap ───
  useEffect(() => {
    if (!isTouch) return;
    const t = setTimeout(() => {
      if (hintRef.current) {
        hintRef.current.style.opacity = "0";
        hintRef.current.style.pointerEvents = "none";
      }
    }, 6000);
    return () => clearTimeout(t);
  }, [isTouch]);

  const fogBlobs = isTouch ? FOG_BLOBS_MOBILE : FOG_BLOBS_DESKTOP;

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
        touchAction: "manipulation",
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
              // Touch + desktop: same "barely visible" treatment — the
              // metaphor only works if myths feel obscured.
              color: "rgba(195,228,210,0.20)",
              filter: "blur(4px)",
              whiteSpace: "nowrap",
              userSelect: "none",
              lineHeight: 1,
            }}
          >
            {text}
          </span>
        ))}
      </div>

      {/* ── Layer 2 · Sharp coloured myths — revealed by mask (desktop + mobile) */}
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

      {/* ── Layer 3 · Animated fog blobs with mask-hole ─────────────────────── */}
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
        {fogBlobs.map((b, i) => (
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
              animation: reducedMotion ? "none" : b.animation,
            }}
          />
        ))}
      </div>

      {/* ── Mobile-only · Touch hint (pulsing hand near current path) ───────── */}
      {isTouch && (
        <div
          ref={hintRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "28%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 15,
            pointerEvents: "none",
            opacity: 0,
            transition: "opacity 0.6s ease",
            animation: reducedMotion ? "none" : "heroHintFadeIn 0.6s ease 1.2s forwards, heroHintPulse 2.2s ease-in-out 1.8s infinite",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Hand size={26} color="rgba(237,244,240,0.78)" strokeWidth={1.5} />
          <span
            style={{
              fontFamily: SANS,
              fontSize: "11px",
              letterSpacing: "1.4px",
              textTransform: "uppercase",
              color: "rgba(237,244,240,0.62)",
              fontWeight: 600,
            }}
          >
            Tippen zum Erkunden
          </span>
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
          animation: reducedMotion ? "none" : "heroBounce 2.6s ease-in-out infinite",
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
        @keyframes heroHintFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes heroHintPulse {
          0%,100% { transform: translateX(-50%) translateY(0px);   opacity: 0.85; }
          50%      { transform: translateX(-50%) translateY(-6px);  opacity: 0.55; }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-label="Einstieg: Cannabis-Mythen und ihre Einordnung"] * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </section>
  );
}
