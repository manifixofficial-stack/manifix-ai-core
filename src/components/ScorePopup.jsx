import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';

/**
 * ScorePopup / useScorePopups / ScorePopupLayer
 * ----------------------------------------------
 * Transient scoring FX layer fired right after a scoring event
 * (capture_veggie(), GoldenSprite grab, or a Bob the Dog / hazard siphon).
 *
 * Each popup is a self-contained particle system:
 *   - an outer "trajectory" div that erupts from the touch point along a
 *     randomized diagonal vector, arcs to an apex, then falls under a
 *     simulated gravity curve before vanishing (pure CSS, driven by
 *     per-instance custom properties so no two popups move identically)
 *   - an inner "content" div carrying the type-specific color/text/motion
 *     treatment (neon spring bounce / shaking gold panel / jagged crimson
 *     slide) as its own independent transform, so it never fights the
 *     outer trajectory animation
 *   - 4-6 orbiting mini star particles (`✦`/`★`) that burst outward in a
 *     360-degree ring from the score center on mount
 *
 * Usage inside GameCanvas.jsx:
 *
 *   const { popups, spawnPopup, removePopup } = useScorePopups({
 *     onShockwave: () => triggerViewfinderShake(), // wire to the 4:3 frame
 *   });
 *
 *   // in handleCatch, after a successful capture:
 *   spawnPopup({ x: caughtScreenX, y: caughtScreenY, value: 500, type: 'capture' });
 *   spawnPopup({ x, y, value: 2000, type: 'critical', shockwave: true }); // GoldenSprite
 *   spawnPopup({ x, y, value: -250, type: 'siphon' }); // Bob the Dog / hazard drain
 *
 *   // in render, anywhere inside the root wrap div:
 *   <ScorePopupLayer popups={popups} onPopupDone={removePopup} />
 */

// --- Per-event-type visual config --------------------------------------
// Each type controls: label text, color treatment, trajectory direction
// (captures/criticals erupt upward, siphons sink downward), particle
// count range, lifetime, and which extra motion layer (spring bounce /
// shake+spin / jagged vibrate) rides on top of the shared arc.
const POPUP_TYPES = {
  capture: {
    label: (v) => `+${v} PTS`,
    lifetimeMs: 700,
    color: '#39ff88',
    stroke: '#0a5c2e',
    glow: '0 0 18px rgba(57,255,136,0.9), 0 0 34px rgba(57,255,136,0.5)',
    fontSize: 18,
    direction: 'up',
    motion: 'spring',
    particleCount: [4, 6],
    particleGlyphs: ['✦', '★'],
    particleColor: '#39ff88',
  },
  critical: {
    label: () => `★ CRITICAL BONUS ★`,
    sublabel: (v) => `+${v}`,
    lifetimeMs: 900,
    color: '#ffd700',
    stroke: '#8a5a00',
    glow: '0 0 26px rgba(255,215,0,0.95), 0 0 46px rgba(255,140,0,0.6)',
    fontSize: 22,
    direction: 'up',
    motion: 'shakeSpin',
    particleCount: [6, 6],
    particleGlyphs: ['★'],
    particleColor: '#ffd700',
    shockwaveDefault: true,
  },
  siphon: {
    label: (v) => `${v} SIPHON`,
    lifetimeMs: 650,
    color: '#ef4444',
    stroke: '#4a0000',
    glow: '0 0 14px rgba(239,68,68,0.9)',
    fontSize: 17,
    direction: 'down',
    motion: 'jagged',
    particleCount: [4, 5],
    particleGlyphs: ['✦'],
    particleColor: '#ef4444',
  },
};

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

