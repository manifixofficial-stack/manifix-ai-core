// src/components/veggies/VeggieModel.viro.jsx
//
// PHASE 2 — Viro3DObject replacement for the react-three-fiber/drei
// version (VeggieModel.jsx). Kept as a SEPARATE file rather than
// overwriting the original, since GameCanvasARScene.jsx currently
// renders veggies inline (simple <Viro3DObject> calls) rather than
// importing this component directly — wire this in by importing it
// into GameCanvasARScene.jsx and swapping its inline <Viro3DObject>
// block for <VeggieModelViro ... /> once you're ready to bring back
// per-species clip-selection logic (idle/run/hide/jumpscare/capture),
// which the inline version in GameCanvasARScene.jsx does NOT yet have.
//
// WHAT CARRIES OVER FROM THE ORIGINAL vs WHAT CAN'T:
//   SkeletonUtils clone / team tint via material traversal -> DROPPED.
//     Viro's Viro3DObject doesn't expose the same raw Three.js material
//     graph for runtime traversal — team-color tinting would need
//     either (a) separate pre-tinted .glb exports per team color, or
//     (b) Viro's materials prop applied per-node if your model's
//     mesh names are known ahead of time. Marked TEAM_TINT_TODO below.
//   Clip selection (idle/run/hide/jumpscare/capture priority logic) ->
//     KEPT, re-implemented against Viro's animation prop (name + run +
//     loop), same priority order as the original.
//   Procedural fallback gait (footfall bob/sway/lean for unrigged
//     models) -> DROPPED. That was hand-rolled Three.js transform math
//     per-frame; Viro doesn't expose a per-frame transform hook the
//     same way. If a species has no baked clip, it will simply hold
//     still rather than get a procedural walk-cycle — acceptable
//     regression for now, flagged as PROCEDURAL_GAIT_TODO below.
//   Idle hide/peek flavor (random timed hide/reveal) -> KEPT, same
//     setTimeout-based logic, now just toggles which clip name plays.
//   Placeholder fallback for missing/failed models -> KEPT, using a
//     plain colored Viro sphere/box instead of Three.js primitives.
//
// VERSION NOTE: written against @reactvision/react-viro@2.41.6. Animation
// clip names below (run/idle/hide/jumpscare/capture) assume your .glb
// exports use these exact names — Viro does NOT have the original's
// findClipName() fuzzy-matching helper built in, so if your models use
// different clip names, either rename them at export time or add a
// name-mapping lookup here.

import React, { useEffect, useRef, useState } from 'react';
import {
  Viro3DObject,
  ViroNode,
  ViroSphere,
  ViroMaterials,
  ViroSpotLight,
} from '@reactvision/react-viro';

const KNOWN_TYPES = ['tomato', 'broccoli', 'golden', 'banana', 'grapes', 'strawberry'];

const HIDE_MIN_INTERVAL_MS = 3500;
const HIDE_MAX_INTERVAL_MS = 7000;
const HIDE_DURATION_MS = 1100;

const FALLBACK_COLOR_BY_SPECIES = {
  tomato: '#ff3b30',
  broccoli: '#3ecf4a',
  golden: '#ffd700',
  banana: '#ffe066',
  grapes: '#8e44ec',
  strawberry: '#ff5c8a',
};

// FIX: same timing bug as GameCanvasARScene.jsx — createMaterials() must
// not run at module top-level (import time), since ViroReact's native
// bridge isn't guaranteed ready yet. Deferred into a lazy-init function
// called from useEffect inside the component below instead.
let placeholderMaterialsRegistered = false;
function ensurePlaceholderMaterialsRegistered() {
  if (placeholderMaterialsRegistered) return;
  placeholderMaterialsRegistered = true;
  ViroMaterials.createMaterials(
    Object.fromEntries(
      Object.entries(FALLBACK_COLOR_BY_SPECIES).map(([species, color]) => [
        `placeholder_${species}`,
        { diffuseColor: color, lightingModel: 'Lambert' },
      ])
    )
  );
}

function modelSource(type) {
  // bundle-assets:// resolves from your app's bundled assets — adjust
  // this URI scheme if your models are hosted remotely instead
  // (Viro also accepts { uri: 'https://...' } for remote .glb files).
  return { uri: `bundle-assets://models/${type}.glb` };
}

