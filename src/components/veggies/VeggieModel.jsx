// src/components/veggies/VeggieModel.jsx
//
// THIS REVISION — idle-stand wiring (the "standing on the floor" fix):
//
// GameCanvas.jsx's AnimatedVeggieTarget now passes a new isIdleStanding
// prop, true whenever useVeggieEvasion's idle_stand AI state is active
// (position frozen, velocity decayed to zero). Previously this component
// had no awareness of that state at all — it kept playing its full
// running gait (baked run clip, or the procedural footfall/sway/lean
// fallback) regardless, so a veggie whose world position had genuinely
// stopped still looked like it was jogging in place. Two changes:
//
//   1. Clip selection now checks isIdleStanding before falling back to
//      the run clip — if the model has a real idle/stand clip, that
//      plays instead while idle-standing is active.
//   2. The procedural fallback gait (used when there's no baked
//      animation at all) now suppresses footfall bob, sway, and forward
//      lean while isIdleStanding is true, so an unrigged/placeholder
//      model actually goes still too, not just the rigged ones.
//
// A gentle idle bob/breathe (independent of the run-gait math) still
// plays during idle-stand so the model doesn't look frozen/dead — see
// IDLE_STAND_BREATHE_* below. This is cosmetic-only, contained entirely
// to this file; it does not touch useVeggieEvasion's real position.
//
// Everything else — SkeletonUtils clone, team tint, robust clip
// detection, distinct per-species fallback color, jump-scare punch,
// vacuum capture timeline, no-eager-preload — is UNCHANGED.

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import { MODEL_BASE_SCALE } from '../../config/gameConfig';

const KNOWN_TYPES = ['tomato', 'broccoli', 'golden', 'banana', 'grapes', 'strawberry'];

function modelPath(type) {
  return `/models/${type}.glb`;
}

// --- Timing (must stay in sync with GameCanvas.jsx) ---
const VACUUM_ANIM_MS = 1200; // === GameCanvas VACUUM_WINDOW_MS
const JUMP_SCARE_PUNCH_MS = 260;
const JUMPSCARE_PUNCH_SCALE = 1.35;

// --- Idle "hiding in the environment" flavor (cosmetic only; real
// evasion/fairness logic lives upstream in useVeggieEvasion.js) ---
const HIDE_MIN_INTERVAL_MS = 3500;
const HIDE_MAX_INTERVAL_MS = 7000;
const HIDE_DURATION_MS = 1100;

// --- Idle-stand breathing (new) — small, slow vertical bob so a
// genuinely-stopped veggie doesn't look frozen/dead. Deliberately much
// gentler/slower than the run-gait footfall bob below, since this reads
// as "resting", not "moving". ---
const IDLE_STAND_BREATHE_SPEED = 1.6;
const IDLE_STAND_BREATHE_HEIGHT = 0.018;

// --- Glitch-phase locomotion tuning (final "everything's worth 1000
// pts" round) — erratic sin+cos blend layered on top of normal sway ---
const GLITCH_SPEED_X = 8, GLITCH_SPEED_X2 = 5, GLITCH_SPEED_Z = 7, GLITCH_SPEED_Z2 = 3;
const GLITCH_RANGE_X = 0.5, GLITCH_RANGE_X2 = 0.25, GLITCH_RANGE_Z = 0.35, GLITCH_RANGE_Z2 = 0.2;

// --- Fallback-gait tuning (only applies when there's no baked clip) ---
const FOOTFALL_PRIMARY_WEIGHT = 0.7;
const FOOTFALL_SECONDARY_WEIGHT = 0.3;
const FOOTFALL_BOB_HEIGHT = 0.07;
const SWAY_SECOND_HARMONIC_WEIGHT = 0.18;
const MAX_FORWARD_LEAN_RAD = 0.14;
const FORWARD_LEAN_PER_SPEED_UNIT = 0.035;

const POINT_LIGHT_PROXIMITY_METERS = 6;

const RUN_CLIP_CANDIDATES = ['run', 'running', 'walk', 'walking', 'move'];
const IDLE_CLIP_CANDIDATES = ['idle', 'stand', 'default'];
const HIDE_CLIP_CANDIDATES = ['hide', 'duck', 'crouch'];
const JUMPSCARE_CLIP_CANDIDATES = ['jumpscare', 'jump_scare', 'scare', 'roar', 'attack'];
const CAPTURE_CLIP_CANDIDATES = ['caught', 'capture', 'vacuum', 'suck', 'death', 'die', 'defeat'];

function findClipName(actions, candidates) {
  if (!actions) return null;
  const names = Object.keys(actions);
  for (const candidate of candidates) {
    const match = names.find((n) => n.toLowerCase().includes(candidate));
    if (match) return match;
  }
  return null;
}

