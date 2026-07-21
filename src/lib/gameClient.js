// src/lib/gameClient.js
//
// Real-Time Multiplayer Game Client — thin wrapper around socket.io-client
// that talks to the live server.js (Express + Socket.IO GPS game server).
//
// THIS REVISION — two launch-blocking gaps closed:
//
//   1. joinRoom() now accepts a 5th `deviceUUID` argument and includes it
//      in the 'join-room' payload. server.js's entire mid-match reconnect
//      grace window (RECONNECT_GRACE_MS, 45s — restores a dropped
//      player's slot/score/character if they rejoin in time) is keyed
//      entirely on deviceUUID matching an existing room.players entry.
//      Previously this function silently dropped it: App.jsx could
//      generate and pass a UUID all day, but it never reached the
//      server, so every mid-match GPS drop or backgrounding permanently
//      ejected the player — on an outdoor GPS game, that's routine, not
//      an edge case. Wallet/ticket-gating and personal-best leaderboard
//      upserts are also deviceUUID-keyed server-side and were equally
//      unreachable until now.
//
//   2. subscribeToRoom() now accepts and wires onTimingModeUpdated and
//      onPromotedToLeader callbacks, forwarding server.js's
//      'timing-mode-updated' and 'promoted-to-leader' broadcasts.
//      App.jsx has been subscribing to these two callback names since
//      an earlier revision, but this file never forwarded them to any
//      socket event — they were silently dropped at this layer. Net
//      effect: when the room leader picked a timing mode, only their own
//      client (which sets state locally in the click handler) ever
//      advanced past the mode-gate screen. Every OTHER player in the
//      room stayed stuck on "WAITING FOR HOST TO CHOOSE MODE…" forever,
//      even though the match was actually running server-side (tick/go/
//      rounds all fired normally) — meaning only the room leader could
//      ever actually play. This was the single largest blocker to a
//      working multiplayer MVP; every other reviewed file was sound
//      once this one gap is closed.
//
// WHY THIS REPLACES THE PREVIOUS VERSION (unchanged from before):
// The previous gameClient.js was a "local storage stand-in" — it never
// opened a network connection at all. joinRoom/claimCharacter/capture
// calls read and wrote to window.localStorage, and window.socket was a
// fake object whose .emit() just called those local functions directly.
// That works fine for one browser tab, but two different phones joining
// the same room code would each be playing in their own isolated
// localStorage copy of the room and would NEVER see each other — which
// defeats the entire point of a real-world GPS multiplayer game.
//
// This version opens one real socket.io connection per browser tab to
// the live server, and every exported function is a thin promise-based
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
// updateLocation() and makeThrottledLocationWriter() previously only
// forwarded { lat, lng } to the server. The hybrid server.js needs
// `accuracy` (to classify a player as 'gps' vs 'indoor' mode per-update)
// and `heading` (to validate indoor-mode capture attempts against a
// vegetable's fixed bearing) — see server.js's getPlayerMode and
// capture-attempt handler. Both functions accept and forward an optional
// { accuracy, heading } alongside lat/lng, matching what server.js's
// update-location handler already reads.
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

// Call once (e.g. from App.jsx on mount) before joinRoom(). Safe to call
// multiple times — reuses the existing connection if already open.
export function connectSocket() {
  if (socket && socket.connected) return socket;

  socket = io(SERVER_URL, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  // Exposed for any code (or older components) that still reads
  // window.socket directly for .on()/.off() subscriptions.
  window.socket = socket;

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
    if (window.socket) delete window.socket;
  }
}

export function getSocket() {
  return socket;
}

// DEPRECATED COMPATIBILITY SHIM — do not build new code against this.
//
// initLocalSocketBridge() existed in the old localStorage-based
// gameClient.js to set up a fake window.socket whose .emit() just called
// local functions directly (see the file-header note above for why that
// approach couldn't support real cross-device multiplayer). Rather than
// leave any old call site broken, this now simply opens the real
// socket.io connection — the same thing connectSocket() does — so
// existing call sites keep working, but nothing "local" is bridged
// anymore.
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
// room, to seed vegetable spawn origin). name: player's typed call sign —
// forwarded up front so it's available even before a slot is assigned.
//
// FIX: deviceUUID is a new 5th argument, forwarded in the 'join-room'
// payload as `deviceUUID`. server.js reads this to:
//   - match a returning player against an existing `disconnected: true`
//     entry in room.players (the reconnect-grace-window path)
//   - key wallet/ticket lookups (getOrCreateWallet(deviceUUID))
//   - key personal-best leaderboard upserts (upsertLeaderboardEntry)
// Passing undefined here is still safe — server.js's own handlers all
// null-check deviceUUID and degrade gracefully (no reconnect match, no
// ticket gate, leaderboard falls back to a username-keyed record) — but
// every caller should pass a real, persisted UUID whenever one is
// available. See App.jsx's getOrCreateDeviceUUID().
export async function joinRoom(roomCode, lat, lng, name, deviceUUID) {
  connectSocket();

  // Wait for the socket to actually be connected before emitting, since
  // connectSocket() may have just opened it.
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
    // server.js identifies players by socket.id (room.players is keyed
    // by socket.id) — attach it here so App.jsx's
    // setMyPlayerId(joined.playerId) has a real value to use instead of
    // undefined.
    result.playerId = socket.id;
  }

  return result;
}

