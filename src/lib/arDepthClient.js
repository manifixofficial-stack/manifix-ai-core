// lib/arDepthClient.js
//
// Thin wrapper around the WebXR Device API's 'immersive-ar' session mode,
// with the 'depth-sensing' and 'plane-detection' optional features. Mirrors
// the wrapper pattern of gameClient.js/tickClient.js — this module owns the
// raw session lifecycle; GameCanvas.jsx and useARPlaneDetection.js consume
// it, they don't touch navigator.xr directly.
//
// Browser support caveat: as of today this is a Chrome/ARCore-only surface
// (practically: Android Chrome). Safari/iOS has no WebXR AR support at all,
// and depth-sensing specifically is not implemented in every Chromium
// build that otherwise supports immersive-ar. Always gate UI on
// isARDepthSupported() rather than assuming — and even when it resolves
// true, requestARDepthSession() can still fail at the actual permission
// prompt (user backs out, camera held by another app, hardware asleep),
// which is why that call is wrapped in try/catch by its caller rather than
// assumed to always resolve.

// Preferred depth usage/format hints, per the WebXR Depth Sensing spec.
// 'cpu-optimized' + 'luminance-alpha' is the broadly-supported combo for
// reading raw depth values off the main thread (as opposed to
// 'gpu-optimized', which is meant for shader sampling and isn't what
// sampleCenterDepthMeters needs here).
const DEPTH_USAGE_PREFERENCE = ['cpu-optimized'];
const DEPTH_FORMAT_PREFERENCE = ['luminance-alpha', 'float32'];

/**
 * Resolves whether this browser/device can negotiate an 'immersive-ar'
 * session with the 'depth-sensing' feature. Read-only capability check —
 * does NOT prompt for camera/XR permission, so it's safe to call without a
 * user gesture (e.g. from a useEffect on mount).
 *
 * @returns {Promise<boolean>}
 */
export async function isARDepthSupported() {
  if (typeof navigator === 'undefined' || !navigator.xr) return false;
  try {
    const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
    // isSessionSupported only confirms the session *mode* is available,
    // not that depth-sensing specifically is — there's no separate
    // capability query for an individual optional feature ahead of an
    // actual session request, so this is the closest pre-check available.
    // requestARDepthSession() is still the source of truth and can fail
    // even when this resolves true.
    return !!arSupported;
  } catch (err) {
    console.error('[arDepthClient] isSessionSupported check failed', err);
    return false;
  }
}

/**
 * Requests an 'immersive-ar' XRSession with depth-sensing (required) and
 * plane-detection + dom-overlay (optional — session still succeeds without
 * them, just with those features unavailable to callers).
 *
 * Must be called from within a user gesture (e.g. a button onClick), per
 * the WebXR spec — this is why GameCanvas.jsx only calls this from
 * toggleARDepth(), never automatically.
 *
 * @param {Object} params
 * @param {HTMLElement|null} params.domOverlayRoot - element to use as the
 *   dom-overlay root (lets our existing HUD/buttons render on top of the
 *   XR camera feed instead of being hidden behind it). Optional — if
 *   null/undefined, dom-overlay is simply not requested.
 * @param {() => void} [params.onSessionEnd] - called when the session ends
 *   for any reason we didn't initiate ourselves (user backs out via the
 *   browser/OS AR UI, tracking lost permanently, etc.)
 * @returns {Promise<{ xrSession: XRSession, referenceSpace: XRReferenceSpace, stop: () => Promise<void> }>}
 */
