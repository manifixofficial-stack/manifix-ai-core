// src/lib/gameClient.js
//
// Real-Time Multiplayer Game Client — thin wrapper around socket.io-client
// that talks to the live server.js (Express + Socket.IO GPS game server).
//
// THIS REVISION — added requestRematch():
//   PROBLEM: server.js has a fully working 'request-rematch' handler
//   (resets scores/round state, restarts the countdown, emits
//   'rematch-starting') but nothing on the client ever emitted it.
//   handleInstantReplay() in App.js only reset local UI state
//   (stage/matchPhase/victoryData) — it never told the server anything.
//   After any match ended, the room sat with matchEnded: true and
//   stageVeggie: null, broadcasting an empty veggies-update forever
//   until the 5-minute post-match cleanup timer deleted the room. The
//   client just bounced back to a permanently empty MapView with no
//   way to start a new match.
//   FIX: new requestRematch() export below, a thin fire-and-forget
//   wrapper around `socket.emit('request-rematch')` — same pattern as
//   attemptCapture()/updateLocation(). App.js's handleInstantReplay now
//   calls this in addition to resetting local UI state.
//
// PRIOR REVISION — fixed the "MapView never advances to GameCanvas" bug:
//   ROOT CAUSE: connectSocket() only reused the existing socket when
//   `socket.connected === true`:
//
//     if (socket && socket.connected) return socket;
//     socket = io(SERVER_URL, {...});
//
//   App.js's `roomCode` useEffect calls subscribeToRoom() (which calls
//   connectSocket() and attaches onTick/onGo/onTimingModeUpdated/etc.)
//   as soon as setRoomCode() runs in handleJoinRoom — BEFORE the
//   `await Location.requestForegroundPermissionsAsync()` delay. That
//   created socket A and put every event listener on it.
//
//   By the time handleJoinRoom() actually called joinRoom() a beat
//   later, socket A often hadn't finished its handshake yet
//   (`socket.connected` still false), so connectSocket() didn't reuse
//   it — it built a brand-new socket B instead, silently discarding
//   the reference to A. joinRoom() then joined the room using socket
//   B, and getSocket() (used by set-timing-mode etc.) also returned B,
//   so outbound emits worked fine. But the server broadcasts
//   tick/go/timing-mode-updated/round-end to the room (i.e. to socket
//   B), and socket B had no listeners on it — those were all still on
//   the orphaned socket A. Net effect: join + mode-pick appeared to
//   work, but the client never heard the response events, so
//   timingModeChosen/matchPhase never updated and the screen never
//   left MapView for GameCanvas.
//
//   FIX: connectSocket() now reuses the existing socket instance as
//   soon as one exists at all — connected or still connecting — so
//   only one socket is ever created per app session, and every caller
//   (subscribeToRoom, joinRoom, getSocket) is guaranteed to be working
//   with the same instance.
//
// PRIOR REVISION — RN env-var fix on top of prior fixes:
//   SERVER_URL previously read `import.meta.env.VITE_GAME_SERVER_URL` —
//   Vite-only syntax. Hermes (React Native's JS engine) has no
//   `import.meta` support at all and throws a SyntaxError on load,
//   crashing the app before anything else runs. Replaced with Expo's
//   env convention: process.env.EXPO_PUBLIC_GAME_SERVER_URL (only
//   EXPO_PUBLIC_-prefixed vars are inlined at build time by Expo).
//   Falls back to the known Render deployment either way, so this
//   works out of the box with no .env setup required.
//
// PRIOR REVISION — RN crash fix (window guards):
//   connectSocket()/disconnectSocket() no longer touch `window`
//   unconditionally. `window` is not guaranteed to exist in RN's JS
//   runtime. Both read/write sites are guarded with
//   `typeof window !== 'undefined'`. Native code should use getSocket()
//   (exported below) rather than relying on window.socket.
//
// PRIOR REVISION (reconnect + mode-gate fixes):
//   1. joinRoom() accepts a 5th `deviceUUID` argument, included in the
//      'join-room' payload — server.js's reconnect grace window,
//      wallet/ticket-gating, and leaderboard upserts are all
//      deviceUUID-keyed.
//   2. subscribeToRoom() wires onTimingModeUpdated and
//      onPromotedToLeader, forwarding server.js's 'timing-mode-updated'
//      and 'promoted-to-leader' broadcasts — previously only the room
//      leader could ever advance past the mode-gate screen.
//
// This version opens one real socket.io connection per client to the
// live server; every exported function is a thin promise-based wrapper
// around emitting the matching server event and waiting for its
// server-emitted response. Event names and payload shapes match
// server.js exactly:
//
//   client emits            server responds with
//   ------------------      ---------------------------------
//   join-room          -->  room-joined | room-error
//   claim-character    -->  slot-confirmed | character-error  (DEPRECATED
//                            — server.js no longer implements this at
//                            all; slots are auto-assigned inside
//                            join-room now. Kept only so nothing that
//                            still imports it crashes at build time.)
//   update-location     (fire-and-forget, no direct response)
//   capture-attempt    -->  capture-result (+ broadcast veggieCaught)
//   request-rematch     (fire-and-forget — server responds by
//                         broadcasting 'rematch-starting' to the room,
//                         then the normal 'tick'/'go' countdown flow)
//
// Server -> all clients in room (no request needed, just subscribe):
//   players-update, veggies-update, tick, go, glitch-pulse,
//   match-countdown-cancelled, round-end, timing-mode-updated,
//   promoted-to-leader, rematch-starting
//
// SLOT_IDS matches server.js's takenCharacters / CHARACTER_COLORS keys
// exactly.

