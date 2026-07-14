// src/components/veggies/VeggieModel.jsx
//
// 3D Character Controller Engine for the vegetable .glb characters.
//
// THIS REVISION — four new behaviors added on top of the original
// loader/placeholder/error-boundary logic:
//
// 1. GROUND PLANE LOCK
//    A fixed local Y offset (GROUND_LOCK_Y) keeps the model's feet
//    glued to a consistent floor line regardless of any local wobble
//    the locomotion/suction logic below introduces. NOTE: this is a
//    LOCAL offset inside this component's own <group> — it does not
//    replace or fight the real world-space position your parent
//    (VeggieSprite.jsx -> GameCanvas.jsx) already computes from actual
//    GPS bearing/distance. If the model looks sunk into or floating
//    above the floor after adding this, tune GROUND_LOCK_Y towards 0 —
//    your parent group is already doing the real grounding.
//
// 2. SENTIENT ESCAPE LOCOMOTION (cosmetic, local-space only)
//    Normal mode: a smooth sine wobble on local X so the model reads as
//    "running back and forth" in place. Glitch mode (isGlitchPhase):
//    switches to a hyperspeed sin+cos blend across local X and Z for an
//    erratic, teleport-y chase feel. This is purely a visual flourish —
//    real evasion/fairness logic still lives in useVeggieEvasion.js and
//    is applied upstream by VeggieSprite.jsx to the actual anchor
//    position. This local wobble sits on top of that, it doesn't
//    replace it.
//
// 3. VACUUM-SUCTION CATCH (isCaught prop)
//    Server-authoritative: this component does NOT decide who catches
//    what. server.js already validates capture-attempt (GPS distance or
//    compass aim) before broadcasting a real catch. Once your parent
//    passes isCaught=true (i.e. the server has already confirmed it),
//    THIS file plays the visual payoff: local Z pulls toward the camera
//    while scale decays to ~0, then calls onSuctionComplete() once so
//    the parent can finish removing the veggie from state — mirroring
//    (and able to replace) VeggieSprite.jsx's old splat-timeout flow.
//
// 4. ANIMATION PIPELINE (useAnimations)
//    Reads embedded animation clips from the .glb via
//    @react-three/drei's useAnimations. Looks for a clip named "Run" or
//    "Walk" (case-insensitive), falling back to the first available
//    clip if neither exists, and cross-fades it in on mount/type change
//    so the model doesn't sit there as a stiff static mesh.
//
// EXPECTED FILES: public/models/<type>.glb — unchanged from before.