function PlaceholderVeggie({ species }) {
  const materialName = FALLBACK_COLOR_BY_SPECIES[species] ? `placeholder_${species}` : 'placeholder_broccoli';
  return (
    <ViroSphere radius={0.28} materials={[materialName]} position={[0, 0.3, 0]} />
  );
}

export default function VeggieModelViro({
  veggieId,
  type = 'tomato',
  position = [0, 0, -4],
  distanceMeters = 5,
  teamColor = 'yellow', // TEAM_TINT_TODO — see file header, not applied yet
  scale = 0.4,
  isJumpScared = false,
  isVacuuming = false,
  isCaught = false,
  isIdleStanding = false,
  onCatch,
}) {
  const [loadFailed, setLoadFailed] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const hideTimeoutRef = useRef(null);
  const vacuumStartRef = useRef(null);
  const catchFiredRef = useRef(false);

  useEffect(() => {
    ensurePlaceholderMaterialsRegistered();
  }, []);

  // Idle hide/peek flavor — same timing/logic as the original, just
  // toggling which Viro animation clip plays instead of a Three.js
  // position offset.
  useEffect(() => {
    if (isCaught || isVacuuming) return undefined;
    function scheduleNext() {
      const delay = HIDE_MIN_INTERVAL_MS + Math.random() * (HIDE_MAX_INTERVAL_MS - HIDE_MIN_INTERVAL_MS);
      hideTimeoutRef.current = setTimeout(() => {
        setIsHiding(true);
        setTimeout(() => setIsHiding(false), HIDE_DURATION_MS);
        scheduleNext();
      }, delay);
    }
    scheduleNext();
    return () => clearTimeout(hideTimeoutRef.current);
  }, [isCaught, isVacuuming]);

  useEffect(() => {
    if (isVacuuming) {
      vacuumStartRef.current = Date.now();
      catchFiredRef.current = false;
    } else {
      vacuumStartRef.current = null;
    }
  }, [isVacuuming]);

  // Same clip-priority order as the original findClipName() cascade:
  // vacuuming > jumpscared > hiding > idle-standing > run.
  const clipName = isVacuuming
    ? 'capture'
    : isJumpScared
      ? 'jumpscare'
      : isHiding
        ? 'hide'
        : isIdleStanding
          ? 'idle'
          : 'run';

  const isOneShot = clipName === 'capture' || clipName === 'jumpscare';

  const handleAnimationFinish = () => {
    if (clipName === 'capture' && !catchFiredRef.current) {
      catchFiredRef.current = true;
      onCatch?.(veggieId);
    }
  };

  if (isCaught) return null;

  const known = KNOWN_TYPES.includes(type);
  const showAccentLight = distanceMeters < 6;

  return (
    <ViroNode position={position} scale={[scale, scale, scale]}>
      {showAccentLight && (
        <ViroSpotLight
          color="#ffffff"
          position={[0, 1, 0.5]}
          direction={[0, -1, -0.5]}
          intensity={200}
        />
      )}

      {known && !loadFailed ? (
        <Viro3DObject
          source={modelSource(type)}
          type="GLB"
          onError={() => setLoadFailed(true)}
          animation={{ name: clipName, run: true, loop: !isOneShot, onFinish: handleAnimationFinish }}
          // TEAM_TINT_TODO: apply a materials override here if your .glb
          // has a known "accent"/"team" mesh material name, e.g.
          // materials={[`team_${teamColor}`]} — requires those materials
          // to be pre-registered via ViroMaterials.createMaterials and
          // your model's mesh material name to match exactly.
        />
      ) : (
        <PlaceholderVeggie species={type} />
      )}
    </ViroNode>
  );
}

// PROCEDURAL_GAIT_TODO: the original's hand-rolled footfall bob / sway /
// forward-lean fallback (for species with no baked animation clip) has
// no equivalent here yet. If a .glb is missing a "run" clip, it will
// simply hold its rest pose instead of procedurally animating. Revisit
// if any shipped species relies on the procedural fallback rather than
// a real baked clip.