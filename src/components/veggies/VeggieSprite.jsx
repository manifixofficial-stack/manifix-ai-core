// src/components/veggies/VeggieSprite.jsx
//
// 100/100 Accurate Universal 3D Vegetable Rig Node.
// Controls the jump-scare proximity timers, text bubbles, and
// performance-optimized ref-driven scale transformations within R3F.
//
// WHAT CHANGED (this revision):
// 1. Replaced the 8 hand-coded primitive-geometry sprite components
//    (CarrotSprite, BananaSprite, etc. — built from LatheGeometry/
//    spheres/cylinders) with a single <VeggieModel> that loads real
//    AI-generated .glb files. The old sprites could never match a
//    professionally-modeled/illustrated look no matter how much their
//    proportions were tuned — see VeggieModel.jsx header comment for
//    the full reasoning. SPRITE_MAP is gone; VeggieModel resolves
//    `type` to the correct .glb path internally (MODEL_PATHS).
// 2. Everything else — phase state machine, evasion, shadow, team ring,
//    speech bubble, catch/splat handling — is UNCHANGED. VeggieModel
//    receives the same `panic` / `leanDirection` / `isDodging` props
//    the old sprites did, so no other logic in this file needed to
//    change.
//
// (Carried over from earlier revisions):
// 1. Added a soft contact shadow mesh beneath every veggie's feet. Without
//    a real ground-plane/AR occlusion system (this app uses compass +
//    fixed camera height, not true ARKit/ARCore plane tracking), veggies
//    were anchoring to a fixed screen-relative height with nothing to
//    visually ground them, so they read as "floating" rather than
//    standing on the floor. A dark ellipse pinned directly under the feet
//    does most of the visual work real AR apps lean on for this same
//    reason — cheap, and fixes the floating look immediately.
// 2. `isDodging` on <VeggieModel> imports EVASION_TRIGGER_M from the hook
//    instead of hardcoding `8` with a "mirrors EVASION_TRIGGER_M" comment —
//    that comment was a promise the code didn't keep; if the hook's
//    threshold ever changes, this used to silently desync from the actual
//    evasion state. Now it can't.
// 3. Removed `handlePointerDown` and the `<group>`'s `onPointerDown` prop.
//    In GameCanvas.jsx, the <Canvas> wrapping this component is styled with
//    `pointerEvents: 'none'` (styles.threeLayer) so that CaptureThrow's 2D
//    overlay owns all touch input for swipe/capture. That means this
//    handler could structurally never fire — it was dead code that looked
//    like a working tap-to-startle interaction but wasn't. If you want
//    tap-to-startle for real, it needs to be wired through CaptureThrow.jsx
//    (which receives real touch events) rather than here.

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import VeggieModel from './VeggieModel';
import { useVeggieEvasion, EVASION_TRIGGER_M } from '../../hooks/useVeggieEvasion';

const TEAM_COLORS = {
  red: '#ff3b3b',
  blue: '#3b82ff',
  yellow: '#ffd23b',
};

const TEXT_CONFIG = {
  carrot: { greeting: 'Hii!', tease: 'Catch me!' },
  tomato: { greeting: 'Hii!', tease: "Can't catch me!" },
  broccoli: { greeting: 'Hii!', tease: 'Yo!' },
  golden: { greeting: '✨✨', tease: 'Catch me!' },
  banana: { greeting: 'Hii!', tease: "Slip away!" },
  grapes: { greeting: 'Hii!', tease: 'Bunch of trouble!' },
  brinjal: { greeting: 'Hii!', tease: "Try me!" },
  strawberry: { greeting: 'Hii!', tease: 'Sweet catch!' },
};

const GREETING_DURATION_MS = 900;
const CHARGE_TRIGGER_MS = 4500;
const CHARGE_DURATION_MS = 1600;
const SPLAT_DURATION_MS = 450;
// Overall size multiplier — makes every veggie read as a big, chunky,
// Pokémon-GO-scale character instead of a small floating icon. Applied
// uniformly to the whole group (body + shadow + ring) so everything scales
// together and stays aligned with the ground-contact shadow.
const BASE_SCALE = 1.4;

