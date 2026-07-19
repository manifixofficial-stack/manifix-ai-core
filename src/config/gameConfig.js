// src/config/gameConfig.js
//
// RECONCILED REVISION — merges the two diverged copies of this file.
//
// CRASH FIXED: one copy dropped PERSONALITY_CHASE_OVERRIDE entirely.
// GameCanvas.jsx's chaseModeForSpecies() calls
// `Object.prototype.hasOwnProperty.call(PERSONALITY_CHASE_OVERRIDE, species)`
// unconditionally on every frame a veggie is on screen — with that
// export missing, this throws immediately and the AR view never
// renders. Restored below, unchanged from the copy that had it.
//
// DISTANCE MISMATCH FIXED: one copy set AR_TRIGGER_DISTANCE_METERS to
// 500 while RADAR_RANGE_METERS stayed at 120 — meaning a veggie could
// render in the AR camera at a distance the radar map would never show
// it at. Restored AR_TRIGGER_DISTANCE_METERS = 120 to match the radar
// range (and GameCanvas's own "120-Meter Radar" comment).
//
// CAMERA HEIGHT MISMATCH FIXED: one copy changed CAMERA_EYE_HEIGHT_METERS
// to 1.4 with no corresponding update noted for useVeggieEvasion.js's
// hardcoded FLOOR_Y_UNITS = -1.6. Restored 1.6 so floorY passed into
// processEvasionFrame (GameCanvas: `floorY: -CAMERA_EYE_HEIGHT_METERS`)
// actually agrees with the hook. If FLOOR_Y_UNITS is ever changed,
// change it here too — they must stay equal in magnitude.
//
// RARITY MAPPING CONFLICT RESOLVED: the two copies disagreed on which
// species is which rarity (tomato common vs. rare, broccoli rare vs.
// common, etc). Kept the mapping that matches the six species'
// PERSONALITY_CHASE_OVERRIDE design intent (Angry Tomato = common/
// aggressive/easy; Shy Broccoli & Shy Strawberry = rare/evasive) since
// that's the pairing GameCanvas's chase-mode logic was actually built
// against. Rebuilt the weighted-spawn RARITY_TIERS structure (weight /
// pointValue / moveSpeed / evasionLevel per tier) around that mapping,
// with RARITY_BY_SPECIES derived FROM it — single source of truth, per
// the original intent of that refactor — rather than the two disagreeing
// standalone copies each file had before.
//
// Everything else (spawn system, scoring, target-ring timing, evasion
// AI tuning, network/throttle constants, room/team limits) is kept from
// whichever copy had it, deduplicated.

// ---------------------------------------------------------------------------
// Radar / map loop timing
// ---------------------------------------------------------------------------
export const RADAR_PULSE_INTERVAL_MS = 2000;
export const RADAR_RANGE_METERS = 120;

// How far away a veggie still renders/shows in the AR camera view.
// MUST match RADAR_RANGE_METERS — a veggie visible in AR but absent
// from the radar map (or vice versa) reads as a bug, not a feature.
export const AR_TRIGGER_DISTANCE_METERS = RADAR_RANGE_METERS;

// How close the player actually has to be to attempt a catch. Kept
// equal to server.js's CATCH_RADIUS_METERS and
// GPS_MODE_ACCURACY_THRESHOLD_M (20m). Do not change this without also
// updating server.js, or the client's "in range" reticle will disagree
// with what the server accepts.
export const CATCH_TRIGGER_DISTANCE_METERS = 20;

export const ENTRY_RADIUS_METERS = CATCH_TRIGGER_DISTANCE_METERS;
export const CATCH_RADIUS_METERS = CATCH_TRIGGER_DISTANCE_METERS;

export const GPS_POLL_INTERVAL_MS = 1000;
export const GPS_THROTTLE_MIN_DELTA_METERS = 1;

// ---------------------------------------------------------------------------
// Model scale / camera
// ---------------------------------------------------------------------------
export const MODEL_BASE_SCALE = 1;
export const GLITCH_TARGET_SCALE_MULTIPLIER = 1.8; // final-round "area overload" size boost