export function ScorePopup({ x, y, value, type = 'capture', onDone }) {
  const cfg = POPUP_TYPES[type] || POPUP_TYPES.capture;

  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), cfg.lifetimeMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Trajectory vector (computed once per popup instance) ---
  // Random diagonal eruption + gravity: dx is the total horizontal drift,
  // peak is how high (or, for siphon, how far down) the apex reaches,
  // end is the resting displacement after gravity pulls it back partway
  // from the apex — this is what produces the "up, over apex, curve back
  // down" arcade feel instead of a straight linear float.
  const traj = useMemo(() => {
    const sign = Math.random() < 0.5 ? -1 : 1;
    const dx = sign * randRange(24, 70);
    if (cfg.direction === 'down') {
      // Siphon: sinks downward with a little sideways sway, no real apex.
      return { dx, peak: randRange(10, 22), end: randRange(50, 80), rot: sign * randRange(2, 6) };
    }
    return { dx, peak: -randRange(70, 110), end: -randRange(30, 55), rot: sign * randRange(3, 8) };
  }, [cfg.direction]);

  // --- Particle burst (4-6 stars radiating outward at mount) ---
  const particles = useMemo(() => {
    const [minC, maxC] = cfg.particleCount;
    const count = Math.round(randRange(minC, maxC));
    return Array.from({ length: count }, (_, i) => {
      const angle = (360 / count) * i + randRange(-15, 15); // spread evenly around 360°, then jitter
      const dist = randRange(26, 46);
      const rad = (angle * Math.PI) / 180;
      return {
        id: i,
        glyph: cfg.particleGlyphs[Math.floor(Math.random() * cfg.particleGlyphs.length)],
        px: Math.cos(rad) * dist,
        py: Math.sin(rad) * dist,
        delay: randRange(0, 60),
      };
    });
  }, [cfg.particleCount, cfg.particleGlyphs]);

  const outerStyle = {
    position: 'absolute',
    left: x,
    top: y,
    zIndex: 46,
    pointerEvents: 'none',
    '--dx': `${traj.dx}px`,
    '--peak': `${traj.peak}px`,
    '--end': `${traj.end}px`,
    '--rot': `${traj.rot}deg`,
    animation: `scorePopupArc ${cfg.lifetimeMs}ms cubic-bezier(0.22, 0.9, 0.32, 1) forwards`,
  };

  const contentStyle = {
    ...styles.contentBase,
    color: cfg.color,
    WebkitTextStroke: `1.5px ${cfg.stroke}`,
    textShadow: cfg.glow,
    fontSize: cfg.fontSize,
    animation: motionAnimationFor(cfg.motion),
  };

  return (
    <div style={outerStyle}>
      <div style={contentStyle}>
        {cfg.label(value)}
        {cfg.sublabel && <div style={styles.sublabel}>{cfg.sublabel(value)}</div>}
      </div>

      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            color: cfg.particleColor,
            fontSize: 12,
            pointerEvents: 'none',
            '--px': `${p.px}px`,
            '--py': `${p.py}px`,
            animation: `scorePopupBurst 500ms ease-out ${p.delay}ms forwards`,
          }}
        >
          {p.glyph}
        </span>
      ))}
    </div>
  );
}

function motionAnimationFor(motion) {
  switch (motion) {
    case 'shakeSpin':
      // Gold pulsing wave: big shaking panel + pulse scale.
      return 'scorePopupShake 140ms steps(2) infinite, scorePopupPulse 480ms ease-in-out infinite alternate';
    case 'jagged':
      // Crimson stain: vibrating, jagged jitter.
      return 'scorePopupJagged 90ms steps(2) infinite';
    case 'spring':
    default:
      // Green neon: single high-stiffness spring bounce on mount, no loop.
      return 'scorePopupSpring 380ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
  }
}

