// src/components/GameCanvasARScene.jsx
//
// ViroReact AR_HOOK implementation — the piece GameCanvas.jsx's old
// comment block marked as "Phase 2 real AR" extension point.
//
// THIS REVISION — wired VeggieModel.viro.jsx in, replacing the bare
// inline <Viro3DObject> block. That inline version had no idle/hide/
// jumpscare clip-priority logic, no placeholder fallback on load
// failure, and never received isIdleStanding — all of that already
// existed in VeggieModel.viro.jsx but was sitting unused. Now each
// veggie renders through <VeggieModelViro>, matching the same
// clip-priority behavior the old Three.js VeggieModel.jsx had.
//
// VeggieModel.jsx (the react-three-fiber/drei version) is no longer
// referenced anywhere in this render path and can be deleted — this
// scene, and GameCanvas.jsx above it, are fully on the Viro path now.
//
// This file is loaded BY ViroARSceneNavigator, not rendered directly by
// GameCanvas. ViroReact scenes run in their own tree — data from the
// parent (GameCanvas) comes in via `viroAppProps`, NOT normal React
// props/context, because the navigator mounts this as an independent
// scene root. See GameCanvas.jsx's <ViroARSceneNavigator
// viroAppProps={{...}}> for what's passed in.
//
// WHAT THIS UNLOCKS vs the old Three.js/vision-camera version:
//   - Real ARCore/ARKit ground plane detection (tracking state) —
//     veggies can now sit on your ACTUAL floor, not a fixed
//     CAMERA_EYE_HEIGHT_METERS guess.
//   - This is also what finally gives GeospatialModule.kt a real
//     ARCore Session to attach to (see onAnchorFound below) —
//     previously that native module had nothing to attach to and would
//     always report NO_SESSION.
//
// WHAT'S DELIBERATELY UNCHANGED:
//   - Evasion math (useVeggieEvasion), capture-lock geometry, HUD,
//     popups, scoring — none of that lives in this file. This file
//     ONLY renders 3D content and reports screen-space projections back
//     up to GameCanvas via onVeggieScreenPositionsUpdate. All game LOGIC
//     stays in GameCanvas.jsx exactly as before.
//
// VERSION NOTE: written against @reactvision/react-viro@2.41.6.
// ViroReact's exact method names (getScreenPositionOfWorldPosition,
// onTrackingUpdated payload shape) have shifted between versions
// before — if any call here throws "not a function" on your build,
// check node_modules/@reactvision/react-viro's TypeScript defs for the
// exact signature in your installed version and adjust; this is the
// one part of this migration that can't be fully verified without a
// real device build.

import React, { useRef, useEffect, useCallback } from 'react';
import {
  ViroARScene,
  ViroNode,
  ViroAmbientLight,
  ViroDirectionalLight,
  ViroQuad,
  ViroMaterials,
  ViroTrackingStateConstants,
} from '@reactvision/react-viro';
import VeggieModelViro from './veggies/VeggieModel.viro';

// FIX (carried over): ViroMaterials.createMaterials() must not run at
// module top-level (import time) — the native bridge isn't guaranteed
// ready yet. Deferred into a useEffect below instead.
let materialsRegistered = false;
function ensureMaterialsRegistered() {
  if (materialsRegistered) return;
  materialsRegistered = true;
  ViroMaterials.createMaterials({
    groundShadow: {
      diffuseColor: '#00000055',
      lightingModel: 'Constant',
    },
  });
}

// Native module bridge for GeospatialModule.kt's attachSession(). This
// mirrors the seam left in GeospatialModule.kt's own comment — Session
// handoff is project-specific, and this is where it actually happens
// now that a real AR view exists.
let NativeGeospatialBridge = null;
try {
  // Only resolves on Android where GeospatialModule.kt exists.
  NativeGeospatialBridge = require('react-native').NativeModules.GeospatialModule;
} catch {
  NativeGeospatialBridge = null;
}

