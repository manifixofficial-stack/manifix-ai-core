// src/config/gameConfig.js
//
// Single source of truth for spawn/rarity/scoring tuning. App.jsx and
// GameCanvas.jsx should derive per-species rarity labels FROM
// RARITY_TIERS below rather than re-typing their own copy — that's what
// caused the previous drift (broccoli/strawberry tiers disagreeing
// between this file and App.jsx, and banana/grapes missing entirely).
//
// ---------------------------------------------------------------------------
// THIS REVISION:
//   - Added an UNCOMMON tier and assigned 'banana' + 'grapes' to it.
//     Previously neither species appeared in ANY tier's `species` array,
//     so pickSpeciesForTier() could never roll them — two of the six
//     live veggie types were mathematically unspawnable.
//   - RARE now holds only 'tomato'; COMMON now holds 'broccoli' AND
//     'strawberry'. This matches the 4-tier vocabulary (common /
//     uncommon / rare / ultra_rare) that App.jsx's UI already expected,
//     instead of the previous 3-tier system silently disagreeing with it.
//   - AVAILABLE_TEAM_COLORS expanded from 4 to 6 entries to match
//     MAX_PLAYERS_PER_ROOM / SLOT_01..SLOT_06. Confirm server.js's team
//     color assignment reads this same 6-entry list — if server.js has
//     its own separate copy, that's the actual source you need to check.
//   - MAX_PLAYERS_PER_ROOM stays at 6 (already correct, matches
//     server.js's SLOT_01..SLOT_06 cap).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Radar / map loop timing
// ---------------------------------------------------------------------------
export const RADAR_PULSE_INTERVAL_MS = 2000;
export const RADAR_RANGE_METERS = 120;

// How far away a veggie can be and still render in the AR camera view.
// Keep this generous — it's just a "is it worth drawing" cutoff.
export const AR_TRIGGER_DISTANCE_METERS = 500;

// How close the player actually has to be to trigger the CATCH button /
// count as "in range" on the radar map. This is the real gameplay
// distance and should be small and deliberate, unlike the AR render cutoff.
export const CATCH_TRIGGER_DISTANCE_METERS = 25;
// Add near the other Spawn system exports:
export const MODEL_BASE_SCALE = 1.4;
export const GLITCH_TARGET_SCALE_MULTIPLIER = 1.3;
export const CAMERA_EYE_HEIGHT_METERS = 1.4;
export const GPS_POLL_INTERVAL_MS = 1000;
export const GPS_THROTTLE_MIN_DELTA_METERS = 1;

export const ENTRY_RADIUS_METERS = CATCH_TRIGGER_DISTANCE_METERS;
export const CATCH_RADIUS_METERS = CATCH_TRIGGER_DISTANCE_METERS;

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
// Every one of the 6 live species (tomato, broccoli, golden, banana,
// grapes, strawberry) MUST appear in exactly one tier's `species` array.
// If you add or retire a species, update this list — anything missing
// here silently becomes unspawnable via pickSpeciesForTier().
// ---------------------------------------------------------------------------
export const RARITY_TIERS = {
  COMMON: {
    key: 'common',
    label: 'Common',
    weight: 45,
    pointValue: 100,
    moveSpeed: 1.0,
    evasionLevel: 1,
    species: ['broccoli', 'strawberry'],
  },
  UNCOMMON: {
    key: 'uncommon',
    label: 'Uncommon',
    weight: 30,
    pointValue: 200,
    moveSpeed: 1.3,
    evasionLevel: 2,
    species: ['banana', 'grapes'],
  },
  RARE: {
    key: 'rare',
    label: 'Rare',
    weight: 20,
    pointValue: 350,
    moveSpeed: 1.6,
    evasionLevel: 3,
    species: ['tomato'],
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
// 'ultra_rare'). Consumers (App.jsx, GameCanvas.jsx) should import THIS
// instead of hand-writing their own species-to-rarity map — that
// duplication is exactly what caused broccoli/strawberry to disagree
// with the real tiers before.
export const RARITY_BY_SPECIES = Object.values(RARITY_TIERS).reduce((acc, tier) => {
  tier.species.forEach((species) => {
    acc[species] = tier.key;
  });
  return acc;
}, {});

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
// Throttling / network
// ---------------------------------------------------------------------------
export const POSITION_SYNC_THROTTLE_MS = 500;
export const LEADERBOARD_REFRESH_MS = 3000;
export const RECONNECT_BACKOFF_MS = [500, 1000, 2000, 4000, 8000, 16000];

// ---------------------------------------------------------------------------
// Player / room limits
// ---------------------------------------------------------------------------
// Matches server.js hard cap — 6 slots (SLOT_01..SLOT_06), do not raise this
// without also adding slots + colors server-side.
export const MAX_PLAYERS_PER_ROOM = 6;

// 6 entries to match MAX_PLAYERS_PER_ROOM / SLOT_01..SLOT_06. Previously
// only had 4 names ('blue','red','green','yellow') while the room cap
// was already 6 — two slots had no team color name to draw from.
// If server.js keeps its own separate color-name list for slot
// assignment, verify it matches this one (or better, have it import
// from here) so a player's team-color name is consistent everywhere.
export const AVAILABLE_TEAM_COLORS = ['blue', 'green', 'pink', 'purple', 'red', 'yellow'];

export default {
  RADAR_PULSE_INTERVAL_MS,
  RADAR_RANGE_METERS,
  AR_TRIGGER_DISTANCE_METERS,
  GPS_POLL_INTERVAL_MS,
  GPS_THROTTLE_MIN_DELTA_METERS,
  ENTRY_RADIUS_METERS,
  CATCH_RADIUS_METERS,
  SPAWN_RADIUS_METERS,
  SPAWN_MIN_DISTANCE_METERS,
  MAX_CONCURRENT_VEGGIES,
  SPAWN_CHECK_INTERVAL_MS,
  SPAWN_CHANCE_PER_CHECK,
  VEGGIE_LIFETIME_MS,
  RARITY_TIERS,
  RARITY_ORDER,
  RARITY_BY_SPECIES,
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
  POSITION_SYNC_THROTTLE_MS,
  LEADERBOARD_REFRESH_MS,
  RECONNECT_BACKOFF_MS,
  MAX_PLAYERS_PER_ROOM,
  AVAILABLE_TEAM_COLORS,
};
