// src/socket.js — The Ultra Low-Latency Stream Conduit
// Background connector module: opens a raw WebSocket pipeline between the phone
// and the hosted server node, streaming thumb coordinates up to 45x/sec with no polling.
import { io } from 'socket.io-client';

// Falls back to the production Render URL if no env var is set, so nothing breaks
// if VITE_SERVER_URL isn't configured yet — but lets you point at localhost in dev
// without editing this file. Set VITE_SERVER_URL in .env / Vercel project settings.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://manifix-ai-core.onrender.com';

export const socket = io(SERVER_URL, {
  autoConnect: false, // Wait until the player submits a room code to connect
  transports: ['websocket'], // Forces clean, ultra-low lag inputs — no long-polling fallback
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500, // Fast first retry — a dropped Wi-Fi blip shouldn't feel laggy
  reconnectionDelayMax: 4000,
  timeout: 8000,
});

// Connection state machine matching the ConnectionStatus.jsx badge:
//   'syncing'      -> amber pulsing dot   (SYNCING TO ROOM...)
//   'connected'    -> green glowing dot   (LIVE HANDSHAKE ACCELERATED)
//   'disconnected' -> red blinking dot    (CONNECTION LOST — RETRYING)
export function connectToRoom(roomCode, onStateChange) {
  onStateChange?.('syncing');

  socket.connect();

  socket.once('connect', () => {
    onStateChange?.('connected');
    socket.emit('join_room', { roomCode });
  });

  socket.on('disconnect', () => {
    onStateChange?.('disconnected');
  });

  socket.on('reconnect_attempt', () => {
    onStateChange?.('syncing');
  });

  socket.on('reconnect', () => {
    onStateChange?.('connected');
    socket.emit('join_room', { roomCode });
  });

  socket.on('connect_error', () => {
    onStateChange?.('disconnected');
  });
}

export function disconnectFromRoom() {
  socket.removeAllListeners('connect');
  socket.removeAllListeners('disconnect');
  socket.removeAllListeners('reconnect_attempt');
  socket.removeAllListeners('reconnect');
  socket.removeAllListeners('connect_error');
  socket.disconnect();
}
