// config/obstacles.js
//
// Real-world hazard map for the outdoor AR play area. GameCanvas.jsx checks
// the player's live GPS position against these zones every time it updates,
// and locks controls / shows ObstacleCollisionOverlay while they're inside
// one — a nudge to look up from the phone near something they could
// actually trip on or walk into.
//
// Distance checks use the same haversine `metersBetween()` helper already
// defined in GameCanvas.jsx, so this file only needs to supply plain
// lat/lng + radius data.

// ---------------------------------------------------------------------------
// Hazard type registry — shared display metadata (icon, label, warning copy,
// default radius) so individual zone entries below can stay terse.
// ---------------------------------------------------------------------------
export const OBSTACLE_TYPES = {
  TREE: {
    key: 'tree',
    label: 'Tree',
    icon: '🌳',
    defaultRadiusMeters: 3,
    warning: 'Watch out — tree ahead!',
  },
  FIRE_HYDRANT: {
    key: 'fire_hydrant',
    label: 'Fire Hydrant',
    icon: '🚒',
    defaultRadiusMeters: 2,
    warning: 'Fire hydrant nearby — mind your step.',
  },
  FENCE: {
    key: 'fence',
    label: 'Fence',
    icon: '🚧',
    defaultRadiusMeters: 4,
    warning: 'Fence line ahead — don\'t climb, go around.',
  },
  CURB: {
    key: 'curb',
    label: 'Curb / Street Edge',
    icon: '🛑',
    defaultRadiusMeters: 5,
    warning: 'Curb ahead — look up before you step off.',
  },
  WATER: {
    key: 'water',
    label: 'Water Hazard',
    icon: '💧',
    defaultRadiusMeters: 6,
    warning: 'Pond / water edge nearby — stay clear.',
  },
  POLE: {
    key: 'pole',
    label: 'Lamp Post / Sign Pole',
    icon: '🚦',
    defaultRadiusMeters: 2,
    warning: 'Pole ahead — heads up!',
  },
  STAIRS: {
    key: 'stairs',
    label: 'Stairs / Steps',
    icon: '🪜',
    defaultRadiusMeters: 4,
    warning: 'Stairs ahead — slow down.',
  },
};

export function getObstacleTypeMeta(typeKey) {
  return (
    Object.values(OBSTACLE_TYPES).find((t) => t.key === typeKey) || {
      key: typeKey || 'unknown',
      label: 'Obstacle',
      icon: '⚠️',
      defaultRadiusMeters: 3,
      warning: 'Obstacle ahead — watch your step.',
    }
  );
}

// ---------------------------------------------------------------------------
// Fixed venue hazard map.
//
// These are placeholder coordinates around a generic park-style layout —
// replace them with the actual surveyed lat/lng of trees, hydrants, fences,
// etc. at your real deployment site before shipping. Walk the venue with a
// phone GPS (or pull from satellite imagery / OpenStreetMap) and drop pins
// here. `radiusMeters` is optional per-zone; falls back to the type's
// `defaultRadiusMeters` if omitted.
// ---------------------------------------------------------------------------
export const OBSTACLE_ZONES = [
  {
    id: 'obs-001',
    type: OBSTACLE_TYPES.TREE.key,
    lat: 37.77531,
    lng: -122.41978,
    label: 'Large oak near the south entrance',
  },
  {
    id: 'obs-002',
    type: OBSTACLE_TYPES.FIRE_HYDRANT.key,
    lat: 37.77468,
    lng: -122.41912,
    label: 'Hydrant at the corner of the lot',
  },
  {
    id: 'obs-003',
    type: OBSTACLE_TYPES.FENCE.key,
    lat: 37.77502,
    lng: -122.41865,
    radiusMeters: 5,
    label: 'Perimeter fence, east side',
  },
  {
    id: 'obs-004',
    type: OBSTACLE_TYPES.CURB.key,
    lat: 37.77489,
    lng: -122.42001,
    label: 'Street curb along the north edge',
  },
  {
    id: 'obs-005',
    type: OBSTACLE_TYPES.WATER.key,
    lat: 37.77445,
    lng: -122.41950,
    radiusMeters: 8,
    label: 'Decorative pond',
  },
  {
    id: 'obs-006',
    type: OBSTACLE_TYPES.POLE.key,
    lat: 37.77520,
    lng: -122.41890,
    label: 'Lamp post near the path',
  },
  {
    id: 'obs-007',
    type: OBSTACLE_TYPES.STAIRS.key,
    lat: 37.77460,
    lng: -122.41880,
    radiusMeters: 5,
    label: 'Steps down to the lower lawn',
  },
].map((zone) => ({
  ...zone,
  radiusMeters: zone.radiusMeters ?? getObstacleTypeMeta(zone.type).defaultRadiusMeters,
}));

// ---------------------------------------------------------------------------
// Dev / testing fallback.
//
// A fixed hazard map only makes sense for a known, surveyed venue. This
// game spins up a *new* room wherever the host happens to be standing
// (see server.js `join-room` → `originLat`/`originLng`), so for anywhere
// that isn't your surveyed venue, generate a handful of plausible hazard
// zones scattered around the room's actual origin instead — useful for
// local testing/demos without needing a real survey first.
// ---------------------------------------------------------------------------
const EARTH_RADIUS_M = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

function destinationPoint(lat, lng, bearingDeg, distM) {
  const angDist = distM / EARTH_RADIUS_M;
  const bearingRad = toRad(bearingDeg);
  const lat1 = toRad(lat);
  const lng1 = toRad(lng);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angDist) + Math.cos(lat1) * Math.sin(angDist) * Math.cos(bearingRad)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angDist) * Math.cos(lat1),
      Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2)
    );
  return { lat: toDeg(lat2), lng: ((toDeg(lng2) + 540) % 360) - 180 };
}

/**
 * Scatters a handful of generic hazard zones around an arbitrary origin
 * point. Not a substitute for a real surveyed hazard map — use this only
 * for local dev/demo rooms where OBSTACLE_ZONES' fixed venue doesn't apply.
 *
 * @param {number} originLat
 * @param {number} originLng
 * @param {number} count - how many hazard zones to generate (default 4)
 * @param {number} spreadMeters - max distance from origin (default 80)
 */
export function generateDemoObstacleZones(originLat, originLng, count = 4, spreadMeters = 80) {
  const types = Object.values(OBSTACLE_TYPES);
  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const bearing = Math.random() * 360;
    const dist = 15 + Math.random() * spreadMeters;
    const pos = destinationPoint(originLat, originLng, bearing, dist);
    return {
      id: `demo-obs-${i}-${Math.random().toString(36).slice(2, 7)}`,
      type: type.key,
      lat: pos.lat,
      lng: pos.lng,
      radiusMeters: type.defaultRadiusMeters,
      label: `${type.label} (demo)`,
    };
  });
}

export default OBSTACLE_ZONES;
