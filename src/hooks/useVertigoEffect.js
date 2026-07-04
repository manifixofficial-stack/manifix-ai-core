// hooks/useVertigoEffect.js
//
// Accelerometer-driven "vertigo" intensity, meant to feed a CSS
// filter/skew warp on the live camera <video> element in GameCanvas.jsx.
// Mirrors the existing DeviceOrientationEvent.requestPermission() gating
// GameCanvas already does for the compass — iOS 13+ needs the exact same
// one-time user-gesture-gated permission call for DeviceMotionEvent, so
// this hook exposes requestVertigoPermission() rather than auto-starting,
// to be called from the same permission step as the camera/compass/GPS
// requests already in requestPermissions().
//
// Usage in GameCanvas.jsx:
//
//   const {
//     vertigoIntensity,
//     vertigoSupported,
//     requestVertigoPermission,
//   } = useVertigoEffect({ enabled: permissionStage === 'ready' && !simMode });
//   ...
//   // inside requestPermissions(), alongside the existing compass request:
//   await requestVertigoPermission();
//   ...
//   <video
//     ...
//     style={{ ...styles.video, filter: buildVertigoFilter(vertigoIntensity) }}
//   />

import { useCallback, useEffect, useRef, useState } from 'react';

const SMOOTHING = 0.15;              // low-pass filter factor, 0..1 (higher = snappier)
const ACCEL_FLOOR = 1.5;             // m/s^2 below this reads as "not really moving"
const ACCEL_CEILING = 9.0;           // m/s^2 at/above this is treated as max vertigo
const MAX_HUE_ROTATE_DEG = 25;
const MAX_SKEW_DEG = 4;

/**
 * Tracks device motion and derives a smoothed 0..1 "vertigo intensity"
 * from the magnitude of acceleration (gravity excluded where the browser
 * supports it). Does nothing until `enabled` is true AND permission has
 * been granted, so it stays fully inert during sim mode or before the
 * base AR permission flow completes.
 */
export default function useVertigoEffect({ enabled = false } = {}) {
  const [vertigoSupported, setVertigoSupported] = useState(null); // null = unchecked
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [vertigoIntensity, setVertigoIntensity] = useState(0);
  const smoothedRef = useRef(0);

  useEffect(() => {
    setVertigoSupported(typeof window !== 'undefined' && 'DeviceMotionEvent' in window);
  }, []);

  const requestVertigoPermission = useCallback(async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const result = await DeviceMotionEvent.requestPermission();
        setPermissionGranted(result === 'granted');
        return result === 'granted';
      } catch (err) {
        console.error('[useVertigoEffect] motion permission request failed', err);
        setPermissionGranted(false);
        return false;
      }
    }
    // Android / older iOS: no explicit permission prompt exists, treat as granted.
    setPermissionGranted(true);
    return true;
  }, []);

  useEffect(() => {
    if (!enabled || !permissionGranted) return undefined;

    const handleMotion = (event) => {
      const accel = event.acceleration || event.accelerationIncludingGravity;
      if (!accel) return;
      const magnitude = Math.hypot(accel.x || 0, accel.y || 0, accel.z || 0);
      const clamped = Math.max(ACCEL_FLOOR, Math.min(ACCEL_CEILING, magnitude));
      const target = (clamped - ACCEL_FLOOR) / (ACCEL_CEILING - ACCEL_FLOOR);

      smoothedRef.current += (target - smoothedRef.current) * SMOOTHING;
      setVertigoIntensity(smoothedRef.current);
    };

    window.addEventListener('devicemotion', handleMotion, true);
    return () => window.removeEventListener('devicemotion', handleMotion, true);
  }, [enabled, permissionGranted]);

  // Decay back toward 0 when disabled (e.g. sim mode toggled on mid-game)
  // rather than leaving the last warp value stuck on screen.
  useEffect(() => {
    if (enabled) return undefined;
    smoothedRef.current = 0;
    setVertigoIntensity(0);
    return undefined;
  }, [enabled]);

  return { vertigoIntensity, vertigoSupported, permissionGranted, requestVertigoPermission };
}

/**
 * Turns a 0..1 intensity into the CSS filter string GameCanvas applies to
 * the video element. Kept as a standalone export so GameCanvas doesn't
 * need to know the specific filter recipe, just the intensity number.
 */
export function buildVertigoFilter(intensity) {
  if (!intensity || intensity <= 0) return 'none';
  const hue = Math.round(intensity * MAX_HUE_ROTATE_DEG);
  const skew = (intensity * MAX_SKEW_DEG).toFixed(2);
  // skewY isn't a real CSS filter function, so the skew component is
  // applied as a transform hint via a custom property GameCanvas can pick
  // up on the wrapping element if it wants an actual skew(); the filter
  // string itself sticks to filter-legal functions (hue-rotate, blur,
  // saturate) so it's safe to assign directly to `filter`.
  return `hue-rotate(${hue}deg) saturate(${1 + intensity * 0.6}) blur(${(intensity * 1.2).toFixed(2)}px)`;
}

/** Companion transform string for the wrapping element's `transform`, since
 * skew must go there rather than in `filter`. Call alongside buildVertigoFilter.
 */
export function buildVertigoTransform(intensity) {
  if (!intensity || intensity <= 0) return 'none';
  const skew = (intensity * MAX_SKEW_DEG).toFixed(2);
  return `skew(${skew}deg, ${(skew / 2).toFixed(2)}deg) scale(${1 + intensity * 0.02})`;
}
