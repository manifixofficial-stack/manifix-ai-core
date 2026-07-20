// src/lib/arBridge.js
//
// JS-side interface to a native "VeggieGoAR" Capacitor plugin (Swift/
// ARKit on iOS, Kotlin/ARCore on Android — see native/ios and
// native/android skeleton drafts). This file defines the CONTRACT
// between native code and GameCanvas.jsx's arGroundY / arAnchors /
// arOcclusion props — GameCanvas doesn't know or care whether the
// numbers it receives came from real ARKit/ARCore or nowhere at all.
//
// SAFE BY DEFAULT: every exported function here resolves to a safe
// fallback (null / {} / no-op) instead of throwing when:
//   - running in a plain mobile browser (no Capacitor native runtime), or
//   - running inside Capacitor but the native VeggieGoAR plugin hasn't
//     been added to this build yet (e.g. iOS skeleton not compiled in
//     yet, or Android skeleton still being tested).
// This means useARBridge() can be wired into App.jsx today, before any
// native plugin code is finished or tested, with zero risk of crashing
// the existing mobile-web build — it'll just always report "not
// available" and GameCanvas falls back to its pre-AR fixed floor,
// exactly as it does today.
//
// PLUGIN CONTRACT (what the native Swift/Kotlin skeletons must
// implement to make this real):
//
//   startSession() -> Promise<{ success: boolean }>
//     Starts an ARKit/ARCore session with horizontal plane detection
//     (and depth/occlusion where the device supports it — see the
//     native skeleton comments on LiDAR vs non-LiDAR iOS devices and
//     ARCore Depth API device support).
//
//   stopSession() -> Promise<void>
//     Tears down the AR session (e.g. when leaving GameCanvas / app
//     backgrounds).
//
//   registerAnchor({ vegId, screenX, screenY }) -> Promise<{ y: number } | null>
//     Performs a hit-test at the given normalized screen point
//     (0-1 range, origin top-left — matches how GameCanvas already
//     projects world positions to screen space via projectToScreen())
//     and returns the detected real-world ground height for that
//     specific veggie, or null if no surface was found at that point
//     yet (caller should keep using the shared ground plane / fixed
//     fallback until a real hit lands).
//
//   Native -> JS events (via Capacitor's plugin event listener system):
//     'groundPlaneUpdate'  { y: number }
//       Fires whenever the primary/largest detected horizontal plane's
//       height changes or firms up. Feeds arGroundY.
//     'occlusionUpdate'    { occluded: { [vegId]: boolean } }
//       Fires whenever the depth-occlusion state of any tracked veggie
//       changes (real object moved between camera and veggie, or
//       cleared). Feeds arOcclusion.
//     'sessionError'       { message: string }
//       Session failed/degraded (tracking lost, unsupported device,
//       permission denied, etc). Surfaced via arSessionState.

import { registerPlugin, Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useRef, useState } from 'react';

// registerPlugin() itself never throws even if no native implementation
// exists for the current platform — calling a method on the returned
// object is what throws/rejects in that case, which is why every
// wrapper below is defensive.
const VeggieGoAR = registerPlugin('VeggieGoAR');

/**
 * True only when running inside a native Capacitor shell (not a plain
 * mobile browser) AND on a platform Capacitor considers native
 * (ios/android, not 'web'). Does NOT guarantee the VeggieGoAR native
 * plugin code itself is present/compiled in — startSession() below is
 * still the real test of that, since Capacitor.isNativePlatform() only
 * tells us we're inside the wrapper, not which plugins were built in.
 */
export function isNativeShell() {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() !== 'web';
  } catch {
    return false;
  }
}

/**
 * Starts the native AR session. Resolves { success: false, reason }
 * instead of throwing on any failure — plain mobile web, plugin not
 * compiled in yet, permission denied, unsupported device, etc all look
 * the same to a caller that just wants to know "do I have real AR data
 * or not" without a try/catch at every call site.
 */
export async function startARSession() {
  if (!isNativeShell()) {
    return { success: false, reason: 'not_native' };
  }
  try {
    const result = await VeggieGoAR.startSession();
    return { success: !!result?.success, reason: result?.success ? null : 'session_failed' };
  } catch (err) {
    console.warn('[arBridge] startARSession failed — falling back to fixed floor.', err?.message || err);
    return { success: false, reason: 'plugin_unavailable' };
  }
}

