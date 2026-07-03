// src/lib/gameClient.js — LOCAL / OFFLINE VERSION (no database, no network).
//
// This keeps the exact same exported function names + signatures every
// component already imports (App.jsx, CharacterSelect.jsx, GameCanvas.jsx),
// so nothing else needs a rewrite to drop Supabase. Everything now lives in
// an in-memory JS object instead of Postgres, and "realtime" is a tiny
// local pub/sub instead of Supabase Realtime channels.
//
// Because there's no server, there's no cross-device multiplayer here —
// this is single-device play. The 4 color slots still exist so the UI
// doesn't need to change, but only this device's own claim will ever be
// filled unless you wire this back up to a real backend later.

// ---------------------------------------------------------------------------
// In-memory "database"
// ---------------------------------------------------------------------------
const ROOMS = new Map(); // roomCode -> room record

const SLOT_IDS = ['oggy-blue', 'jack-green', 'olivia-pink', 'bob-purple'];

const VEGGIE_TYPES = [
  { type: 'carrot', points: 10, weight: 45 },
  { type: 'tomato', points: 15, weight: 30 },
  { type: 'broccoli', points: 20, weight: 20 },
  { type: 'golden', points: 50, weight: 5 },
];

const MAX_VEGGIES = 8;
const SPAWN_RADIUS_METERS = 120;
const SPAWN_INTERVAL_MS = 15000;