// Matches useVeggieEvasion's hardcoded FLOOR_Y_UNITS = -1.6. If you
// change one, change the other — GameCanvas passes
// `floorY: -CAMERA_EYE_HEIGHT_METERS` into processEvasionFrame every
// frame, so a mismatch here silently desyncs ground level from the
// evasion hook's own floor.
export const CAMERA_EYE_HEIGHT_METERS = 1.6;

// ---------------------------------------------------------------------------
// Spawn system
// ---------------------------------------------------------------------------
export const SPAWN_RADIUS_METERS = 80;
export const SPAWN_MIN_DISTANCE_METERS = 20;
export const MAX_CONCURRENT_VEGGIES = 6;
export const SPAWN_CHECK_INTERVAL_MS = 5000;
export const SPAWN_CHANCE_PER_CHECK = 0.35;
export const VEGGIE_LIFETIME_MS = 90000;

// ---------------------------------------------------------------------------
// Rarity tiers & spawn weighting
//
// Single source of truth: every one of the 6 live species MUST appear
// in exactly one tier's `species` array. RARITY_BY_SPECIES and
// CATCH_DIFFICULTY_BY_SPECIES / BASE_CATCH_POINTS_BY_SPECIES are all
// derived from this — don't hand-maintain a second copy elsewhere
// (that duplication is exactly what caused the tomato/broccoli rarity
// conflict this revision resolves).
//
// Mapping matches PERSONALITY_CHASE_OVERRIDE below: Angry Tomato is
// common/easy/aggressive (a frequent, low-stakes "gotcha" target,
// same design role as Pokémon GO's common aggressive spawns), Golden
// is the ultra-rare aggressive legendary, and the two shy/hiding
// species (Broccoli, Strawberry) are the harder rare tier — worth
// more precisely because they're evasive, not despite it.
// ---------------------------------------------------------------------------
export const RARITY_TIERS = {
  COMMON: {
    key: 'common',
    label: 'Common',
    weight: 45,
    pointValue: 100,
    moveSpeed: 1.0,
    evasionLevel: 1,
    species: ['tomato', 'grapes'],
  },
  UNCOMMON: {
    key: 'uncommon',
    label: 'Uncommon',
    weight: 30,
    pointValue: 200,
    moveSpeed: 1.3,
    evasionLevel: 2,
    species: ['banana'],
  },
  RARE: {
    key: 'rare',
    label: 'Rare',
    weight: 20,
    pointValue: 350,
    moveSpeed: 1.6,
    evasionLevel: 3,
    species: ['strawberry', 'broccoli'],
  },
  ULTRA_RARE: {
    key: 'ultra_rare',
    label: 'Ultra Rare',
    weight: 5,
    pointValue: 1000,
    moveSpeed: 2.2,
    evasionLevel: 5,
    species: ['golden'],
  },
};

export const RARITY_ORDER = ['COMMON', 'UNCOMMON', 'RARE', 'ULTRA_RARE'];

export function pickRarityTier() {
  const tiers = RARITY_ORDER.map((k) => RARITY_TIERS[k]);
  const totalWeight = tiers.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const tier of tiers) {
    if (roll < tier.weight) return tier;
    roll -= tier.weight;
  }
  return tiers[0];
}

export function pickSpeciesForTier(tier) {
  const list = tier.species;
  return list[Math.floor(Math.random() * list.length)];
}

// Derived lookup: species -> rarity key ('common' | 'uncommon' | 'rare' |
// 'ultra_rare'). Import THIS rather than hand-writing a second map.
export const RARITY_BY_SPECIES = Object.values(RARITY_TIERS).reduce((acc, tier) => {
  tier.species.forEach((species) => {
    acc[species] = tier.key;
  });
  return acc;
}, {});

// true = charges the camera (aggressive). false = flees/hides (shy).
// This is the source of truth for charge-vs-flee behavior —
// GameCanvas.jsx's chaseModeForSpecies() checks this FIRST, before
// ever falling back to rarity. Rarity (above) only drives spawn
// scarcity / catch difficulty / points, never this.
// REQUIRED: do not remove this export — GameCanvas.jsx calls
// Object.prototype.hasOwnProperty.call(PERSONALITY_CHASE_OVERRIDE, species)
// unconditionally every frame; if this is undefined, the AR view
// throws on mount.
export const PERSONALITY_CHASE_OVERRIDE = {
  tomato: true,      // Angry Tomato: aggressive, charges on sight
  golden: true,       // Legendary golden spawn: aggressive, high-value target
  broccoli: false,    // Shy Broccoli: always hides, regardless of rarity
  banana: false,
  grapes: false,
  strawberry: false,  // Shy: always hides
};

