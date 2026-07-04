// utils/spatialGeoMath.js
//
// Pure geometry helpers, extracted out of GameCanvas.jsx's engine loop.
// These have zero React/DOM dependencies — safe to unit test standalone.

const EARTH_RADIUS_M = 6371000;

export const toRad = (deg) => (deg * Math.PI) / 180;
export const toDeg = (rad) => (rad * 180) / Math.PI;

/**
 * Haversine great-circle distance between two {lat, lng} points, in meters.
 *
 * @param {{lat: number, lng: number}|null} a
 * @param {{lat: number, lng: number}|null} b
 * @returns {number} meters, or Infinity if either point is missing
 */
export function metersBetween(a, b) {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return Infinity;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/**
 * Initial compass bearing (0-360, 0 = north) from point a to point b.
 *
 * @param {{lat: number, lng: number}} a
 * @param {{lat: number, lng: number}} b
 * @returns {number} degrees, 0-360
 */
export function bearingDegrees(a, b) {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return 0;
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Wraps a bearing delta into (-180, 180].
 *
 * @param {number} deg
 * @returns {number} normalized degrees in (-180, 180]
 */
export function normalizeRelAngle(deg) {
  return ((deg + 540) % 360) - 180;
}

/**
 * Projects a heading-relative bearing + distance into screen-space {x, y, scale}.
 *
 * @param {number} relAngle - degrees, signed, relative to device heading
 * @param {number} dist - meters
 * @param {number} screenW - viewport width in px
 * @param {number} screenH - viewport height in px
 * @param {Object} [opts]
 * @param {number} [opts.fovDeg=65] - assumed horizontal camera FOV
 * @param {number} [opts.visibilityRadiusM=45] - distance at which scale bottoms out
 * @returns {{x: number, y: number, scale: number}}
 */
export function bearingScreenPos(relAngle, dist, screenW, screenH, opts = {}) {
  const fovDeg = opts.fovDeg ?? 65;
  const visibilityRadiusM = opts.visibilityRadiusM ?? 45;

  // Rear clipping: if the target sits past the camera's visual edges
  // (e.g., behind you), push it off-screen so it doesn't float in view.
  if (Math.abs(relAngle) > 90) {
    return { x: -9999, y: -9999, scale: 0 };
  }

  const nx = 0.5 + (relAngle / (fovDeg / 2)) * 0.5;
  const ny = Math.max(0.02, Math.min(1, 1 - dist / visibilityRadiusM));

  const zFactor = 0.7 + (1.0 - ny) * 0.9;
  const x = screenW / 2 + ((nx - 0.5) * screenW) / zFactor;
  const y = screenH * (0.15 + ny * 0.8);
  const scale = 1.1 / zFactor;

  return { x, y, scale };
}

export { EARTH_RADIUS_M };
