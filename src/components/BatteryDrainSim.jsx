// components/BatteryDrainSim.jsx
//
// Purely cosmetic gameplay mechanic: an in-game "energy" meter that
// drains faster the more the player moves their device (compass heading
// delta) or moves in sim mode (keyboard velocity vector magnitude), and
// drains even faster under "operational strain" (PANIC mode, spamming
// multi-touch gestures in CaptureThrow, or standing in a Bob the Dog
// OBSTACLE_ZONE). Hits 0% -> full lockout until the player taps
// "INSTANT REPLAY LOOP," which resets the game state, refills energy,
// and applies a short recharge-rate debuff so spamming the button isn't
// a free out.
//
// This has NOTHING to do with the device's real battery — it's a fake
// meter for game feel, so it's safe to run continuously without asking
// for any real Battery Status API access (which most browsers have
// deprecated/restricted anyway). Likewise the "core temperature" and
// "screen distortion" effects below are pure CSS/SVG cosmetics driven
// off the fake energy number — they don't read or touch any real
// device sensor or display API.
//
// Exposes a hook (useBatteryDrainSim) that owns all the state/timers, and
// a presentational <BatteryDrainSim /> component that renders the HUD,
// thermal bar, low-voltage distortion overlay, and lockout/replay screen.
// GameCanvas.jsx should call the hook itself (so it can read `locked` to
// gate CATCH/movement alongside its existing controlsLocked from
// ObstacleCollisionOverlay) and pass the hook's return values into the
// component as props.

import React, { useCallback, useEffect, useRef, useState } from 'react';

const DRAIN_PER_SEC_IDLE = 0.4;        // slow baseline drain just from the session being open
const DRAIN_PER_HEADING_DEGREE = 0.03; // extra drain per degree/sec of compass turn rate
const DRAIN_PER_SIM_VELOCITY = 6;      // extra drain per unit of sim-mode velocity magnitude (0-1 range)
const RECHARGE_TO_PERCENT = 100;
const POST_PLUGIN_DRAIN_MULTIPLIER = 0.5; // temporary slower drain right after resetting
const POST_PLUGIN_GRACE_MS = 15000;

// --- Strain multiplier -------------------------------------------------
// Any one of these active triples the instantaneous drain rate. They
// don't stack multiplicatively beyond that — being in an obstacle zone
// while also panic-spamming is still just "tripled," not 9x — since the
// goal is to punish risky play, not to create a runaway death spiral.
const STRAIN_MULTIPLIER = 3;

// --- Thermal core (cosmetic only) --------------------------------------
const TEMP_SAFE_C = 32;
const TEMP_CRITICAL_C = 105;
const TEMP_OVERHEAT_THRESHOLD_C = 90; // blinking alarm bar kicks in at/above this

// --- Low-voltage distortion ---------------------------------------------
const LOW_VOLTAGE_THRESHOLD_PERCENT = 15;

/**
 * @param {Object} params
 * @param {number} params.headingDeg - current compass heading, 0-360
 * @param {{x: number, y: number}} params.simVelocity - current sim-mode keyboard velocity vector (unit-ish)
 * @param {boolean} params.simMode - whether we're in keyboard sim mode (vs live compass)
 * @param {boolean} [params.enabled=true] - master on/off switch for the whole mechanic
 * @param {boolean} [params.panicMode=false] - true while the player is in PANIC mode
 * @param {boolean} [params.gestureSpamActive=false] - true while the player is spamming multi-touch gestures in CaptureThrow
 * @param {boolean} [params.obstacleZoneActive=false] - true while the player is standing inside a Bob the Dog OBSTACLE_ZONE
 */
