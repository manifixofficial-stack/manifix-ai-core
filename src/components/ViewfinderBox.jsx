// components/ViewfinderBox.jsx
//
// Center reticle. Reacts live to whether a target is currently inside it
// (`targetInBounds`), the current lock `status`, how close the nearest
// tracked target is (`activeScale`), and now also: how fast that target
// is moving (`targetVelocity`), whether it's sitting dead-center long
// enough to build a lock (`isDeadCenter`), the global hack flag
// (`isHackedGlobal`), simulated thermal/power stress (`processorStress`),
// and one-off screen-splat hits (`screenSplat`, an incrementing counter).
//
// Inline styles throughout to match every other component in this
// codebase (Scoreboard/CaptureOverlay/etc. all use style={{...}}, not
// className strings) — if Tailwind is actually configured, say so and
// this can switch back.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

const STATUS_STYLES = {
  searching: { border: '#f59e0b66', text: '#f59e0b', label: 'SCANNING...' },
  acquired: { border: '#2dd4bf', text: '#2dd4bf', label: 'TARGET ACQUIRED' },
  locking: { border: '#22d3ee', text: '#22d3ee', label: 'LOCKING...' },
  success: { border: '#10b981', text: '#10b981', label: 'ASSET SECURED' },
  failed: { border: '#f43f5e', text: '#f43f5e', label: 'LOCK LOST' },
};

// -----------------------------------------------------------------------
// Lock-on ticker tunables
// -----------------------------------------------------------------------
const LOCK_FILL_MS = 2200; // time centered-on-target to reach 100%
const LOCK_RESET_GLITCH_MS = 400;

// -----------------------------------------------------------------------
// Splat lockout tunables
// -----------------------------------------------------------------------
const SPLAT_DURATION_MS = 1400;

// -----------------------------------------------------------------------
// Telemetry tunables
// -----------------------------------------------------------------------
const BAR_COUNT = 7;
const BASE_TELEMETRY_INTERVAL_MS = 260; // flicker rate at zero velocity
const MIN_TELEMETRY_INTERVAL_MS = 70; // flicker rate at max velocity

// -----------------------------------------------------------------------
// Corner-compression tunables (magnetic reticle)
// -----------------------------------------------------------------------
const CORNER_INSET_IDLE = -6;
const CORNER_INSET_LOCKED = 22; // how far corners slide inward at 100% lock

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function randomBinary(len) {
  return Array.from({ length: len }, () => (Math.random() > 0.5 ? '1' : '0')).join('');
}

