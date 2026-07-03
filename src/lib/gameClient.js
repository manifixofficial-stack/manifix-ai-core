// src/lib/gameClient.js — replaces src/socket.js.
//
// This is the single file every component imports instead of `socket.js`.
// It wraps Supabase Postgres + Realtime behind the same kind of small,
// named-function surface socket.js used to provide, so the migration in
// each component is a call-site swap rather than a redesign.
//
// What changed vs. socket.js, and why:
//   - No more raw event names to keep in sync between client/server
//     (that was the exact bug flagged in the old socket.js comments —
//     'join-room' vs 'join_room' silently breaking joins). Realtime
//     subscriptions are typed by table + event, not free-text strings.
//   - Character claim and veggie capture go through Postgres RPC
//     functions (claim_character, capture_veggie) so the race conditions
//     that a client-side "check then act" pattern can't prevent are
//     handled atomically in the DB. See supabase/schema.sql.
//   - GPS writes are throttled here (distance + time gate) before they
//     ever hit the network, because unthrottled writes on every
//     watchPosition tick will blow through Realtime message quota in
//     hours on the free tier.
import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Room lifecycle
// ---------------------------------------------------------------------------

// Creates the room if it doesn't exist yet (first player), otherwise just
// confirms it's there. Mirrors socket.js's old 'join-room' emit + the
// server's now-removed lat/lng-required check — this RPC accepts lat/lng
// unconditionally since Postgres doesn't need it for anything but seeding
// center_lat/center_lng on first insert.
export async function joinRoom(roomCode, lat, lng) {
  const { data, error } = await supabase.rpc('join_room', {
    p_room_code: roomCode,
    p_lat: lat,
    p_lng: lng,
  });
  if (error) throw error;
  return data; // game_rooms row
}

// Fetches the current taken-slots map once, e.g. right after joining a room
// and before the realtime subscription below is wired up, so the UI isn't
// empty for the first render.
export async function fetchTakenCharacters(roomCode) {
  const { data, error } = await supabase
    .from('player_scores')
    .select('slot_id, name')
    .eq('room_code', roomCode);
  if (error) throw error;

  // Themed slot ids — must match CharacterSelect.jsx's ALL_SLOTS and
  // schema.sql's slot_id CHECK constraint exactly.
  const taken = { 'oggy-blue': null, 'jack-green': null, 'olivia-pink': null, 'bob-purple': null };
  (data || []).forEach((row) => {
    taken[row.slot_id] = row.name;
  });
  return taken;
}

// Atomic color claim. Returns { success, player_id, slot_id, name } or
// { success: false, reason: 'slot_taken' } — the client never has to guess
// whether an insert failure means "someone beat you to it" vs. a real error.
export async function claimCharacter(roomCode, slotId, name) {
  const { data, error } = await supabase.rpc('claim_character', {
    p_room_code: roomCode,
    p_slot_id: slotId,
    p_name: name,
  });
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Live gameplay
// ---------------------------------------------------------------------------

export async function fetchPlayers(roomCode) {
  const { data, error } = await supabase
    .from('player_scores')
    .select('*')
    .eq('room_code', roomCode);
  if (error) throw error;
  return data || [];
}

export async function fetchVeggies(roomCode) {
  const { data, error } = await supabase
    .from('veggie_spawns')
    .select('*')
    .eq('room_code', roomCode);
  if (error) throw error;
  return data || [];
}

// Atomic capture. Returns { success:false, reason:'already_gone' } if
// another player's swipe landed first in the same tick — the DB is the
// source of truth, not a client-side "is this veggie still in my array"
// check, which is what made the old design double-award possible.
export async function captureVeggie(veggieId, playerId) {
  const { data, error } = await supabase.rpc('capture_veggie', {
    p_veggie_id: veggieId,
    p_player_id: playerId,
  });
  if (error) throw error;
  return data;
}

// Raw location write — call via makeThrottledLocationWriter() below rather
// than directly, unless you've already throttled upstream.
export async function updateLocation(playerId, lat, lng) {
  const { error } = await supabase.rpc('update_location', {
    p_player_id: playerId,
    p_lat: lat,
    p_lng: lng,
  });
  if (error) throw error;
}

// Returns a function you call on every raw GPS fix; it only actually hits
// the network if enough time AND enough distance have passed. Distance
// check uses a cheap haversine (good enough at foot-traffic scale — this
// doesn't need to be precise, just needs to not fire on GPS jitter).
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
  let inFlight = false;

  return function sendIfDue(lat, lng) {
    if (!playerId || inFlight) return;
    const now = Date.now();
    const pos = { lat, lng };
    const movedEnough = metersBetween(lastSentPos, pos) >= minDistanceMeters;
    const timeEnough = now - lastSentAt >= minIntervalMs;

    if (lastSentPos && !movedEnough && !timeEnough) return;

    lastSentAt = now;
    lastSentPos = pos;
    inFlight = true;
    updateLocation(playerId, lat, lng)
      .catch((err) => console.error('[gameClient] location write failed', err))
      .finally(() => {
        inFlight = false;
      });
  };
}

// ---------------------------------------------------------------------------
// Realtime subscriptions
//
// One channel per room, fanning out postgres_changes on the three tables.
// Call subscribeToRoom once after joining; call the returned unsubscribe()
// on unmount/room-leave.
// ---------------------------------------------------------------------------
export function subscribeToRoom(roomCode, { onRoomUpdate, onPlayerChange, onVeggieChange } = {}) {
  const channel = supabase
    .channel(`room:${roomCode}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` },
      (payload) => onRoomUpdate?.(payload.new)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'player_scores', filter: `room_code=eq.${roomCode}` },
      (payload) => onPlayerChange?.(payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'veggie_spawns', filter: `room_code=eq.${roomCode}` },
      (payload) => onVeggieChange?.(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
