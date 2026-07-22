// src/lib/gameClient.js
//
// Real-Time Multiplayer Game Client — thin wrapper around socket.io-client
// that talks to the live server.js (Express + Socket.IO GPS game server).
//
// THIS REVISION — RN crash fix on top of the previous two launch-blocking
// gaps closed:
//
//   3. connectSocket()/disconnectSocket() no longer touch `window`
//      unconditionally. This file is shared between the web App.jsx and
//      the native app (App.native.jsx / GameCanvas.native.jsx both need a
//      real socket.io-client instance too — socket.io-client itself works
//      fine on React Native). `window` is not guaranteed to exist in RN's
//      JS runtime unless something has explicitly polyfilled it (some
//      setups do `global.window = global`, most don't). Previously,
//      connectSocket() did `window.socket = socket` unconditionally —
//      on a real device with no polyfill, importing this file and
//      calling connectSocket() threw `ReferenceError: window is not
//      defined` immediately, meaning nothing in the native app that
//      touches sockets would ever work. Both read/write sites are now
//      guarded with `typeof window !== 'undefined'`.
//      NOTE: native code should NOT rely on window.socket even when it
//      happens to exist — use getSocket() (already exported below) or
//      the explicit `socket` prop instead (see GameCanvas.native.jsx,
//      which takes socket as a prop for exactly this reason, and
//      App.native.jsx, which passes getSocket() down to it).
//
//   1. joinRoom() accepts a 5th `deviceUUID` argument and includes it in
//      the 'join-room' payload. server.js's entire mid-match reconnect
//      grace window (RECONNECT_GRACE_MS, 45s — restores a dropped
//      player's slot/score/character if they rejoin in time) is keyed
//      entirely on deviceUUID matching an existing room.players entry.
//      Wallet/ticket-gating and personal-best leaderboard upserts are
//      also deviceUUID-keyed server-side.
//
//   2. subscribeToRoom() accepts and wires onTimingModeUpdated and
//      onPromotedToLeader callbacks, forwarding server.js's
//      'timing-mode-updated' and 'promoted-to-leader' broadcasts. Net
//      effect fixed: previously only the room leader could ever
//      advance past the mode-gate screen; every other player stayed
//      stuck on "WAITING FOR HOST TO CHOOSE MODE…" forever, even though
//      the match was actually running server-side.
//
// WHY THIS REPLACES THE ORIGINAL "LOCAL STORAGE STAND-IN" VERSION:
// The original gameClient.js never opened a network connection at all —
// joinRoom/claimCharacter/capture calls read and wrote to
// window.localStorage, and window.socket was a fake object whose
// .emit() just called those local functions directly. That works for
// one browser tab; two different phones joining the same room code
// would each be playing in their own isolated localStorage copy of the
// room and would never see each other.
//
// This version opens one real socket.io connection per client to the
// live server, and every exported function is a thin promise-based
// wrapper around emitting the matching server event and waiting for its
// server-emitted response. Event names and payload shapes match
// server.js exactly:
//
//   client emits            server responds with
//   ------------------      ---------------------------------
//   join-room          -->  room-joined | room-error
//   claim-character    -->  slot-confirmed | character-error  (DEPRECATED
//                            — server.js no longer implements
//                            'claim-character' at all; slots are
//                            auto-assigned inside join-room now. Kept
//                            here only so nothing that still imports it
//                            crashes at build time. Do not call it.)
//   update-location     (fire-and-forget, no direct response)
//   capture-attempt    -->  capture-result (+ broadcast veggieCaught)
//
// Server -> all clients in room (no request needed, just subscribe):
//   players-update, veggies-update, tick, go, glitch-pulse,
//   match-countdown-cancelled, round-end, timing-mode-updated,
//   promoted-to-leader
//
// SLOT_IDS matches server.js's takenCharacters / CHARACTER_COLORS keys
// exactly.
//
// PRIOR REVISION (hybrid gps/indoor wiring):
// updateLocation() and makeThrottledLocationWriter() forward `accuracy`
// (to classify a player as 'gps' vs 'indoor' mode per-update) and
// `heading` (to validate indoor-mode capture attempts against a
// vegetable's fixed bearing) — see server.js's getPlayerMode and
// capture-attempt handler.
//
// NOTE ON A REJECTED "REPLACEMENT" VERSION:
// A different gameClient.js was proposed alongside this one, using
// underscored event names (join_room, update_location, players_update),
// an ack-callback emit pattern, and a client-side submitRoundScore() that
// POSTs to /api/leaderboard. None of that matches server.js: its events
// are hyphenated and broadcast-based (no ack callbacks), it has no
// app.post('/api/leaderboard') route, and it deliberately never accepts
// client-reported scores (see endStage()/saveScoreToMongo() — the server
// computes and persists scores itself). That version was NOT merged in.

