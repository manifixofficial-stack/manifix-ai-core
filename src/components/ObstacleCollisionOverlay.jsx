import React, { useEffect, useRef, useState } from 'react';

const LOCKOUT_MS = 2000;
const RETRIGGER_COOLDOWN_MS = 8000; // don't spam the same zone repeatedly

function metersBetween(a, b) {
  if (!a || !b) return Infinity;
  const dLat = (b.lat - a.lat) * 111320;
  const dLng = (b.lng - a.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

/**
 * Real-world safety nudge, not a "damage" mechanic: this game has people
 * walking around outdoors staring at their phone, so when the player's
 * position enters a known obstacle zone (tree, wall, hydrant, curb) we
 * briefly flash the screen, show a "look up" message, and disable game
 * input for a couple seconds — mirroring the kind of safety reminder
 * real location-based games use, rather than simulating an injury.
 *
 * Fully self-contained: watches playerPos against `obstacles` itself and
 * reports lock state up via onLockChange so the parent can disable the
 * joystick/capture/tackle controls while it's active.
 */
export default function ObstacleCollisionOverlay({ playerPos, obstacles = [], onLockChange }) {
  const [active, setActive] = useState(false);
  const [obstacleLabel, setObstacleLabel] = useState(null);
  const cooldownRef = useRef(new Map()); // obstacleId -> timestamp it's clear to retrigger
  const lockTimerRef = useRef(null);

  useEffect(() => {
    if (!playerPos || active) return;

    const now = Date.now();
    for (const obstacle of obstacles) {
      const readyAt = cooldownRef.current.get(obstacle.id) || 0;
      if (now < readyAt) continue;

      const dist = metersBetween(playerPos, obstacle);
      if (dist <= obstacle.radiusMeters) {
        cooldownRef.current.set(obstacle.id, now + RETRIGGER_COOLDOWN_MS);
        setObstacleLabel(obstacle.label || 'an obstacle');
        setActive(true);
        onLockChange?.(true);

        lockTimerRef.current = setTimeout(() => {
          setActive(false);
          onLockChange?.(false);
        }, LOCKOUT_MS);
        break;
      }
    }
  }, [playerPos, obstacles, active, onLockChange]);

  useEffect(() => () => clearTimeout(lockTimerRef.current), []);

  if (!active) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.flash} />
      <div style={styles.card}>
        <div style={styles.icon}>👀</div>
        <div style={styles.title}>Look up!</div>
        <div style={styles.subtitle}>You're near {obstacleLabel} — watch where you're walking.</div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'absolute', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center',
    justifyContent: 'center', pointerEvents: 'all',
  },
  flash: {
    position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)',
    animation: 'obstacleFlashFade 2000ms ease-out forwards',
  },
  card: {
    position: 'relative', zIndex: 1, textAlign: 'center', padding: '20px 28px', borderRadius: 18,
    background: 'rgba(11,31,15,0.9)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
    maxWidth: 260,
  },
  icon: { fontSize: 30, marginBottom: 6 },
  title: { fontSize: 18, fontWeight: 800, marginBottom: 4 },
  subtitle: { fontSize: 13, opacity: 0.85, lineHeight: 1.4 },
};

// Inject the flash keyframes once (styles object above can't hold @keyframes).
if (typeof document !== 'undefined' && !document.getElementById('obstacle-flash-keyframes')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'obstacle-flash-keyframes';
  styleTag.textContent = `
    @keyframes obstacleFlashFade {
      0% { opacity: 0.9; }
      100% { opacity: 0; }
    }
  `;
  document.head.appendChild(styleTag);
}
