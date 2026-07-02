// src/socket.js — The Ultra Low-Latency Stream Conduit
// Background connector module: opens a raw WebSocket pipeline between the phone
// and the hosted server node, streaming location + gameplay events with no polling
// once connected.
import { io } from 'socket.io-client';

// Falls back to the production Render URL if no env var is set, so nothing breaks
// if VITE_SERVER_URL isn't configured yet — but lets you point at localhost in dev
// without editing this file. Set VITE_SERVER_URL in .env / Vercel project settings.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://manifix-ai-core.onrender.com';

export const socket = io(SERVER_URL, {
  autoConnect: false, // Wait until the player submits a room code to connect
  // Prefer websocket for lowest latency, but allow polling as a fallback —
  // 'websocket'-only will hard-fail on networks (some corporate/campus wifi,
  // certain carriers) that block raw upgrades. socket.io still upgrades to
  // websocket automatically once the handshake succeeds.
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500, // Fast first retry — a dropped Wi-Fi blip shouldn't feel laggy
  reconnectionDelayMax: 4000,
  timeout: 8000,
});

// ---------------------------------------------------------------------------
// Canonical event names.
//
// These MUST match backend/server.js exactly — server.js is the source of
// truth for wire event names. Import EVENTS everywhere instead of typing
// raw string literals, so a rename in one place doesn't silently desync
// client and server (which is what happened before: this file emitted
// 'join_room' while server.js only ever listened for 'join-room', so room
// joins never actually worked).
// ---------------------------------------------------------------------------
export const EVENTS = {
  // Lobby / room lifecycle
  JOIN_ROOM: 'join-room',
  ROOM_JOINED: 'room-joined',
  ROOM_ERROR: 'room-error',
  REQUEST_CHARACTERS: 'request-characters',
  CHARACTERS_UPDATE: 'characters-update',
  JOIN_GAME: 'join-game',
  GAME_JOINED: 'game-joined',
  CHARACTER_ERROR: 'character-error',

  // Countdown / round lifecycle
  MATCH_COUNTDOWN: 'match-countdown',
  MATCH_COUNTDOWN_CANCELLED: 'match-countdown-cancelled',
  MATCH_GO: 'match-go',
  MATCH_ENDED: 'match-ended',
  REQUEST_REPLAY: 'request-replay',

  // Live gameplay
  GAME_STATE: 'game-state',
  LOCATION_UPDATE: 'location-update',
  ATTEMPT_TACKLE: 'attempt-tackle',
  TACKLE_FAILED: 'tackle-failed',
  POINT_STEAL: 'point-steal',
  CAPTURE_ATTEMPT: 'capture-attempt',
  CAPTURE_FAILED: 'capture-failed',
  CAPTURE_RESULT: 'veggieCaught', // server emits this name directly, not 'capture-result'
  HIGH_SCORE_FLASH: 'high-score-flash',
};

// Connection state machine matching the ConnectionStatus.jsx badge:
//   'syncing'      -> amber pulsing dot   (SYNCING TO ROOM...)
//   'connected'    -> green glowing dot   (LIVE HANDSHAKE ACCELERATED)
//   'disconnected' -> red blinking dot    (CONNECTION LOST — RETRYING)
//
// `location` is required on the *first* join for a brand-new room code —
// server.js's join-room handler rejects room creation without a starting
// lat/lng (see backend/server.js). If the room already exists (a teammate
// created it first), location is ignored server-side and can be omitted.
export function connectToRoom(roomCode, location, onStateChange) {
  const { lat, lng } = location || {};

  onStateChange?.('syncing');
  socket.connect();

  const emitJoin = () => {
    socket.emit(EVENTS.JOIN_ROOM, { room: roomCode, lat, lng });
  };

  socket.once('connect', () => {
    onStateChange?.('connected');
    emitJoin();
  });

  socket.on('disconnect', () => {
    onStateChange?.('disconnected');
  });

  socket.on('reconnect_attempt', () => {
    onStateChange?.('syncing');
  });

  socket.on('reconnect', () => {
    onStateChange?.('connected');
    // Re-announce ourselves after a reconnect so the server re-attaches us
    // to the room (the room itself persists server-side as long as at
    // least one player is still connected).
    emitJoin();
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

// ---------------------------------------------------------------------------
// Gameplay action helpers — thin wrappers so components emit through a
// named function instead of scattering `socket.emit(EVENTS.X, {...})`
// call sites with slightly different payload shapes across the codebase.
// ---------------------------------------------------------------------------

// Streams a GPS fix up to the server. Called from the watchPosition callback
// in GameCanvas.jsx on every position update.
export function sendLocationUpdate(lat, lng) {
  socket.emit(EVENTS.LOCATION_UPDATE, { lat, lng });
}

// Player-initiated steal attempt (the TACKLE button). Server enforces its
// own cooldown/proximity/target checks — this just fires the request and
// lets EVENTS.TACKLE_FAILED / EVENTS.POINT_STEAL carry the outcome back.
export function attemptTackle() {
  socket.emit(EVENTS.ATTEMPT_TACKLE);
}

// Manual capture attempt on a specific vegetable, fired from the CATCH
// button once a veggie is within range.
export function attemptCapture(vegId) {
  socket.emit(EVENTS.CAPTURE_ATTEMPT, { vegId });
}

export function joinCharacter(character, name) {
  socket.emit(EVENTS.JOIN_GAME, { character, name });
}

export function requestCharacters() {
  socket.emit(EVENTS.REQUEST_CHARACTERS);
}

export function requestReplay() {
  socket.emit(EVENTS.REQUEST_REPLAY);
}