import { io } from 'socket.io-client';

const SLOT_IDS = ['SLOT_01', 'SLOT_02', 'SLOT_03', 'SLOT_04', 'SLOT_05', 'SLOT_06'];

// Set VITE_GAME_SERVER_URL (or REACT_APP_GAME_SERVER_URL, adjust to your
// bundler's env prefix) in your frontend's environment. Falls back to the
// known Render deployment so local dev "just works" without extra setup.
// NOTE: this constant is NOT exported. App.native.jsx's account-deletion
// call currently duplicates this URL locally rather than importing it —
// consider exporting SERVER_URL from here if that drifts.
const SERVER_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GAME_SERVER_URL) ||
  'https://manifix-ai-core.onrender.com';

const ACK_TIMEOUT_MS = 8000;

let socket = null;
let currentRoomCode = null;

// Persistent caches of the most recent broadcast from server.js, kept up
// to date regardless of whether any component has called subscribeToRoom()
// yet. Backs the one-shot fetchPlayers()/fetchVeggies() snapshot helpers
// below, and fetchTakenCharacters()'s snapshot use.
let lastKnownPlayers = [];
let lastKnownVeggies = [];

// --- Connection lifecycle ---------------------------------------------

// Call once (e.g. from App.jsx/App.native.jsx on mount) before joinRoom().
// Safe to call multiple times — reuses the existing connection if already
// open.
export function connectSocket() {
  if (socket && socket.connected) return socket;

  socket = io(SERVER_URL, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  // Exposed for any WEB code that still reads window.socket directly for
  // .on()/.off() subscriptions (e.g. GameCanvas.jsx's web version).
  // Guarded because `window` doesn't reliably exist in React Native —
  // native code should use getSocket() / the explicit socket prop
  // instead (see GameCanvas.native.jsx, which takes socket as a prop for
  // exactly this reason).
  if (typeof window !== 'undefined') {
    window.socket = socket;
  }

  // Persistent cache listeners: kept alive for the life of the socket, so
  // fetchPlayers()/fetchVeggies() always have the latest broadcast to hand
  // back immediately, even if called before any subscribeToRoom().
  socket.on('players-update', (players) => {
    lastKnownPlayers = Array.isArray(players) ? players : Object.values(players || {});
  });
  socket.on('veggies-update', (veggies) => {
    lastKnownVeggies = Array.isArray(veggies) ? veggies : Object.values(veggies || {});
  });

  socket.on('connect_error', (err) => {
    console.error('[gameClient] socket connect_error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentRoomCode = null;
    lastKnownPlayers = [];
    lastKnownVeggies = [];
    if (typeof window !== 'undefined' && window.socket) {
      delete window.socket;
    }
  }
}

export function getSocket() {
  return socket;
}

// DEPRECATED COMPATIBILITY SHIM — do not build new code against this.
export function initLocalSocketBridge() {
  return connectSocket();
}

// Wraps a one-shot emit that expects exactly one of two named response
// events back from the server, with a timeout so callers never hang
// forever if the server drops the message.
function emitAndWaitOnce(eventName, payload, successEvent, errorEvent) {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      reject(new Error('Socket not connected. Call connectSocket() first.'));
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for "${successEvent}"/"${errorEvent}" after "${eventName}"`));
    }, ACK_TIMEOUT_MS);

    function onSuccess(data) {
      cleanup();
      resolve(data);
    }
    function onError(data) {
      cleanup();
      // Resolve (not reject) so callers can branch on { success: false,
      // message } the same way the old localStorage version's callers do,
      // instead of needing try/catch everywhere.
      resolve({ success: false, ...data });
    }
    function cleanup() {
      clearTimeout(timeout);
      socket.off(successEvent, onSuccess);
      socket.off(errorEvent, onError);
    }

    socket.once(successEvent, onSuccess);
    socket.once(errorEvent, onError);
    socket.emit(eventName, payload);
  });
}

// Waits for the first live broadcast of `eventName`, resolving instantly
// from the persistent cache if one has already arrived. Used by the
// one-shot fetchPlayers()/fetchVeggies() snapshot helpers below.
function waitForFirstBroadcast(eventName, getCached, timeoutMs = ACK_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const cached = getCached();
    if (cached && cached.length) {
      resolve(cached);
      return;
    }
    if (!socket) {
      resolve(cached || []);
      return;
    }

    const timeout = setTimeout(() => {
      socket.off(eventName, onData);
      resolve(getCached() || []);
    }, timeoutMs);

    function onData(data) {
      clearTimeout(timeout);
      resolve(Array.isArray(data) ? data : Object.values(data || {}));
    }
    socket.once(eventName, onData);
  });
}

// --- Room lifecycle ------------------------------------------------------

// roomCode: string. lat/lng: numbers (used only when creating a brand new
// room, to seed vegetable spawn origin). name: player's typed call sign.
// deviceUUID: forwarded in the 'join-room' payload — see file header for
// what server.js keys off it. Passing undefined is safe (server-side
// null-checks degrade gracefully) but every caller should pass a real,
// persisted UUID whenever one is available.
export async function joinRoom(roomCode, lat, lng, name, deviceUUID) {
  connectSocket();

  if (!socket.connected) {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket failed to connect')), ACK_TIMEOUT_MS);
      socket.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  const result = await emitAndWaitOnce(
    'join-room',
    { room: roomCode, lat, lng, name, deviceUUID },
    'room-joined',
    'room-error'
  );

  if (result && result.room) {
    currentRoomCode = result.room;
    result.playerId = socket.id;
  }

  return result;
}

export async function fetchTakenCharacters(roomCode) {
  const taken = { SLOT_01: false, SLOT_02: false, SLOT_03: false, SLOT_04: false, SLOT_05: false, SLOT_06: false };
  lastKnownPlayers.forEach((p) => {
    const slot = p.slot_id || p.slotId;
    if (slot && slot in taken) taken[slot] = p.name || 'OPERATOR';
  });
  return taken;
}

export async function fetchPlayers(roomCode) {
  connectSocket();
  return waitForFirstBroadcast('players-update', () => lastKnownPlayers);
}

export async function fetchVeggies(roomCode) {
  connectSocket();
  return waitForFirstBroadcast('veggies-update', () => lastKnownVeggies);
}

// DEPRECATED — server.js no longer implements 'claim-character' at all.
export async function claimCharacter(roomCode, slotId, name) {
  if (!SLOT_IDS.includes(slotId)) {
    return { success: false, message: 'invalid_slot' };
  }
  if (!socket || !socket.connected) {
    return { success: false, message: 'not_connected' };
  }

  console.warn(
    '[gameClient] claimCharacter() is deprecated — server.js auto-assigns slots inside join-room and has no "claim-character" handler. This call will time out.'
  );

  return emitAndWaitOnce('claim-character', { character: slotId, name }, 'slot-confirmed', 'character-error');
}

// --- Live gameplay -------------------------------------------------------

export function updateLocation(lat, lng, extra = {}) {
  if (!socket || !socket.connected) return;
  const { accuracy, heading } = extra;
  socket.emit('update-location', {
    lat,
    lng,
    accuracy: typeof accuracy === 'number' ? accuracy : undefined,
    heading: typeof heading === 'number' ? heading : undefined,
  });
}

export function makeThrottledLocationWriter({ minIntervalMs = 3000, minDistanceMeters = 5 } = {}) {
  let lastSentAt = 0;
  let lastSentPos = null;

  function metersBetween(a, b) {
    if (!a || !b) return Infinity;
    const EARTH_RADIUS_M = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  return function sendIfDue(lat, lng, extra = {}) {
    const now = Date.now();
    const pos = { lat, lng };
    const movedEnough = metersBetween(lastSentPos, pos) >= minDistanceMeters;
    const timeEnough = now - lastSentAt >= minIntervalMs;

    if (lastSentPos && !movedEnough && !timeEnough) return;

    lastSentAt = now;
    lastSentPos = pos;
    updateLocation(lat, lng, extra);
  };
}

export function attemptCapture(vegId, quality) {
  if (!socket || !socket.connected) return;
  socket.emit('capture-attempt', { vegId, quality });
}

// --- Subscriptions ---------------------------------------------------------

export function subscribeToRoom(
  roomCode,
  {
    onRoomUpdate,
    onPlayersUpdate,
    onVeggiesUpdate,
    onTick,
    onGo,
    onRoundEnd,
    onGlitch,
    onCountdownCancelled,
    onTimingModeUpdated,
    onPromotedToLeader,
  } = {}
) {
  if (!socket) connectSocket();

  function handlePlayersUpdate(players) {
    lastKnownPlayers = players || [];
    if (onPlayersUpdate) onPlayersUpdate(players);
  }

  function handleVeggiesUpdate(veggies) {
    if (!onVeggiesUpdate) return;
    const asObject = {};
    (veggies || []).forEach((v) => {
      asObject[v.id] = { ...v, species: v.type };
    });
    onVeggiesUpdate(asObject);
  }

  socket.on('players-update', handlePlayersUpdate);
  socket.on('veggies-update', handleVeggiesUpdate);
  if (onTick) socket.on('tick', onTick);
  if (onGo) socket.on('go', onGo);
  if (onRoundEnd) socket.on('round-end', onRoundEnd);
  if (onGlitch) socket.on('glitch-pulse', onGlitch);
  if (onCountdownCancelled) socket.on('match-countdown-cancelled', onCountdownCancelled);
  if (onTimingModeUpdated) socket.on('timing-mode-updated', onTimingModeUpdated);
  if (onPromotedToLeader) socket.on('promoted-to-leader', onPromotedToLeader);

  if (onRoomUpdate) {
    socket.on('room-joined', onRoomUpdate);
  }

  return () => {
    socket.off('players-update', handlePlayersUpdate);
    socket.off('veggies-update', handleVeggiesUpdate);
    if (onTick) socket.off('tick', onTick);
    if (onGo) socket.off('go', onGo);
    if (onRoundEnd) socket.off('round-end', onRoundEnd);
    if (onGlitch) socket.off('glitch-pulse', onGlitch);
    if (onCountdownCancelled) socket.off('match-countdown-cancelled', onCountdownCancelled);
    if (onTimingModeUpdated) socket.off('timing-mode-updated', onTimingModeUpdated);
    if (onPromotedToLeader) socket.off('promoted-to-leader', onPromotedToLeader);
    if (onRoomUpdate) socket.off('room-joined', onRoomUpdate);
  };
}

export function getCurrentRoomCode() {
  return currentRoomCode;
}

export { SLOT_IDS };