import React, { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// This list matches your live 6-vegetable roster (carrot and brinjal
// were removed from the game earlier and are intentionally NOT here).
const KNOWN_TYPES = [
  'tomato',
  'broccoli',
  'golden',
  'banana',
  'grapes',
  'strawberry',
];

function modelPath(type) {
  return `/models/${type}.glb`;
}

// --- Feature 1: ground plane lock ------------------------------------
// Local offset only — see header note above.
const GROUND_LOCK_Y = -1.2;

// --- Feature 2: locomotion tuning -------------------------------------
const NORMAL_RUN_SPEED = 2;
const NORMAL_RUN_RANGE = 1.8;
const GLITCH_SPEED_X = 8;
const GLITCH_SPEED_X2 = 5;
const GLITCH_SPEED_Z = 7;
const GLITCH_SPEED_Z2 = 3;
const GLITCH_RANGE_X = 3;
const GLITCH_RANGE_X2 = 1.5;
const GLITCH_RANGE_Z = 2;
const GLITCH_RANGE_Z2 = 1.2;

// --- Feature 3: vacuum-suction tuning ----------------------------------
const SUCTION_Z_SPEED = 7; // units/sec pulled toward camera
const SUCTION_SCALE_DECAY = 2.5; // higher = faster shrink

// Simple stand-in shape shown when a real model hasn't been generated
// yet for this veggie type. Chunky rounded capsule + two dot eyes so it
// still reads as "a character" in playtests rather than a bare error box.
function PlaceholderVeggie({ tiltZ }) {
  return (
    <group rotation={[0, 0, tiltZ]}>
      <mesh castShadow position={[0, 0.32, 0]}>
        <capsuleGeometry args={[0.28, 0.34, 6, 12]} />
        <meshStandardMaterial color="#8fd14f" roughness={0.55} />
      </mesh>
      <mesh position={[-0.09, 0.5, 0.24]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.09, 0.5, 0.24]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

// Loads and renders the actual .glb scene graph for a veggie type, and
// now also drives its embedded animation clips (Feature 4).
function LoadedModel({ type, tiltZ, isGlitchPhase, isCaught, onSuctionComplete }) {
  const { scene, animations } = useGLTF(modelPath(type));

  // Clone so multiple on-screen instances of the same veggie type don't
  // share/mutate a single scene graph (glTF caches by URL under the hood).
  const cloned = useMemo(() => scene.clone(true), [scene]);

  const animGroupRef = useRef();
  const { actions, names } = useAnimations(animations, animGroupRef);

  // --- Feature 4: animation pipeline handshake ------------------------
  useEffect(() => {
    if (!names || names.length === 0) return undefined;

    const preferredName = names.find((n) => /run|walk/i.test(n)) || names[0];
    const action = actions[preferredName];
    if (!action) return undefined;

    action.reset().fadeIn(0.2).play();

    return () => {
      action.fadeOut(0.2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names, type]);

  // --- Local locomotion + ground lock + vacuum suction ----------------
  const localGroupRef = useRef();
  const suctionActiveRef = useRef(false);
  const suctionDoneRef = useRef(false);

  useEffect(() => {
    // Reset suction state whenever this veggie instance's catch flag
    // clears (e.g. a fresh spawn re-using the same mounted component).
    if (!isCaught) {
      suctionActiveRef.current = false;
      suctionDoneRef.current = false;
    } else {
      suctionActiveRef.current = true;
    }
  }, [isCaught]);

  useFrame((state, delta) => {
    if (!localGroupRef.current) return;
    const t = state.clock.elapsedTime;

    if (suctionActiveRef.current && !suctionDoneRef.current) {
      // --- Feature 3: vacuum-suction catch ---
      localGroupRef.current.position.z += delta * SUCTION_Z_SPEED;
      localGroupRef.current.position.y = GROUND_LOCK_Y;

      const decay = Math.max(0, 1 - delta * SUCTION_SCALE_DECAY);
      localGroupRef.current.scale.multiplyScalar(decay);

      if (localGroupRef.current.scale.x <= 0.02) {
        suctionDoneRef.current = true;
        suctionActiveRef.current = false;
        onSuctionComplete?.();
      }
      return;
    }

    // --- Feature 1: ground plane lock ---
    localGroupRef.current.position.y = GROUND_LOCK_Y;

    // --- Feature 2: locomotion ---
    if (isGlitchPhase) {
      localGroupRef.current.position.x =
        Math.sin(t * GLITCH_SPEED_X) * GLITCH_RANGE_X + Math.cos(t * GLITCH_SPEED_X2) * GLITCH_RANGE_X2;
      localGroupRef.current.position.z =
        Math.cos(t * GLITCH_SPEED_Z) * GLITCH_RANGE_Z + Math.sin(t * GLITCH_SPEED_Z2) * GLITCH_RANGE_Z2;
    } else {
      localGroupRef.current.position.x = Math.sin(t * NORMAL_RUN_SPEED) * NORMAL_RUN_RANGE;
      localGroupRef.current.position.z = 0;
    }
  });

  return (
    <group ref={animGroupRef} rotation={[0, 0, tiltZ]}>
      <group ref={localGroupRef}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}

// Error-safe wrapper: if the .glb for this type 404s or fails to parse,
// fall back to the placeholder instead of crashing the whole R3F tree.
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.warn(
      `VeggieModel: failed to load model for "${this.props.type}", falling back to placeholder.`,
      error
    );
  }
  render() {
    if (this.state.failed) {
      return <PlaceholderVeggie tiltZ={this.props.tiltZ} />;
    }
    return this.props.children;
  }
}

export default function VeggieModel({
  type = 'tomato',
  panic = false,
  leanDirection = 0,
  isDodging = false,
  // NEW props — all optional and backward-compatible. Existing callers
  // that don't pass these get the original tilt-only behavior plus
  // ground lock + idle locomotion + auto-playing animation.
  isGlitchPhase = false,
  isCaught = false,
  onSuctionComplete,
}) {
  const wrapRef = useRef();
  const tiltRef = useRef(0);

  // Small local tilt: leans into movement direction, and shudders faster
  // during panic/charge phase. Unchanged from before.
  useFrame((state, delta) => {
    const targetTilt = panic
      ? Math.sin(state.clock.elapsedTime * 18) * 0.12
      : leanDirection * (isDodging ? 0.22 : 0.12);
    tiltRef.current += (targetTilt - tiltRef.current) * Math.min(1, delta * 10);
    if (wrapRef.current) {
      wrapRef.current.rotation.z = tiltRef.current;
    }
  });

  const known = KNOWN_TYPES.includes(type);

  return (
    <group ref={wrapRef}>
      {known ? (
        <ModelErrorBoundary type={type} tiltZ={0}>
          <Suspense fallback={<PlaceholderVeggie tiltZ={0} />}>
            <LoadedModel
              type={type}
              tiltZ={0}
              isGlitchPhase={isGlitchPhase}
              isCaught={isCaught}
              onSuctionComplete={onSuctionComplete}
            />
          </Suspense>
        </ModelErrorBoundary>
      ) : (
        <PlaceholderVeggie tiltZ={0} />
      )}
    </group>
  );
}

// Warm the glTF cache for every known type at import time. Any type
// whose .glb doesn't exist on disk yet will 404 quietly in the network
// tab and fall through to the placeholder via ModelErrorBoundary above —
// this is expected and safe while you're still generating assets.
KNOWN_TYPES.forEach((type) => {
  useGLTF.preload(modelPath(type));
});

// ── INTEGRATION NOTE FOR VeggieSprite.jsx ─────────────────────────────────
// To actually see the new vacuum-suction/glitch-locomotion behavior,
// VeggieSprite.jsx needs to pass the new props through, e.g.:
//
//   <VeggieModel
//     veggieId={veggieId}
//     type={type}
//     panic={phase === 'charging'}
//     leanDirection={leanDirection}
//     isDodging={phase !== 'charging' && distanceMeters <= EVASION_TRIGGER_M}
//     isGlitchPhase={phase === 'charging'}   // or your own glitch-pulse flag
//     isCaught={isCaught}                     // already exists as a prop on VeggieSprite
//     onSuctionComplete={() => onCatch?.(veggieId)}  // replaces the old
//                                                       setTimeout-based
//                                                       triggerCatch() flow
//   />
//
// If you'd rather keep VeggieSprite.jsx's existing splat/timeout flow
// exactly as-is for now, you can simply NOT pass isCaught/isGlitchPhase —
// this file is fully backward-compatible and behaves like the old
// version (minus the new idle wobble + ground lock + auto-animation)
// when those props are omitted.
