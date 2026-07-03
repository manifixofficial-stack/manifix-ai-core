// components/ViewfinderBox.jsx
//
// Center reticle. Previously static — now reacts live to whether a target
// is currently inside it (`targetInBounds`), the current lock `status`,
// and how close the nearest tracked target is (`activeScale`, which grows
// the box as you approach — see GameCanvas.jsx's nearestTargetScale memo).
//
// Converted from the Tailwind-class version to inline styles to match
// every other component in this codebase (Scoreboard/CaptureOverlay/etc.
// all use style={{...}} objects, not className strings) — if Tailwind is
// actually configured in this project, say so and this can switch back.

import React from 'react';

const STATUS_STYLES = {
  searching: { border: '#f59e0b66', text: '#f59e0b', label: 'SCANNING...' },
  acquired: { border: '#2dd4bf', text: '#2dd4bf', label: 'TARGET ACQUIRED' },
  locking: { border: '#22d3ee', text: '#22d3ee', label: 'LOCKING...' },
  success: { border: '#10b981', text: '#10b981', label: 'ASSET SECURED' },
  failed: { border: '#f43f5e', text: '#f43f5e', label: 'LOCK LOST' },
};

export default function ViewfinderBox({
  centerX,
  centerY,
  size = 96,
  status = 'searching',
  targetInBounds = false,
  activeScale = 1.0,
}) {
  const resolvedKey =
    status === 'searching' && targetInBounds ? 'acquired' : STATUS_STYLES[status] ? status : 'searching';
  const s = STATUS_STYLES[resolvedKey];

  const width = size * activeScale;
  const height = size * 1.4 * activeScale;

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
      `}</style>

      <div
        style={{
          position: 'relative',
          width,
          height,
          border: `2px dashed ${s.border}`,
          borderRadius: 12,
          transition: 'width 100ms ease-out, height 100ms ease-out, border-color 150ms ease-out',
          animation: resolvedKey === 'locking' ? 'viewfinderPulse 0.6s infinite' : 'none',
        }}
      >
        {/* Corner brackets */}
        {[
          { top: -6, left: -6, borderWidth: '4px 0 0 4px' },
          { top: -6, right: -6, borderWidth: '4px 4px 0 0' },
          { bottom: -6, left: -6, borderWidth: '0 0 4px 4px' },
          { bottom: -6, right: -6, borderWidth: '0 4px 4px 0' },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 16,
              height: 16,
              borderStyle: 'solid',
              borderColor: s.border,
              ...pos,
            }}
          />
        ))}

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
      </div>

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
        }}
      >
        {s.label}
      </div>
    </div>
  );
}