export function useBatteryDrainSim({
  headingDeg,
  simVelocity,
  simMode,
  enabled = true,
  panicMode = false,
  gestureSpamActive = false,
  obstacleZoneActive = false,
}) {
  const [energyPercent, setEnergyPercent] = useState(100);
  const [locked, setLocked] = useState(false);
  const [pluggedInUntil, setPluggedInUntil] = useState(0);
  const [strained, setStrained] = useState(false); // exposed so the HUD can show *why* it's draining fast

  const lastHeadingRef = useRef(headingDeg);
  const lastTickRef = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return undefined;

    let raf;
    const tick = (now) => {
      const dtSec = Math.min(0.25, (now - lastTickRef.current) / 1000); // clamp to avoid huge jumps after a tab was backgrounded
      lastTickRef.current = now;

      const isStrained = panicMode || gestureSpamActive || obstacleZoneActive;
      setStrained(isStrained);

      setEnergyPercent((prevEnergy) => {
        if (prevEnergy <= 0) return 0; // already dead, wait for replay

        let drain = DRAIN_PER_SEC_IDLE;

        if (simMode) {
          const vMag = Math.hypot(simVelocity?.x || 0, simVelocity?.y || 0);
          drain += vMag * DRAIN_PER_SIM_VELOCITY;
        } else {
          const prevHeading = lastHeadingRef.current;
          let delta = Math.abs(headingDeg - prevHeading);
          if (delta > 180) delta = 360 - delta; // shortest angular distance
          const turnRatePerSec = dtSec > 0 ? delta / dtSec : 0;
          drain += turnRatePerSec * DRAIN_PER_HEADING_DEGREE;
        }

        if (isStrained) drain *= STRAIN_MULTIPLIER;

        const throttled = now < pluggedInUntil ? drain * POST_PLUGIN_DRAIN_MULTIPLIER : drain;
        const next = Math.max(0, prevEnergy - throttled * dtSec);

        if (next <= 0 && !locked) setLocked(true);
        return next;
      });

      lastHeadingRef.current = headingDeg;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    simMode,
    headingDeg,
    simVelocity?.x,
    simVelocity?.y,
    pluggedInUntil,
    locked,
    panicMode,
    gestureSpamActive,
    obstacleZoneActive,
  ]);

  // Cosmetic derived values — pure functions of energyPercent, nothing
  // touches real hardware.
  const coreTempC =
    TEMP_SAFE_C + ((100 - energyPercent) / 100) * (TEMP_CRITICAL_C - TEMP_SAFE_C);
  const overheating = coreTempC >= TEMP_OVERHEAT_THRESHOLD_C;
  const lowVoltage = energyPercent < LOW_VOLTAGE_THRESHOLD_PERCENT && energyPercent > 0;

  const replay = useCallback(() => {
    setEnergyPercent(RECHARGE_TO_PERCENT);
    setLocked(false);
    setPluggedInUntil(performance.now() + POST_PLUGIN_GRACE_MS);
  }, []);

  return {
    energyPercent,
    locked,
    strained,
    coreTempC,
    overheating,
    lowVoltage,
    replay,
    // kept as an alias so any existing call sites using the old name still work
    plugInPowerBank: replay,
  };
}

/**
 * Presentational HUD + thermal bar + low-voltage distortion + lockout/replay
 * overlay. Renders the small battery meter and thermal readout always,
 * the distortion overlay while lowVoltage is true, and a full-screen
 * "SYSTEM DEAD" gate with a replay button when `locked` is true.
 */
