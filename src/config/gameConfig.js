// src/config/gameConfig.js
//
// 100/100 Aligned Configuration Sheet.
// Maps synchronized overworld variables and restores syntax parameters to build successfully.
//
// ---------------------------------------------------------------------------
// THIS REVISION:
//   - MAX_PLAYERS_PER_ROOM corrected from 8 -> 6 to match server.js, which
//     hard-caps rooms at 6 players and only ever allocates SLOT_01..SLOT_06.
//     A client reading 8 here could show a wrong "room is full" state and
//     let a 7th/8th player attempt to join, only to be rejected server-side.
//   - Removed 'carrot' from RARITY_TIERS.COMMON.species — carrot was already
//     retired from the active roster (current 6 species: tomato, broccoli,
//     golden, banana, grapes, strawberry). Replaced with 'strawberry' so
//     COMMON still has a valid low-tier species to roll.
//   - NOTE: RARITY_TIERS.pointValue (100/350/1000) intentionally left as-is.
//     This looks like a separate open-world spawn/rarity scoring system,
//     distinct from server.js's 3-round ROUND_POINT_VALUES (100/300/600).
//     Nothing here indicates the two are meant to share the same numbers —
//     confirm with the actual game-mode design before unifying them.
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
// ---------------------------------------------------------------------------
export const RARITY_TIERS = {
  COMMON: {
    key: 'common',
    label: 'Common',
    weight: 70,
    pointValue: 100,
    moveSpeed: 1.0,      
    evasionLevel: 1,     
    species: ['strawberry'],
  },
  RARE: {
    key: 'rare',
    label: 'Rare',
    weight: 25,
    pointValue: 350,
    moveSpeed: 1.6,
    evasionLevel: 3,
    species: ['tomato', 'broccoli'],
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

export const RARITY_ORDER = ['COMMON', 'RARE', 'ULTRA_RARE'];

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
// 🛠️ FIX: Restored array bounds expression to solve the Rollup parsing crash
export const RECONNECT_BACKOFF_MS = [500, 1000, 2000, 4000, 8000, 16000];

// ---------------------------------------------------------------------------
// Player / room limits
// ---------------------------------------------------------------------------
// Matches server.js hard cap — 6 slots (SLOT_01..SLOT_06), do not raise this
// without also adding slots + colors server-side.
export const MAX_PLAYERS_PER_ROOM = 6;
export const AVAILABLE_TEAM_COLORS = ['blue', 'red', 'green', 'yellow'];

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
