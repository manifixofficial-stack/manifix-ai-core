// src/components/veggies/VeggieModel.jsx
//
// PERFORMANCE PATCH (this revision — "mobile tuning pass"):
//
//   A) REMOVED EAGER PRELOAD OF ALL 6 SPECIES: the bottom of this file
//      previously called useGLTF.preload() for every KNOWN_TYPES entry
//      the moment this module was imported — meaning all 6 .glb files
//      started downloading as soon as GameCanvas mounted, regardless of
//      which species had actually spawned nearby. On a real device on
//      cellular data this is unnecessary bandwidth/memory pressure right
//      when the AR screen is also trying to open the camera and start
//      rendering. Removed — <Suspense fallback={<PlaceholderVeggie />}>
//      already handles first-load gracefully per-instance, so nothing
//      breaks; only species actually present in a given AR session now
//      get downloaded, at the point they're first rendered.
//
//   B) PER-INSTANCE POINT LIGHT NOW CONDITIONAL: previously every single
//      VeggieModel instance added its own <pointLight>, unconditionally
//      — with up to MAX_CONCURRENT_VEGGIES (6) targets visible at once,
//      that's up to 6 extra real-time lights on top of GameCanvas's own
//      scene-level lighting rig, compounding into a heavy light count
//      for a mobile WebView compositing a live camera feed underneath.
//      The light is now only added when the veggie is actually close
//      (distanceMeters < 6) — i.e. only where it's visually meaningful —
//      so a target rendered at clamped scene depth (40m, 200m, whatever)
//      costs zero extra lighting. Comment in the code already said the
//      intent was "kept short-range and low-intensity to avoid battery
//      drain" — this patch makes that intent actually match the code.
//
// Everything else — the fallback-gait two-peak footfall bounce, sway
// second-harmonic, forward-lean-on-run, baked-animation clip pipeline,
// vacuum-capture timeline, jump-scare, hide/peek flavor, material sanity
// pass, isGlitchPhase erratic locomotion — is UNCHANGED from the
// previous revision. NOTE: isGlitchPhase was already a real, wired prop
// in this file (see the useFrame block below) — the bug was that
// GameCanvas.jsx wasn't passing it down; that's fixed in GameCanvas.jsx
// in this same patch round, not here.
//
// Generic loader for AI-generated / artist-made vegetable characters.
// Renders at the world `position` GameCanvas computes from GPS/heading,
// then layers a local "run cycle" on top (sway + bob + lean + optional
// glitch-phase locomotion), plus jump-scare / vacuum-capture / hide-peek
// behaviors driven by props from GameCanvas's round/vacuum/jump-scare
// state machine.
//
// HONEST CAVEAT: true "walking like a real human/creature" requires a
// skinned mesh with a walk/run animation clip baked into the .glb from a
// 3D tool (Mixamo, Ready Player Me, Blender, etc.) — this component
// auto-detects and plays that clip if it exists (see LoadedModel /
// handleClipsReady below). Without one, this file can only fake motion
// at the whole-body level (sway/bob/lean), because there's no skeleton
// to pose. It cannot generate a rig or animation from text.

import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { MODEL_BASE_SCALE } from '../../config/gameConfig';

const KNOWN_TYPES = ['tomato', 'broccoli', 'golden', 'banana', 'grapes', 'strawberry'];

// Must match GameCanvas's VACUUM_WINDOW_MS so the shrink animation and
// the onCatch callback line up with when the parent clears vacuumLock.
const VACUUM_ANIM_MS = 1200;
const JUMP_SCARE_ANIM_MS = 900;

// How often (ms) an idle veggie randomly ducks/peeks instead of running
// flat-out — purely cosmetic "hiding in the environment" flavor.
const HIDE_MIN_INTERVAL_MS = 3500;
const HIDE_MAX_INTERVAL_MS = 7000;
const HIDE_DURATION_MS = 1100;

