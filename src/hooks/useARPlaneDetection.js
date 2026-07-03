// hooks/useARPlaneDetection.js
//
// Tracks WebXR 'detected-planes' (walls, floors, tables) for a live
// XRSession started via lib/arDepthClient.js's requestARDepthSession().
// This hook does NOT start its own XRSession — it consumes one handed to
// it (xrSession + referenceSpace), since only one immersive-ar session can
// be active at a time and arDepthClient owns session lifecycle.
//
// Unlike a "call updateFromFrame() yourself" design, this hook owns its
// OWN xrSession.requestAnimationFrame loop internally, started/stopped by
// the `enabled` flag. That matches how it's actually consumed in
// GameCanvas.jsx:
//
//   const { planes, planeCount, wallPlanes, floorPlanes } = useARPlaneDetection({
//     xrSession: xrHandle?.xrSession ?? null,
//     referenceSpace: xrHandle?.referenceSpace ?? null,
//     enabled: arDepthActive,
//   });
//
// GameCanvas has no XR frame loop of its own to drive this from (only
// arDepthClient's startDepthLoop runs one, and that's scoped to depth
// sampling only) — so this hook has to be self-driving.
//
// Browser support caveat (same as arDepthClient.js): plane-detection is a
// Chrome/ARCore-only optional feature today. Safari/iOS has no WebXR AR
// support. `planesSupported` is null until the first frame resolves it,
// then true/false — an empty planes array does not by itself distinguish
// "no planes detected yet" from "this device can't detect planes at all,"
// so check planesSupported if that distinction matters to a caller.

import { useEffect, useRef, useState } from 'react';

/**
 * @param {Object} params
 * @param {XRSession|null} params.xrSession - active session from arDepthClient.requestARDepthSession()
 * @param {XRReferenceSpace|null} params.referenceSpace - reference space from the same call
 * @param {boolean} params.enabled - whether to run the plane-tracking frame loop right now
 */
export default function useARPlaneDetection({ xrSession, referenceSpace, enabled }) {
  const [planes, setPlanes] = useState([]);
  const [planesSupported, setPlanesSupported] = useState(null); // null = unknown until first frame

  const planePoseCacheRef = useRef(new Map()); // XRPlane -> last-seen entry, to skip unchanged planes
  const rafHandleRef = useRef(null);

  useEffect(() => {
    // Nothing to track: no session, no reference space, or the caller has
    // this feature switched off (e.g. AR depth mode not toggled on yet).
    // Reset to a clean slate rather than leaving stale planes/flags
    // around from a previous session.
    if (!enabled || !xrSession || !referenceSpace) {
      setPlanes([]);
      setPlanesSupported(null);
      planePoseCacheRef.current.clear();
      return undefined;
    }

    let cancelled = false;
    const cache = planePoseCacheRef.current;
    cache.clear();

    const onXRFrame = (_time, frame) => {
      if (cancelled) return;

      if (typeof frame.detectedPlanes === 'undefined') {
        // detectedPlanes missing from the frame object entirely means
        // this browser/session doesn't support plane-detection — distinct
        // from an empty Set, which means "supported, nothing found yet."
        setPlanesSupported((prev) => (prev === false ? prev : false));
      } else {
        setPlanesSupported((prev) => (prev === true ? prev : true));

        const currentPlaneObjects = frame.detectedPlanes;
        let changed = currentPlaneObjects.size !== cache.size;

        const nextPlanes = [];
        const seenPlaneRefs = new Set();

        currentPlaneObjects.forEach((xrPlane) => {
          seenPlaneRefs.add(xrPlane);
          let pose;
          try {
            pose = frame.getPose(xrPlane.planeSpace, referenceSpace);
          } catch (err) {
            // Pose can transiently fail to resolve (tracking loss) —
            // skip this plane for this frame rather than throwing the
            // whole loop.
            return;
          }
          if (!pose) return;

          const cached = cache.get(xrPlane);
          const lastChangedAt = xrPlane.lastChangedTime;
          if (!cached || cached.lastChangedAt !== lastChangedAt) {
            changed = true;
          }

          const entry = {
            id:
              cached?.id ??
              `${xrPlane.orientation || 'plane'}-${nextPlanes.length}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,
            orientation: xrPlane.orientation, // 'horizontal' | 'vertical' | undefined, per spec
            // polygon: array of {x,z} points in plane-local space (meters),
            // defining the detected plane's boundary — needed to test
            // whether a projected screen point falls within real geometry
            // vs. just an infinite plane.
            polygon: xrPlane.polygon ? xrPlane.polygon.map((p) => ({ x: p.x, z: p.z })) : [],
            position: pose.transform.position,
            orientationQuat: pose.transform.orientation,
            lastChangedAt,
          };
          cache.set(xrPlane, entry);
          nextPlanes.push(entry);
        });

        // Drop cache entries for planes no longer present this frame
        // (merged or lost tracking) — XRPlane objects can be invalidated
        // by the browser mid-session per spec.
        cache.forEach((_entry, xrPlaneKey) => {
          if (!seenPlaneRefs.has(xrPlaneKey)) {
            cache.delete(xrPlaneKey);
            changed = true;
          }
        });

        if (changed && !cancelled) {
          setPlanes(nextPlanes);
        }
      }

      if (!cancelled) {
        rafHandleRef.current = xrSession.requestAnimationFrame(onXRFrame);
      }
    };

    rafHandleRef.current = xrSession.requestAnimationFrame(onXRFrame);

    return () => {
      cancelled = true;
      if (rafHandleRef.current != null) {
        xrSession.cancelAnimationFrame(rafHandleRef.current);
        rafHandleRef.current = null;
      }
      cache.clear();
    };
  }, [xrSession, referenceSpace, enabled]);

  // Derived views GameCanvas.jsx consumes directly for its HUD:
  //   SURFACES: {arPlaneCount} ({floorPlanes.length} floor / {wallPlanes.length} wall)
  const wallPlanes = planes.filter((p) => p.orientation === 'vertical');
  const floorPlanes = planes.filter((p) => p.orientation === 'horizontal');

  return {
    planes,
    planeCount: planes.length,
    wallPlanes,
    floorPlanes,
    planesSupported,
  };
}