let uidCounter = 0;
function uid(prefix) {
  uidCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${uidCounter}`;
}

function pickVeggieType() {
  const totalWeight = VEGGIE_TYPES.reduce((sum, v) => sum + v.weight, 0);
  let r = Math.random() * totalWeight;
  for (const v of VEGGIE_TYPES) {
    if (r < v.weight) return v;
    r -= v.weight;
  }
  return VEGGIE_TYPES[0];
}

// Offsets a lat/lng by a random distance (0..radiusMeters) at a random
// bearing — good enough at foot-traffic scale, same order of accuracy as
// the haversine math used elsewhere in the app.
function randomOffset(center, radiusMeters) {
  const distance = Math.random() * radiusMeters;
  const bearing = Math.random() * 2 * Math.PI;
  const dLat = (distance * Math.cos(bearing)) / 111320;
  const dLng =
    (distance * Math.sin(bearing)) / (111320 * Math.cos((center.lat * Math.PI) / 180));
  return { lat: center.lat + dLat, lng: center.lng + dLng };
}

function spawnVeggie(room) {
  const meta = pickVeggieType();
  const pos = randomOffset(room.center, SPAWN_RADIUS_METERS);
  return {
    id: uid('veggie'),
    room_code: room.code,
    veggie_type: meta.type,
    points: meta.points,
    latitude: pos.lat,
    longitude: pos.lng,
  };
}

function ensureRoom(roomCode, lat, lng) {
  let room = ROOMS.get(roomCode);
  if (room) return room;

  room = {
    code: roomCode,
    center_lat: lat,
    center_lng: lng,
    center: { lat, lng },
    current_leader_name: null,
    players: [],
    veggies: [],
    listeners: new Set(),
    spawnTimer: null,
  };

  for (let i = 0; i < 5; i += 1) {
    room.veggies.push(spawnVeggie(room));
  }

  // Keeps the field topped up while a room is active — replaces the old
  // server-side spawn job. Runs forever for the life of the tab; that's
  // fine for a local single-session game.
  room.spawnTimer = setInterval(() => {
    if (room.veggies.length < MAX_VEGGIES) {
      room.veggies.push(spawnVeggie(room));
      notify(room, 'veggies');
    }
  }, SPAWN_INTERVAL_MS);

  ROOMS.set(roomCode, room);
  return room;
}

function notify(room, kind) {
  room.listeners.forEach((cb) => {
    try {
      if (kind === 'players') cb.onPlayersUpdate?.([...room.players]);
      if (kind === 'veggies') cb.onVeggiesUpdate?.([...room.veggies]);
      if (kind === 'room') cb.onRoomUpdate?.({ ...room });
    } catch (err) {
      console.error('[gameClient] listener error', err);
    }
  });
}

// ---------------------------------------------------------------------------
// Room lifecycle
// ---------------------------------------------------------------------------

// Creates the room locally if it doesn't exist yet, otherwise just returns
// it. Mirrors the old join_room RPC's "idempotent, seeds center on first
// join" behavior, just without Postgres underneath.
export async function joinRoom(roomCode, lat, lng) {
  const room = ensureRoom(roomCode, lat, lng);
  return { room_code: room.code, center_lat: room.center_lat, center_lng: room.center_lng };
}

// Fetches the current taken-slots map. Slot ids must match
// CharacterSelect.jsx's SLOT_ORDER exactly.
export async function fetchTakenCharacters(roomCode) {
  const room = ROOMS.get(roomCode);
  const taken = { 'oggy-blue': null, 'jack-green': null, 'olivia-pink': null, 'bob-purple': null };
  if (!room) return taken;
  room.players.forEach((p) => {
    taken[p.slot_id] = p.name;
  });
  return taken;
}

// Local "atomic" color claim — this runs synchronously under the hood, so
// there's no real race condition to guard against the way the old Postgres
// RPC had to.
export async function claimCharacter(roomCode, slotId, name) {
  const room = ROOMS.get(roomCode);
  if (!room) return { success: false, reason: 'room_not_found' };
  if (!SLOT_IDS.includes(slotId)) return { success: false, reason: 'invalid_slot' };

  const alreadyTaken = room.players.some((p) => p.slot_id === slotId);
  if (alreadyTaken) return { success: false, reason: 'slot_taken' };

  const player = {
    id: uid('player'),
    room_code: roomCode,
    slot_id: slotId,
    name,
    score: 0,
    latitude: room.center.lat,
    longitude: room.center.lng,
  };
  room.players.push(player);
  notify(room, 'players');

  return { success: true, player_id: player.id, slot_id: player.slot_id, name: player.name };
}

// ---------------------------------------------------------------------------
// Live gameplay
// ---------------------------------------------------------------------------

export async function fetchPlayers(roomCode) {
  const room = ROOMS.get(roomCode);
  return room ? [...room.players] : [];
}

export async function fetchVeggies(roomCode) {
  const room = ROOMS.get(roomCode);
  return room ? [...room.veggies] : [];
}

// Local capture — no other device can beat you to it, so 'already_gone'
// only fires if the veggie already got picked up on this same device
// (e.g. a double-tap) or has aged out of the room.
export async function captureVeggie(veggieId, playerId) {
  const room = [...ROOMS.values()].find((r) => r.veggies.some((v) => v.id === veggieId));
  if (!room) return { success: false, reason: 'already_gone' };

  const veggieIdx = room.veggies.findIndex((v) => v.id === veggieId);
  if (veggieIdx === -1) return { success: false, reason: 'already_gone' };

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { success: false, reason: 'player_not_found' };

  const [veggie] = room.veggies.splice(veggieIdx, 1);
  player.score += veggie.points;

  const topScore = Math.max(...room.players.map((p) => p.score));
  const leader = room.players.find((p) => p.score === topScore);
  room.current_leader_name = leader?.name || null;

  notify(room, 'veggies');
  notify(room, 'players');
  notify(room, 'room');

  return {
    success: true,
    points: veggie.points,
    new_score: player.score,
    player_name: player.name,
  };
}

export async function updateLocation(playerId, lat, lng) {
  const room = [...ROOMS.values()].find((r) => r.players.some((p) => p.id === playerId));
  if (!room) return;
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return;
  player.latitude = lat;
  player.longitude = lng;
  notify(room, 'players');
}

// Same throttle shape as before — still worth keeping even without a
// network quota to protect, since it also caps how often React state
// re-renders off raw GPS jitter.
const EARTH_RADIUS_M = 6371000;
function metersBetween(a, b) {
  if (!a || !b) return Infinity;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function makeThrottledLocationWriter(playerId, { minIntervalMs = 3000, minDistanceMeters = 5 } = {}) {
  let lastSentAt = 0;
  let lastSentPos = null;

  return function sendIfDue(lat, lng) {
    if (!playerId) return;
    const now = Date.now();
    const pos = { lat, lng };
    const movedEnough = metersBetween(lastSentPos, pos) >= minDistanceMeters;
    const timeEnough = now - lastSentAt >= minIntervalMs;

    if (lastSentPos && !movedEnough && !timeEnough) return;

    lastSentAt = now;
    lastSentPos = pos;
    updateLocation(playerId, lat, lng).catch((err) =>
      console.error('[gameClient] location write failed', err)
    );
  };
}

// ---------------------------------------------------------------------------
// "Realtime" subscription — a local pub/sub instead of Supabase channels.
// Call subscribeToRoom once after joining; call the returned unsubscribe()
// on unmount/room-leave.
//
// Callback shape (note: full arrays, not incremental Postgres-style
// payloads — there's no diffing to do locally, so components just replace
// their state wholesale):
//   onRoomUpdate(room)
//   onPlayersUpdate(players[])
//   onVeggiesUpdate(veggies[])
// ---------------------------------------------------------------------------
export function subscribeToRoom(roomCode, { onRoomUpdate, onPlayersUpdate, onVeggiesUpdate } = {}) {
  const room = ROOMS.get(roomCode);
  if (!room) return () => {};

  const listener = { onRoomUpdate, onPlayersUpdate, onVeggiesUpdate };
  room.listeners.add(listener);

  return () => {
    room.listeners.delete(listener);
  };
}
