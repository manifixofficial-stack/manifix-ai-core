// src/lib/motionPermission.js
//
// REACT NATIVE PORT of motionPermission.js (web build gated on Safari's
// DeviceOrientationEvent.requestPermission()).
//
// ============================================================================
// Library / API swaps made for RN
// ============================================================================
//   DeviceOrientationEvent.requestPermission()  -> expo-sensors'
//                                                   DeviceMotion.requestPermissionsAsync().
//                                                   This is RN's equivalent
//                                                   gate: iOS 13+ still
//                                                   requires an explicit,
//                                                   user-gesture-triggered
//                                                   permission prompt before
//                                                   motion/orientation data
//                                                   will flow, same as on
//                                                   web Safari — just a
//                                                   different API surface
//                                                   because there's no
//                                                   DeviceOrientationEvent
//                                                   global in RN.
//   typeof DeviceOrientationEvent !== 'undefined'
//     feature-detect                            -> Platform.OS === 'ios'
//                                                   check instead. RN has
//                                                   no DeviceOrientationEvent
//                                                   global to feature-detect
//                                                   against on any platform,
//                                                   so we branch on OS
//                                                   directly. Android/RN
//                                                   never gates this behind
//                                                   a runtime prompt, so it
//                                                   still no-ops safely
//                                                   there.
//   sessionStorage.setItem/getItem               -> DROPPED to a plain
//                                                    module-scoped variable.
//                                                    RN has no sessionStorage,
//                                                    and a JS module-level
//                                                    variable already gives
//                                                    us the same "persists
//                                                    for this app-session,
//                                                    gone on next cold
//                                                    start" behavior with
//                                                    no extra dependency.
//                                                    (If you want it to
//                                                    survive an app kill,
//                                                    swap this for
//                                                    @react-native-async-storage/
//                                                    async-storage — not
//                                                    done here since the
//                                                    original was
//                                                    sessionStorage, not
//                                                    localStorage, i.e.
//                                                    explicitly NOT meant
//                                                    to survive a relaunch.)
//
// NEW DEPENDENCY: expo-sensors (DeviceMotion). If your project doesn't
// have it yet: `npx expo install expo-sensors`.
//
// Unchanged logic: same call contract (call from inside a tap handler,
// not a mount-time useEffect), same return semantics (true = safe to
// rely on orientation/motion data, false = user declined), same
// "no-op true on platforms that don't gate this" behavior for Android.

import { Platform } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

// Module-scoped stand-in for the web version's sessionStorage flag —
// lives only as long as this JS context does (i.e. resets on app cold
// start, same "this session only" lifetime sessionStorage had).
let cachedGranted = false;

// True only on the platform that actually gates motion/orientation
// events behind a runtime permission prompt (iOS). Android's
// DeviceMotion just works without asking, so nothing to request there.
export function needsMotionPermission() {
  return Platform.OS === 'ios';
}

// Call this from inside a tap/press handler — NOT from a useEffect on
// mount, or iOS will silently ignore the request since it wasn't
// triggered by a direct user gesture (same rule as the web version).
//
// Resolves true if motion/orientation events are safe to rely on
// (permission granted, or platform doesn't require it), false if the
// user declined.
export async function requestMotionPermission() {
  if (!needsMotionPermission()) {
    // Android: nothing to ask for, events just work.
    return true;
  }

  try {
    const { status } = await DeviceMotion.requestPermissionsAsync();
    const granted = status === 'granted';
    if (granted) {
      cachedGranted = true;
    }
    return granted;
  } catch (err) {
    console.error('[motionPermission] requestPermissionsAsync() threw:', err?.message || err);
    return false;
  }
}

// Optional fast-path check for UI that wants to know up front whether to
// bother showing an "enable compass" prompt at all this session.
export function hasMotionPermissionCached() {
  if (!needsMotionPermission()) return true;
  return cachedGranted;
}