export default function VeggieSprite({
  veggieId,
  type = 'carrot',
  position,
  distanceMeters = Infinity,
  teamColor = 'yellow',
  catchMode = false,
  isHacked = false,
  isCaught = false,
  onCatch,
}) {
  const groupRef = useRef();
  const prevX = useRef(position ? position[0] : 0);
  const mountedRef = useRef(true);
  const splatTimeoutRef = useRef(null);

  const bounceRef = useRef(0);
  const catchModeTimerRef = useRef(0);
  const chargeProgressRef = useRef(0);

  const [phase, setPhase] = useState('greeting'); // greeting | teasing | charging | splat | gone
  const [bubbleText, setBubbleText] = useState(TEXT_CONFIG[type]?.greeting || 'Hii!');
  const [leanDirection, setLeanDirection] = useState(0);

  const greetingElapsedRef = useRef(0);

  const { processEvasionFrame, clearVeggieState } = useVeggieEvasion();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(splatTimeoutRef.current);
      clearVeggieState(veggieId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isCaught && phase !== 'splat' && phase !== 'gone') {
      triggerCatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCaught]);

  // useFrame must be called unconditionally, before any early return below.
  useFrame((_, delta) => {
    if (!groupRef.current || !position || phase === 'splat' || phase === 'gone') return;
    const deltaMs = delta * 1000;

    // --- Real 3D-space evasion: flees away from the player (world origin),
    // returns world-space x/z deltas instead of the old screen-pixel ones. ---
    const evasion = processEvasionFrame(veggieId, {
      distanceMeters,
      worldX: position[0],
      worldZ: position[2],
      isHackedGlobal: isHacked,
      dtSeconds: delta,
    });
    const isDodging = evasion.state === 'running';
    const dodgeOffset = { x: evasion.dx || 0, z: evasion.dz || 0 };

    // --- Greeting -> teasing, once ---
    if (phase === 'greeting') {
      greetingElapsedRef.current += deltaMs;
      if (greetingElapsedRef.current > GREETING_DURATION_MS) {
        setPhase('teasing');
        setBubbleText(TEXT_CONFIG[type]?.tease || 'Catch me!');
      }
    }

    // --- Catch-mode proximity timer -> jump-scare charge ---
    if (catchMode && phase === 'teasing') {
      catchModeTimerRef.current += deltaMs;
      if (catchModeTimerRef.current > CHARGE_TRIGGER_MS) {
        setPhase('charging');
        setBubbleText('!!');
        chargeProgressRef.current = 0;
        catchModeTimerRef.current = 0;
      }
    } else if (!catchMode) {
      catchModeTimerRef.current = 0; // reset on range exit, don't accumulate across gaps
    }

    // --- Charge pulse: driven by a ref + direct scale mutation, not state ---
    if (phase === 'charging') {
      chargeProgressRef.current += deltaMs;
      const progress = Math.min(chargeProgressRef.current / CHARGE_DURATION_MS, 1);
      const pulseScale = 1 + Math.sin(progress * Math.PI) * 1.5;
      groupRef.current.scale.set(pulseScale * BASE_SCALE, pulseScale * BASE_SCALE, pulseScale * BASE_SCALE);

      if (progress >= 1) {
        setPhase('teasing');
        setBubbleText(TEXT_CONFIG[type]?.tease || 'Catch me!');
        groupRef.current.scale.set(BASE_SCALE, BASE_SCALE, BASE_SCALE);
      }
    } else if (isDodging) {
      // Evasion's own squash/stretch takes over scale while fleeing.
      groupRef.current.scale.set((evasion.scaleX || 1) * BASE_SCALE, BASE_SCALE, (evasion.scaleZ || 1) * BASE_SCALE);
    } else {
      groupRef.current.scale.set(BASE_SCALE, BASE_SCALE, BASE_SCALE);
    }

    // --- Lean direction, only updates React state on an actual flip ---
    const dx = position[0] - prevX.current;
    if (Math.abs(dx) > 0.01) {
      setLeanDirection(dx > 0 ? 1 : -1);
    }
    prevX.current = position[0];

    // --- Ground positioning + idle bounce, ref-driven ---
    bounceRef.current += delta;
    const bounce = phase === 'charging' ? 0 : Math.abs(Math.sin(bounceRef.current * 3)) * 0.06;

    groupRef.current.position.set(
      position[0] + dodgeOffset.x,
      position[1] + bounce,
      position[2] + dodgeOffset.z
    );
  });

  if (!position) {
    console.warn(`VeggieSprite(${veggieId}): missing position — will not render.`);
    return null;
  }

  function triggerCatch() {
    if (!veggieId) {
      console.error('VeggieSprite: triggerCatch called without a veggieId — capture will not register.');
      return;
    }
    setPhase('splat');
    setBubbleText('');
    splatTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setPhase('gone');
      onCatch?.(veggieId);
    }, SPLAT_DURATION_MS);
  }

  if (phase === 'gone') return null;

  return (
    <group ref={groupRef} position={position}>
      <VeggieModel
        veggieId={veggieId}
        type={type}
        panic={phase === 'charging'}
        leanDirection={leanDirection}
        isDodging={phase !== 'charging' && distanceMeters <= EVASION_TRIGGER_M}
      />

      {/* Soft contact shadow — anchors the sprite visually to the ground,
          compensating for the lack of true AR plane detection. */}
      {phase !== 'splat' && (
        <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.32, 24]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      )}

      {/* Team badge ring, flat on the ground under the sprite */}
      {phase !== 'splat' && (
        <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.34, 32]} />
          <meshBasicMaterial color={TEAM_COLORS[teamColor] || TEAM_COLORS.yellow} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Floating AR speech bubble */}
      {bubbleText && phase !== 'splat' && (
        <Html position={[0, 1.2, 0]} center distanceFactor={6}>
          <div
            style={{
              background: 'white',
              padding: '4px 10px',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontFamily: 'sans-serif',
              border: '2px solid black',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {bubbleText}
          </div>
        </Html>
      )}

      {phase === 'splat' && (
        <Html center distanceFactor={8}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#ffd23b',
              textShadow: '0 0 8px #000',
              pointerEvents: 'none',
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            SPLAT!
          </div>
        </Html>
      )}
    </group>
  );
}

// ── INTEGRATION NOTE FOR GameCanvas.jsx ──────────────────────────────────
// This component needs a `distanceMeters` prop to gate evasion state
// (idle/greeting/running thresholds live in useVeggieEvasion.js). The
// <VeggieSprite> call inside GameCanvas.jsx's targetNodes.map() already
// passes distanceMeters={node.distance} — keep that wired.
//
// Also make sure GameCanvas.jsx's <Canvas> has real lights in the scene
// (ambientLight + directionalLight, or an Environment preset) — the GLB
// models use PBR materials and will render black/gray without any light
// hitting them. See VeggieModel.jsx header comment for details.
//
// ── INTEGRATION NOTE FOR server.js ────────────────────────────────────────
// The new banana/grapes/brinjal types need to actually be spawnable —
// see the updated spawnVegetable()/VEGGIE_POINTS in the accompanying
// server.js patch, or these three sprites will exist in code but never
// appear in a real match.
