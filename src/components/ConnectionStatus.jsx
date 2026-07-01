import React, { useState, useEffect } from 'react';
import { socket } from '../socket';

// src/components/ConnectionStatus.jsx — The Floating Cyber Signal Badge
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
      label: 'SYNCING TO ROOM...',
      color: '#FFC93C', // amber
      blink: true,
    },
    connected: {
      label: `LIVE HANDSHAKE ACCELERATED${roomCode ? ` — ROOM ${roomCode}` : ''}`,
      color: '#39ff88', // neon green
      blink: false,
    },
    disconnected: {
      label: 'CONNECTION LOST — RETRYING',
      color: '#ff3333', // red
      blink: true,
    },
  };

  const { label, color, blink } = PHASE_CONFIG[phase] || PHASE_CONFIG.disconnected;

  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        background: phase === 'disconnected' ? 'rgba(255, 51, 51, 0.1)' : 'rgba(8, 8, 10, 0.7)',
        border: `1px solid ${phase === 'connected' ? color : 'rgba(255, 201, 60, 0.35)'}`,
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '1px',
        fontFamily: "'Orbitron', monospace",
        zIndex: 999,
        pointerEvents: 'none',
        maxWidth: '90vw',
        boxSizing: 'border-box',
        boxShadow:
          phase === 'disconnected'
            ? '0 0 15px rgba(255, 51, 51, 0.25)'
            : phase === 'connected'
            ? `0 0 12px ${color}55`
            : '0 0 10px rgba(255, 201, 60, 0.15)',
        transition: 'all 0.3s ease',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
          display: 'inline-block',
          flexShrink: 0,
          animation: blink ? 'blinkAnimation 1s infinite' : phase === 'connected' ? 'glowPulse 2s ease-in-out infinite' : 'none',
        }}
      />
      <span
        style={{
          color,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </span>
      <style>{`
        @keyframes blinkAnimation {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 6px ${color}; }
          50% { box-shadow: 0 0 14px ${color}; }
        }
      `}</style>
    </div>
  );
}

export default ConnectionStatus;
