import React from 'react';

/**
 * PerspectiveGridOverlay
 * -----------------------
 * 3D vanishing-point wireframe drawn over the AR camera feed. Pure overlay,
 * no state, no interactivity — sits above the <video>/simBackground layer
 * and below sprites/UI.
 *
 * Mount directly inside GameCanvas's root wrap div:
 *   <PerspectiveGridOverlay />
 */
export default function PerspectiveGridOverlay({ color = 'rgba(250, 204, 21, 0.8)' }) {
  return (
    <svg
      style={styles.svg}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Corner-to-center vanishing lines */}
      <line x1="0" y1="0" x2="38" y2="35" stroke={color} strokeWidth="0.4" />
      <line x1="100" y1="0" x2="62" y2="35" stroke={color} strokeWidth="0.4" />
      <line x1="0" y1="100" x2="38" y2="65" stroke={color} strokeWidth="0.4" />
      <line x1="100" y1="100" x2="62" y2="65" stroke={color} strokeWidth="0.4" />

      {/* Secondary side horizon lines for extra depth */}
      <line x1="0" y1="50" x2="38" y2="50" stroke={color} strokeWidth="0.2" strokeOpacity="0.5" />
      <line x1="100" y1="50" x2="62" y2="50" stroke={color} strokeWidth="0.2" strokeOpacity="0.5" />

      {/* Central dashed focus rectangle */}
      <rect x="38" y="35" width="24" height="30" fill="none" stroke={color} strokeWidth="0.6" strokeDasharray="2,1" />
    </svg>
  );
}

const styles = {
  svg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
    pointerEvents: 'none',
  },
};