export default function BatteryDrainSim({
  energyPercent,
  locked,
  strained,
  coreTempC,
  overheating,
  lowVoltage,
  onReplay,
}) {
  const pct = Math.round(energyPercent);
  const temp = Math.round(coreTempC);
  const barColor = pct > 40 ? '#39ff88' : pct > 15 ? '#FFD700' : '#ff5c5c';
  const tempColor = temp < 60 ? '#39ff88' : temp < 90 ? '#FFD700' : '#ff2d2d';

  return (
    <>
      <div style={styles.hudWrap} title="In-game energy — drains faster the more you move your device, and even faster under strain">
        <div style={styles.hudIcon}>🔋</div>
        <div style={styles.hudBarTrack}>
          <div style={{ ...styles.hudBarFill, width: `${pct}%`, background: barColor }} />
        </div>
        <div style={styles.hudPercentLabel}>{pct}%</div>
        {strained && !locked && <div style={styles.strainBadge}>⚡3x</div>}
      </div>

      <div style={styles.thermalWrap} title="Simulated core temperature">
        <div style={styles.thermalIcon}>🌡️</div>
        <div style={styles.thermalBarTrack}>
          <div
            style={{
              ...styles.thermalBarFill,
              width: `${Math.min(100, ((temp - 32) / (105 - 32)) * 100)}%`,
              background: tempColor,
            }}
          />
        </div>
        <div style={{ ...styles.thermalLabel, color: tempColor }}>{temp}°C</div>
      </div>

      {overheating && !locked && (
        <div style={styles.overheatBar}>
          <span style={styles.overheatBlink}>⚠ OVERHEAT: SYSTEM MELTDOWN ⚠</span>
        </div>
      )}

      {lowVoltage && !locked && (
        <div style={styles.distortionOverlay} aria-hidden="true">
          <div style={styles.scanlines} />
          <div style={styles.flicker} />
          <div style={styles.splitTop} />
          <div style={styles.splitBottom} />
        </div>
      )}

      {locked && (
        <div style={styles.lockoutVignette}>
          <div style={styles.lockoutCard}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💀</div>
            <h2 style={styles.lockoutTitle}>SYSTEM DEAD: CRITICAL DISCHARGE</h2>
            <p style={styles.lockoutText}>
              All that AR tracking drained you dry and cooked the core. Controls are frozen —
              run it back.
            </p>
            <button style={styles.lockoutButton} onClick={onReplay}>
              ▶ INSTANT REPLAY LOOP
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bds-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0.15; } }
        @keyframes bds-flicker {
          0%, 100% { opacity: 0; }
          8% { opacity: 0.5; }
          9% { opacity: 0; }
          22% { opacity: 0; }
          23% { opacity: 0.35; }
          24% { opacity: 0; }
          61% { opacity: 0; }
          62% { opacity: 0.6; }
          63% { opacity: 0; }
        }
        @keyframes bds-scan {
          0% { background-position: 0 0; }
          100% { background-position: 0 8px; }
        }
        @keyframes bds-split-top {
          0%, 92%, 100% { transform: translateX(0); }
          93% { transform: translateX(-6px); }
          94% { transform: translateX(4px); }
          95% { transform: translateX(0); }
        }
        @keyframes bds-split-bottom {
          0%, 88%, 100% { transform: translateX(0); }
          89% { transform: translateX(6px); }
          90% { transform: translateX(-4px); }
          91% { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

const styles = {
  hudWrap: {
    position: 'absolute', top: 10, left: 12, zIndex: 50,
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(0,0,0,0.4)', borderRadius: 999, padding: '4px 10px',
  },
  hudIcon: { fontSize: 12 },
  hudBarTrack: {
    width: 54, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.2)', overflow: 'hidden',
  },
  hudBarFill: { height: '100%', transition: 'width 0.3s linear' },
  hudPercentLabel: {
    fontFamily: "'Orbitron', monospace", fontSize: 10, color: '#fff', minWidth: 28, textAlign: 'right',
  },
  strainBadge: {
    fontFamily: "'Orbitron', monospace", fontSize: 9, color: '#ff2d2d',
    animation: 'bds-blink 0.6s steps(1) infinite',
  },

  thermalWrap: {
    position: 'absolute', top: 38, left: 12, zIndex: 50,
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(0,0,0,0.4)', borderRadius: 999, padding: '4px 10px',
  },
  thermalIcon: { fontSize: 12 },
  thermalBarTrack: {
    width: 54, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.2)', overflow: 'hidden',
  },
  thermalBarFill: { height: '100%', transition: 'width 0.3s linear' },
  thermalLabel: {
    fontFamily: "'Orbitron', monospace", fontSize: 10, minWidth: 32, textAlign: 'right',
  },

  overheatBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 60,
    background: '#4a0000', color: '#ff4d4d', textAlign: 'center',
    padding: '6px 8px', fontFamily: "'Orbitron', sans-serif", fontWeight: 800,
    fontSize: 12, letterSpacing: 1,
    animation: 'bds-blink 0.5s steps(1) infinite',
  },
  overheatBlink: {},

  distortionOverlay: {
    position: 'absolute', inset: 0, zIndex: 55, pointerEvents: 'none', overflow: 'hidden',
  },
  scanlines: {
    position: 'absolute', inset: 0,
    backgroundImage: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 4px)',
    animation: 'bds-scan 0.6s linear infinite',
    mixBlendMode: 'overlay',
  },
  flicker: {
    position: 'absolute', inset: 0, background: '#fff',
    animation: 'bds-flicker 2.5s infinite',
  },
  splitTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    background: 'transparent', boxShadow: 'inset 0 -2px 0 rgba(0,255,255,0.25)',
    animation: 'bds-split-top 3.2s infinite',
  },
  splitBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
    background: 'transparent', boxShadow: 'inset 0 2px 0 rgba(255,0,80,0.25)',
    animation: 'bds-split-bottom 3.2s infinite',
  },

  lockoutVignette: {
    position: 'absolute', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(8,8,10,0.92)',
  },
  lockoutCard: {
    textAlign: 'center', color: '#F5F0E8', fontFamily: "'Fredoka', sans-serif", padding: '24px', maxWidth: 320,
  },
  lockoutTitle: {
    fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: 20, color: '#ff2d2d', letterSpacing: 1, marginBottom: 8,
    animation: 'bds-blink 0.8s steps(1) infinite',
  },
  lockoutText: { fontSize: 13, color: '#e0c98a', lineHeight: 1.5, marginBottom: 18 },
  lockoutButton: {
    background: 'linear-gradient(180deg, #39ff88, #0a8a44)', color: '#08080a', fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700, fontSize: 14, letterSpacing: 1, border: 'none', borderRadius: 10, padding: '12px 28px', cursor: 'pointer',
  },
};
