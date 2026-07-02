import React from 'react';

const LABELS = { carrot: 'Carrot', tomato: 'Tomato', broccoli: 'Broccoli', golden: 'Golden Veggie' };

/**
 * Compass-style arrow pointing toward the nearest tracked veggie, shown
 * whenever it's too far to have appeared on screen yet. bearingDeg is
 * 0 = north, 90 = east, matching bearingScreenPos's convention in
 * GameCanvas so the arrow and the eventual on-screen spawn agree.
 */
export default function RadarIndicator({ type, distanceMeters, bearingDeg }) {
  if (distanceMeters == null || !Number.isFinite(distanceMeters)) return null;

  return (
    <div style={styles.wrap}>
      <div style={{ ...styles.arrow, transform: `rotate(${bearingDeg}deg)` }}>▲</div>
      <div style={styles.label}>
        {LABELS[type] || type}: {Math.round(distanceMeters)}m away
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: 'absolute', top: 54, left: '50%', transform: 'translateX(-50%)', zIndex: 45,
    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999,
    background: 'rgba(0,0,0,0.55)', color: '#fef08a', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
  arrow: { fontSize: 14, lineHeight: 1, transition: 'transform 0.2s ease' },
  label: {},
};