export function useScorePopups({ onShockwave } = {}) {
  const [popups, setPopups] = useState([]);
  const idRef = useRef(0);

  const spawnPopup = useCallback(
    ({ x, y, value, type = 'capture', shockwave = false }) => {
      const id = idRef.current++;
      setPopups((prev) => [...prev, { id, x, y, value, type }]);

      const cfg = POPUP_TYPES[type] || POPUP_TYPES.capture;
      if ((shockwave || cfg.shockwaveDefault) && onShockwave) {
        onShockwave();
      }
    },
    [onShockwave]
  );

  const removePopup = useCallback((id) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { popups, spawnPopup, removePopup };
}

/**
 * Renders all active popups plus a one-time <style> tag carrying the
 * keyframe animations (GameCanvas.jsx uses inline style objects throughout,
 * so there's no existing global stylesheet to hook into — this injects its
 * own scoped keyframes rather than requiring a separate CSS import).
 */
export function ScorePopupLayer({ popups, onPopupDone }) {
  return (
    <>
      <style>{keyframes}</style>
      {popups.map((p) => (
        <ScorePopup
          key={p.id}
          x={p.x}
          y={p.y}
          value={p.value}
          type={p.type}
          onDone={() => onPopupDone(p.id)}
        />
      ))}
    </>
  );
}

const keyframes = `
/* Shared trajectory: erupt from touch point along a random diagonal,
   climb to the apex, then curve back down under simulated gravity before
   fading out. Siphon-type popups reuse this same keyframe set, just with
   positive (downward) --peak/--end values passed in per-instance. */
@keyframes scorePopupArc {
  0%   { transform: translate3d(0, 0, 0) scale(0.3); opacity: 0; }
  20%  { transform: translate3d(calc(var(--dx) * 0.25), calc(var(--peak) * 0.7), 0) scale(1.15); opacity: 1; }
  50%  { transform: translate3d(calc(var(--dx) * 0.65), var(--peak), 0) scale(1.0); opacity: 1; }
  100% { transform: translate3d(var(--dx), var(--end), 0) scale(0.85); opacity: 0; }
}

/* Orbiting particle burst: each star flies outward to its own --px/--py
   offset and fades, so the popup reads as an explosion/emitter. */
@keyframes scorePopupBurst {
  0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--px)), calc(-50% + var(--py))) scale(0.2); opacity: 0; }
}

/* Green neon glow: one crisp high-stiffness spring bounce, no loop. */
@keyframes scorePopupSpring {
  0%   { transform: translate(-50%, -50%) scale(0.4) rotate(0deg); }
  60%  { transform: translate(-50%, -50%) scale(1.35) rotate(-2deg); }
  80%  { transform: translate(-50%, -50%) scale(0.92) rotate(1deg); }
  100% { transform: translate(-50%, -50%) scale(1.0) rotate(0deg); }
}

/* Gold pulsing wave: shaking panel under the critical-bonus text. */
@keyframes scorePopupShake {
  0%   { transform: translate(-50%, -50%) rotate(-1.5deg); }
  50%  { transform: translate(-50%, -50%) rotate(1.5deg); }
  100% { transform: translate(-50%, -50%) rotate(-1.5deg); }
}
@keyframes scorePopupPulse {
  0%   { filter: brightness(1); }
  100% { filter: brightness(1.5); }
}

/* Bleeding crimson stain: vibrating, jagged jitter while it slides down. */
@keyframes scorePopupJagged {
  0%   { transform: translate(-52%, -48%) rotate(var(--rot)); }
  50%  { transform: translate(-48%, -52%) rotate(calc(var(--rot) * -1)); }
  100% { transform: translate(-52%, -48%) rotate(var(--rot)); }
}
`;

const styles = {
  contentBase: {
    position: 'absolute',
    left: 0,
    top: 0,
    transform: 'translate(-50%, -50%)',
    fontFamily: "'Orbitron', 'Impact', sans-serif",
    fontWeight: 800,
    whiteSpace: 'nowrap',
    textAlign: 'center',
  },
  sublabel: {
    fontSize: 13,
    marginTop: 2,
  },
};

export default ScorePopup;

// --- Screen shockwave helper -------------------------------------------
// Ultra-rare high-point catches should also kick the surrounding 4:3
// viewfinder frame. This mechanic doesn't own the viewport DOM node
// itself — GameCanvas.jsx does — so it's exposed as a small hook that
// GameCanvas wires up, then passes as `onShockwave` into useScorePopups().
// Once wired, spawnPopup automatically fires it whenever the popup's type
// config sets `shockwaveDefault: true` (currently `critical`, i.e.
// GoldenSprite catches) or the caller explicitly passes `shockwave: true`
// on any other spawnPopup call — no manual triggering needed at call sites.
//
//   const { triggerShockwave, shockwaveKey } = useScreenShockwave();
//   const { popups, spawnPopup, removePopup } = useScorePopups({ onShockwave: triggerShockwave });
//   // apply e.g. `key={shockwaveKey}` + a CSS shake animation class to
//   // the 4:3 viewfinder wrapper so it restarts the shake each trigger
export function useScreenShockwave() {
  const [shockwaveKey, setShockwaveKey] = useState(0);
  const triggerShockwave = useCallback(() => {
    setShockwaveKey((k) => k + 1);
  }, []);
  return { shockwaveKey, triggerShockwave };
}
