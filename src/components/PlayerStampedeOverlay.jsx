import React, { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';

const STAMPEDE_RADIUS_METERS = 5;
const CHARACTER_EMOJI = { carrot: '🥕', tomato: '🍅', broccoli: '🥦', golden: '✨🌽' };

// -----------------------------------------------------------------------
// Shake / drift tunables
// -----------------------------------------------------------------------
const MAX_SHAKE_PX = 16; // screen-shake amplitude at max density
const MAX_DRIFT_PX = 34; // crosshair deflection amplitude at max density
const TARGET_REFRESH_MS = 140; // how often a new random jitter target is picked
const SMOOTH_FACTOR = 0.25; // per-frame lerp toward the current jitter target

// -----------------------------------------------------------------------
// Audio tunables
// -----------------------------------------------------------------------
const MAX_CROWD_GAIN = 0.5; // ceiling so it never fully drowns out other SFX
const GAIN_RAMP_SEC = 0.35;

function metersBetween(a, b) {
  if (!a || !b) return Infinity;
  const dLat = (b.lat - a.lat) * 111320;
  const dLng = (b.lng - a.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}
function bearingDegrees(from, to) {
  const dLat = (to.lat - from.lat) * 111320;
  const dLng = (to.lng - from.lng) * 111320 * Math.cos((from.lat * Math.PI) / 180);
  const angle = Math.atan2(dLng, dLat); // 0 = north
  return ((angle * 180) / Math.PI + 360) % 360;
}
// Map a compass bearing to whichever screen edge a nearby player's avatar
// should clip in from — an approximation since we don't have device heading,
// but it's enough to sell "someone's crowding into your shot from over there."
function edgeFromBearing(deg) {
  if (deg >= 315 || deg < 45) return 'top';
  if (deg >= 45 && deg < 135) return 'right';
  if (deg >= 135 && deg < 225) return 'bottom';
  return 'left';
}
const EDGE_STYLES = {
  top: { top: -18, left: '50%', transform: 'translateX(-50%) rotate(180deg)' },
  bottom: { bottom: -18, left: '50%', transform: 'translateX(-50%)' },
  left: { left: -18, top: '50%', transform: 'translateY(-50%) rotate(90deg)' },
  right: { right: -18, top: '50%', transform: 'translateY(-50%) rotate(-90deg)' },
};

// 0..1 cluster-density score: grows with how many nearby players there
// are AND how close each one is, so a single distant player barely
// registers but three people crowding in from all sides maxes it out
// fast. Drives shake, drift, and crowd-audio gain from one shared number.
function densityScoreFor(nearby) {
  if (!nearby.length) return 0;
  const raw = nearby.reduce((acc, p) => acc + Math.max(0, 1 - p.distance / STAMPEDE_RADIUS_METERS), 0);
  return Math.max(0, Math.min(1, raw / 4)); // 4 close players ≈ fully maxed
}

// Generates a short white-noise buffer once per AudioContext — this is
// the raw material for a synthesized "roaring crowd + running footsteps"
// bed without needing to ship/fetch an actual audio asset.
function buildNoiseBuffer(ctx) {
  const seconds = 2;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Renders each other nearby player's own chosen avatar + nickname (the
 * same info already shown on the Scoreboard) clipping in from the screen
 * edge matching their real-world bearing, whenever they're within
 * STAMPEDE_RADIUS_METERS of the local player — no video, camera, or
 * location data beyond what's already broadcast for the scoreboard.
 *
 * On top of that purely-decorative avatar layer, this also:
 *   - reports a proximity-scaled screen-shake vector via onScreenShake so
 *     GameCanvas.jsx can shudder the camera view as the cluster closes in
 *   - reports a proximity-scaled crosshair deflection via onAimDrift so
 *     the targeting reticle wobbles/slides instead of holding steady
 *   - renders extra generic (non-identifying) runner silhouettes along
 *     the bottom/sides purely for crowd atmosphere
 *   - synthesizes and plays a looping crowd-noise bed locally via the
 *     Web Audio API, scaling its gain with cluster density — no external
 *     audio asset required
 *
 * onScreenShake/onAimDrift/onAudioBlocked are all optional; if omitted
 * this component still renders the avatar layer exactly as before.
 */
export default function PlayerStampedeOverlay({
  players = [],
  selfId,
  playerPos,
  screenW,
  screenH,
  onScreenShake,
  onAimDrift,
  onAudioBlocked,
}) {
  const nearby = useMemo(() => {
    if (!playerPos) return [];
    return players
      .filter((p) => p.id !== selfId && p.lat != null && p.lng != null)
      .map((p) => ({ ...p, distance: metersBetween(playerPos, p), bearing: bearingDegrees(playerPos, p) }))
      .filter((p) => p.distance <= STAMPEDE_RADIUS_METERS);
  }, [players, selfId, playerPos]);

  const density = useMemo(() => densityScoreFor(nearby), [nearby]);

  // ---- Screen-shake + aim-drift: shared smoothed-random-walk loop ----
  const shakeStateRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, lastPickTs: 0 });
  const driftStateRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, lastPickTs: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    if (density <= 0) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      onScreenShake?.({ x: 0, y: 0 });
      onAimDrift?.({ x: 0, y: 0 });
      return undefined;
    }

    const step = (ts) => {
      const shake = shakeStateRef.current;
      const drift = driftStateRef.current;

      if (ts - shake.lastPickTs > TARGET_REFRESH_MS) {
        shake.targetX = (Math.random() * 2 - 1) * MAX_SHAKE_PX * density;
        shake.targetY = (Math.random() * 2 - 1) * MAX_SHAKE_PX * density;
        shake.lastPickTs = ts;
      }
      if (ts - drift.lastPickTs > TARGET_REFRESH_MS * 2.5) {
        drift.targetX = (Math.random() * 2 - 1) * MAX_DRIFT_PX * density;
        drift.targetY = (Math.random() * 2 - 1) * MAX_DRIFT_PX * density;
        drift.lastPickTs = ts;
      }

      shake.x += (shake.targetX - shake.x) * SMOOTH_FACTOR;
      shake.y += (shake.targetY - shake.y) * SMOOTH_FACTOR;
      drift.x += (drift.targetX - drift.x) * (SMOOTH_FACTOR * 0.6);
      drift.y += (drift.targetY - drift.y) * (SMOOTH_FACTOR * 0.6);

      onScreenShake?.({ x: shake.x, y: shake.y });
      onAimDrift?.({ x: drift.x, y: drift.y });

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [density > 0, onScreenShake, onAimDrift]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Crowd-noise audio: lazily-created, gain scales with density ----
  const audioRef = useRef(null); // { ctx, gainNode, source }

  useEffect(() => {
    if (density <= 0) {
      const audio = audioRef.current;
      if (audio) {
        audio.gainNode.gain.linearRampToValueAtTime(0, audio.ctx.currentTime + GAIN_RAMP_SEC);
      }
      return;
    }

    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioRef.current) {
      try {
        const ctx = new AudioCtx();
        const source = ctx.createBufferSource();
        source.buffer = buildNoiseBuffer(ctx);
        source.loop = true;

        // Bandpass tuned low so raw white noise reads as a distant
        // rumble/roar-and-footsteps bed rather than pure static.
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 220;
        filter.Q.value = 0.6;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0;

        source.connect(filter).connect(gainNode).connect(ctx.destination);
        source.start();

        audioRef.current = { ctx, gainNode, source };
      } catch (err) {
        // Autoplay policies can block AudioContext creation before any
        // user gesture has happened — degrade silently, but let the
        // parent know so it can nudge the player to interact first if
        // it cares to.
        onAudioBlocked?.(err);
        return;
      }
    }

    const audio = audioRef.current;
    if (audio && audio.ctx.state === 'suspended') {
      audio.ctx.resume().catch(() => onAudioBlocked?.(new Error('AudioContext resume blocked')));
    }
    if (audio) {
      const targetGain = MAX_CROWD_GAIN * density;
      audio.gainNode.gain.linearRampToValueAtTime(targetGain, audio.ctx.currentTime + GAIN_RAMP_SEC);
    }
  }, [density, onAudioBlocked]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        try {
          audio.source.stop();
          audio.ctx.close();
        } catch {
          // already stopped/closed — nothing to clean up
        }
      }
    };
  }, []);

  if (!nearby.length) return null;

  const silhouetteCount = Math.min(8, nearby.length * 2);

  return (
    <div style={{ ...styles.wrap, width: screenW, height: screenH }}>
      {/* Generic crowd silhouettes — decorative only, not tied to any
          specific player's identity/position, just sells "a mob is
          closing in" along the bottom/sides, spilling past the 4:3
          frame edges. */}
      <div style={styles.silhouetteLayer}>
        {Array.from({ length: silhouetteCount }).map((_, i) => (
          <motion.div
            key={i}
            style={{
              ...styles.silhouette,
              bottom: -10 + (i % 3) * 6,
            }}
            initial={{ x: i % 2 === 0 ? '-20%' : '120%' }}
            animate={{ x: i % 2 === 0 ? '120%' : '-20%' }}
            transition={{
              duration: 1.1 - Math.min(0.6, density * 0.6),
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.08,
            }}
          >
            🏃
          </motion.div>
        ))}
      </div>

      {/* Real per-player avatar intruders — unchanged identification
          layer, still sourced only from already-broadcast scoreboard
          data (id, nickname, character, lat/lng). */}
      {nearby.map((p) => {
        const edge = edgeFromBearing(p.bearing);
        return (
          <div key={p.id} style={{ ...styles.intruder, ...EDGE_STYLES[edge] }}>
            <div style={styles.hand}>
              <span style={styles.emoji}>{CHARACTER_EMOJI[p.characterId] || '🖐️'}</span>
              <span style={styles.net}>🥅</span>
            </div>
            <div style={{ ...styles.nametag, transform: EDGE_STYLES[edge].transform.replace(/rotate\([^)]*\)/, '') }}>
              {p.nickname}
            </div>
          </div>
        );
      })}

      {/* Hazard wrapper — the flashing yellow/red warning border called
          out in the original spec, intensity tied to the same density
          score driving shake/drift/audio. */}
      <motion.div
        style={styles.hazardBorder}
        animate={{ opacity: [0.25, 0.7, 0.25] }}
        transition={{ duration: Math.max(0.35, 0.9 - density * 0.5), repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

const styles = {
  wrap: { position: 'absolute', inset: 0, zIndex: 35, pointerEvents: 'none', overflow: 'visible' },
  silhouetteLayer: {
    position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none',
  },
  silhouette: {
    position: 'absolute', fontSize: 30, filter: 'brightness(0) saturate(100%) drop-shadow(0 0 6px rgba(255,60,60,0.6))',
    opacity: 0.85,
  },
  intruder: {
    position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center',
    animation: 'stampedeSwipe 0.9s ease-in-out infinite alternate',
  },
  hand: { fontSize: 40, display: 'flex', alignItems: 'center', gap: -6, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' },
  emoji: { fontSize: 34 },
  net: { fontSize: 26, marginLeft: -10 },
  nametag: {
    marginTop: 2, fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.5)',
    padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap',
  },
  hazardBorder: {
    position: 'absolute', inset: 0, border: '6px solid', borderImage: 'repeating-linear-gradient(45deg, #ffd60a 0 20px, #ff003c 20px 40px) 6',
    boxSizing: 'border-box',
  },
};
if (typeof document !== 'undefined' && !document.getElementById('stampede-keyframes')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'stampede-keyframes';
  styleTag.textContent = `
    @keyframes stampedeSwipe {
      0% { margin-left: -8px; margin-top: -8px; }
      100% { margin-left: 8px; margin-top: 8px; }
    }
  `;
  document.head.appendChild(styleTag);
}