export async function stopARSession() {
  if (!isNativeShell()) return;
  try {
    await VeggieGoAR.stopSession();
  } catch (err) {
    console.warn('[arBridge] stopARSession failed (non-fatal).', err?.message || err);
  }
}

/**
 * Requests a real ground-anchor Y for one specific veggie via a native
 * hit-test at its current projected screen position. screenX/screenY
 * MUST be normalized 0-1 (not raw pixels) — matches
 * GameCanvas.projectToScreen()'s output once divided by
 * windowDims.w/h. Resolves null on any failure (no plane found yet,
 * plugin unavailable, not native) — callers should treat null as "keep
 * using the shared ground plane / fixed fallback for this veggie", not
 * as an error.
 */
export async function registerAnchor(vegId, screenX, screenY) {
  if (!isNativeShell() || !vegId) return null;
  try {
    const result = await VeggieGoAR.registerAnchor({ vegId, screenX, screenY });
    return typeof result?.y === 'number' ? result.y : null;
  } catch (err) {
    console.warn(`[arBridge] registerAnchor(${vegId}) failed.`, err?.message || err);
    return null;
  }
}

/**
 * React hook: owns the AR session lifecycle and exposes live state in
 * EXACTLY the shape GameCanvas.jsx's arGroundY / arAnchors / arOcclusion
 * props expect — spread the return value straight onto <GameCanvas>.
 *
 * @param {boolean} enabled - gate this false until the player is
 *   actually in GameCanvas (don't burn battery running an AR session
 *   on the lobby/radar screens). App.jsx should pass something like
 *   `screen === 'game'`.
 */
export function useARBridge(enabled) {
  const [arGroundY, setArGroundY] = useState(null);
  const [arAnchors, setArAnchors] = useState({});
  const [arOcclusion, setArOcclusion] = useState({});
  // 'idle' | 'starting' | 'active' | 'unavailable' | 'error'
  const [arSessionState, setArSessionState] = useState('idle');

  const listenersRef = useRef([]);

  useEffect(() => {
    if (!enabled) {
      setArSessionState('idle');
      return undefined;
    }

    let cancelled = false;

    async function boot() {
      if (!isNativeShell()) {
        // Plain mobile web build — expected, not an error. GameCanvas
        // already handles null/empty gracefully via its fixed-floor
        // fallback, so this is a quiet no-op, not a console warning.
        setArSessionState('unavailable');
        return;
      }

      setArSessionState('starting');
      const { success } = await startARSession();
      if (cancelled) return;

      if (!success) {
        setArSessionState('unavailable');
        return;
      }

      setArSessionState('active');

      const groundListener = await VeggieGoAR.addListener('groundPlaneUpdate', (data) => {
        if (typeof data?.y === 'number') setArGroundY(data.y);
      });
      const occlusionListener = await VeggieGoAR.addListener('occlusionUpdate', (data) => {
        if (data?.occluded && typeof data.occluded === 'object') {
          setArOcclusion(data.occluded);
        }
      });
      const errorListener = await VeggieGoAR.addListener('sessionError', (data) => {
        console.warn('[arBridge] native session error:', data?.message);
        setArSessionState('error');
      });

      listenersRef.current = [groundListener, occlusionListener, errorListener];
    }

    boot();

    return () => {
      cancelled = true;
      listenersRef.current.forEach((l) => l?.remove?.());
      listenersRef.current = [];
      stopARSession();
      setArGroundY(null);
      setArAnchors({});
      setArOcclusion({});
    };
  }, [enabled]);

  // Exposed so App.jsx/GameCanvas can request a precise per-veggie
  // anchor (e.g. right after a veggie spawns) instead of relying only
  // on the shared ground plane. Merges into arAnchors on success;
  // no-ops safely if unavailable.
  const anchorVeggie = useCallback(async (vegId, screenX, screenY) => {
    const y = await registerAnchor(vegId, screenX, screenY);
    if (y != null) {
      setArAnchors((prev) => ({ ...prev, [vegId]: { y } }));
    }
    return y;
  }, []);

  return { arGroundY, arAnchors, arOcclusion, arSessionState, anchorVeggie };
}
