import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { socket } from '../socket';

// src/components/ConnectionStatus.jsx — The Veggie GO Radar Network Badge
//
// Controlled usage (recommended): pass `phase` down from whatever component
// called connectToRoom(roomCode, onStateChange) in socket.js — that callback
// already produces 'syncing' | 'connected' | 'disconnected', so this badge
// and your actual game logic never disagree about connection state.
//
// Uncontrolled fallback: if no `phase` prop is given, this listens to the
// raw socket 'connect'/'disconnect' events itself. NOTE: it does NOT assume
// a 'room-joined' server event — that contract isn't confirmed against
// backend/server.js yet. Once we review the backend, we can wire a real
// "actually synced into the room" signal here instead of just raw connect.
//
// Copy pass: consumer-app cartoon voice, not network-engineer jargon
// ("SATELLITE SCANNING AREA…" not "SYNCING"). On connect, the badge also
// confirms GPS lock + leaderboard sync in a subline, since that pairing is
// the actual in-game promise (live rank tracking), not just "you're online."
//
// Visually matched to RoomJoin.jsx / CharacterSelect.jsx: same glass panel
// (rgba(18,16,12,0.72), gold-tinted border, backdrop blur), same Orbitron
// badge typography, and motion handled via framer-motion (not raw CSS
// @keyframes) so every animated element in the app speaks one language.
function ConnectionStatus({ roomCode, phase: controlledPhase }) {
  const [internalPhase, setInternalPhase] = useState(
    socket.connected ? 'connected' : 'disconnected'
  );

  useEffect(() => {
    if (controlledPhase) return; // parent owns state — skip internal listeners

    setInternalPhase(socket.connected ? 'connected' : 'disconnected');
    const handleConnect = () => setInternalPhase('connected');
    const handleDisconnect = () => setInternalPhase('disconnected');
    const handleReconnectAttempt = () => setInternalPhase('syncing');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
    };
  }, [controlledPhase]);

  const phase = controlledPhase || internalPhase;

  const PHASE_CONFIG = {
    syncing: {
      label: 'SATELLITE SCANNING AREA…',
      sublabel: null,
      color: '#FFC93C', // amber
      pulse: 'blink',
    },
    connected: {
      label: `🛰️ VEGGIE NETWORK ACTIVE${roomCode ? ` — ARENA ${roomCode}` : ''}`,
      sublabel: 'GPS locked · Leaderboard synced',
      color: '#39ff88', // neon green
      pulse: 'glow',
    },
    disconnected: {
      label: 'NETWORK CRASHED — RECONNECTING…',
      sublabel: null,
      color: '#ff3333', // red
      pulse: 'blink',
    },
  };

  const { label, sublabel, color, pulse } = PHASE_CONFIG[phase] || PHASE_CONFIG.disconnected;

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
        border: `2px solid ${phase === 'connected' ? color : 'rgba(255, 215, 0, 0.35)'}`,
        borderRadius: '999px',
        backdropFilter: 'blur(10px)',
        boxShadow:
          phase === 'disconnected'
            ? '0 0 15px rgba(255, 51, 51, 0.3)'
            : phase === 'connected'
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
            textShadow: phase === 'connected' ? `0 0 4px ${color}44` : 'none',
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
