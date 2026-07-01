import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// Point this at your Railway backend base URL (same host that runs Gpt.jsx streaming).
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://your-railway-app.up.railway.app';

const TRACK_CONFIG = [
  { id: 'blue', label: 'BLUE', color: '#3b82f6' },
  { id: 'purple', label: 'PURPLE', color: '#a855f7' },
  { id: 'pink', label: 'PINK', color: '#ec4899' },
  { id: 'orange', label: 'ORANGE', color: '#f97316' },
];

export default function VeggieGoLobby() {
  const [screen, setScreen] = useState('join'); // 'join' | 'lobby'
  const [codeInput, setCodeInput] = useState('');
  const [roomCode, setRoomCode] = useState(null);
  const [tracks, setTracks] = useState({ blue: null, purple: null, pink: null, orange: null });
  const [myId, setMyId] = useState(null);
  const [joinError, setJoinError] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL + '/veggiego', {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setMyId(socket.id);
    });

    socket.on('room-state', (state) => {
      setTracks(state.tracks);
    });

    socket.on('join-error', (err) => {
      setJoinError((err && err.message) || 'Could not join room');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoin = useCallback(() => {
    const trimmed = codeInput.trim();
    if (!trimmed) {
      setJoinError('Enter a room code');
      return;
    }
    if (!socketRef.current) return;
    setJoinError('');
    socketRef.current.emit('join-room', { code: trimmed });
    setRoomCode(trimmed);
    setScreen('lobby');
  }, [codeInput]);

  const handleClaim = useCallback((trackId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('claim-track', { track: trackId });
  }, []);

  const myTrack = TRACK_CONFIG.find((t) => tracks[t.id] === myId);

  if (screen === 'join') {
    return (
      <div style={styles.wrapper}>
        <h1 style={styles.title}>VEGGIE GO</h1>
        <p style={styles.subtitle}>Enter the room code to join</p>
        <input
          style={styles.input}
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="555"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleJoin();
          }}
        />
        <button style={styles.joinButton} onClick={handleJoin}>
          JOIN ROOM
        </button>
        {joinError ? <p style={styles.error}>{joinError}</p> : null}
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>ROOM {roomCode}</h1>
      <p style={styles.subtitle}>
        {myTrack ? "You're on " + myTrack.label : 'Claim your track'}
      </p>
      <div style={styles.trackGrid}>
        {TRACK_CONFIG.map((track) => {
          const holderId = tracks[track.id];
          const isMine = holderId === myId;
          const isLocked = holderId !== null;
          return (
            <button
              key={track.id}
              onClick={() => {
                if (!isLocked) handleClaim(track.id);
              }}
              disabled={isLocked && !isMine}
              style={{
                ...styles.trackButton,
                borderColor: track.color,
                opacity: isLocked && !isMine ? 0.5 : 1,
                cursor: isLocked && !isMine ? 'not-allowed' : 'pointer',
              }}
            >
              <div style={{ ...styles.trackDot, backgroundColor: track.color }} />
              <span style={styles.trackLabel}>{track.label}</span>
              {isLocked ? (
                <span style={{ ...styles.stamp, color: isMine ? '#ffc83c' : '#888888' }}>
                  IN GAME
                </span>
              ) : (
                <span style={styles.claimText}>CLAIM</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: '#080808',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    fontFamily: '"DM Mono", monospace',
    textAlign: 'center',
  },
  title: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '48px',
    letterSpacing: '2px',
    color: '#ffc83c',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#c8a84b',
    marginBottom: '24px',
  },
  input: {
    backgroundColor: '#111111',
    border: '1px solid #c8a84b',
    color: '#ffffff',
    fontFamily: '"DM Mono", monospace',
    fontSize: '24px',
    textAlign: 'center',
    letterSpacing: '8px',
    padding: '12px 16px',
    width: '160px',
    borderRadius: '8px',
    marginBottom: '16px',
    outline: 'none',
  },
  joinButton: {
    backgroundColor: '#ffc83c',
    color: '#080808',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '18px',
    letterSpacing: '2px',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 32px',
    cursor: 'pointer',
  },
  error: {
    color: '#ff5c5c',
    fontSize: '13px',
    marginTop: '12px',
  },
  trackGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    width: '100%',
    maxWidth: '360px',
  },
  trackButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#111111',
    border: '2px solid',
    borderRadius: '12px',
    padding: '24px 12px',
    fontFamily: '"DM Mono", monospace',
  },
  trackDot: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
  },
  trackLabel: {
    color: '#ffffff',
    fontSize: '14px',
    letterSpacing: '1px',
  },
  claimText: {
    fontFamily: '"Bebas Neue", sans-serif',
    color: '#ffc83c',
    fontSize: '16px',
    letterSpacing: '1px',
  },
  stamp: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '16px',
    letterSpacing: '1px',
    border: '1px solid currentColor',
    padding: '2px 8px',
    borderRadius: '4px',
  },
};
