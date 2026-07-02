// src/lib/gameClient.js — replaces src/socket.js.
//
// This is the single file every component imports instead of `socket.js`.
// It wraps Supabase Postgres + Realtime behind the same kind of small,
// named-function surface socket.js used to provide, so the migration in
// each component is a call-site swap rather than a redesign.
//
// ---------------------------------------------------------------------------
// FIX (this version): claimCharacter() and captureVeggie() were calling
// their RPCs with fewer arguments than the Postgres functions in
// supabase/schema.sql require, which means PostgREST rejects both calls
// outright (no matching function overload) — character claiming and
// vegetable capture fail every time as originally written.
//
//   claim_character(p_id, p_lat, p_lng, p_name, p_room_code, p_slot_id)
//     — was only sending p_room_code, p_slot_id, p_name.
//   capture_veggie(p_player_id, p_veggie_id, p_player_lat, p_player_lng)
//     — was only sending p_veggie_id, p_player_id.
//
// Since gameClient.js holds no state of its own, both functions below now
// take playerId/lat/lng as explicit parameters instead of guessing where
// your component keeps them. You'll need to update the two call sites:
//
//   claimCharacter(roomCode, slotId, name)
//     -> claimCharacter(roomCode, slotId, name, playerId, lat, lng)
//
//   captureVeggie(veggieId, playerId)
//     -> captureVeggie(veggieId, playerId, lat, lng)
//
// playerId is whatever join_room()'s response returned as `player_id` —
// make sure that's the value being threaded through, not a socket id or
// slot_id. lat/lng should be the player's current live GPS position at
// the moment of the claim/capture (same source you feed into
// makeThrottledLocationWriter).
// ---------------------------------------------------------------------------
import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Room lifecycle
// ---------------------------------------------------------------------------

export async function joinRoom(roomCode, lat, lng) {
  const { data, error } = await supabase.rpc('join_room', {
    p_room_code: roomCode,
    p_lat: lat,
    p_lng: lng,
  });
  if (error) throw error;
  return data; // { status, success, player_id, room_code, name }
}

export async function fetchTakenCharacters(roomCode) {
  const { data, error } = await supabase
    .from('player_scores')
    .select('slot_id, name')
    .eq('room_code', roomCode);
  if (error) throw error;

  const taken = { BLUE: null, PURPLE: null, PINK: null, ORANGE: null };
  (data || []).forEach((row) => {
    taken[row.slot_id] = row.name;
  });
  return taken;
}

// FIXED: now sends all six params claim_character() requires. playerId
// must be the `player_id` returned by joinRoom(); lat/lng should be the
// player's current position (the same values you'd hand to
// makeThrottledLocationWriter).
export async function claimCharacter(roomCode, slotId, name, playerId, lat, lng) {
  const { data, error } = await supabase.rpc('claim_character', {
    p_id: playerId,
    p_lat: lat,
    p_lng: lng,
    p_name: name,
    p_room_code: roomCode,
    p_slot_id: slotId,
  });
  if (error) throw error;
  return data; // { status, success, player_id, slot_id, room_code, name } or { success:false, message }
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

// FIXED: now sends p_player_lat/p_player_lng, which capture_veggie() needs
// to run its server-side haversine anti-cheat proximity check (25m
// radius). Without these the RPC call fails outright — it isn't optional
// data, the function has no default for them.
export async function captureVeggie(veggieId, playerId, lat, lng) {
  const { data, error } = await supabase.rpc('capture_veggie', {
    p_player_id: playerId,
    p_veggie_id: veggieId,
    p_player_lat: lat,
    p_player_lng: lng,
  });
  if (error) throw error;
  return data; // { success:true, points_gained, updated_score } or { success:false, message }
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