export default function GameCanvasARScene(props) {
  // ViroReact convention: app-level data comes through
  // sceneNavigator.viroAppProps, not plain props, since this scene is
  // mounted independently by ViroARSceneNavigator.
  const {
    targetNodes = [],
    glitchTargetId = null,
    isGlitched = false,
    jumpScaredIds = null,
    vacuumingId = null,
    caughtIds = null,
    onVeggieScreenPositionsUpdate,
    onGroundReady,
  } = props.sceneNavigator?.viroAppProps || {};

  const sceneRef = useRef(null);
  const groundFoundRef = useRef(false);

  useEffect(() => {
    ensureMaterialsRegistered();
  }, []);

  // Fires continuously as ARCore/ARKit tracks the camera each frame.
  // This is the real per-frame hook — used for two things:
  //   1. Reporting AR-tracking health up to GameCanvas (onGroundReady),
  //      so the HUD can show "FINDING SURFACE..." until a plane is found.
  //   2. Projecting each veggie's 3D world position to a 2D screen
  //      point, which GameCanvas needs for its lock-ring brackets (same
  //      job projectToScreen() did manually in the old Three.js version
  //      — Viro can do this natively instead of hand-rolled FOV math).
  const handleTrackingUpdated = useCallback((state, reason) => {
    if (state === ViroTrackingStateConstants.TRACKING_NORMAL) {
      if (!groundFoundRef.current) {
        groundFoundRef.current = true;
        onGroundReady?.(true);
      }
    } else {
      onGroundReady?.(false);
    }
  }, [onGroundReady]);

  // Recompute screen-space positions for every visible veggie each
  // frame-ish (throttled via setInterval — Viro doesn't expose a raw
  // useFrame hook the way react-three-fiber did, so this polls the
  // scene's own projection API instead).
  useEffect(() => {
    if (!sceneRef.current || !targetNodes.length) return undefined;

    const intervalId = setInterval(async () => {
      if (!sceneRef.current) return;
      const results = await Promise.all(
        targetNodes.map(async (node) => {
          try {
            // getScreenPositionOfWorldPosition: confirm exact name/shape
            // against your installed ViroReact version's typings if this
            // throws — see VERSION NOTE above.
            const screenPos = await sceneRef.current.getScreenPositionOfWorldPosition(node.position);
            return { id: node.id, x: screenPos.x, y: screenPos.y };
          } catch {
            return { id: node.id, x: null, y: null };
          }
        })
      );
      onVeggieScreenPositionsUpdate?.(results);
    }, 100);

    return () => clearInterval(intervalId);
  }, [targetNodes, onVeggieScreenPositionsUpdate]);

  return (
    <ViroARScene
      ref={sceneRef}
      onTrackingUpdated={handleTrackingUpdated}
      onAnchorFound={() => {
        // Real ground plane found — this is the moment
        // GeospatialModule.kt's attachSession() should be called if
        // you're also wiring outdoor Geospatial mode on top of indoor
        // plane tracking. Left as an explicit seam rather than firing
        // automatically, since indoor (plane-tracking) and outdoor
        // (Geospatial) are different ARCore config modes — don't
        // enable both blindly.
        // Example, once you decide indoor vs outdoor at this point:
        //   NativeGeospatialBridge?.isGeospatialSupported?.();
      }}
    >
      <ViroAmbientLight color="#ffffff" intensity={250} />
      <ViroDirectionalLight color="#ffffff" direction={[0, -1, -0.5]} intensity={400} />

      {targetNodes.map((node) => {
        const isThisGlitchTarget = isGlitched && node.id === glitchTargetId;
        const isJumpScared = !!jumpScaredIds?.has?.(node.id);
        const isVacuuming = vacuumingId === node.id;
        const isCaught = !!caughtIds?.has?.(node.id);

        if (isCaught) return null;

        return (
          <ViroNode key={node.id} position={node.position}>
            <ViroQuad
              rotation={[-90, 0, 0]}
              position={[0, 0.02, 0]}
              width={0.5}
              height={0.5}
              materials={['groundShadow']}
              arShadowReceiver={true}
            />
            <VeggieModelViro
              veggieId={node.id}
              type={node.species}
              position={[0, 0, 0]}
              distanceMeters={node.distance}
              teamColor={node.teamColor}
              scale={isThisGlitchTarget ? 0.56 : 0.4}
              isJumpScared={isJumpScared}
              isVacuuming={isVacuuming}
              isCaught={isCaught}
              isIdleStanding={false}
              onCatch={() => {
                // Cosmetic completion signal only — the server's
                // veggieCaught broadcast (handled in GameCanvas.jsx)
                // is what actually adds this id to caughtIds and
                // removes it from render. No action needed here beyond
                // letting the vacuum-capture animation play to
                // completion; left as an explicit no-op rather than
                // silently dropping the callback, in case you want to
                // hook a local sound/haptic cue to it later.
              }}
            />
          </ViroNode>
        );
      })}
    </ViroARScene>
  );
}