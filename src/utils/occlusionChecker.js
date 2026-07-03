// utils/occlusionChecker.js
//
// Fakes wall/obstacle occlusion without real depth sensing: if a mapped
// OBSTACLE_ZONES entry sits close to the straight line between the player
// and a veggie, treat the veggie as hidden behind it.
//
// NOTE on the version you may have seen elsewhere: a simpler approach
// just checks "is the veggie within radiusMeters of the obstacle center."
// That's cheap but wrong in an important way — it hides a veggie
// standing right NEXT to a wall even when the player is looking at it
// from the open side, and fails to hide veggies further away that are
// genuinely behind the wall from the player's position. This version
// instead checks distance from the obstacle's center to the *segment*
// between player and veggie, which approximates "is this wall actually
// between them" — much closer to how occlusion should feel.
//
// Safe no-op fallback: any OBSTACLE_ZONES entry missing `coordinates` or
// `radiusMeters` is skipped rather than throwing, so this works even
// before your config/obstacles.js entries have been upgraded with those
// fields (see the note left in config/obstacles.js).

import { OBSTACLE_ZONES } from '../config/obstacles.js';

const METERS_PER_DEGREE_LAT = 111320;

function metersPerDegreeLng(atLat) {
  return METERS_PER_DEGREE_LAT * Math.cos((atLat * Math.PI) / 180);
}

/**
 * Rough local equirectangular projection to meters, centered on `origin`.
 * Fine at the scale of a single obstacle check (tens of meters) — not
 * meant for long-distance math, which is what utils/spatialGeoMath.js's
 * haversine functions are for.
 */
function toLocalMeters(point, origin) {
  const mPerLng = metersPerDegreeLng(origin.lat);
  return {
    x: (point.lng - origin.lng) * mPerLng,
    y: (point.lat - origin.lat) * METERS_PER_DEGREE_LAT,
  };
}

/** Shortest distance from point P to segment AB, all in local meters. */
function pointToSegmentDistanceMeters(p, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSq = abx * abx + aby * aby;

  if (lengthSq === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y); // a === b, degenerate segment
  }

  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const closest = { x: a.x + t * abx, y: a.y + t * aby };
  return Math.hypot(p.x - closest.x, p.y - closest.y);
}

/**
 * @param {{lat: number, lng: number}} veggieCoords
 * @param {{lat: number, lng: number}} playerCoords
 * @returns {boolean} true if a mapped obstacle sits between player and veggie
 */
export function checkPhysicalOcclusion(veggieCoords, playerCoords) {
  if (!veggieCoords || !playerCoords) return false;

  for (const zone of OBSTACLE_ZONES) {
    if (!zone.coordinates || typeof zone.radiusMeters !== 'number') continue;

    const origin = playerCoords;
    const playerLocal = { x: 0, y: 0 };
    const veggieLocal = toLocalMeters(veggieCoords, origin);
    const obstacleLocal = toLocalMeters(zone.coordinates, origin);

    const distToSegment = pointToSegmentDistanceMeters(obstacleLocal, playerLocal, veggieLocal);
    if (distToSegment <= zone.radiusMeters) {
      return true;
    }
  }
  return false;
}
