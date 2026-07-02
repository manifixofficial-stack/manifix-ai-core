import React, { useMemo } from 'react';

const STAMPEDE_RADIUS_METERS = 5;

const CHARACTER_EMOJI = { carrot: '🥕', tomato: '🍅', broccoli: '🥦', golden: '✨🌽' };

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

/**
 * Purely decorative — renders each other player's own chosen avatar +
 * nickname (the same info already shown on the Scoreboard) clipping in
 * from the screen edge matching their real-world bearing, whenever they're
 * within STAMPEDE_RADIUS_METERS of the local player. No video, camera, or
 * location data beyond what's already broadcast for the scoreboard.
 */
export default function PlayerStampedeOverlay({ players = [], selfId, playerPos, screenW, screenH }) {
  const nearby = useMemo(() => {
    if (!playerPos) return [];
    return players
      .filter((p) => p.id !== selfId && p.lat != null && p.lng != null)
      .map((p) => ({ ...p, distance: metersBetween(playerPos, p), bearing: bearingDegrees(playerPos, p) }))
      .filter((p) => p.distance <= STAMPEDE_RADIUS_METERS);
  }, [players, selfId, playerPos]);

  if (!nearby.length) return null;

  return (
    <div style={{ ...styles.wrap, width: screenW, height: screenH }}>
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
    </div>
  );
}

const styles = {
  wrap: { position: 'absolute', inset: 0, zIndex: 35, pointerEvents: 'none', overflow: 'hidden' },
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
