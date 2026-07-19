// src/components/veggies/VeggieModel.jsx
//
// THIS REVISION ("better fallback gait"): the procedural motion used
// when a .glb has no baked run/walk animation clip (`hasBakedAnimation
// === false`) is upgraded from a single flat sine bob/sway to something
// closer to an actual footfall pattern:
//   - bobY is now a two-peak wave (one bounce per "footfall" instead of
//     one smooth bounce per full stride) — reads more like alternating
//     footsteps than a single hop.
//   - swayX gets a small second harmonic layered on top of the base
//     sine, so the side-to-side weight shift isn't perfectly symmetric
//     (real gaits aren't).
//   - a speed-scaled forward lean is added (via runRef's rotation.x)
//     when running so it visually reads as "leaning into the run",
//     which sells the chase-mode "running at you" behavior from
//     useVeggieEvasion.js much better than a purely upright bob did.
// This is still NOT real leg animation — there's no skeleton to move
// without an actual rigged, animated .glb (see the honest caveat left
// in place below). It's a stopgap that makes the placeholder/no-clip
// path look more alive in the meantime.
//
// Everything else in this file — the baked-animation clip pipeline
// (LoadedModel/useAnimations), the vacuum-capture timeline, jump-scare,
// hide/peek flavor, material sanity pass, and all component props — is
// UNCHANGED from before. This file was NOT the source of the
// vacuum/catch bug fixed in GameCanvas.jsx (patch note F there); it's
// only being revisited now for the fallback-gait improvement.
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

// Glitch-phase locomotion tuning (folded in from the alternate draft) —
// an erratic hyperspeed sin+cos blend layered on top of the normal run
// sway during a chase/charge phase. Cosmetic only: real evasion/fairness
// logic still lives in useVeggieEvasion.js upstream.
const GLITCH_SPEED_X = 8;
const GLITCH_SPEED_X2 = 5;
const GLITCH_SPEED_Z = 7;
const GLITCH_SPEED_Z2 = 3;
const GLITCH_RANGE_X = 0.5;
const GLITCH_RANGE_X2 = 0.25;
const GLITCH_RANGE_Z = 0.35;
const GLITCH_RANGE_Z2 = 0.2;

// --- Fallback-gait tuning (only applies when there's no baked clip) ---
// Two-peak footfall bounce: primary + secondary peak weighted so it
// reads as "step, step" rather than one smooth bob per stride.
const FOOTFALL_PRIMARY_WEIGHT = 0.7;
const FOOTFALL_SECONDARY_WEIGHT = 0.3;
const FOOTFALL_BOB_HEIGHT = 0.07;
// Small second-harmonic added to the base hip sway so left/right weight
// shift isn't perfectly symmetric.
const SWAY_SECOND_HARMONIC_WEIGHT = 0.18;
// Forward lean scales with runSpeed, capped so it never looks like a
// face-plant.
const MAX_FORWARD_LEAN_RAD = 0.14;
const FORWARD_LEAN_PER_SPEED_UNIT = 0.035;

function modelPath(type) {
  return `/models/${type}.glb`;
}

function teamColorToHex(teamColor) {
  // NOTE: intentionally kept independent of the app's white/black/green/
  // navy UI palette. This light identifies *which player's team* a
  // veggie is tied to in multiplayer — collapsing it down to 4 palette
  // colors would make two team slots visually indistinguishable. If you
  // want team colors constrained to the palette too, say the word and
  // I'll remap slot count vs. palette size.
  const map = { yellow: '#ffbe1a', blue: '#3cd6ff', red: '#ff3f34', green: '#1fae6e', purple: '#c084fc' };
  return map[teamColor] || teamColor || '#ffbe1a';
}

// Placeholder shown before a real .glb loads, or if one fails to load —
// this is the one surface here that's pure "app styling" rather than a
// generated character asset, so it's the one recolored to the
// white / black / green / dark-blue palette.
const PLACEHOLDER_BODY = '#1fae6e'; // green
const PLACEHOLDER_BODY_SHADE = '#0f2340'; // dark blue, subtle underside shading
const PLACEHOLDER_EYE = '#0a0a0a'; // black
const PLACEHOLDER_HIGHLIGHT = '#ffffff'; // white