export async function requestARDepthSession({ domOverlayRoot, onSessionEnd } = {}) {
  if (typeof navigator === 'undefined' || !navigator.xr) {
    throw new Error('WebXR is not available in this browser.');
  }

  const optionalFeatures = ['plane-detection'];
  if (domOverlayRoot) optionalFeatures.push('dom-overlay');

  const sessionInit = {
    requiredFeatures: ['depth-sensing'],
    optionalFeatures,
    depthSensing: {
      usagePreference: DEPTH_USAGE_PREFERENCE,
      dataFormatPreference: DEPTH_FORMAT_PREFERENCE,
    },
  };
  if (domOverlayRoot) {
    sessionInit.domOverlay = { root: domOverlayRoot };
  }

  const xrSession = await navigator.xr.requestSession('immersive-ar', sessionInit);

  let referenceSpace;
  try {
    // 'local' is the right reference space for a handheld/walk-around AR
    // session — tracks relative to where tracking started, doesn't assume
    // a seated/stationary rig like 'local-floor' can on some devices.
    referenceSpace = await xrSession.requestReferenceSpace('local');
  } catch (err) {
    // Session was granted but the reference space failed — don't leave a
    // half-open XRSession dangling.
    await xrSession.end().catch(() => {});
    throw err;
  }

  let ended = false;
  const handleSessionEnd = () => {
    if (ended) return;
    ended = true;
    xrSession.removeEventListener('end', handleSessionEnd);
    if (typeof onSessionEnd === 'function') onSessionEnd();
  };
  xrSession.addEventListener('end', handleSessionEnd);

  const stop = async () => {
    if (ended) return;
    // Mark ended immediately so the 'end' listener above (which will
    // still fire from session.end()) doesn't also call onSessionEnd —
    // that callback exists specifically for the *unrequested* end case
    // (user backing out via native UI), not for our own stop() calls.
    ended = true;
    xrSession.removeEventListener('end', handleSessionEnd);
    try {
      await xrSession.end();
    } catch (err) {
      // Session may already be ending/ended (e.g. OS reclaimed the
      // camera) — nothing more to clean up on our side either way.
      console.error('[arDepthClient] session.end() failed', err);
    }
  };

  return { xrSession, referenceSpace, stop };
}

/**
 * Starts an XRSession.requestAnimationFrame loop and invokes onFrame with
 * { frame, view } once per XR frame, for as long as the session has a
 * usable pose. Returns a stop function that cancels the loop (does NOT end
 * the session itself — that's requestARDepthSession()'s returned `stop`).
 *
 * @param {Object} params
 * @param {XRSession} params.xrSession
 * @param {XRReferenceSpace} params.referenceSpace
 * @param {(ctx: { frame: XRFrame, view: XRView }) => void} params.onFrame
 * @returns {() => void} stop - cancels the frame loop
 */
export function startDepthLoop({ xrSession, referenceSpace, onFrame }) {
  let rafHandle = null;
  let cancelled = false;

  const onXRFrame = (_time, frame) => {
    if (cancelled) return;

    const pose = frame.getViewerPose(referenceSpace);
    if (pose) {
      // A handheld phone AR session has exactly one view (the camera
      // feed) — unlike a headset's stereo pair — but we still iterate
      // pose.views rather than assume [0], since that's the
      // spec-correct way to find the view actually being rendered.
      for (const view of pose.views) {
        if (typeof onFrame === 'function') {
          onFrame({ frame, view });
        }
      }
    }

    if (!cancelled) {
      rafHandle = xrSession.requestAnimationFrame(onXRFrame);
    }
  };

  rafHandle = xrSession.requestAnimationFrame(onXRFrame);

  return () => {
    cancelled = true;
    if (rafHandle != null) {
      xrSession.cancelAnimationFrame(rafHandle);
      rafHandle = null;
    }
  };
}

/**
 * Reads the depth value at the center of the given view's viewport for
 * this frame, in meters. Returns null if depth data isn't available for
 * this frame/view (e.g. depth-sensing wasn't actually granted, or this
 * particular frame has no depth data yet — this can happen for the first
 * few frames after session start).
 *
 * @param {XRFrame} frame
 * @param {XRView} view
 * @returns {number|null}
 */
export function sampleCenterDepthMeters(frame, view) {
  if (!frame || !view || typeof frame.getDepthInformation !== 'function') return null;

  let depthInfo;
  try {
    depthInfo = frame.getDepthInformation(view);
  } catch (err) {
    // Spec allows this to throw if depth data isn't available for this
    // frame — treat the same as "no reading yet" rather than surfacing
    // an error for a transient, expected condition.
    return null;
  }
  if (!depthInfo) return null;

  try {
    // getDepthInPixel wants normalized viewport coordinates in CSS pixels
    // relative to the depth buffer's own width/height, per spec — center
    // of frame is just half of each.
    const x = Math.floor(depthInfo.width / 2);
    const y = Math.floor(depthInfo.height / 2);
    return depthInfo.getDepthInMeters(x, y);
  } catch (err) {
    console.error('[arDepthClient] getDepthInMeters failed', err);
    return null;
  }
}