import { io } from 'socket.io-client';

const SLOT_IDS = ['SLOT_01', 'SLOT_02', 'SLOT_03', 'SLOT_04', 'SLOT_05', 'SLOT_06'];

// Falls back to the known Render deployment so the app "just works"
// without extra env setup. To override, set EXPO_PUBLIC_GAME_SERVER_URL
// in a .env file at project root (Expo only inlines EXPO_PUBLIC_-
// prefixed vars at build time).
// NOTE: this constant is NOT exported. App.js's account-deletion call
// currently duplicates this URL locally rather than importing it —
// consider exporting SERVER_URL from here if that drifts.
const SERVER_URL =
  process.env.EXPO_PUBLIC_GAME_SERVER_URL || 'https://manifix-ai-core.onrender.com';

const ACK_TIMEOUT_MS = 30000;

let socket = null;
let currentRoomCode = null;

// Persistent caches of the most recent broadcast from server.js, kept up
// to date regardless of whether any component has called subscribeToRoom()
// yet. Backs the one-shot fetchPlayers()/fetchVeggies() snapshot helpers
// below, and fetchTakenCharacters()'s snapshot use.
let lastKnownPlayers = [];
let lastKnownVeggies = [];

// --- Connection lifecycle ---------------------------------------------

// Call once (e.g. from App.js on mount) before joinRoom(). Safe to call
// multiple times — reuses the existing connection if one already exists,
// REGARDLESS of whether its handshake has finished yet. This is the fix
// for the MapView-never-advances bug: previously this only reused a
// socket once socket.connected was true, which meant two call sites
// racing during the join flow (subscribeToRoom() from App.js's roomCode
// effect, and joinRoom() itself) could each create their OWN socket if
// the first one hadn't finished connecting yet — splitting event
// listeners from the connection that actually joined the room. Reusing
// on mere existence (not connected-ness) guarantees a single instance.
export function connectSocket() {
  if (socket) return socket;

  socket = io(SERVER_URL, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  // Exposed for any code that still reads window.socket directly.
  // Guarded because `window` doesn't reliably exist in React Native —
  // native code should use getSocket() / an explicit socket prop
  // instead (see GameCanvas.jsx, which takes socket as a prop).
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
      // message } instead of needing try/catch everywhere.
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

// Requests a rematch in the current room. Fire-and-forget, same pattern
// as attemptCapture()/updateLocation() — server.js's 'request-rematch'
// handler responds by broadcasting 'rematch-starting' to the room and,
// if enough players remain, kicking off the normal tick/go countdown
// again (both already wired via subscribeToRoom()'s onTick/onGo). No-op
// if there's no connected socket, matching the other fire-and-forget
// emitters above.
export function requestRematch() {
  if (!socket || !socket.connected) return;
  socket.emit('request-rematch');
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