// components/HazardTrailOverlay.jsx
//
// Pairs a hook (useHazardTrail) with a presentational overlay
// (HazardTrailOverlay), same split as DustCloudEffect.jsx. Self-contained:
// does its own lat/lng -> screen projection and its own collision check
// against playerPos, so it doesn't require useVeggieEvasion.js to change
// shape first. When useVeggieEvasion.js IS available, the only integration
// point needed is calling dropHazard() from wherever a veggie's flee tick
// already knows its own current lat/lng — see the TODO near the hook.
//
// Usage in GameCanvas.jsx:
//
//   const { hazards, dropHazard } = useHazardTrail();
//   ...
//   <HazardTrailOverlay
//     playerPos={playerPos}
//     heading={heading}
//     dims={dims}
//     hazards={hazards}
//     onSlip={() => setControlsLocked(true)}   // or a dedicated slippedLocked state
//     onRecover={() => setControlsLocked(false)}
//   />

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  metersBetween,
  bearingDegrees,
  normalizeRelAngle,
  bearingScreenPos,
} from '../utils/spatialGeoMath.js';

const HAZARD_LIFETIME_MS = 12000;   // trail marker despawns after this long
const SLIP_RADIUS_METERS = 2.5;     // how close the player must step to trigger a slip
const SLIP_LOCK_MS = 1600;          // how long controls stay locked + screen spins
const HAZARD_VISIBLE_RADIUS_M = 45; // reuse VeggieSprite's rough visibility range
const HAZARD_FOV_DEG = 65;

let hazardIdCounter = 0;

/**
 * Tracks currently-active hazard markers (banana peels / juice slicks).
 * dropHazard(lat, lng) is the only thing a caller needs — expiry is
 * handled internally via a sweep interval, no manual cleanup required.
 *
 * TODO (once useVeggieEvasion.js is available): call dropHazard() with
 * the fleeing veggie's current position on a fixed cadence (e.g. every
 * ~600ms while a veggie is in RUN state) rather than every frame, so the
 * trail reads as discrete "drops" instead of a solid line.
 */
export function useHazardTrail() {
  const [hazards, setHazards] = useState([]);

  const dropHazard = useCallback((lat, lng) => {
    const id = ++hazardIdCounter;
    const hazard = { id, lat, lng, createdAt: Date.now() };
    setHazards((prev) => [...prev, hazard]);
    return id;
  }, []);

  // Periodic sweep to drop expired hazards — simpler and cheaper than a
  // per-hazard setTimeout when many can be dropped in quick succession.
  useEffect(() => {
    const sweep = setInterval(() => {
      const now = Date.now();
      setHazards((prev) => prev.filter((h) => now - h.createdAt < HAZARD_LIFETIME_MS));
    }, 1000);
    return () => clearInterval(sweep);
  }, []);

  return { hazards, dropHazard };
}

/**
 * Renders trail markers within view and, independently of what's on
 * screen, checks playerPos against every live hazard's real-world
 * coordinates each time playerPos changes. On entering a hazard's slip
 * radius it fires onSlip() once, holds the "SLIPPED!" spin state for
 * SLIP_LOCK_MS, then fires onRecover(). A cooldown ref prevents the same
 * hazard (or a cluster of hazards underfoot) from re-triggering every
 * render while the player stands still inside the radius.
 */
export function HazardTrailOverlay({ playerPos, heading = 0, dims, hazards = [], onSlip, onRecover }) {
  const [slipped, setSlipped] = useState(false);
  const cooldownRef = useRef(false);
  const recoverTimeoutRef = useRef(null);

  useEffect(() => {
    if (!playerPos || hazards.length === 0 || cooldownRef.current) return;

    const hit = hazards.find(
      (h) => metersBetween(playerPos, { lat: h.lat, lng: h.lng }) <= SLIP_RADIUS_METERS
    );
    if (!hit) return;

    cooldownRef.current = true;
    setSlipped(true);
    onSlip?.();

    recoverTimeoutRef.current = setTimeout(() => {
      setSlipped(false);
      cooldownRef.current = false;
      onRecover?.();
    }, SLIP_LOCK_MS);
  }, [playerPos, hazards, onSlip, onRecover]);

  useEffect(() => () => clearTimeout(recoverTimeoutRef.current), []);

  // Project hazards to screen space the same way GameCanvas projects
  // veggies, so trail markers sit correctly relative to heading + FOV.
  const visibleMarkers = [];
  if (playerPos && dims) {
    hazards.forEach((h) => {
      const hPos = { lat: h.lat, lng: h.lng };
      const dist = metersBetween(playerPos, hPos);
      if (dist > HAZARD_VISIBLE_RADIUS_M) return;
      const bearing = bearingDegrees(playerPos, hPos);
      const relAngle = normalizeRelAngle(bearing - heading);
      if (Math.abs(relAngle) > HAZARD_FOV_DEG / 2) return;
      const screenPos = bearingScreenPos(relAngle, dist, dims.w, dims.h, {
        fovDeg: HAZARD_FOV_DEG,
        visibilityRadiusM: HAZARD_VISIBLE_RADIUS_M,
      });
      visibleMarkers.push({ id: h.id, ...screenPos });
    });
  }

  return (
    <>
      <style>{`
        @keyframes hazardSlipSpin {
          0%   { transform: rotate(0deg) scale(1); filter: blur(0px); }
          30%  { transform: rotate(25deg) scale(1.08); filter: blur(2px); }
          60%  { transform: rotate(-18deg) scale(1.05); filter: blur(3px); }
          100% { transform: rotate(0deg) scale(1); filter: blur(0px); }
        }
        @keyframes hazardSlipTextPop {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
          20%  { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
          80%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>

      {visibleMarkers.map((m) => (
        <div
          key={m.id}
          style={{
            position: 'absolute',
            left: m.x,
            top: m.y,
            transform: `translate(-50%, -50%) scale(${m.scale || 1})`,
            fontSize: 22,
            zIndex: 22, // beneath veggie sprites (25) so it reads as ground-level
            pointerEvents: 'none',
          }}
        >
          🍌
        </div>
      ))}

      {slipped && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            pointerEvents: 'none',
            animation: `hazardSlipSpin ${SLIP_LOCK_MS}ms ease-in-out`,
            background:
              'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.05) 0deg 8deg, transparent 8deg 16deg)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: `hazardSlipTextPop ${SLIP_LOCK_MS}ms ease-out`,
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 800,
              fontSize: 36,
              letterSpacing: 2,
              color: '#FFD700',
              textShadow: '0 0 12px rgba(0,0,0,0.8), 3px 3px 0 #000',
            }}
          >
            SLIPPED!
          </div>
        </div>
      )}
    </>
  );
}

export default HazardTrailOverlay;
