// src/lib/motionPermission.js
//
// iOS Safari (13+) requires an explicit, user-gesture-triggered permission
// request before 'deviceorientation'/'deviceorientationabsolute' events
// will fire at all — DeviceOrientationEvent.requestPermission() must be
// called from inside a tap handler, and the user must accept a system
// prompt. Without this, the listeners in App.jsx (compass heading) and
// GameCanvas.jsx (CameraPitchRig device pitch) attach successfully, never
// error, and simply never receive events — deviceHeading and devicePitch
// silently stay stuck at 0 forever on iPhone, with no visible sign
// anything is wrong.
//
// Android Chrome and desktop browsers don't implement requestPermission()
// at all (the API doesn't exist on those platforms), so this feature-
// detects it and no-ops safely everywhere else — this is the ONE place
// that gate should live, called once, riding on a tap the user already
// has to make (e.g. entering AR mode), rather than sprinkled into every
// listener site.

const PERMISSION_GRANTED_KEY = 'motionPermissionGranted';

// True only on platforms that actually gate orientation events behind a
// runtime permission prompt (iOS 13+ Safari). Everywhere else this is
// undefined/not a function, so requesting isn't necessary at all.
export function needsMotionPermission() {
  return (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  );
}

// Call this from inside a tap/click handler — NOT from a useEffect on
// mount, or iOS will silently ignore the request since it wasn't
// triggered by a direct user gesture.
//
// Resolves true if orientation events are safe to rely on (permission
// granted, or platform doesn't require it), false if the user declined.
export async function requestMotionPermission() {
  if (!needsMotionPermission()) {
    // Android / desktop: nothing to ask for, events just work.
    return true;
  }

  // Already asked and granted earlier this session — iOS does persist
  // the grant per page load, but re-calling requestPermission() is safe
  // and cheap, so we still call through rather than trusting a cache
  // that could be stale across a hard navigation.
  try {
    const result = await DeviceOrientationEvent.requestPermission();
    const granted = result === 'granted';
    if (granted) {
      try {
        sessionStorage.setItem(PERMISSION_GRANTED_KEY, '1');
      } catch {
        // sessionStorage can throw in some locked-down webviews — not
        // fatal, just means we won't short-circuit on a future call.
      }
    }
    return granted;
  } catch (err) {
    console.error('[motionPermission] requestPermission() threw:', err?.message || err);
    return false;
  }
}

// Optional fast-path check for UI that wants to know up front whether to
// bother showing a "enable compass" prompt at all this session.
export function hasMotionPermissionCached() {
  if (!needsMotionPermission()) return true;
  try {
    return sessionStorage.getItem(PERMISSION_GRANTED_KEY) === '1';
  } catch {
    return false;
  }
}
