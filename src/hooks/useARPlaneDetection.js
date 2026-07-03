// useARPlaneDetection.js
//
// Tracks WebXR 'detected-planes' (walls, floors, tables) for a live
// XRSession started via lib/arDepthClient.js's startSession(). Depends on
// the SAME session — this hook does not start its own session, since only
// one immersive-ar session can be active at a time and arDepthClient owns
// session lifecycle.
//
// Browser support caveat (same as arDepthClient.js): plane-detection is a
// Chrome/ARCore-only optional feature today. Safari/iOS has no WebXR AR
// support. Always check `planesSupported` before relying on non-empty
// output — an empty planes array does not distinguish "no planes detected
// yet" from "this device can't detect planes at all."
//
// Usage: this hook expects to be driven from inside the same
// XRSession.requestAnimationFrame loop that arDepthClient's depth reads
// happen in — it exposes updateFromFrame(frame) to be called once per XR
// frame, rather than polling independently, since XRFrame.detectedPlanes
// is only valid within that callback.

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * @param {XRSession|null} session - active session from arDepthClient.startSession()
 * @param {XRReferenceSpace|null} referenceSpace - reference space from the same call
 */
export default function useARPlaneDetection(session, referenceSpace) {
  const [planes, setPlanes] = useState([]);
  const [planesSupported, setPlanesSupported] = useState(null); // null = unknown until first frame
  const planePoseCache = useRef(new Map()); // XRPlane -> last pose, to skip unchanged planes

  useEffect(() => {
    if (!session) {
      setPlanes([]);
      setPlanesSupported(null);
      planePoseCache.current.clear();
      return undefined;
    }

    const supported = session.enabledFeatures
      ? session.enabledFeatures.includes('plane-detection')
      : null;
    setPlanesSupported(supported);

    // Reset cache when the session changes so stale planes from a prior
    // session can't leak into a new one.
    planePoseCache.current.clear();
    return () => {
      planePoseCache.current.clear();
    };
  }, [session]);

  /**
   * Call once per XRFrame from the render loop owning this session, e.g.:
   *
   *   session.requestAnimationFrame(function onFrame(t, frame) {
   *     updateFromFrame(frame);
   *     ...
   *     session.requestAnimationFrame(onFrame);
   *   });
   *
   * Reads frame.detectedPlanes (a set of XRPlane), resolves each plane's
   * pose against referenceSpace, and republishes to React state ONLY when
   * the plane set or a pose actually changed — detectedPlanes can include
   * dozens of planes on a busy scene, and diffing avoids a setState (and
   * therefore a re-render) on every single XR frame at 60-90fps.
   */
  const updateFromFrame = useCallback((frame) => {
    if (!frame || !referenceSpace) return;
    if (typeof frame.detectedPlanes === 'undefined') {
      // detectedPlanes not present on this frame object at all means the
      // browser doesn't support plane-detection — distinct from an empty
      // Set, which means "supported, nothing detected yet."
      if (planesSupported !== false) setPlanesSupported(false);
      return;
    }
    if (planesSupported !== true) setPlanesSupported(true);

    const currentPlaneObjects = frame.detectedPlanes;
    const cache = planePoseCache.current;
    let changed = currentPlaneObjects.size !== cache.size;

    const nextPlanes = [];
    const seenPlaneRefs = new Set();

    currentPlaneObjects.forEach((xrPlane) => {
      seenPlaneRefs.add(xrPlane);
      let pose;
      try {
        pose = frame.getPose(xrPlane.planeSpace, referenceSpace);
      } catch (err) {
        // Pose can transiently fail to resolve (tracking loss); skip this
        // plane for this frame rather than throwing the whole loop.
        return;
      }
      if (!pose) return;

      const cached = cache.get(xrPlane);
      const lastChangedAt = xrPlane.lastChangedTime;
      if (!cached || cached.lastChangedAt !== lastChangedAt) {
        changed = true;
      }

      const entry = {
        id: cached?.id ?? `${xrPlane.orientation || 'plane'}-${nextPlanes.length}-${Math.random().toString(36).slice(2, 8)}`,
        orientation: xrPlane.orientation, // 'horizontal' | 'vertical' | undefined, per spec
        // polygon: array of {x,z} points in plane-local space, in meters,
        // defining the detected plane's boundary — needed to test whether
        // a projected screen point actually falls within real geometry
        // vs. just an infinite plane.
        polygon: xrPlane.polygon ? xrPlane.polygon.map((p) => ({ x: p.x, z: p.z })) : [],
        position: pose.transform.position,
        orientationQuat: pose.transform.orientation,
        lastChangedAt,
      };
      cache.set(xrPlane, entry);
      nextPlanes.push(entry);
    });

    // Drop cache entries for planes no longer present this frame (merged
    // or lost tracking) — XRPlane objects can be invalidated by the
    // browser mid-session per spec.
    cache.forEach((_, xrPlaneKey) => {
      if (!seenPlaneRefs.has(xrPlaneKey)) {
        cache.delete(xrPlaneKey);
        changed = true;
      }
    });

    if (changed) {
      setPlanes(nextPlanes);
    }
  }, [referenceSpace, planesSupported]);

  return { planes, planesSupported, updateFromFrame };
}