// Glitch-phase locomotion tuning — an erratic hyperspeed sin+cos blend
// layered on top of the normal run sway during a chase/charge phase.
// Cosmetic only: real evasion/fairness logic still lives in
// useVeggieEvasion.js upstream.
const GLITCH_SPEED_X = 8;
const GLITCH_SPEED_X2 = 5;
const GLITCH_SPEED_Z = 7;
const GLITCH_SPEED_Z2 = 3;
const GLITCH_RANGE_X = 0.5;
const GLITCH_RANGE_X2 = 0.25;
const GLITCH_RANGE_Z = 0.35;
const GLITCH_RANGE_Z2 = 0.2;

// --- Fallback-gait tuning (only applies when there's no baked clip) ---
const FOOTFALL_PRIMARY_WEIGHT = 0.7;
const FOOTFALL_SECONDARY_WEIGHT = 0.3;
const FOOTFALL_BOB_HEIGHT = 0.07;
const SWAY_SECOND_HARMONIC_WEIGHT = 0.18;
const MAX_FORWARD_LEAN_RAD = 0.14;
const FORWARD_LEAN_PER_SPEED_UNIT = 0.035;

// Proximity threshold (meters) below which a veggie's ground-accent
// point light is actually added to the scene. Above this, the light
// would be visually negligible anyway (target is rendered small/far),
// so skipping it entirely saves a real-time light per distant veggie.
const POINT_LIGHT_PROXIMITY_METERS = 6;

function modelPath(type) {
  return `/models/${type}.glb`;
}

function teamColorToHex(teamColor) {
  const map = { yellow: '#ffbe1a', blue: '#3cd6ff', red: '#ff3f34', green: '#1fae6e', purple: '#c084fc' };
  return map[teamColor] || teamColor || '#ffbe1a';
}

const PLACEHOLDER_BODY = '#1fae6e';
const PLACEHOLDER_BODY_SHADE = '#0f2340';
const PLACEHOLDER_EYE = '#0a0a0a';
const PLACEHOLDER_HIGHLIGHT = '#ffffff';

function PlaceholderVeggie({ tiltZ }) {
  return (
    <group rotation={[0, 0, tiltZ]}>
      <mesh castShadow position={[0, 0.32, 0]}>
        <capsuleGeometry args={[0.28, 0.34, 6, 12]} />
        <meshStandardMaterial color={PLACEHOLDER_BODY} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.14, 0]} scale={[1, 0.4, 1]}>
        <sphereGeometry args={[0.27, 12, 8]} />
        <meshStandardMaterial color={PLACEHOLDER_BODY_SHADE} roughness={0.6} transparent opacity={0.35} />
      </mesh>
      <mesh position={[-0.1, 0.42, 0.2]} scale={[0.5, 0.3, 0.3]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color={PLACEHOLDER_HIGHLIGHT} roughness={0.3} transparent opacity={0.5} />
      </mesh>
      <mesh position={[-0.09, 0.5, 0.24]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color={PLACEHOLDER_EYE} /></mesh>
      <mesh position={[0.09, 0.5, 0.24]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color={PLACEHOLDER_EYE} /></mesh>
    </group>
  );
}

function sanityCheckMaterials(root, type) {
  root.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((mat) => {
      const hasColorSource = !!mat.map || (mat.color && mat.color.getHex() !== 0x000000);
      if (mat.metalness > 0.85 && !hasColorSource) {
        console.warn(`VeggieModel: "${type}" mesh "${child.name}" metalness=${mat.metalness} with no color source — clamping to 0.4.`);
        mat.metalness = 0.4;
      }
      if (mat.map && mat.map.image === undefined) {
        console.warn(`VeggieModel: "${type}" mesh "${child.name}" has a base-color texture that failed to load.`);
      }
      if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
      mat.needsUpdate = true;
    });
  });
}

function LoadedModel({ type, groupRef, onClipsReady }) {
  const { scene, animations } = useGLTF(modelPath(type));

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    sanityCheckMaterials(clone, type);
    return clone;
  }, [scene, type]);

  const { actions, names } = useAnimations(animations, groupRef);

  useEffect(() => {
    onClipsReady?.(actions, names);
    return () => {
      if (!names || names.length === 0) return;
      const preferredName = names.find((n) => /run|walk/i.test(n)) || names[0];
      actions?.[preferredName]?.fadeOut(0.2);
    };
  }, [actions, names, onClipsReady]);

  return <primitive object={cloned} />;
}

class ModelErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) {
    console.warn(`VeggieModel: failed to load model for "${this.props.type}", falling back to placeholder.`, error);
  }
  render() {
    if (this.state.failed) return <PlaceholderVeggie tiltZ={0} />;
    return this.props.children;
  }
}

export default function VeggieModel({
  veggieId,
  type = 'tomato',
  position = [0, -1.4, -4],
  distanceMeters = 5,
  teamColor = 'yellow',
  scale = MODEL_BASE_SCALE,
  runAmplitude = 1.8,
  runSpeed = 2,
  runSeed = 0,
  leanEnabled = true,
  hyperSpeed = false,
  isGlitchPhase = false,
  isJumpScared = false,
  isVacuuming = false,
  isCaught = false,
  onCatch,
}) {
  const outerRef = useRef();
  const runRef = useRef();
  const captureRef = useRef();
  const clockOffsetRef = useRef(runSeed);

  const [clipInfo, setClipInfo] = useState(null);
  const activeClipRef = useRef(null);

  const [isHiding, setIsHiding] = useState(false);
  const hideTimeoutRef = useRef(null);
  useEffect(() => {
    if (isCaught || isVacuuming) return undefined;
    function scheduleNext() {
      const delay = HIDE_MIN_INTERVAL_MS + Math.random() * (HIDE_MAX_INTERVAL_MS - HIDE_MIN_INTERVAL_MS);
      hideTimeoutRef.current = window.setTimeout(() => {
        setIsHiding(true);
        window.setTimeout(() => setIsHiding(false), HIDE_DURATION_MS);
        scheduleNext();
      }, delay);
    }
    scheduleNext();
    return () => window.clearTimeout(hideTimeoutRef.current);
  }, [isCaught, isVacuuming]);

  const handleClipsReady = (actions, names) => {
    if (!names || names.length === 0) return;
    const preferredName =
      names.find((n) => /run/i.test(n)) ||
      names.find((n) => /walk/i.test(n)) ||
      names[0];
    if (activeClipRef.current === preferredName) return;
    activeClipRef.current = preferredName;
    Object.values(actions).forEach((a) => a?.stop());
    const action = actions[preferredName];
    if (action) {
      action.reset().fadeIn(0.2).play();
      action.timeScale = hyperSpeed ? 2.2 : 1;
    }
    setClipInfo({ actions, names });
  };

  const hasBakedAnimation = !!clipInfo;

  const catchFiredRef = useRef(false);
  const vacuumStartRef = useRef(null);

  useEffect(() => {
    if (isVacuuming) {
      vacuumStartRef.current = performance.now();
      catchFiredRef.current = false;
    } else {
      vacuumStartRef.current = null;
    }
  }, [isVacuuming]);

  const jumpScareStartRef = useRef(null);
  useEffect(() => {
    jumpScareStartRef.current = isJumpScared ? performance.now() : null;
  }, [isJumpScared]);

  useFrame((state, delta) => {
    if (!outerRef.current) return;

    outerRef.current.position.set(position[0], position[1], position[2]);

    if (isCaught) {
      outerRef.current.visible = false;
      return;
    }
    outerRef.current.visible = true;

    const t = state.clock.elapsedTime + clockOffsetRef.current;
    const speed = runSpeed;
    const amp = runAmplitude;

    let swayX =
      (Math.sin(t * speed) + SWAY_SECOND_HARMONIC_WEIGHT * Math.sin(t * speed * 2)) * amp * 0.1;
    let swayZ = 0;
    const bobY = hasBakedAnimation
      ? 0
      : (Math.abs(Math.sin(t * speed * 2)) * FOOTFALL_PRIMARY_WEIGHT +
          Math.abs(Math.sin(t * speed * 2 + Math.PI * 0.5)) * FOOTFALL_SECONDARY_WEIGHT) *
        FOOTFALL_BOB_HEIGHT;
    const stepLean = leanEnabled ? Math.sin(t * speed) * 0.18 : 0;
    const forwardLean =
      leanEnabled && !hasBakedAnimation
        ? Math.min(MAX_FORWARD_LEAN_RAD, speed * FORWARD_LEAN_PER_SPEED_UNIT)
        : 0;

    if (isGlitchPhase) {
      swayX += Math.sin(t * GLITCH_SPEED_X) * GLITCH_RANGE_X + Math.cos(t * GLITCH_SPEED_X2) * GLITCH_RANGE_X2;
      swayZ += Math.cos(t * GLITCH_SPEED_Z) * GLITCH_RANGE_Z + Math.sin(t * GLITCH_SPEED_Z2) * GLITCH_RANGE_Z2;
    }

    if (runRef.current) {
      runRef.current.position.x = swayX;
      runRef.current.position.z = swayZ;
      runRef.current.position.y = bobY + (isHiding ? -0.22 : 0);
      runRef.current.rotation.z = stepLean;
      const targetPitch = -forwardLean;
      runRef.current.rotation.x += (targetPitch - runRef.current.rotation.x) * Math.min(1, delta * 4);
      runRef.current.rotation.y += (Math.sin(t * speed * 0.5) * 0.4 - runRef.current.rotation.y) * Math.min(1, delta * 3);
    }

    let scarePop = 0;
    if (jumpScareStartRef.current != null) {
      const elapsed = performance.now() - jumpScareStartRef.current;
      const progress = Math.min(1, elapsed / JUMP_SCARE_ANIM_MS);
      scarePop = Math.sin(progress * Math.PI) * 0.35;
      if (captureRef.current) captureRef.current.position.z = scarePop * -0.6;
    } else if (captureRef.current) {
      captureRef.current.position.z = 0;
    }

    if (vacuumStartRef.current != null && captureRef.current) {
      const elapsed = performance.now() - vacuumStartRef.current;
      const progress = Math.min(1, elapsed / VACUUM_ANIM_MS);
      const eased = progress * progress;
      captureRef.current.scale.setScalar(Math.max(0.001, 1 - eased));
      captureRef.current.position.z = -eased * 2.5;
      captureRef.current.position.y = eased * 0.8;

      if (progress >= 1 && !catchFiredRef.current) {
        catchFiredRef.current = true;
        onCatch?.(veggieId);
      }
    } else if (captureRef.current && !isJumpScared) {
      captureRef.current.scale.setScalar(1);
    }
  });

  const known = KNOWN_TYPES.includes(type);
  const accentColor = teamColorToHex(teamColor);

  // PATCH B: light only added when actually close enough to matter —
  // see POINT_LIGHT_PROXIMITY_METERS note above. A veggie rendered at
  // clamped scene depth for a far-away real-world distance no longer
  // costs an extra real-time light.
  const showAccentLight = distanceMeters < POINT_LIGHT_PROXIMITY_METERS;

  return (
    <group ref={outerRef} scale={scale}>
      {showAccentLight && (
        <pointLight color={accentColor} intensity={0.6} distance={2} position={[0, 0.4, 0.3]} />
      )}

      <group ref={captureRef}>
        <group ref={runRef}>
          {known ? (
            <ModelErrorBoundary type={type}>
              <Suspense fallback={<PlaceholderVeggie tiltZ={0} />}>
                <LoadedModel type={type} groupRef={runRef} onClipsReady={handleClipsReady} />
              </Suspense>
            </ModelErrorBoundary>
          ) : (
            <PlaceholderVeggie tiltZ={0} />
          )}
        </group>
      </group>
    </group>
  );
}

// PATCH A: eager preload of all 6 species on module import REMOVED.
// Previously:
//   KNOWN_TYPES.forEach((type) => { useGLTF.preload(modelPath(type)); });
// This forced all 6 .glb files to start downloading the instant
// GameCanvas mounted, regardless of which species had actually spawned
// nearby — wasted bandwidth/memory pressure on mobile right as the AR
// camera is also starting up. <Suspense> above already handles
// first-load per instance gracefully, so no replacement call is
// required — only species actually rendered in a given session get
// fetched, at the moment they're first needed.