// Per-species catch difficulty (0-1), used for the break-out chance
// calc and as a basis for XP/points on a successful catch. Golden uses
// the hardcoded 0.8 already in GameCanvas's AnimatedVeggieTarget
// (node.isGolden ? 0.8 : 0.3) — kept here too so other callers (e.g. a
// future Scoreboard/XP screen) have one place to read it from.
export const CATCH_DIFFICULTY_BY_SPECIES = {
  tomato: 0.2,
  grapes: 0.25,
  banana: 0.35,
  strawberry: 0.55,
  broccoli: 0.6,
  golden: 0.8,
};

// Points awarded per species on a successful catch (independent of the
// per-round tier multiplier in GameCanvas's ROUND_POINT_TIERS).
export const BASE_CATCH_POINTS_BY_SPECIES = {
  tomato: 50,
  grapes: 60,
  banana: 80,
  strawberry: 140,
  broccoli: 160,
  golden: 500,
};

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------
export const SCORE_PERFECT_MULTIPLIER = 2.0;
export const SCORE_GOOD_MULTIPLIER = 1.0;
export const SCORE_MISS_PENALTY = -50;
export const SCORE_ESCAPE_PENALTY = -100;

// ---------------------------------------------------------------------------
// Target ring (capture timing) mechanics
// ---------------------------------------------------------------------------
export const TARGET_RING_CYCLE_MS = 1400;
export const TARGET_RING_MAX_RADIUS_PX = 90;
export const TARGET_RING_MIN_RADIUS_PX = 20;
export const TARGET_RING_PERFECT_THRESHOLD_PX = 28;

// ---------------------------------------------------------------------------
// Veggie evasion / AI tuning (consumed by hooks/useVeggieEvasion.js)
//
// "How the veggies move" lives here instead of hook internals so it's
// tunable in one place. The hook falls back to its own built-in
// defaults for anything removed from here, so partial overrides are
// safe. "Scene units" are the same 3D-scene coordinate space GameCanvas
// uses everywhere (ROAM_MAX_RADIUS_UNITS should stay close to
// GameCanvas's own MAX_SCENE_DEPTH so the roam boundary and the visible
// AR depth agree).
// ---------------------------------------------------------------------------
export const EVASION_TRIGGER_METERS = 8;
export const GREETING_MIN_METERS = 12;
export const GREETING_MAX_METERS = 25;

export const ROAM_MAX_RADIUS_UNITS = 11; // matches GameCanvas MAX_SCENE_DEPTH

// Base chase/flee speed: actual speed = FLEE_SPEED_CONSTANT / distance —
// a "how fast does it close/open the gap" dial, not a flat units/sec.
export const FLEE_SPEED_CONSTANT = 14;

export const CHASE_STOP_DISTANCE_UNITS = 2.5;
export const CHASE_ORBIT_SPEED_UNITS_S = 1.8;

export const DASH_TRIGGER_CLOSING_SPEED_UNITS_S = 2.2;
export const DASH_SPEED_MULTIPLIER = 3.0;
export const DASH_COOLDOWN_MS = 2500;

export const AGGRESSIVE_CHARGE_SPEED_MULTIPLIER = 2.2;
export const TACTICAL_DODGE_SPEED_UNITS_S = 9;

export const AUTO_HIDE_MIN_INTERVAL_MS = 7000;
export const AUTO_HIDE_MAX_INTERVAL_MS = 14000;
export const OBSTACLE_HIDE_DURATION_FRAMES = 45;

// Break-out probability for a failed catch attempt:
// chance = clamp(BASE - playerLevel*LEVEL_REDUCTION + catchDifficulty*DIFFICULTY_WEIGHT)
export const BREAKOUT_BASE_CHANCE = 0.35;
export const BREAKOUT_PLAYER_LEVEL_REDUCTION = 0.02;
export const BREAKOUT_DIFFICULTY_WEIGHT = 0.5;

