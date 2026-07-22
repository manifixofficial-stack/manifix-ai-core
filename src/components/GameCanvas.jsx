// src/components/GameCanvas.native.jsx
//
// REACT NATIVE PORT of GameCanvas.jsx (was: web/Capacitor build using
// WebXR + <video> + framer-motion + DOM overlays).
//
// ============================================================================
// THE ONE THING THIS PORT DELIBERATELY DOES NOT DO: real WebXR-style AR
// ============================================================================
// The web version had two tiers:
//   1. "Real AR" (xrState === 'active'): WebXR immersive-ar session,
//      ground-anchored via hit-test (ARGroundAnchor), depth occlusion
//      (ARDepthOcclusion using frame.getDepthInformation).
//   2. "Basic camera" fallback (xrState === 'unsupported' or user skipped):
//      plain camera feed behind a heading/GPS-projected 3D scene, no ground
//      anchor, no occlusion.
//
// React Native has NO WebXR. There is no drop-in equivalent to
// navigator.xr.requestSession('immersive-ar') in RN's JS layer — real
// ground-anchored AR here requires a native bridge (ViroReact's ARScene,
// or a custom ARKit/ARCore module) which is a genuinely separate,
// native-code-touching project, not a JS port. Given this game's own
// design doc already treats basic-camera as a fully playable fallback
// mode (it's what ships on any device/browser without WebXR support),
// this port ships ONLY that tier for now. Tier 1 is left as a clearly
// marked extension point below (`// AR_HOOK:`) for whenever you want to
// take on the ViroReact/native-module work as its own phase.
//
// Concretely dropped vs the web file: XRSessionBridge, ARGroundAnchor,
// ARDepthOcclusion, all `xrActive`/`xrSession` state, the AR opt-in
// prompt screens (REAL AR AVAILABLE / STARTING AR / AR SESSION FAILED).
// Kept: everything about the basic-camera tier, which is now the only
// tier, so there's no more mode-switch logic cluttering the render.
//
// ============================================================================
// Library swaps made for RN
// ============================================================================
//   <video> camera feed          -> react-native-vision-camera <Camera>
//   three.js Canvas (web)        -> @react-three/fiber/native (expo-gl)
//   @react-three/drei Environment-> dropped (native drei env presets need
//                                   HDR asset loading not worth it here);
//                                   replaced with three plain lights, same
//                                   visual weight as the old hemisphere+dir+
//                                   ambient rig minus the reflection map.
//   framer-motion popups         -> Animated (RN core) — same timing/feel,
//                                   just spring/timing configs instead of
//                                   variants.
//   DOM overlays (div/button)    -> View / Text / TouchableOpacity
//   backdropFilter blur          -> DROPPED (not supported in RN styles).
//                                   The AR-prompt frosted-glass look doesn't
//                                   apply anyway since the AR-prompt screens
//                                   are gone; camera-denied overlay is now a
//                                   plain solid overlay same as web's
//                                   cameraErrorOverlay.
//   window.socket                -> `socket` prop, passed down from
//                                   App.jsx's existing socket singleton.
//                                   (window doesn't meaningfully exist in RN;
//                                   a prop is cleaner than a global anyway.)
//   DeviceOrientationEvent       -> expo-sensors DeviceMotion, for the
//                                   camera-pitch rig only (deviceHeading
//                                   itself is still passed in as a prop,
//                                   same contract as the web version —
//                                   App.jsx already owns that compass logic).
//   navigator.share/clipboard    -> RN's Share API.
//   Capacitor Haptics            -> unchanged; that's CaptureThrow's
//                                   concern, not this file's — CaptureThrow
//                                   needs its own RN port (out of scope
//                                   here), this file just forwards props
//                                   to it identically.
//
// Everything else — round/points/glitch state machine, evasion-frame
// processing, lock-ring geometry, capture-target projection math — is
// unchanged logic, just re-hosted on RN components.

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Share,
  Platform,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import { DeviceMotion } from 'expo-sensors';
import * as THREE from 'three';
import CaptureThrow from './CaptureThrow.native';
import Veggie3DModel from '../components/veggies/VeggieModel.native';
import {
  AR_TRIGGER_DISTANCE_METERS,
  CATCH_TRIGGER_DISTANCE_METERS,
  MODEL_BASE_SCALE,
  GLITCH_TARGET_SCALE_MULTIPLIER,
  CAMERA_EYE_HEIGHT_METERS,
  RARITY_BY_SPECIES,
  PERSONALITY_CHASE_OVERRIDE,
} from '../config/gameConfig';
import { useVeggieEvasion } from '../hooks/useVeggieEvasion';

const EARTH_RADIUS_M = 6371000;
const FOV_ANGLE_DEG = 60;

const MIN_SCENE_DEPTH = 1.6;
const MAX_SCENE_DEPTH = 11;
const METERS_TO_SCENE_DIVISOR = 5;
const MAX_PITCH_DEG = 60;

const FALLBACK_SESSION_SECONDS = 55;
const TIMER_SECONDS_BY_MODE = { indoor: 45, outdoor: 60 };

const LOCK_RADIUS_PX = 80;

