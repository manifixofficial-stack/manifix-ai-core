// lib/hackedEventClient.js
//
// Handles the "system compromised" event: a room-level `is_hacked` flag
// (flipped by an admin action or a timer, outside this client) that, once
// true, spawns a single high-value Hacked Target entity pinned to
// whichever player's coordinates triggered the read.
//
// NOTE: this is intentionally its own module rather than an addition to
// lib/gameClient.js — I don't have gameClient.js's current contents, and
// guessing at a merge risks clobbering RPC wrappers you already have
// (claimCharacter, captureVeggie, fetchPlayers/fetchVeggies,
// subscribeToRoom, makeThrottledLocationWriter per your file tree). Once
// you share gameClient.js, these functions can move in as siblings to
// fetchVeggies()/subscribeToRoom() and reuse the same supabase client
// instance instead of importing a second one here.
//
// Expects a `rooms` table (or equivalent) with a boolean `is_hacked`
// column, and reuses the existing `veggies` table for the spawned entity
// — inserting a row with veggie_type = 'hacked_target' is enough for your
// existing fetchVeggies()/subscribeToRoom() realtime pipeline to pick it
// up for free, since VeggieSprite/GameCanvas already render whatever's in
// that table.

import { createClient } from '@supabase/supabase-js';

// Reuses the same env vars gameClient.js already relies on. If your
// project centralizes the client instance instead of creating one per
// module, swap this for `import { supabase } from './supabaseClient.js'`
// (or wherever yours lives) once you wire this into the real gameClient.
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const HACKED_TARGET_VEGGIE_TYPE = 'hacked_target';

// Point bounty for catching the Hacked Target — deliberately large so it
// reads as "legendary" against normal veggie point values, without
// needing a whole separate scoring column.
export const HACKED_TARGET_POINTS = 500;

/**
 * Subscribes to the room's `is_hacked` flag. Fires `onHackedChange(isHacked)`
 * on every change, including the initial read, so a caller can react to
 * both "already hacked when I joined" and "just got hacked live."
 *
 * @param {string} roomCode
 * @param {(isHacked: boolean) => void} onHackedChange
 * @returns {() => void} unsubscribe
 */
export function subscribeToHackedFlag(roomCode, onHackedChange) {
  let cancelled = false;

  (async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('is_hacked')
      .eq('code', roomCode)
      .single();
    if (!cancelled && !error && data) {
      onHackedChange(!!data.is_hacked);
    }
  })();

  const channel = supabase
    .channel(`room-hacked-flag-${roomCode}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode}` },
      (payload) => {
        if (!cancelled) onHackedChange(!!payload.new.is_hacked);
      }
    )
    .subscribe();

  return () => {
    cancelled = true;
    supabase.removeChannel(channel);
  };
}

/**
 * Spawns the Hacked Target veggie row pinned to the given coordinates.
 * Idempotent per room: checks for an existing un-caught hacked_target row
 * first, so a flaky reconnect or multiple clients reacting to the same
 * is_hacked flip doesn't spawn duplicates.
 *
 * @param {string} roomCode
 * @param {{lat: number, lng: number}} position
 * @returns {Promise<Object|null>} the inserted row, or null if one already existed
 */
export async function spawnHackedTarget(roomCode, position) {
  const { data: existing, error: checkError } = await supabase
    .from('veggies')
    .select('id')
    .eq('room_code', roomCode)
    .eq('veggie_type', HACKED_TARGET_VEGGIE_TYPE)
    .limit(1);

  if (checkError) {
    console.error('[hackedEventClient] existing-check failed', checkError);
    throw checkError;
  }
  if (existing && existing.length > 0) return null; // already spawned, don't duplicate

  const { data, error } = await supabase
    .from('veggies')
    .insert({
      room_code: roomCode,
      veggie_type: HACKED_TARGET_VEGGIE_TYPE,
      latitude: position.lat,
      longitude: position.lng,
      points_value: HACKED_TARGET_POINTS,
    })
    .select()
    .single();

  if (error) {
    console.error('[hackedEventClient] spawn failed', error);
    throw error;
  }
  return data;
}