export const DEPTH_SCALE_MAX = 2.8;

// ---------------------------------------------------------------------------
// Throttling / network
// ---------------------------------------------------------------------------
export const POSITION_SYNC_THROTTLE_MS = 500;
export const LEADERBOARD_REFRESH_MS = 3000;
export const RECONNECT_BACKOFF_MS = [500, 1000, 2000, 4000, 8000, 16000];

// ---------------------------------------------------------------------------
// Player / room limits
// ---------------------------------------------------------------------------
// Matches server.js hard cap — 6 slots (SLOT_01..SLOT_06); do not raise
// without also adding slots + colors server-side.
export const MIN_PLAYERS_PER_ROOM = 2;
export const MAX_PLAYERS_PER_ROOM = 6;

// 6 entries to match MAX_PLAYERS_PER_ROOM. If server.js keeps its own
// separate color-name list for slot assignment, verify it matches this
// one (or better, have it import from here).
export const AVAILABLE_TEAM_COLORS = ['blue', 'green', 'pink', 'purple', 'red', 'yellow'];

export default {
  RADAR_PULSE_INTERVAL_MS,
  RADAR_RANGE_METERS,
  AR_TRIGGER_DISTANCE_METERS,
  CATCH_TRIGGER_DISTANCE_METERS,
  ENTRY_RADIUS_METERS,
  CATCH_RADIUS_METERS,
  GPS_POLL_INTERVAL_MS,
  GPS_THROTTLE_MIN_DELTA_METERS,
  MODEL_BASE_SCALE,
  GLITCH_TARGET_SCALE_MULTIPLIER,
  CAMERA_EYE_HEIGHT_METERS,
  SPAWN_RADIUS_METERS,
  SPAWN_MIN_DISTANCE_METERS,
  MAX_CONCURRENT_VEGGIES,
  SPAWN_CHECK_INTERVAL_MS,
  SPAWN_CHANCE_PER_CHECK,
  VEGGIE_LIFETIME_MS,
  RARITY_TIERS,
  RARITY_ORDER,
  RARITY_BY_SPECIES,
  PERSONALITY_CHASE_OVERRIDE,
  CATCH_DIFFICULTY_BY_SPECIES,
  BASE_CATCH_POINTS_BY_SPECIES,
  pickRarityTier,
  pickSpeciesForTier,
  SCORE_PERFECT_MULTIPLIER,
  SCORE_GOOD_MULTIPLIER,
  SCORE_MISS_PENALTY,
  SCORE_ESCAPE_PENALTY,
  TARGET_RING_CYCLE_MS,
  TARGET_RING_MAX_RADIUS_PX,
  TARGET_RING_MIN_RADIUS_PX,
  TARGET_RING_PERFECT_THRESHOLD_PX,
  EVASION_TRIGGER_METERS,
  GREETING_MIN_METERS,
  GREETING_MAX_METERS,
  ROAM_MAX_RADIUS_UNITS,
  FLEE_SPEED_CONSTANT,
  CHASE_STOP_DISTANCE_UNITS,
  CHASE_ORBIT_SPEED_UNITS_S,
  DASH_TRIGGER_CLOSING_SPEED_UNITS_S,
  DASH_SPEED_MULTIPLIER,
  DASH_COOLDOWN_MS,
  AGGRESSIVE_CHARGE_SPEED_MULTIPLIER,
  TACTICAL_DODGE_SPEED_UNITS_S,
  AUTO_HIDE_MIN_INTERVAL_MS,
  AUTO_HIDE_MAX_INTERVAL_MS,
  OBSTACLE_HIDE_DURATION_FRAMES,
  BREAKOUT_BASE_CHANCE,
  BREAKOUT_PLAYER_LEVEL_REDUCTION,
  BREAKOUT_DIFFICULTY_WEIGHT,
  DEPTH_SCALE_MAX,
  POSITION_SYNC_THROTTLE_MS,
  LEADERBOARD_REFRESH_MS,
  RECONNECT_BACKOFF_MS,
  MIN_PLAYERS_PER_ROOM,
  MAX_PLAYERS_PER_ROOM,
  AVAILABLE_TEAM_COLORS,
};
