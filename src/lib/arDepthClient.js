// arDepthClient.js
//
// Thin wrapper around the WebXR Device API's 'immersive-ar' session with
// the 'depth-sensing' feature. This is NOT compatible with the current
// GameCanvas.jsx camera pipeline (getUserMedia + <video> element) — WebXR
// AR sessions own the camera/render loop themselves via
// XRSession.requestAnimationFrame, so adopting this means restructuring
// the render path, not adding a helper alongside the existing one.
//
// Browser support (check before building on this): Chrome/Edge on
// ARCore-capable Android devices support 'immersive-ar' + 'depth-sensing'.
// Safari/iOS has no WebXR AR support at all — this will silently fail
// isSupported() there. There is no cross-platform fallback baked in here;
// callers must handle isSupported() === false explicitly (e.g. keep the
// existing 2D bearing-projection mode as the fallback for unsupported
// devices, same as today's simMode fallback pattern).

const DEPTH_FEATURE = 'depth-sensing';

/**
 * Checks whether this browser/device can run an immersive-ar session with
 * depth sensing. Always await this before calling startSession() — do not
 * assume support based on 'xr' in navigator alone, since that only tells
 * you the API surface exists, not that immersive-ar + depth-sensing is
 * actually available on this hardware.
 */
export async function isDepthSensingSupported() {
  if (!navigator.xr || typeof navigator.xr.isSessionSupported !== 'function') {
    return false;
  }
  try {
    const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
    return !!arSupported;
    // Note: isSessionSupported() confirms 'immersive-ar' is available, but
    // NOT that 'depth-sensing' specifically will be granted — that's only
    // knowable after requestSession() resolves and you check
    // session.depthUsage / session.enabledFeatures. Treat depth as
    // "requested, not guaranteed" throughout this file.
  } catch (err) {
    console.error('[arDepthClient] isSessionSupported check failed', err);
    return false;
  }
}

/**
 * Starts an immersive-ar XRSession requesting depth-sensing (and
 * plane-detection, since useARPlaneDetection.js depends on the same
 * session). Returns { session, referenceSpace, depthSupported } or throws.
 *
 * gl: a WebGL2 context already configured with
 *   { xrCompatible: true } — required by WebXR's makeXRCompatible/
 *   baseLayer setup. This module does not create the canvas/GL context
 *   itself; the caller owns that, since it's tightly coupled to whatever
 *   renderer (three.js, raw WebGL, etc.) actually draws the frame.
 */
export async function startSession(gl, {
  depthUsagePreference = ['cpu-optimized', 'gpu-optimized'],
  depthFormatPreference = ['luminance-alpha', 'float32'],
} = {}) {
  if (!gl) {
    throw new Error('[arDepthClient] startSession requires an XR-compatible WebGL2 context.');
  }
  if (!navigator.xr) {
    throw new Error('[arDepthClient] navigator.xr is unavailable in this browser.');
  }

  let session;
  try {
    session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['local-floor'],
      optionalFeatures: [DEPTH_FEATURE, 'plane-detection', 'hit-test'],
      depthSensing: {
        usagePreference: depthUsagePreference,
        dataFormatPreference: depthFormatPreference,
      },
    });
  } catch (err) {
    throw new Error(`[arDepthClient] requestSession failed: ${err.message}`);
  }

  // depth-sensing is optional — the session can start without it granting.
  // Check enabledFeatures rather than assuming the optionalFeatures list
  // was honored.
  const depthSupported = session.enabledFeatures
    ? session.enabledFeatures.includes(DEPTH_FEATURE)
    : false;

  const xrLayer = new XRWebGLLayer(session, gl);
  session.updateRenderState({ baseLayer: xrLayer });

  let referenceSpace;
  try {
    referenceSpace = await session.requestReferenceSpace('local-floor');
  } catch (err) {
    // local-floor requires a floor estimate; fall back to 'local' if the
    // device can't provide one (still valid for depth/plane data, just no
    // guaranteed floor-level origin).
    referenceSpace = await session.requestReferenceSpace('local');
  }

  return { session, referenceSpace, depthSupported };
}

/**
 * Pulls per-frame CPU depth data for a given XRView, if depth-sensing was
 * granted. Returns null if unsupported/unavailable for this frame — this
 * is a normal, expected outcome (device dropped tracking, view has no
 * depth this frame) and callers should skip occlusion for that frame
 * rather than treat it as an error.
 *
 * Must be called once per XRView, inside the session's XRFrame callback —
 * depth data is only valid for the frame it was retrieved in.
 */
export function getDepthDataForView(frame, view) {
  if (!frame || !view || typeof frame.getDepthInformation !== 'function') {
    return null;
  }
  try {
    const depthInfo = frame.getDepthInformation(view);
    if (!depthInfo) return null;
    return {
      width: depthInfo.width,
      height: depthInfo.height,
      rawValueToMeters: depthInfo.rawValueToMeters,
      // getDepthInMeters(x, y) takes NORMALIZED [0,1] view coordinates,
      // not pixel coordinates — a common source of silently-wrong
      // occlusion tests if you pass raw screen px here.
      getDepthInMeters: (normX, normY) => depthInfo.getDepthInMeters(normX, normY),
    };
  } catch (err) {
    console.error('[arDepthClient] getDepthInformation failed', err);
    return null;
  }
}

/**
 * Occlusion test: given a normalized [0,1] screen-space point and the
 * known distance (meters) from camera to the virtual object at that
 * point, returns true if real-world geometry is closer than the object
 * (i.e. the object should be hidden/clipped this frame).
 *
 * toleranceMeters guards against z-fighting flicker at near-equal depths;
 * tune per device — depth-sensing accuracy varies significantly across
 * ARCore hardware.
 */
export function isOccluded(depthData, normX, normY, objectDistanceMeters, toleranceMeters = 0.15) {
  if (!depthData) return false; // no depth data this frame — don't hide anything
  const realDepth = depthData.getDepthInMeters(normX, normY);
  if (!Number.isFinite(realDepth) || realDepth <= 0) return false;
  return realDepth + toleranceMeters < objectDistanceMeters;
}

export function endSession(session) {
  if (!session) return Promise.resolve();
  return session.end().catch((err) => {
    console.error('[arDepthClient] session.end() failed', err);
  });
}