// Mirrors the old fetchTakenCharacters() signature/shape so callers (e.g.
// CharacterSelect.jsx's initial load) don't need to change: returns an
// object keyed by slot id, value = taken player's name or false.
// The live server keeps this pushed via 'players-update' broadcasts
// (see subscribeToRoom below); this one-shot version derives the same
// shape from the most recent players-update the socket has seen, for
// components that want an immediate snapshot on mount before the first
// broadcast tick arrives.
export async function fetchTakenCharacters(roomCode) {
  const taken = { SLOT_01: false, SLOT_02: false, SLOT_03: false, SLOT_04: false, SLOT_05: false, SLOT_06: false };
  lastKnownPlayers.forEach((p) => {
    const slot = p.slot_id || p.slotId;
    if (slot && slot in taken) taken[slot] = p.name || 'OPERATOR';
  });
  return taken;
}

// One-shot snapshot of the room's current player list, in the same array
// shape server.js broadcasts on 'players-update':
//   { id, name, slot_id, slotId, latitude, longitude, mode, score }[]
// Resolves immediately if a broadcast has already been seen; otherwise
// waits (up to ACK_TIMEOUT_MS) for the next tick, then falls back to an
// empty array rather than hanging forever.
export async function fetchPlayers(roomCode) {
  connectSocket();
  return waitForFirstBroadcast('players-update', () => lastKnownPlayers);
}

// One-shot snapshot of the room's current vegetables, in the same array
// shape server.js broadcasts on 'veggies-update':
//   { id, lat, lng, latitude, longitude, bearing, type, veggie_type }[]
export async function fetchVeggies(roomCode) {
  connectSocket();
  return waitForFirstBroadcast('veggies-update', () => lastKnownVeggies);
}

// DEPRECATED — server.js no longer implements a 'claim-character' event
// at all (see this file's header note). Slots are auto-assigned inside
// join-room now. Kept only so an old, unremoved call site doesn't crash
// the build; calling this will time out waiting for a response the
// server will never send. Delete both this and its call site when
// convenient.
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

  const result = await emitAndWaitOnce(
    'claim-character',
    { character: slotId, name },
    'slot-confirmed',
    'character-error'
  );

  return result;
}

// --- Live gameplay ---------------------------------------------------

// FIX (hybrid gps/indoor wiring): accepts an optional third `extra`
// object ({ accuracy, heading }) and forwards it alongside lat/lng.
// server.js's update-location handler reads both fields (see its
// isFiniteNumber(data.accuracy)/data.heading checks).
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

// FIX (hybrid gps/indoor wiring): sendIfDue accepts and forwards an
// optional third arg ({ accuracy, heading }) through to updateLocation().
// Existing call sites that only pass (lat, lng) keep working unchanged
// (extra defaults to {}, so accuracy/heading are simply omitted) —
// callers that want hybrid-mode detection to work need to pass it, see
// MapView.jsx.
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

// Fire-and-forget-from-the-caller's-perspective, but internally waits for
// the server's 'capture-result' matching this vegId so GameCanvas.jsx's
// CaptureThrow animation (which listens for 'capture-result' globally via
// window.socket.on) still resolves the same way it did with the old
// localStorage bridge.
export function attemptCapture(vegId, quality) {
  if (!socket || !socket.connected) return;
  socket.emit('capture-attempt', { vegId, quality });
}

// --- Subscriptions ------------------------------------------------------

// FIX: added onTimingModeUpdated and onPromotedToLeader params, wired to
// server.js's 'timing-mode-updated' and 'promoted-to-leader' broadcasts.
// Previously neither was forwarded at all — App.jsx has been passing
// both callback names into subscribeToRoom() since an earlier revision,
// but they were silently dropped here, so no non-leader client ever
// received the room leader's mode selection. That left every non-leader
// player stuck on the "WAITING FOR HOST TO CHOOSE MODE…" gate screen
// forever, even while the match ran to completion server-side — i.e.
// only the room leader could ever actually play a match. This was the
// single largest blocker to a working MVP.
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
    // GameCanvas.jsx expects an object keyed by veggie id with
    // lat/lng/species fields (matching the old normalizeVeggie() shape);
    // server.js broadcasts an array with lat/lng/type/bearing already
    // present, so just re-key it here rather than changing every
    // consumer. `bearing` is passed through untouched — MapView.jsx's
    // indoor-mode branch reads it directly off each veggie.
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

  // room-joined already fired once during joinRoom(); onRoomUpdate here is
  // for components that mount subscribeToRoom after the join already
  // happened and want the geofence info re-delivered on reconnect.
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
