// components/BatteryDrainSim.jsx
//
// Purely cosmetic gameplay mechanic: an in-game "energy" meter that
// drains faster the more the player moves their device (compass heading
// delta) or moves in sim mode (keyboard velocity vector magnitude). Hits
// 0% -> controls lock until the player taps "Plug in Power Bank," which
// refills to full and applies a short recharge-rate debuff so spamming
// the button isn't a free out.
//
// This has NOTHING to do with the device's real battery — it's a fake
// meter for game feel, so it's safe to run continuously without asking
// for any real Battery Status API access (which most browsers have
// deprecated/restricted anyway).
//
// Exposes a hook (useBatteryDrainSim) that owns all the state/timers, and
// a presentational <BatteryDrainSim /> component that renders the HUD +
// lockout overlay. GameCanvas.jsx should call the hook itself (so it can
// read `locked` to gate CATCH/movement alongside its existing
// controlsLocked from ObstacleCollisionOverlay) and pass the hook's
// return values into the component as props.

import React, { useCallback, useEffect, useRef, useState } from 'react';

const DRAIN_PER_SEC_IDLE = 0.4;       // slow baseline drain just from the session being open
const DRAIN_PER_HEADING_DEGREE = 0.03; // extra drain per degree/sec of compass turn rate
const DRAIN_PER_SIM_VELOCITY = 6;      // extra drain per unit of sim-mode velocity magnitude (0-1 range)
const RECHARGE_TO_PERCENT = 100;
const POST_PLUGIN_DRAIN_MULTIPLIER = 0.5; // temporary slower drain right after plugging in
const POST_PLUGIN_GRACE_MS = 15000;

/**
 * @param {Object} params
 * @param {number} params.headingDeg - current compass heading, 0-360
 * @param {{x: number, y: number}} params.simVelocity - current sim-mode keyboard velocity vector (unit-ish)
 * @param {boolean} params.simMode - whether we're in keyboard sim mode (vs live compass)
 * @param {boolean} [params.enabled=true] - master on/off switch for the whole mechanic
 */
export function useBatteryDrainSim({ headingDeg, simVelocity, simMode, enabled = true }) {
  const [energyPercent, setEnergyPercent] = useState(100);
  const [locked, setLocked] = useState(false);
  const [pluggedInUntil, setPluggedInUntil] = useState(0);

  const lastHeadingRef = useRef(headingDeg);
  const lastTickRef = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return undefined;

    let raf;
    const tick = (now) => {
      const dtSec = Math.min(0.25, (now - lastTickRef.current) / 1000); // clamp to avoid huge jumps after a tab was backgrounded
      lastTickRef.current = now;

      setEnergyPercent((prevEnergy) => {
        if (prevEnergy <= 0) return 0; // already dead, wait for plug-in

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
  }, [enabled, simMode, headingDeg, simVelocity?.x, simVelocity?.y, pluggedInUntil, locked]);

  const plugInPowerBank = useCallback(() => {
    setEnergyPercent(RECHARGE_TO_PERCENT);
    setLocked(false);
    setPluggedInUntil(performance.now() + POST_PLUGIN_GRACE_MS);
  }, []);

  return { energyPercent, locked, plugInPowerBank };
}

/**
 * Presentational HUD + lockout overlay. Renders a small battery meter
 * always, and a full-screen "OUT OF BATTERY" gate with a plug-in button
 * when `locked` is true.
 */
export default function BatteryDrainSim({ energyPercent, locked, onPlugIn }) {
  const pct = Math.round(energyPercent);
  const barColor = pct > 40 ? '#39ff88' : pct > 15 ? '#FFD700' : '#ff5c5c';

  return (
    <>
      <div style={styles.hudWrap} title="In-game energy — drains faster the more you move your device">
        <div style={styles.hudIcon}>🔋</div>
        <div style={styles.hudBarTrack}>
          <div style={{ ...styles.hudBarFill, width: `${pct}%`, background: barColor }} />
        </div>
        <div style={styles.hudPercentLabel}>{pct}%</div>
      </div>

      {locked && (
        <div style={styles.lockoutVignette}>
          <div style={styles.lockoutCard}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔌</div>
            <h2 style={styles.lockoutTitle}>OUT OF BATTERY</h2>
            <p style={styles.lockoutText}>
              All that AR tracking drained you dry. Hook up the power bank to keep hunting.
            </p>
            <button style={styles.lockoutButton} onClick={onPlugIn}>
              PLUG IN POWER BANK
            </button>
          </div>
        </div>
      )}
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
  lockoutVignette: {
    position: 'absolute', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(8,8,10,0.9)',
  },
  lockoutCard: {
    textAlign: 'center', color: '#F5F0E8', fontFamily: "'Fredoka', sans-serif", padding: '24px', maxWidth: 300,
  },
  lockoutTitle: {
    fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: 20, color: '#ff5c5c', letterSpacing: 1, marginBottom: 8,
  },
  lockoutText: { fontSize: 13, color: '#e0c98a', lineHeight: 1.5, marginBottom: 18 },
  lockoutButton: {
    background: 'linear-gradient(180deg, #FFD700, #B8860B)', color: '#08080a', fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700, fontSize: 14, letterSpacing: 1, border: 'none', borderRadius: 10, padding: '12px 28px', cursor: 'pointer',
  },
};