// Display-only — server.js is authoritative on the real round count and
// per-round point value. This constant only feeds the "ROUND: X/3" HUD label.
const TOTAL_ROUNDS = 3;
const VACUUM_WINDOW_MS = 1200;
const CAPTURE_RESULT_TIMEOUT_MS = 3500;

const RUN_AMPLITUDE = 1.8;
const RUN_SPEED = 2;
const JUMP_SCARE_DELAY_MS = 4500;
const JUMP_SCARE_DURATION_MS = 900;
const GLITCH_SPEED_MULTIPLIER = 3.0;
const RETICLE_SNAPSHOT_INTERVAL_MS = 100;
const KNOWN_VEGGIE_SPECIES = ['tomato', 'broccoli', 'golden', 'banana', 'grapes', 'strawberry'];
const BLIND_ATTACK_DURATION_MS = 1400;
const BLIND_ATTACK_COOLDOWN_MS = 3000;
const REAL_MISS_LABELS = ['TOO FAR', 'NOT AIMED', 'NEAR MISS', 'BREAKOUT'];

const VORTEX_SPIN_Y_RAD_PER_SEC = 15;
const VORTEX_SPIN_X_RAD_PER_SEC = 8;
const VORTEX_POSITION_LERP_SPEED = 6;
const VORTEX_SCALE_LERP_SPEED = 5;

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

function distanceMeters(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingDegrees(lat1, lng1, lat2, lng2) {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function metersToSceneDepth(meters) {
  const raw = meters / METERS_TO_SCENE_DIVISOR;
  return Math.min(MAX_SCENE_DEPTH, Math.max(MIN_SCENE_DEPTH, raw));
}

const APPROX_MODEL_HALF_WIDTH_SCENE_UNITS = 0.42;
const MIN_SCREEN_HIT_RADIUS_PX = 14;

function projectToScreen(position, screenW, screenH, fovDeg, halfWidthUnits = APPROX_MODEL_HALF_WIDTH_SCENE_UNITS) {
  const [x, y, z] = position;
  if (z >= -0.01) return null;

  const fovRad = toRad(fovDeg);
  const aspect = screenW / screenH;
  const tanHalfV = Math.tan(fovRad / 2);
  const tanHalfH = tanHalfV * aspect;

  const ndcX = x / (-z * tanHalfH);
  const ndcY = y / (-z * tanHalfV);

  const screenX = (ndcX * 0.5 + 0.5) * screenW;
  const screenY = (1 - (ndcY * 0.5 + 0.5)) * screenH;

  const focalLengthPx = (screenH / 2) / tanHalfV;
  const radius = Math.max(MIN_SCREEN_HIT_RADIUS_PX, (halfWidthUnits / -z) * focalLengthPx);

  return { x: screenX, y: screenY, radius };
}

function chaseModeForSpecies(species) {
  if (Object.prototype.hasOwnProperty.call(PERSONALITY_CHASE_OVERRIDE, species)) {
    return PERSONALITY_CHASE_OVERRIDE[species];
  }
  const tier = RARITY_BY_SPECIES[species];
  return tier === 'rare' || tier === 'ultra_rare';
}

function seedFromId(id) {
  let h = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 1000) / 1000 * Math.PI * 2;
}

function CameraPitchRig({ pitchDeg }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.rotation.x = toRad(-pitchDeg);
  });
  return null;
}

