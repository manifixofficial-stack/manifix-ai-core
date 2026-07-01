import React, { useState, useEffect } from 'react';
import { socket } from '../socket';

// roomCode: the code this phone is trying to join.
// Socket contract assumed: server emits 'room-joined' with { roomCode } once
// this phone is actually synced into the match, separate from raw 'connect'.
function ConnectionStatus({ roomCode }) {
  const [phase, setPhase] = useState(socket.connected ? 'connecting' : 'disconnected');

  useEffect(() => {
    setPhase(socket.connected ? 'connecting' : 'disconnected');

    const handleConnect = () => setPhase('connecting');
    const handleDisconnect = () => setPhase('disconnected');
    const handleRoomJoined = () => setPhase('live');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('room-joined', handleRoomJoined);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room-joined', handleRoomJoined);
    };
  }, []);

  const PHASE_CONFIG = {
    connecting: {
      label: 'SYNCING GRID...',
      color: '#ffca28',
      blink: true
    },
    live: {
      label: `LIVE HANDSHAKE ACCELERATED${roomCode ? ` — ROOM ${roomCode}` : ''}`,
      color: '#39ff88',
      blink: false
    },
    disconnected: {
      label: 'OFFLINE - ENGINE SEARCHING',
      color: '#ff3333',
      blink: true
    }
  };

  const { label, color, blink } = PHASE_CONFIG[phase];

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
        background: phase === 'disconnected' ? 'rgba(255, 51, 51, 0.1)' : 'rgba(0, 0, 0, 0.6)',
        border: `1px solid ${phase === 'live' ? color : 'rgba(255, 202, 40, 0.3)'}`,
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        fontFamily: 'monospace',
        zIndex: 999,
        pointerEvents: 'none',
        maxWidth: '90vw',
        boxSizing: 'border-box',
        boxShadow:
          phase === 'disconnected' ? '0 0 15px rgba(255, 51, 51, 0.2)' : '0 0 10px rgba(255, 202, 40, 0.05)',
        transition: 'all 0.3s ease'
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
          animation: blink ? 'blinkAnimation 1s infinite' : 'none'
        }}
      />

      <span
        style={{
          color,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {label}
      </span>

      <style>{`
        @keyframes blinkAnimation {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ConnectionStatus;
