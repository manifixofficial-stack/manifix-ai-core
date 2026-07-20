import React from 'react';
import { motion } from 'framer-motion';
// src/components/ConnectionStatus.jsx — The Veggie GO Radar Network Badge
//
// THIS REVISION: fixed a real bug — this component's PHASE_CONFIG only
// defined 'idle' | 'local' | 'disconnected', but App.jsx actually sends
// tickStatus values of 'connecting' | 'joined' | 'connected' | 'failed' |
// 'error' | 'disconnected' | 'idle' (from tickClient.js's onStatusChange
// plus App.jsx's own setTickStatus calls). Every one of those unmatched
// values silently fell through `PHASE_CONFIG[phase] || PHASE_CONFIG.idle`
// to the idle "SATELLITE SCANNING AREA…" badge — meaning the connection
// indicator lied and showed "not connected" even while fully connected
// and mid-match. Also removed the stale header comment claiming the game
// "runs fully offline (no Supabase, no tick server)" — that described an
// earlier version; App.jsx now drives a real Socket.io connection via
// gameClient.js/tickClient.js, and this badge should say so accurately.
//
// normalizePhase() below buckets every real tickStatus value into one of
// five badge states, so nothing new App.jsx starts sending later
// silently falls back to idle again without at least degrading sensibly.
function normalizePhase(raw) {
  switch (raw) {
    case 'connecting':
      return 'connecting';
    case 'joined':
    case 'connected':
      return 'connected';
    case 'disconnected':
      return 'disconnected';
    case 'failed':
    case 'error':
      return 'error';
    case 'idle':
    default:
      return 'idle';
  }
}

const PHASE_CONFIG = {
  idle: {
    label: 'SATELLITE SCANNING AREA…',
    sublabel: null,
    color: '#FFC93C', // amber
    pulse: 'blink',
  },
  connecting: {
    label: 'LINKING TO ARENA SERVER…',
    sublabel: null,
    color: '#FFC93C', // amber
    pulse: 'blink',
  },
  connected: {
    label: (roomCode) => `📡 LIVE — ARENA ${roomCode || 'SCANNING'}`,
    sublabel: 'Connected · Multiplayer sync active',
    color: '#39ff88', // neon green
    pulse: 'glow',
  },
  disconnected: {
    label: 'CONNECTION LOST — RECONNECTING…',
    sublabel: null,
    color: '#ff3333', // red
    pulse: 'blink',
  },
  error: {
    label: 'CONNECTION FAILED — CHECK NETWORK',
    sublabel: null,
    color: '#ff3333', // red
    pulse: 'blink',
  },
};

// phase is whatever App.jsx's tickStatus currently is — normalized below
// rather than requiring App.jsx to already speak this component's vocabulary.
function ConnectionStatus({ roomCode, phase }) {
  const bucket = normalizePhase(phase);
  const config = PHASE_CONFIG[bucket];
  const label = typeof config.label === 'function' ? config.label(roomCode) : config.label;
  const { sublabel, color, pulse } = config;

  const dotAnimation =
    pulse === 'blink'
      ? { opacity: [0.2, 1, 0.2] }
      : { boxShadow: [`0 0 6px ${color}`, `0 0 14px ${color}`, `0 0 6px ${color}`] };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: sublabel ? '7px 14px' : '6px 12px',
        background: 'rgba(18, 16, 12, 0.72)',
        border: `2px solid ${bucket === 'connected' ? color : 'rgba(255, 215, 0, 0.35)'}`,
        borderRadius: '999px',
        backdropFilter: 'blur(10px)',
        boxShadow:
          bucket === 'disconnected' || bucket === 'error'
            ? '0 0 15px rgba(255, 51, 51, 0.3)'
            : bucket === 'connected'
            ? `0 0 12px ${color}55`
            : '0 0 10px rgba(255, 201, 60, 0.2)',
        fontSize: '11px',
        fontWeight: 900,
        letterSpacing: '1px',
        fontFamily: "'Orbitron', sans-serif",
        zIndex: 999,
        pointerEvents: 'none',
        maxWidth: '90vw',
        boxSizing: 'border-box',
      }}
    >
      <motion.span
        animate={dotAnimation}
        transition={{ duration: pulse === 'blink' ? 0.8 : 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 10px ${color}`,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <span style={{ display: 'flex', flexDirection: 'column', gap: sublabel ? '2px' : 0, overflow: 'hidden' }}>
        <span
          style={{
            color,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: bucket === 'connected' ? `0 0 4px ${color}44` : 'none',
          }}
        >
          {label}
        </span>
        {sublabel && (
          <span
            style={{
              color: '#F5F0E8',
              opacity: 0.7,
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
            }}
          >
            {sublabel}
          </span>
        )}
      </span>
    </motion.div>
  );
}

export default ConnectionStatus;
