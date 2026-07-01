/**
 * Celebration FX for the quiz card (Stage 5, 2026-05-29).
 *
 *   • fireConfetti        — a 🎉 burst around the card + two side "salut"
 *                            cannons that arc across the screen. Fired on an
 *                            EXACT answer (Schritte 0).
 *   • fireFloatingEmoji   — a few 👍 that float up and fade. Fired on a NEAR
 *                            answer (Schritte 1).
 *
 * Both are client-only (no-op during SSR). The caller (QuizCard) only calls
 * these for a FRESH answer and never when `prefers-reduced-motion` is set,
 * so navigating back to an already-answered card or a reduced-motion user
 * triggers nothing. canvas-confetti is loaded lazily so it stays out of the
 * critical path.
 */

type ConfettiFn = (opts: Record<string, unknown>) => void;
let confettiFn: ConfettiFn | null = null;

/** 🎉 burst centred a bit above `anchor`, plus two side cannons. */
export async function fireConfetti(anchor: HTMLElement | null): Promise<void> {
  if (typeof window === "undefined") return;
  const r = anchor?.getBoundingClientRect();
  const x = r ? (r.left + r.width / 2) / window.innerWidth : 0.5;
  const y = r ? (r.top + r.height * 0.32) / window.innerHeight : 0.4;
  try {
    if (!confettiFn) {
      const mod = await import("canvas-confetti");
      confettiFn = mod.default as unknown as ConfettiFn;
    }
    const fire = confettiFn;
    const base = { disableForReducedMotion: true, zIndex: 2000 };
    // Center pop, from the card.
    fire({
      ...base,
      particleCount: 90,
      spread: 78,
      startVelocity: 42,
      scalar: 0.9,
      gravity: 0.95,
      ticks: 180,
      origin: { x, y },
    });
    // Two side "salut" cannons arcing inward across the screen.
    fire({
      ...base,
      particleCount: 55,
      angle: 60,
      spread: 55,
      startVelocity: 55,
      ticks: 200,
      origin: { x: 0, y: 0.72 },
    });
    fire({
      ...base,
      particleCount: 55,
      angle: 120,
      spread: 55,
      startVelocity: 55,
      ticks: 200,
      origin: { x: 1, y: 0.72 },
    });
  } catch {
    // canvas-confetti unavailable — silently skip.
  }
}

/** A few `emoji` that float up from `anchor` and fade out (Zoom-reaction
 *  style). Uses the Web Animations API; each node removes itself on finish. */
export function fireFloatingEmoji(
  anchor: HTMLElement | null,
  emoji = "👍",
  count = 4,
): void {
  if (typeof window === "undefined") return;
  const r = anchor?.getBoundingClientRect();
  const cx = r ? r.left + r.width / 2 : window.innerWidth / 2;
  const cy = r ? r.top + r.height * 0.42 : window.innerHeight / 2;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "quiz-fx-emoji";
    el.textContent = emoji;
    el.setAttribute("aria-hidden", "true");
    const jitter = (i - (count - 1) / 2) * 26 + (i % 2 ? 8 : -8);
    el.style.left = `${cx + jitter}px`;
    el.style.top = `${cy}px`;
    document.body.appendChild(el);
    const rise = 130 + Math.random() * 70;
    const anim = el.animate(
      [
        { transform: "translate(-50%, 0) scale(0.5)", opacity: 0 },
        {
          transform: "translate(-50%, -16px) scale(1.15)",
          opacity: 1,
          offset: 0.25,
        },
        { transform: `translate(-50%, -${rise}px) scale(1)`, opacity: 0 },
      ],
      {
        duration: 1000 + i * 90,
        easing: "cubic-bezier(0.2, 0, 0, 1)",
        delay: i * 70,
        fill: "forwards",
      },
    );
    anim.onfinish = () => el.remove();
    anim.oncancel = () => el.remove();
  }
}
