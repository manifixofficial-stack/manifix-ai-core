/**
 * geoMath.js
 * Haversine distance + bearing vector utilities for GPS-anchored AR gameplay.
 * All angles in degrees unless noted. All distances in meters.
 */

const EARTH_RADIUS_M = 6371000;

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

/**
 * Haversine distance between two lat/lng points, in meters.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in meters
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Initial compass bearing (0-360, 0 = North, clockwise) from point 1 to point 2.
 * @returns {number} bearing in degrees
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLon = toRad(lon2 - lon1);

  const y = Math.sin(dLon) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);

  const theta = Math.atan2(y, x);
  return (toDeg(theta) + 360) % 360;
}

/**
 * Normalize an angle difference to the range [-180, 180].
 * Useful for figuring out shortest rotation direction.
 */
export function normalizeAngleDelta(delta) {
  let d = delta % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/**
 * Given the device's compass heading and the true bearing to a target,
 * return the relative bearing (-180..180) the target sits at, relative
 * to where the phone is currently pointing. 0 = dead ahead.
 */
export function relativeBearing(deviceHeading, targetBearing) {
  return normalizeAngleDelta(targetBearing - deviceHeading);
}

/**
 * Project a relative bearing onto a screen x-position for AR overlay.
 * @param {number} relBearing - relative bearing in degrees (-180..180)
 * @param {number} screenWidth - width of the camera viewport in px
 * @param {number} fovDegrees - horizontal field of view of the camera/view, default 60
 * @returns {number|null} x coordinate in px, or null if outside the FOV
 */
export function bearingToScreenX(relBearing, screenWidth, fovDegrees = 60) {
  const halfFov = fovDegrees / 2;
  if (relBearing < -halfFov || relBearing > halfFov) return null;
  const ratio = (relBearing + halfFov) / fovDegrees; // 0..1
  return ratio * screenWidth;
}

/**
 * Convenience: full projection of a target lat/lng into AR screen space,
 * given the player's current position/heading and viewport dimensions.
 */
export function projectTargetToScreen({
  playerLat,
  playerLon,
  targetLat,
  targetLon,
  deviceHeading,
  screenWidth,
  fovDegrees = 60,
}) {
  const distance = haversineDistance(playerLat, playerLon, targetLat, targetLon);
  const bearing = calculateBearing(playerLat, playerLon, targetLat, targetLon);
  const relBearing = relativeBearing(deviceHeading, bearing);
  const screenX = bearingToScreenX(relBearing, screenWidth, fovDegrees);

  return {
    distance,
    bearing,
    relativeBearing: relBearing,
    screenX, // null if off-screen
    inView: screenX !== null,
  };
}

/**
 * Check whether a player is within capture range of a target.
 * @param {number} thresholdMeters - default 15m capture radius
 */
export function isWithinRange(lat1, lon1, lat2, lon2, thresholdMeters = 15) {
  return haversineDistance(lat1, lon1, lat2, lon2) <= thresholdMeters;
}