function teamColorToHex(teamColor) {
  const map = { yellow: '#ffbe1a', blue: '#3cd6ff', red: '#ff3f34', green: '#1fae6e', purple: '#c084fc' };
  return map[teamColor] || teamColor || '#ffbe1a';
}

function applyTeamTint(root, teamColor) {
  if (!root || !teamColor) return;
  const color = new THREE.Color(teamColorToHex(teamColor));
  root.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    mats.forEach((mat) => {
      const name = (mat.name || '').toLowerCase();
      if ((name.includes('accent') || name.includes('team')) && mat.emissive) {
        mat.emissive.set(color);
        mat.emissiveIntensity = Math.max(mat.emissiveIntensity ?? 0, 0.6);
        mat.needsUpdate = true;
      }
    });
  });
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

const FALLBACK_COLOR_BY_SPECIES = {
  tomato: '#ff3b30',
  broccoli: '#3ecf4a',
  golden: '#ffd700',
  banana: '#ffe066',
  grapes: '#8e44ec',
  strawberry: '#ff5c8a',
};

function PlaceholderVeggie({ species, tiltZ = 0 }) {
  const body = FALLBACK_COLOR_BY_SPECIES[species] || '#39ff88';
  return (
    <group rotation={[0, 0, tiltZ]}>
      <mesh castShadow position={[0, 0.32, 0]}>
        <capsuleGeometry args={[0.28, 0.34, 6, 12]} />
        <meshStandardMaterial color={body} roughness={0.5} emissive={body} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[-0.1, 0.42, 0.2]} scale={[0.5, 0.3, 0.3]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} transparent opacity={0.5} />
      </mesh>
      <mesh position={[-0.09, 0.5, 0.24]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
      <mesh position={[0.09, 0.5, 0.24]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
    </group>
  );
}

function LoadedModel({ type, teamColor, groupRef, onClipsReady }) {
  const { scene, animations } = useGLTF(modelPath(type));

  const cloned = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    sanityCheckMaterials(clone, type);
    return clone;
  }, [scene, type]);

  useEffect(() => {
    applyTeamTint(cloned, teamColor);
  }, [cloned, teamColor]);

  const { actions, names } = useAnimations(animations, groupRef);

  useEffect(() => {
    onClipsReady?.(actions, names);
    return () => {
      if (!names || names.length === 0) return;
      const preferred = findClipName(actions, RUN_CLIP_CANDIDATES) || names[0];
      actions?.[preferred]?.fadeOut(0.2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (this.state.failed) return <PlaceholderVeggie species={this.props.type} />;
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
  isIdleStanding = false,
  onCatch,
}) {
  const outerRef = useRef();
  const runRef = useRef();
  const captureRef = useRef();
  const clockOffsetRef = useRef(runSeed);

  const [clipInfo, setClipInfo] = useState(null);
  const activeClipRef = useRef(null);

  // --- Idle hide/peek flavor ---
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
    setClipInfo({ actions, names });
  };

  // FIX: clip selection now checks isIdleStanding before falling back
  // to the run clip. If this species has a real idle/stand clip, it
  // plays while the veggie's world position is frozen — otherwise it
  // falls through to whatever it would have played before (run/idle
  // fallback), and the procedural math below picks up the slack instead.
  useEffect(() => {
    if (!clipInfo) return;
    const { actions } = clipInfo;
    const runClip = findClipName(actions, RUN_CLIP_CANDIDATES);
    const idleClip = findClipName(actions, IDLE_CLIP_CANDIDATES);
    const hideClip = findClipName(actions, HIDE_CLIP_CANDIDATES);
    const jumpscareClip = findClipName(actions, JUMPSCARE_CLIP_CANDIDATES);
    const captureClip = findClipName(actions, CAPTURE_CLIP_CANDIDATES);

    let target;
    if (isVacuuming) target = captureClip || hideClip;
    else if (isJumpScared) target = jumpscareClip;
    else if (isHiding) target = hideClip;
    else if (isIdleStanding) target = idleClip || runClip;
    else target = runClip || idleClip;

    if (!target || activeClipRef.current === target) return;
    activeClipRef.current = target;

    Object.values(actions).forEach((a) => a?.fadeOut(0.15));
    const action = actions[target];
    if (action) {
      action.reset().fadeIn(0.15).play();
      action.timeScale = hyperSpeed ? 2.2 : 1;
      const isOneShot = target === captureClip || target === jumpscareClip;
      action.setLoop(isOneShot ? THREE.LoopOnce : THREE.LoopRepeat, isOneShot ? 1 : Infinity);
      action.clampWhenFinished = isOneShot;
    }
  }, [clipInfo, isVacuuming, isJumpScared, isHiding, isIdleStanding, hyperSpeed]);

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
  const wasJumpScaredRef = useRef(false);
  useEffect(() => {
    if (isJumpScared && !wasJumpScaredRef.current) {
      jumpScareStartRef.current = performance.now();
    }
    wasJumpScaredRef.current = isJumpScared;
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

    // FIX: procedural fallback gait (footfall bob / sway / forward
    // lean) is suppressed while idle-standing and there's no baked
    // animation to lean on instead — this is the branch that actually
    // stops an unrigged/placeholder model from "jogging in place".
    // A gentle breathing bob replaces it so it doesn't look frozen.
    const suppressProceduralGait = isIdleStanding && !hasBakedAnimation;

    let swayX = suppressProceduralGait
      ? 0
      : (Math.sin(t * speed) + SWAY_SECOND_HARMONIC_WEIGHT * Math.sin(t * speed * 2)) * amp * 0.1;
    let swayZ = 0;

    const runGaitBobY = hasBakedAnimation
      ? 0
      : (Math.abs(Math.sin(t * speed * 2)) * FOOTFALL_PRIMARY_WEIGHT +
          Math.abs(Math.sin(t * speed * 2 + Math.PI * 0.5)) * FOOTFALL_SECONDARY_WEIGHT) *
        FOOTFALL_BOB_HEIGHT;
    const breatheBobY = isIdleStanding
      ? (Math.sin(t * IDLE_STAND_BREATHE_SPEED) * 0.5 + 0.5) * IDLE_STAND_BREATHE_HEIGHT
      : 0;
    const bobY = suppressProceduralGait ? breatheBobY : runGaitBobY;

    const stepLean = leanEnabled && !suppressProceduralGait ? Math.sin(t * speed) * 0.18 : 0;
    const forwardLean = leanEnabled && !hasBakedAnimation && !suppressProceduralGait
      ? Math.min(MAX_FORWARD_LEAN_RAD, speed * FORWARD_LEAN_PER_SPEED_UNIT)
      : 0;

    if (isGlitchPhase) {
      swayX += Math.sin(t * GLITCH_SPEED_X) * GLITCH_RANGE_X + Math.cos(t * GLITCH_SPEED_X2) * GLITCH_RANGE_X2;
      swayZ += Math.cos(t * GLITCH_SPEED_Z) * GLITCH_RANGE_Z + Math.sin(t * GLITCH_SPEED_Z2) * GLITCH_RANGE_Z2;
    }

    let punchScale = 1;
    if (jumpScareStartRef.current != null) {
      const elapsed = performance.now() - jumpScareStartRef.current;
      if (elapsed < JUMP_SCARE_PUNCH_MS) {
        const p = elapsed / JUMP_SCARE_PUNCH_MS;
        punchScale = 1 + Math.sin(p * Math.PI) * (JUMPSCARE_PUNCH_SCALE - 1);
      } else {
        jumpScareStartRef.current = null;
      }
    }

    if (runRef.current) {
      runRef.current.position.x = swayX;
      runRef.current.position.z = swayZ;
      runRef.current.position.y = bobY + (isHiding ? -0.22 : 0);
      runRef.current.rotation.z = stepLean;
      const targetPitch = -forwardLean;
      runRef.current.rotation.x += (targetPitch - runRef.current.rotation.x) * Math.min(1, delta * 4);
      const targetYaw = suppressProceduralGait ? 0 : Math.sin(t * speed * 0.5) * 0.4;
      runRef.current.rotation.y += (targetYaw - runRef.current.rotation.y) * Math.min(1, delta * 3);
      runRef.current.scale.setScalar(punchScale);
    }

    if (vacuumStartRef.current != null && captureRef.current) {
      const elapsed = performance.now() - vacuumStartRef.current;
      const progress = Math.min(1, elapsed / VACUUM_ANIM_MS);
      const eased = progress * progress;
      captureRef.current.scale.setScalar(Math.max(0.001, 1 - eased));
      captureRef.current.position.z = -eased * 2.5;
      captureRef.current.position.y = eased * 0.8;
      captureRef.current.rotation.y += delta * 14 * (1 - eased);

      if (progress >= 1 && !catchFiredRef.current) {
        catchFiredRef.current = true;
        onCatch?.(veggieId);
      }
    } else if (captureRef.current) {
      captureRef.current.scale.setScalar(1);
      captureRef.current.position.z = 0;
      captureRef.current.position.y = 0;
    }
  });

  const known = KNOWN_TYPES.includes(type);
  const accentColor = teamColorToHex(teamColor);
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
              <Suspense fallback={<PlaceholderVeggie species={type} />}>
                <LoadedModel type={type} teamColor={teamColor} groupRef={runRef} onClipsReady={handleClipsReady} />
              </Suspense>
            </ModelErrorBoundary>
          ) : (
            <PlaceholderVeggie species={type} />
          )}
        </group>
      </group>
    </group>
  );
}

// No eager preload of all 6 species on module import — see prior
// revision note; unchanged.