function PlaceholderVeggie({ tiltZ }) {
  return (
    <group rotation={[0, 0, tiltZ]}>
      <mesh castShadow position={[0, 0.32, 0]}>
        <capsuleGeometry args={[0.28, 0.34, 6, 12]} />
        <meshStandardMaterial color={PLACEHOLDER_BODY} roughness={0.5} />
      </mesh>
      {/* subtle dark-blue underside shading so the shape reads as
          rounded rather than flat green, without adding a texture */}
      <mesh position={[0, 0.14, 0]} scale={[1, 0.4, 1]}>
        <sphereGeometry args={[0.27, 12, 8]} />
        <meshStandardMaterial color={PLACEHOLDER_BODY_SHADE} roughness={0.6} transparent opacity={0.35} />
      </mesh>
      {/* small white highlight, catches light so it doesn't read flat */}
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

// Loads the glb, clones it (so instances don't share a mutable scene
// graph), runs the material safety pass, and exposes any baked-in
// animation clips so the parent can decide run vs. procedural bob.
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
    // Fade out cleanly on unmount / type change (folded in from the
    // alternate draft) so a swapped veggie type doesn't leave a dangling
    // action driving a now-detached mixer.
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
  const outerRef = useRef();     // world position (from GameCanvas)
  const runRef = useRef();       // local run sway/bob/lean/glitch
  const captureRef = useRef();   // vacuum shrink-and-fly
  const clockOffsetRef = useRef(runSeed);

  const [clipInfo, setClipInfo] = useState(null); // { actions, names }
  const activeClipRef = useRef(null);

  // ── Hide/peek idle flavor: randomly duck for a beat, purely cosmetic ──
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

  // ── Pick a baked-in animation clip if one exists, else procedural bob ──
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

  // ── Atomic Catch Verification Lock ──────────────────────────────
  // catchFiredRef is the single source of truth for "has onCatch
  // already been called for this capture window." It is set to true
  // at the exact millisecond the vacuum-compression timeline finishes,
  // and nothing else in this component is allowed to flip it back to
  // false except a brand-new isVacuuming=true transition (a fresh
  // capture attempt on this same instance). This guarantees onCatch —
  // and therefore whatever score-write GameCanvas triggers off of it —
  // fires exactly once per capture, even if this component re-renders
  // or the frame loop ticks again before the parent clears vacuumLock.
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

  // ── Jump scare: quick startle pop + retreat ──
  const jumpScareStartRef = useRef(null);
  useEffect(() => {
    jumpScareStartRef.current = isJumpScared ? performance.now() : null;
  }, [isJumpScared]);

  useFrame((state, delta) => {
    if (!outerRef.current) return;

    // World position — snaps to GameCanvas-provided position (GPS/heading
    // driven), no smoothing needed since that already updates smoothly.
    outerRef.current.position.set(position[0], position[1], position[2]);

    if (isCaught) {
      outerRef.current.visible = false;
      return;
    }
    outerRef.current.visible = true;

    const t = state.clock.elapsedTime + clockOffsetRef.current;
    const speed = runSpeed;
    const amp = runAmplitude;

    // Procedural run cycle (used as-is if no baked animation clip, and
    // layered as a subtle secondary sway even when a clip IS playing,
    // so root motion still reads even on a static/looping clip).
    //
    // Fallback-gait upgrade (see file header): bobY is now a two-peak
    // "footfall" wave instead of one smooth bounce per stride, swayX
    // gets a light second harmonic so the weight shift isn't perfectly
    // symmetric, and a speed-scaled forward lean sells "running at you"
    // for chase-mode targets. None of this applies when a real baked
    // clip is driving the mesh — that clip already has real motion.
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

    // Glitch-phase locomotion: erratic hyperspeed blend layered on top
    // of the normal sway during a chase/charge phase. Kept small in
    // magnitude relative to the alternate draft's version since this
    // sits on top of the already-correct world position rather than
    // replacing it.
    if (isGlitchPhase) {
      swayX += Math.sin(t * GLITCH_SPEED_X) * GLITCH_RANGE_X + Math.cos(t * GLITCH_SPEED_X2) * GLITCH_RANGE_X2;
      swayZ += Math.cos(t * GLITCH_SPEED_Z) * GLITCH_RANGE_Z + Math.sin(t * GLITCH_SPEED_Z2) * GLITCH_RANGE_Z2;
    }

    if (runRef.current) {
      runRef.current.position.x = swayX;
      runRef.current.position.z = swayZ;
      runRef.current.position.y = bobY + (isHiding ? -0.22 : 0);
      runRef.current.rotation.z = stepLean;
      // Forward lean (pitch) — negative X rotation tips the top of the
      // group toward -Z (the direction it's facing when running at the
      // player). Blended in smoothly so a sudden speed change doesn't
      // snap the lean instantly.
      const targetPitch = -forwardLean;
      runRef.current.rotation.x += (targetPitch - runRef.current.rotation.x) * Math.min(1, delta * 4);
      runRef.current.rotation.y += (Math.sin(t * speed * 0.5) * 0.4 - runRef.current.rotation.y) * Math.min(1, delta * 3);
    }

    // Jump scare: quick scale-pop + backward hop, decaying over
    // JUMP_SCARE_ANIM_MS.
    let scarePop = 0;
    if (jumpScareStartRef.current != null) {
      const elapsed = performance.now() - jumpScareStartRef.current;
      const progress = Math.min(1, elapsed / JUMP_SCARE_ANIM_MS);
      scarePop = Math.sin(progress * Math.PI) * 0.35;
      if (captureRef.current) captureRef.current.position.z = scarePop * -0.6;
    } else if (captureRef.current) {
      captureRef.current.position.z = 0;
    }

    // ── Vacuum capture: quadratic Z-axis suction curve ──────────────
    // Shrinks toward zero scale and flies down the local Z axis using
    // an ease-in (progress^2) curve — slow drift at first, then a fast
    // final snap into the vacuum nozzle for the cartoon "gulp" feel.
    if (vacuumStartRef.current != null && captureRef.current) {
      const elapsed = performance.now() - vacuumStartRef.current;
      const progress = Math.min(1, elapsed / VACUUM_ANIM_MS);
      const eased = progress * progress; // quadratic ease-in
      captureRef.current.scale.setScalar(Math.max(0.001, 1 - eased));
      captureRef.current.position.z = -eased * 2.5;
      captureRef.current.position.y = eased * 0.8;

      // Atomic catch verification: fire onCatch exactly once, at the
      // exact frame the timeline completes, guarded by catchFiredRef
      // rather than by nulling shared timing state — so this check is
      // self-contained and cannot be bypassed by a stray re-render.
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

  return (
    <group ref={outerRef} scale={scale}>
      {/* Mobile-safe ground ambient glow — small colored accent light at
          the feet, mapped from player slot color, so team ownership
          reads even on veggies with dark/neutral base textures. Kept
          short-range and low-intensity to avoid battery drain / frame
          drops on mobile. */}
      <pointLight color={accentColor} intensity={distanceMeters < 6 ? 0.6 : 0.3} distance={2} position={[0, 0.4, 0.3]} />

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

KNOWN_TYPES.forEach((type) => {
  useGLTF.preload(modelPath(type));
});
