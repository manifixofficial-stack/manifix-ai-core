import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// useDeviceMotion
//
// Wraps the `devicemotion` event and exposes a live accelerometer vector.
// This does NOT do anything with the data on its own — it's just the raw
// sensor plumbing (permission handling + event subscription). What the
// accelerometer is actually *for* (step detection, shake-to-catch, etc.)
// still needs to be defined and built on top of this in GameCanvas.jsx.
//
// iOS 13+ requires an explicit user-gesture-triggered permission request
// (DeviceMotionEvent.requestPermission()), same pattern as the compass
// permission already handled in GameCanvas's requestPermissions(). Android
// and older iOS just fire the event with no permission prompt at all.
// ---------------------------------------------------------------------------

const DEFAULT_STATE = {
  x: 0,
  y: 0,
  z: 0,
  // Gravity-inclusive reading, if the browser provides it (accelerometer
  // vs accelerationIncludingGravity) — see note on `useGravity` below.
  magnitude: 0,
  interval: null,
};

export function useDeviceMotion({ useGravity = false, smoothing = 0 } = {}) {
  const [motion, setMotion] = useState(DEFAULT_STATE);
  const [supported, setSupported] = useState(true);
  const [permissionState, setPermissionState] = useState('unknown'); // 'unknown' | 'granted' | 'denied' | 'unnecessary'
  const cleanupRef = useRef(null);
  const smoothedRef = useRef({ x: 0, y: 0, z: 0 });

  const attachListener = useCallback(() => {
    const handleMotion = (event) => {
      const raw = useGravity
        ? event.accelerationIncludingGravity
        : event.acceleration;

      // Some browsers report `acceleration` as null when the device has no
      // hardware accel-minus-gravity filtering (common on cheaper Android
      // devices) — fall back to accelerationIncludingGravity so the hook
      // still returns *something* rather than silently zeroing out.
      const source = raw && raw.x !== null ? raw : event.accelerationIncludingGravity;
      if (!source || source.x === null) return;

      const nextRaw = { x: source.x || 0, y: source.y || 0, z: source.z || 0 };

      // Optional exponential smoothing — raw accelerometer data is noisy;
      // smoothing in [0, 1) (e.g. 0.8) trades responsiveness for stability.
      let next = nextRaw;
      if (smoothing > 0) {
        const prev = smoothedRef.current;
        next = {
          x: prev.x + (nextRaw.x - prev.x) * (1 - smoothing),
          y: prev.y + (nextRaw.y - prev.y) * (1 - smoothing),
          z: prev.z + (nextRaw.z - prev.z) * (1 - smoothing),
        };
        smoothedRef.current = next;
      }

      const magnitude = Math.sqrt(next.x ** 2 + next.y ** 2 + next.z ** 2);

      setMotion({
        x: next.x,
        y: next.y,
        z: next.z,
        magnitude,
        interval: event.interval ?? null,
      });
    };

    window.addEventListener('devicemotion', handleMotion, true);
    return () => window.removeEventListener('devicemotion', handleMotion, true);
  }, [useGravity, smoothing]);

  // Call this from a user-gesture handler (button tap), same as the
  // existing compass/geolocation permission flow in GameCanvas — iOS will
  // silently no-op devicemotion events forever if you skip this and just
  // add the listener directly.
  const requestPermission = useCallback(async () => {
    if (typeof DeviceMotionEvent === 'undefined') {
      setSupported(false);
      return false;
    }

    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const result = await DeviceMotionEvent.requestPermission();
        setPermissionState(result === 'granted' ? 'granted' : 'denied');
        if (result !== 'granted') return false;
      } catch (err) {
        setPermissionState('denied');
        return false;
      }
    } else {
      // Android / older iOS / desktop — no permission gate exists.
      setPermissionState('unnecessary');
    }

    cleanupRef.current = attachListener();
    return true;
  }, [attachListener]);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  return { motion, supported, permissionState, requestPermission };
}