// AR_HOOK: this is where a ViroReact ARScene / native ARCore-ARKit ground
// anchor would slot in for Phase 2 "real AR" — see file header. For now
// floorY always comes from CAMERA_EYE_HEIGHT_METERS, no ground truth.
function GroundShadow({ position, distanceMeters: distM }) {
  const [gx, gy, gz] = position;
  const proximity = Math.max(0, Math.min(1, 1 - distM / AR_TRIGGER_DISTANCE_METERS));
  const scale = 0.35 + proximity * 0.35;
  const opacity = 0.18 + proximity * 0.32;
  return (
    <mesh position={[gx, gy + 0.02, gz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={0}>
      <circleGeometry args={[scale, 32]} />
      <meshBasicMaterial color="#000000" transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function AnimatedVeggieTarget({
  node,
  processEvasionFrame,
  clearVeggieState,
  deviceHeadingDeg,
  isThisGlitchTarget,
  jumpScared,
  isVacuuming,
  isCaught,
  pendingCatchAttemptsRef,
  onLiveUpdate,
  onLocalCatch,
}) {
  const groupRef = useRef();
  const posRef = useRef({ x: node.position[0], z: node.position[2] });
  const seededRef = useRef(false);

  useEffect(() => {
    if (!seededRef.current) {
      posRef.current = { x: node.position[0], z: node.position[2] };
      seededRef.current = true;
    }
    return () => {
      clearVeggieState(node.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id]);

  const [isIdleStanding, setIsIdleStanding] = useState(false);

  useFrame((_, delta) => {
    if (isVacuuming) {
      if (groupRef.current) {
        groupRef.current.rotation.y += delta * VORTEX_SPIN_Y_RAD_PER_SEC;
        groupRef.current.rotation.x += delta * VORTEX_SPIN_X_RAD_PER_SEC;

        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, delta * VORTEX_POSITION_LERP_SPEED);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, delta * VORTEX_POSITION_LERP_SPEED);
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 0, delta * VORTEX_POSITION_LERP_SPEED);

        groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, 0, delta * VORTEX_SCALE_LERP_SPEED);
        groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, 0, delta * VORTEX_SCALE_LERP_SPEED);
        groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, 0, delta * VORTEX_SCALE_LERP_SPEED);
      }
      return;
    }

    const pending = pendingCatchAttemptsRef.current[node.id];
    let catchAttempted = false;
    let catchLockSuccess = false;
    if (pending) {
      catchAttempted = true;
      catchLockSuccess = !!pending.success;
      delete pendingCatchAttemptsRef.current[node.id];
    }

    const result = processEvasionFrame(node.id, {
      distanceMeters: node.distance,
      worldX: posRef.current.x,
      worldZ: posRef.current.z,
      dtSeconds: Math.min(delta, 1 / 15),
      deviceHeadingDeg,
      catchAttempted,
      catchLockSuccess,
      catchDifficulty: node.isGolden ? 0.8 : 0.3,
      chaseMode: chaseModeForSpecies(node.species),
      floorY: node.floorY,
    });

    posRef.current = {
      x: posRef.current.x + result.dx,
      z: posRef.current.z + result.dz,
    };

    if (groupRef.current) {
      groupRef.current.position.set(posRef.current.x, result.worldY, posRef.current.z);
      groupRef.current.scale.set(result.scaleX, result.scaleY, result.scaleZ);
    }

    if (result.spinoutTriggered) {
      onLiveUpdate(node.id, { spinoutTriggered: true });
    }

    const nowIdle = result.state === 'idle_stand';
    setIsIdleStanding((prev) => (prev === nowIdle ? prev : nowIdle));

    onLiveUpdate(node.id, {
      x: posRef.current.x,
      z: posRef.current.z,
      worldY: result.worldY,
      fleaRadius: result.fleaRadius,
      state: result.state,
    });
  });

  return (
    <group ref={groupRef}>
      <GroundShadow position={[0, 0, 0]} distanceMeters={node.distance} />
      <Veggie3DModel
        veggieId={node.id}
        type={node.species}
        position={[0, 0, 0]}
        distanceMeters={node.distance}
        teamColor={node.teamColor}
        scale={isThisGlitchTarget ? MODEL_BASE_SCALE * GLITCH_TARGET_SCALE_MULTIPLIER : MODEL_BASE_SCALE}
        runAmplitude={RUN_AMPLITUDE}
        runSpeed={isThisGlitchTarget ? RUN_SPEED * GLITCH_SPEED_MULTIPLIER : RUN_SPEED}
        runSeed={node.runSeed}
        leanEnabled
        hyperSpeed={isThisGlitchTarget}
        isGlitchPhase={isThisGlitchTarget}
        isJumpScared={jumpScared}
        isVacuuming={isVacuuming}
        isCaught={isCaught}
        isIdleStanding={isIdleStanding}
        onCatch={onLocalCatch}
      />
    </group>
  );
}

// ---- popup components using RN Animated (replaces framer-motion) ----