export default function ViewfinderBox({
  centerX,
  centerY,
  size = 96,
  status = 'searching',
  targetInBounds = false,
  activeScale = 1.0,
  targetVelocity = 0, // arbitrary relative speed units, drives telemetry flicker + bar chart
  distanceMeters = null,
  isDeadCenter = false, // true while the target sits centered enough to build lock
  isHackedGlobal = false,
  processorStress = 0, // 0..1, thermal/low-power distortion intensity
  screenSplat = 0, // bump this counter each time a veggie hits the screen with juice
}) {
  const resolvedKey =
    status === 'searching' && targetInBounds ? 'acquired' : STATUS_STYLES[status] ? status : 'searching';
  const baseStyle = STATUS_STYLES[resolvedKey];
  const width = size * activeScale;
  const height = size * 1.4 * activeScale;

  // ---- Lock-on ticker ----
  const [lockProgress, setLockProgress] = useState(0);
  const [resetGlitch, setResetGlitch] = useState(false);
  const lockRafRef = useRef(null);
  const lockStartRef = useRef(null);
  const wasDeadCenterRef = useRef(false);

  useEffect(() => {
    if (isDeadCenter && targetInBounds && !isHackedGlobal) {
      if (!wasDeadCenterRef.current) lockStartRef.current = performance.now() - (lockProgress / 100) * LOCK_FILL_MS;
      wasDeadCenterRef.current = true;
      const step = (ts) => {
        const elapsed = ts - lockStartRef.current;
        const pct = Math.max(0, Math.min(100, (elapsed / LOCK_FILL_MS) * 100));
        setLockProgress(pct);
        if (pct < 100) lockRafRef.current = requestAnimationFrame(step);
      };
      lockRafRef.current = requestAnimationFrame(step);
      return () => cancelAnimationFrame(lockRafRef.current);
    }

    // Target left dead-center (or bounds, or a hack started) — if we had
    // any progress built up, flash a corrupted glitch readout, then zero
    // it back out.
    if (wasDeadCenterRef.current && lockProgress > 0) {
      setResetGlitch(true);
      const t = setTimeout(() => {
        setResetGlitch(false);
        setLockProgress(0);
      }, LOCK_RESET_GLITCH_MS);
      wasDeadCenterRef.current = false;
      return () => clearTimeout(t);
    }
    wasDeadCenterRef.current = false;
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeadCenter, targetInBounds, isHackedGlobal]);

  // ---- Zoom-snap pulse on fresh target acquisition ----
  const zoomControls = useAnimation();
  const prevInBoundsRef = useRef(targetInBounds);
  useEffect(() => {
    if (targetInBounds && !prevInBoundsRef.current) {
      zoomControls.start({ scale: [1, 1.12, 1], transition: { duration: 0.32, ease: 'easeOut' } });
    }
    prevInBoundsRef.current = targetInBounds;
  }, [targetInBounds, zoomControls]);

  // ---- Splat lockout ----
  const [splatActive, setSplatActive] = useState(false);
  const prevSplatRef = useRef(screenSplat);
  useEffect(() => {
    if (screenSplat !== prevSplatRef.current) {
      prevSplatRef.current = screenSplat;
      setSplatActive(true);
      const t = setTimeout(() => setSplatActive(false), SPLAT_DURATION_MS);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [screenSplat]);

  // ---- Telemetry flicker clock: faster at higher target velocity ----
  const [telemetryTick, setTelemetryTick] = useState(0);
  useEffect(() => {
    const interval = lerp(
      BASE_TELEMETRY_INTERVAL_MS,
      MIN_TELEMETRY_INTERVAL_MS,
      Math.max(0, Math.min(1, targetVelocity))
    );
    const id = setInterval(() => setTelemetryTick((t) => t + 1), interval);
    return () => clearInterval(id);
  }, [targetVelocity]);

  const barHeights = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, i) => {
        const wave = Math.sin(telemetryTick * 0.7 + i * 1.3);
        return 3 + Math.abs(wave) * (6 + targetVelocity * 10);
      }),
    [telemetryTick, targetVelocity]
  );

  const binaryGlitchText = useMemo(() => randomBinary(6), [telemetryTick]);

  // ---- Resolve active color scheme (hacked / splat override everything else) ----
  const s = isHackedGlobal
    ? { border: '#ff003c', text: '#ff003c', label: 'SIGNAL COMPROMISED' }
    : splatActive
    ? { border: '#7a0d0d', text: '#ff6b6b', label: 'LENS OBSTRUCTED' }
    : baseStyle;

  // ---- Thermal barrel-distortion transform ----
  const thermalT = Math.max(0, Math.min(1, processorStress));
  const skewDeg = thermalT * 6;
  const bulge = 1 + thermalT * 0.18;
  const thermalTransform =
    thermalT > 0
      ? `skew(${skewDeg}deg, ${skewDeg * 0.5}deg) matrix(${bulge}, 0, 0.08, ${bulge}, 0, 0)`
      : 'none';

  // ---- Corner compression insets: idle far corners slide inward as
  // lock builds, simulating a mechanical focus lock tightening down.
  const cornerInset = isHackedGlobal
    ? CORNER_INSET_IDLE
    : lerp(CORNER_INSET_IDLE, CORNER_INSET_LOCKED, lockProgress / 100);

  const cornerBase = [
    { top: 0, left: 0, borderWidth: '4px 0 0 4px' },
    { top: 0, right: 0, borderWidth: '4px 4px 0 0' },
    { bottom: 0, left: 0, borderWidth: '0 0 4px 4px' },
    { bottom: 0, right: 0, borderWidth: '0 4px 4px 0' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        left: centerX,
        top: centerY,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 22,
        transition: 'all 150ms ease-out',
      }}
    >
      <style>{`
        @keyframes viewfinderPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @keyframes splatWobble {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-1.4deg); }
          75% { transform: rotate(1.4deg); }
        }
        @keyframes hackedShake {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-2px, 1px); }
          40% { transform: translate(2px, -1px); }
          60% { transform: translate(-1px, -2px); }
          80% { transform: translate(1px, 2px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>

      <motion.div
        animate={zoomControls}
        style={{
          position: 'relative',
          width,
          height,
          border: `2px dashed ${s.border}`,
          borderRadius: 12,
          transition: 'width 100ms ease-out, height 100ms ease-out, border-color 150ms ease-out',
          animation: [
            resolvedKey === 'locking' ? 'viewfinderPulse 0.6s infinite' : '',
            splatActive ? 'splatWobble 0.25s ease-in-out infinite' : '',
            isHackedGlobal ? 'hackedShake 0.12s linear infinite' : '',
          ]
            .filter(Boolean)
            .join(', ') || 'none',
          transform: thermalTransform,
          filter: splatActive
            ? 'drop-shadow(0 6px 4px rgba(122,13,13,0.7)) saturate(1.4)'
            : isHackedGlobal
            ? 'drop-shadow(0 0 10px rgba(255,0,60,0.8))'
            : 'none',
        }}
      >
        {/* Corner brackets — hacked mode swaps geometry entirely for a
            skull-and-crossbones motif; splat mode drips dark red; normal
            mode collapses inward with lockProgress via a crisp spring. */}
        {cornerBase.map((pos, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              top: pos.top !== undefined ? (pos.top === 0 ? cornerInset : undefined) : undefined,
              bottom: pos.bottom !== undefined ? (pos.bottom === 0 ? cornerInset : undefined) : undefined,
              left: pos.left !== undefined ? (pos.left === 0 ? cornerInset : undefined) : undefined,
              right: pos.right !== undefined ? (pos.right === 0 ? cornerInset : undefined) : undefined,
            }}
            transition={{ type: 'spring', stiffness: 520, damping: 26 }}
            style={{
              position: 'absolute',
              width: 16,
              height: 16,
              borderStyle: 'solid',
              borderColor: splatActive ? '#3a0303' : s.border,
              borderWidth: pos.borderWidth,
            }}
          />
        ))}

        {splatActive && (
          <div style={styles.dripLayer} aria-hidden="true">
            {[18, 42, 68].map((left, i) => (
              <motion.div
                key={i}
                style={{ ...styles.dripBlob, left: `${left}%` }}
                animate={{ height: [4, 16, 10] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
              />
            ))}
          </div>
        )}

        {isHackedGlobal && (
          <>
            <div style={styles.hackedSkull}>☠️</div>
            <div style={styles.hackedBinaryTop}>{binaryGlitchText}</div>
            <div style={styles.hackedBinaryBottom}>{randomBinary(6)}</div>
          </>
        )}

        {/* Center crosshair dot */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: targetInBounds ? 1 : 0.35,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.text }} />
        </div>

        {/* Raster telemetry — micro-text distance readout along the top
            edge, sweeping bar chart along the bottom, both flickering
            faster the quicker the tracked target is moving. */}
        {!isHackedGlobal && !splatActive && (
          <>
            <div style={styles.telemetryTop}>
              {distanceMeters != null ? `${distanceMeters.toFixed(1)}M` : '—'} · V{targetVelocity.toFixed(2)}
            </div>
            <div style={styles.telemetryBars}>
              {barHeights.map((h, i) => (
                <div key={i} style={{ ...styles.telemetryBar, height: h, background: s.border }} />
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Status label / lock-on ticker */}
      <div
        style={{
          marginTop: 10,
          fontFamily: "'Orbitron', monospace",
          fontWeight: 800,
          fontSize: 10,
          letterSpacing: 1.5,
          padding: '3px 8px',
          borderRadius: 6,
          border: `1px solid ${s.border}`,
          background: 'rgba(0,0,0,0.55)',
          color: s.text,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <AnimatePresence mode="wait">
          {resetGlitch ? (
            <motion.span
              key="glitch"
              initial={{ opacity: 0 }}
              animate={{ opacity: [1, 0.3, 1, 0.2, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: LOCK_RESET_GLITCH_MS / 1000 }}
              style={{ color: '#ff003c' }}
            >
              {randomBinary(8)}
            </motion.span>
          ) : (
            <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {isHackedGlobal ? s.label : splatActive ? s.label : s.label}
              {!isHackedGlobal && !splatActive && lockProgress > 0 && ` · ${Math.round(lockProgress)}% LOCK`}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const styles = {
  telemetryTop: {
    position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
    fontFamily: 'monospace', fontSize: 8, letterSpacing: 0.5, color: 'rgba(255,255,255,0.75)',
    whiteSpace: 'nowrap',
  },
  telemetryBars: {
    position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', alignItems: 'flex-end', gap: 2, height: 16,
  },
  telemetryBar: { width: 2, borderRadius: 1, opacity: 0.85 },
  dripLayer: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'visible', pointerEvents: 'none' },
  dripBlob: {
    position: 'absolute', top: -2, width: 6, borderRadius: '0 0 4px 4px',
    background: 'linear-gradient(180deg, #7a0d0d, #3a0303)',
  },
  hackedSkull: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, filter: 'drop-shadow(0 0 8px rgba(255,0,60,0.9))', opacity: 0.9,
  },
  hackedBinaryTop: {
    position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
    fontFamily: 'monospace', fontSize: 9, color: '#ff003c', letterSpacing: 1,
  },
  hackedBinaryBottom: {
    position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)',
    fontFamily: 'monospace', fontSize: 9, color: '#ff003c', letterSpacing: 1,
  },
};