function ScorePopup({ popup, onDone }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(anim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [30, -100] });
  const scale = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.7, 1.05, 1] });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just secured a ${popup.speciesName} and scored ${popup.text}! 🥕📸`,
      });
    } catch {
      // user dismissed the share sheet — no action needed
    }
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.scoreBurstWrapper, { opacity: anim, transform: [{ translateY }, { scale }] }]}
    >
      <Text style={styles.securedFlashTag}>SECURED! 💥</Text>
      {popup.isPerfect && <Text style={styles.perfectTag}>PERFECT!</Text>}
      <Text style={styles.bigScoreLabel}>{popup.text}</Text>
      <Text style={styles.speciesTextCard}>{popup.speciesName}</Text>
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>📤 SHARE</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function MissPopup({ miss, onDone }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(700),
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(onDone);
  }, []);
  return (
    <Animated.View pointerEvents="none" style={[styles.missBurstWrapper, { opacity: anim }]}>
      <Text style={styles.missLabel}>{miss.text}</Text>
    </Animated.View>
  );
}

function VacuumFlash({ points }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [50, -100] });
  return (
    <Animated.View pointerEvents="none" style={[styles.vacuumFlashLabel, { opacity: anim, transform: [{ translateY }] }]}>
      <Text style={styles.vacuumFlashText}>🎉 SECURED! +{points} PTS</Text>
    </Animated.View>
  );
}

export default function GameCanvas({
  connectionStatus = 'idle',
  roomCode = '',
  playerId = null,
  mySlot = 'oggy-blue',
  selfPosition = null,
  deviceHeading = 0,
  players = {},
  veggies = {},
  matchPhase = null,
  initialTimingMode = null,
  targetVegId = null,
  socket = null,
  onExit,
}) {
  const [windowDims, setWindowDims] = useState(() => Dimensions.get('window'));
  const [popups, setPopups] = useState([]);
  const [missPopups, setMissPopups] = useState([]);
  const [caughtIds, setCaughtIds] = useState(() => new Set());
  const [captureResolutions, setCaptureResolutions] = useState([]);
  const [devicePitch, setDevicePitch] = useState(0);

  const [blindAttack, setBlindAttack] = useState(null);
  const blindCooldownRef = useRef(new Map());

  const [topBarHeight, setTopBarHeight] = useState(96);

  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraDevice = useCameraDevice('back');
  const [cameraState, setCameraState] = useState('initializing');

  useEffect(() => {
    if (hasPermission == null) return;
    if (hasPermission) {
      setCameraState('ready');
    } else {
      requestPermission().then((granted) => {
        setCameraState(granted ? 'ready' : 'denied');
      });
    }
  }, [hasPermission]);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setWindowDims(window));
    return () => sub?.remove?.();
  }, []);

  // Device pitch for the camera-pitch rig — RN equivalent of the web
  // version's `deviceorientation` listener. deviceHeading (compass) is
  // still owned by the parent (App.jsx), same contract as before.
  useEffect(() => {
    let sub;
    DeviceMotion.setUpdateInterval(100);
    sub = DeviceMotion.addListener(({ rotation }) => {
      if (!rotation) return;
      const tiltDeg = toDeg(rotation.beta ?? 0);
      setDevicePitch(Math.max(-MAX_PITCH_DEG, Math.min(MAX_PITCH_DEG, tiltDeg)));
    });
    return () => sub?.remove?.();
  }, []);

  const timerBaseSeconds = TIMER_SECONDS_BY_MODE[initialTimingMode] ?? FALLBACK_SESSION_SECONDS;
  const [secondsLeft, setSecondsLeft] = useState(timerBaseSeconds);

  // Round/points/glitch are server-authoritative — only ever set from the
  // real 'round-start' / 'glitch-pulse' socket payloads. stageDeadline
  // anchors the display-only countdown to the server's real round start.
  const [matchRound, setMatchRound] = useState(1);
  const [currentRoundPoints, setCurrentRoundPoints] = useState(100);
  const [isGlitched, setIsGlitched] = useState(false);
  const [stageDeadline, setStageDeadline] = useState(null);

  const [vacuumLock, setVacuumLock] = useState(null);
  const timerFrozenRef = useRef(false);
  const attemptTimeoutRef = useRef(null);

  const lockedSinceRef = useRef(new Map());
  const [jumpScaredIds, setJumpScaredIds] = useState(() => new Set());
  const [glitchTargetId, setGlitchTargetId] = useState(null);

  const { processEvasionFrame, clearVeggieState } = useVeggieEvasion();
  const pendingCatchAttemptsRef = useRef({});
  const liveVeggieRef = useRef({});
  const [liveVeggieSnapshot, setLiveVeggieSnapshot] = useState({});

  const handleLiveUpdate = useCallback((id, patch) => {
    liveVeggieRef.current[id] = { ...(liveVeggieRef.current[id] || {}), ...patch };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setLiveVeggieSnapshot({ ...liveVeggieRef.current });
    }, RETICLE_SNAPSHOT_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => () => clearTimeout(attemptTimeoutRef.current), []);

  // Display-only countdown — recomputes remaining seconds from the
  // server-anchored stageDeadline every second. Never advances the round
  // or exits the arena on its own.
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (timerFrozenRef.current || stageDeadline == null) return;
      setSecondsLeft(Math.max(0, Math.ceil((stageDeadline - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [stageDeadline]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleCaughtBroadcast = (data) => {
      if (!data) return;
      if (data.vegId) {
        setCaughtIds((prev) => new Set(prev).add(data.vegId));
      }
      if (data.playerId !== socket.id) return;

      const newPopup = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: `+${data.points ?? 0}`,
        speciesName: (data.species || 'CAUGHT').toUpperCase(),
        isPerfect: data.quality === 'perfect',
      };
      setPopups((prev) => [...prev, newPopup]);
      // Next round / true match end is driven entirely by the server's
      // own 'round-start' below (or App.jsx's 'round-end' handling) —
      // this component never decides that on its own.
    };

    const handleCaptureResult = (data) => {
      if (!data) return;
      clearTimeout(attemptTimeoutRef.current);

      const label = data.success ? null : (data.label || 'MISSED');
      const resolution = {
        id: data.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        vegId: data.vegId ?? null,
        success: !!data.success,
        label,
      };

      setCaptureResolutions((prev) => {
        const next = [...prev, resolution];
        return next.length > 20 ? next.slice(next.length - 20) : next;
      });

      if (resolution.vegId) {
        pendingCatchAttemptsRef.current[resolution.vegId] = { success: resolution.success };
      }

      if (resolution.success) {
        if (resolution.vegId) {
          setVacuumLock({ targetId: resolution.vegId, expiresAt: Date.now() + VACUUM_WINDOW_MS });
        }
        setTimeout(() => {
          timerFrozenRef.current = false;
          setVacuumLock((prev) => (prev?.targetId === resolution.vegId ? null : prev));
        }, VACUUM_WINDOW_MS);
      } else {
        timerFrozenRef.current = false;
        const newMiss = { id: resolution.id, text: label };
        setMissPopups((prev) => [...prev, newMiss]);

        const vegId = resolution.vegId;
        if (vegId && REAL_MISS_LABELS.includes(label)) {
          const now = Date.now();
          const nextEligible = blindCooldownRef.current.get(vegId) || 0;
          if (now >= nextEligible) {
            blindCooldownRef.current.set(vegId, now + BLIND_ATTACK_COOLDOWN_MS);
            setBlindAttack({ id: vegId, startedAt: now });
            setTimeout(() => {
              setBlindAttack((prev) => (prev?.id === vegId && prev.startedAt === now ? null : prev));
            }, BLIND_ATTACK_DURATION_MS);
          }
        }
      }
    };

    const handleRoundStart = (data) => {
      if (!data) return;
      setMatchRound(data.round || 1);
      setCurrentRoundPoints(data.pointValue ?? 100);
      setStageDeadline(Date.now() + timerBaseSeconds * 1000);
      setVacuumLock(null);
      timerFrozenRef.current = false;
      lockedSinceRef.current.clear();
      setJumpScaredIds(new Set());
      setCaughtIds(new Set());
    };

    const handleRoundTimeoutEvt = () => {
      timerFrozenRef.current = false;
      setVacuumLock(null);
    };

    // Real glitch-pulse from the server — periodic visual-only window,
    // never changes point values. currentRoundPoints always comes from
    // round-start, so this can't disagree with it.
    const handleGlitchPulse = (data) => setIsGlitched(!!data?.active);

    socket.on('veggieCaught', handleCaughtBroadcast);
    socket.on('capture-result', handleCaptureResult);
    socket.on('round-timeout', handleRoundTimeoutEvt);
    socket.on('round-start', handleRoundStart);
    socket.on('glitch-pulse', handleGlitchPulse);
    return () => {
      socket.off('veggieCaught', handleCaughtBroadcast);
      socket.off('capture-result', handleCaptureResult);
      socket.off('round-timeout', handleRoundTimeoutEvt);
      socket.off('round-start', handleRoundStart);
      socket.off('glitch-pulse', handleGlitchPulse);
    };
  }, [socket, timerBaseSeconds]);

  // Basic-camera-tier target projection: bearing + heading only, no
  // ground anchor (see AR_HOOK note above and file header).
  const rawTargetNodes = useMemo(() => {
    if (!selfPosition || !veggies || typeof veggies !== 'object') return [];
    const projectedList = [];

    Object.entries(veggies).forEach(([id, node]) => {
      if (!node || node.lat == null || node.lng == null) return;
      const dist = distanceMeters(selfPosition.lat, selfPosition.lng, node.lat, node.lng);
      if (dist > AR_TRIGGER_DISTANCE_METERS) return;

      const resolvedFloorY = -CAMERA_EYE_HEIGHT_METERS;

      const bearing = bearingDegrees(selfPosition.lat, selfPosition.lng, node.lat, node.lng);
      const relAngle = ((bearing - deviceHeading + 540) % 360) - 180;
      if (Math.abs(relAngle) > FOV_ANGLE_DEG / 2) return;
      const relAngleRad = toRad(relAngle);
      const sceneDepth = metersToSceneDepth(dist);
      const worldX = Math.sin(relAngleRad) * sceneDepth;
      const worldZ = -Math.cos(relAngleRad) * sceneDepth;

      projectedList.push({
        id,
        position: [worldX, resolvedFloorY, worldZ],
        floorY: resolvedFloorY,
        species: (node.species || node.type || KNOWN_VEGGIE_SPECIES[0]).toLowerCase(),
        teamColor: node.teamColor || 'yellow',
        distance: dist,
        isGolden: (node.species || node.type) === 'golden',
        runSeed: seedFromId(id),
      });
    });

    return projectedList;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [veggies, selfPosition, deviceHeading]);

  const targetNodes = useMemo(() => {
    if (!targetVegId) return rawTargetNodes;
    return rawTargetNodes.filter((n) => n.id === targetVegId);
  }, [rawTargetNodes, targetVegId]);

  useEffect(() => {
    if (targetNodes.length === 0) {
      setGlitchTargetId(null);
      return;
    }
    const nearest = targetNodes.reduce((a, b) => (a.distance <= b.distance ? a : b));
    setGlitchTargetId((prev) => (prev === nearest.id ? prev : nearest.id));
  }, [targetNodes]);

  const captureTargets = useMemo(() => {
    return targetNodes
      .map((node) => {
        const live = liveVeggieSnapshot[node.id];
        const x = live ? live.x : node.position[0];
        const z = live ? live.z : node.position[2];
        const worldY = live ? live.worldY : node.position[1];
        const fleaRadius = live?.fleaRadius;
        const projected = projectToScreen([x, worldY, z], windowDims.width, windowDims.height, FOV_ANGLE_DEG, fleaRadius);
        if (!projected) return null;
        return {
          id: node.id,
          species: node.species,
          distance: node.distance,
          x: projected.x,
          y: projected.y,
          radius: projected.radius,
        };
      })
      .filter(Boolean);
  }, [targetNodes, liveVeggieSnapshot, windowDims]);

  const lockRings = useMemo(() => {
    const cx = windowDims.width / 2;
    const cy = windowDims.height / 2;
    return captureTargets.map((t) => {
      const dx = t.x - cx;
      const dy = t.y - cy;
      const distToCenter = Math.sqrt(dx * dx + dy * dy);
      const inRealRange = t.distance <= CATCH_TRIGGER_DISTANCE_METERS;
      const locked = distToCenter <= LOCK_RADIUS_PX && inRealRange;
      const vacuuming = vacuumLock?.targetId === t.id;
      const jumpScared = jumpScaredIds.has(t.id);
      return { ...t, locked, inRealRange, vacuuming, jumpScared };
    });
  }, [captureTargets, windowDims, vacuumLock, jumpScaredIds]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const stillLockedIds = new Set(lockRings.filter((r) => r.locked && !r.vacuuming).map((r) => r.id));

      for (const id of stillLockedIds) {
        if (!lockedSinceRef.current.has(id)) lockedSinceRef.current.set(id, now);
      }
      for (const id of Array.from(lockedSinceRef.current.keys())) {
        if (!stillLockedIds.has(id)) lockedSinceRef.current.delete(id);
      }

      stillLockedIds.forEach((id) => {
        const lockedSince = lockedSinceRef.current.get(id);
        if (lockedSince != null && now - lockedSince >= JUMP_SCARE_DELAY_MS) {
          setJumpScaredIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
          lockedSinceRef.current.set(id, now);
          setTimeout(() => {
            setJumpScaredIds((prev) => {
              if (!prev.has(id)) return prev;
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }, JUMP_SCARE_DURATION_MS);
        }
      });
    }, 250);
    return () => clearInterval(intervalId);
  }, [lockRings]);

  const handleCaptureAttempt = useCallback((id, quality) => {
    const targetNode = targetNodes.find((n) => n.id === id);
    if (targetNode && targetNode.distance > CATCH_TRIGGER_DISTANCE_METERS) return;

    timerFrozenRef.current = true;
    lockedSinceRef.current.delete(id);
    setJumpScaredIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    clearTimeout(attemptTimeoutRef.current);
    attemptTimeoutRef.current = setTimeout(() => {
      timerFrozenRef.current = false;
    }, CAPTURE_RESULT_TIMEOUT_MS);

    socket?.emit('capture-attempt', { vegId: id, quality });
  }, [targetNodes, socket]);

  const timerColor = secondsLeft <= 10 ? '#ff3f34' : secondsLeft <= 20 ? '#ffbe1a' : '#39ff88';
  const myScore = players?.[mySlot]?.score ?? 0;
  const myMode = players?.[mySlot]?.mode;

  const rankedPlayers = useMemo(() => {
    return Object.entries(players || {})
      .map(([slot, p]) => ({
        slot,
        name: p?.name || (slot === mySlot ? 'You' : slot),
        score: p?.score ?? 0,
      }))
      .sort((a, b) => b.score - a.score);
  }, [players, mySlot]);

  const visibleTargetCount = targetNodes.length;

  // No isMobileCapable desktop-block screen — RN only ever runs on a
  // real device, that check was web-only and had no RN equivalent need.

  if (!cameraDevice) {
    return (
      <View style={styles.cameraErrorOverlay}>
        <Text style={styles.errorTitle}>NO CAMERA FOUND</Text>
      </View>
    );
  }

  return (
    <View style={styles.viewport}>
      {cameraState === 'denied' ? (
        <View style={styles.cameraErrorOverlay}>
          <Text style={styles.errorTitle}>CAMERA ACCESS REJECTED</Text>
        </View>
      ) : (
        <Camera style={StyleSheet.absoluteFill} device={cameraDevice} isActive={true} />
      )}
      <View style={styles.videoScrim} pointerEvents="none" />

      {blindAttack && <View style={styles.blindAttackOverlay} pointerEvents="none" />}

      {myMode === 'indoor' && (
        <View style={styles.alignmentBarWrap} pointerEvents="none">
          <View style={styles.alignmentBar} />
          <Text style={styles.alignmentBarLabel}>ALIGN DEVICE TO CENTER LINE</Text>
        </View>
      )}

      <View style={styles.threeLayer} pointerEvents="none">
        <Canvas
          camera={{ position: [0, 0, 0], fov: FOV_ANGLE_DEG, near: 0.1, far: 150 }}
          gl={{ alpha: true }}
        >
          <CameraPitchRig pitchDeg={devicePitch} />
          <hemisphereLight args={['#ffffff', '#4a4a4a', 0.5]} />
          <directionalLight position={[3, 6, 4]} intensity={1.8} />
          <ambientLight intensity={0.45} />

          {targetNodes.map((node) => {
            const isThisGlitchTarget = isGlitched && node.id === glitchTargetId;
            return (
              <AnimatedVeggieTarget
                key={node.id}
                node={node}
                processEvasionFrame={processEvasionFrame}
                clearVeggieState={clearVeggieState}
                deviceHeadingDeg={deviceHeading}
                isThisGlitchTarget={isThisGlitchTarget}
                jumpScared={jumpScaredIds.has(node.id)}
                isVacuuming={vacuumLock?.targetId === node.id}
                isCaught={caughtIds.has(node.id)}
                pendingCatchAttemptsRef={pendingCatchAttemptsRef}
                onLiveUpdate={handleLiveUpdate}
                onLocalCatch={(id) => {
                  setCaughtIds((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                  });
                  clearVeggieState(id);
                  delete liveVeggieRef.current[id];
                }}
              />
            );
          })}
        </Canvas>
      </View>

      {vacuumLock && <VacuumFlash points={currentRoundPoints} />}

      <View style={styles.lockLayer} pointerEvents="none">
        {lockRings.map((ring) => {
          const color = ring.vacuuming ? '#ffbe1a' : ring.locked ? '#39ff6e' : '#ff3b3b';
          const size = ring.radius * 2.6;
          const distLabel = `${ring.species.toUpperCase()} ${ring.distance.toFixed(1)}m`;
          const label = ring.vacuuming
            ? 'MAX SUCTION'
            : ring.locked
              ? `LOCKED ON! · ${distLabel}`
              : !ring.inRealRange
                ? `MOVE CLOSER! · ${distLabel}`
                : distLabel;
          const labelColor = ring.vacuuming ? '#ffbe1a' : ring.locked ? '#39ff6e' : '#ff8f85';

          return (
            <View
              key={`bracket-${ring.id}`}
              style={[styles.bracketWrap, { left: ring.x - size / 2, top: ring.y - size / 2, width: size, height: size }]}
            >
              <View style={[styles.bracketCorner, styles.bracketTL, { borderColor: color }]} />
              <View style={[styles.bracketCorner, styles.bracketTR, { borderColor: color }]} />
              <View style={[styles.bracketCorner, styles.bracketBL, { borderColor: color }]} />
              <View style={[styles.bracketCorner, styles.bracketBR, { borderColor: color }]} />
              <Text style={[styles.bracketLabel, { color: labelColor }]}>{label}</Text>
            </View>
          );
        })}
      </View>

      <CaptureThrow
        targets={captureTargets}
        onAttempt={handleCaptureAttempt}
        captureResolutions={captureResolutions}
        disabled={cameraState !== 'ready'}
        screenW={windowDims.width}
        screenH={windowDims.height}
      />

      {isGlitched && (
        <View style={styles.glitchBanner} pointerEvents="none">
          <Text style={styles.glitchBannerText}>⚠️ GLITCH SURGE — TARGETS MOVING ERRATICALLY ⚠️</Text>
        </View>
      )}

      <View
        style={styles.topBar}
        pointerEvents="none"
        onLayout={(e) => setTopBarHeight(e.nativeEvent.layout.height + 10)}
      >
        <View style={styles.topBarHeader}>
          <View style={styles.scanDot} />
          <Text style={styles.topBarHeaderText}>HUNTING FOR TARGETS</Text>
        </View>
        <View style={styles.telemetryRow}>
          <View style={styles.ptsTag}><Text style={styles.ptsNumber}>{myScore.toLocaleString()}</Text><Text style={styles.ptsTagText}> PTS</Text></View>
          <View style={styles.telemetryTag}><Text style={styles.telemetryTagText}>ARENA: <Text style={{ color: '#00e5e5' }}>{roomCode || 'LOCAL'}</Text></Text></View>
          <View style={styles.telemetryTag}><Text style={styles.telemetryTagText}>ROUND: <Text style={{ color: '#c084fc' }}>{matchRound}/{TOTAL_ROUNDS}</Text></Text></View>
          <View style={[styles.telemetryTag, isGlitched && { borderColor: 'rgba(255,190,26,0.7)' }]}>
            <Text style={styles.telemetryTagText}>TIER: <Text style={{ color: isGlitched ? '#ffbe1a' : '#39ff88' }}>{currentRoundPoints} PTS</Text></Text>
          </View>
          <View style={styles.telemetryTag}><Text style={styles.telemetryTagText}>COMPASS: <Text style={{ color: '#39ff88' }}>{Math.round(deviceHeading)}°</Text></Text></View>
          <View style={styles.telemetryTag}>
            <Text style={styles.telemetryTagText}>TIME: <Text style={{ color: timerColor, fontWeight: '900' }}>{vacuumLock ? '⏸' : secondsLeft}s</Text></Text>
          </View>
          <View style={styles.telemetryTag}><Text style={styles.telemetryTagText}>LOCKS: <Text style={{ color: '#ffbe1a' }}>{visibleTargetCount} IN SIGHT</Text></Text></View>
          {myMode && (
            <View style={styles.telemetryTag}>
              <Text style={styles.telemetryTagText}>{myMode === 'gps' ? '🛰 OUTDOOR GPS' : '📶 INDOOR SENSOR'}</Text>
            </View>
          )}
        </View>
      </View>

      {rankedPlayers.length > 0 && (
        <View style={[styles.leaderboardWidget, { top: topBarHeight }]} pointerEvents="none">
          <Text style={styles.leaderboardTitle}>LEADERBOARD</Text>
          {rankedPlayers.slice(0, 4).map((p, idx) => (
            <View key={p.slot} style={[styles.leaderboardRow, p.slot === mySlot && styles.leaderboardRowMe]}>
              <Text style={styles.leaderboardRank}>{idx === 0 ? '👑' : `#${idx + 1}`}</Text>
              <Text style={styles.leaderboardName} numberOfLines={1}>
                {p.name}
                {idx === 0 && <Text style={styles.crownLabel}> CROWN MASTER</Text>}
                {p.slot === mySlot && <Text style={styles.youLabel}> (You)</Text>}
              </Text>
              <Text style={styles.leaderboardScore}>{p.score.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      {popups.map((popup) => (
        <ScorePopup
          key={popup.id}
          popup={popup}
          onDone={() => setPopups((prev) => prev.filter((p) => p.id !== popup.id))}
        />
      ))}

      {missPopups.map((miss) => (
        <MissPopup
          key={miss.id}
          miss={miss}
          onDone={() => setMissPopups((prev) => prev.filter((p) => p.id !== miss.id))}
        />
      ))}

      <View style={styles.controlDeck}>
        <TouchableOpacity onPress={onExit} style={styles.fleeBtn}>
          <Text style={styles.fleeBtnText}>← RADAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { ...StyleSheet.absoluteFillObject, backgroundColor: '#04060a' },
  videoScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,6,10,0.35)' },
  threeLayer: { ...StyleSheet.absoluteFillObject },

  cameraErrorOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d111a', padding: 30 },
  errorTitle: { color: '#ff4d4d', fontWeight: '900', fontSize: 16, textAlign: 'center' },

  vacuumFlashLabel: { position: 'absolute', top: '45%', left: 0, right: 0, alignItems: 'center', zIndex: 200 },
  vacuumFlashText: { fontSize: 30, fontWeight: '900', color: '#39ff88', textAlign: 'center' },

  blindAttackOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,40,10,0.6)' },

  alignmentBarWrap: { position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center' },
  alignmentBar: { width: '86%', height: 2, backgroundColor: 'rgba(255,255,255,0.75)' },
  alignmentBarLabel: { marginTop: 6, color: 'rgba(255,255,255,0.85)', fontSize: 10, letterSpacing: 1.5 },

  glitchBanner: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#c21f1f', paddingVertical: 9, paddingHorizontal: 10, zIndex: 60 },
  glitchBannerText: { color: '#fff', fontWeight: '800', fontSize: 12, textAlign: 'center', letterSpacing: 1 },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(6,10,18,0.85)', padding: 12, zIndex: 30 },
  topBarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  topBarHeaderText: { color: '#ffbe1a', fontWeight: '700', fontSize: 11, letterSpacing: 1.5, marginLeft: 6 },
  scanDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ffbe1a' },
  telemetryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  telemetryTag: { backgroundColor: 'rgba(10,16,30,0.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 7, paddingVertical: 6, paddingHorizontal: 12 },
  telemetryTagText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  ptsTag: { flexDirection: 'row', backgroundColor: 'rgba(10,16,30,0.85)', borderWidth: 1, borderColor: 'rgba(255,190,26,0.4)', borderRadius: 7, paddingVertical: 6, paddingHorizontal: 12 },
  ptsNumber: { color: '#ffe066', fontWeight: '900', fontSize: 13 },
  ptsTagText: { color: '#ffbe1a', fontWeight: '700', fontSize: 11 },

  leaderboardWidget: { position: 'absolute', right: 14, width: 210, backgroundColor: 'rgba(8,12,22,0.92)', borderWidth: 1.5, borderColor: '#ffbe1a', borderRadius: 10, padding: 10, zIndex: 30 },
  leaderboardTitle: { color: '#ffbe1a', fontWeight: '800', fontSize: 11, letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 6, padding: 6, marginBottom: 5, backgroundColor: 'rgba(255,255,255,0.04)' },
  leaderboardRowMe: { borderWidth: 1, borderColor: 'rgba(255,140,0,0.45)' },
  leaderboardRank: { fontSize: 13, width: 20, textAlign: 'center' },
  leaderboardName: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '600' },
  crownLabel: { color: '#ffbe1a', fontSize: 9, fontWeight: '800' },
  youLabel: { color: '#ff9d3f', fontSize: 10, fontWeight: '700' },
  leaderboardScore: { color: '#39ff88', fontWeight: '800', fontSize: 12 },

  lockLayer: { ...StyleSheet.absoluteFillObject, zIndex: 25 },
  bracketWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  bracketCorner: { position: 'absolute', width: '26%', height: '26%', borderColor: '#fff' },
  bracketTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  bracketTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bracketBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bracketBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  bracketLabel: { position: 'absolute', bottom: -18, fontSize: 8.5, fontWeight: '800', letterSpacing: 0.5 },

  controlDeck: { position: 'absolute', top: 14, left: 14, zIndex: 50 },
  fleeBtn: { backgroundColor: 'rgba(255,63,52,0.92)', borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 },
  fleeBtnText: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },

  scoreBurstWrapper: { position: 'absolute', top: '20%', left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
  securedFlashTag: { fontSize: 20, fontWeight: '900', color: '#ffbe1a', letterSpacing: 2, marginBottom: 4 },
  perfectTag: { fontSize: 16, fontWeight: '900', color: '#3cd6ff', letterSpacing: 2, marginBottom: 2 },
  bigScoreLabel: { fontSize: 60, fontWeight: '900', color: '#ffbe1a', letterSpacing: 2 },
  speciesTextCard: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 1, marginTop: 4 },
  shareBtn: { marginTop: 14, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 2, borderColor: '#ffbe1a', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20 },
  shareBtnText: { color: '#ffbe1a', fontWeight: 'bold', fontSize: 12 },

  missBurstWrapper: { position: 'absolute', top: '35%', left: 0, right: 0, alignItems: 'center', zIndex: 999 },
  missLabel: { fontSize: 28, fontWeight: '800', color: '#ff6b5e', letterSpacing: 1.5 },
});
