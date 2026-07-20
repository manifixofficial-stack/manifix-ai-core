// src/components/GameCanvas.jsx
//
// THIS REVISION — AR bridge readiness (patch I):
//
//   Adds three new OPTIONAL props so this component is ready to consume
//   real plane-detection/occlusion data the moment a native AR bridge
//   (Capacitor + ARKit/ARCore plugin, or a paid SDK) exists — without
//   requiring any further GameCanvas.jsx changes when that bridge lands.
//   Every one of these defaults to "off", and with all three omitted
//   this component behaves EXACTLY as before this patch — same fixed
//   floor, same full always-visible target list. Nothing regresses for
//   builds that never wire a native bridge.
//
//   - arGroundY (number | null, default null): a single detected
//     real-world floor height, in the same scene-unit space GameCanvas
//     already uses for worldY. When present, every veggie's floor
//     locks to this instead of the hardcoded
//     `-CAMERA_EYE_HEIGHT_METERS` constant. This is the JS-side landing
//     spot for a future WebXR hit-test result or a native ARKit/ARCore
//     plane's Y coordinate, bridged in by whatever plugin eventually
//     supplies it — GameCanvas doesn't care where the number comes
//     from, only that it's a real detected height instead of a guess.
//
//   - arAnchors ({ [vegId]: { y: number } }, default {}): optional
//     PER-VEGGIE override, for when detection is precise enough to
//     anchor each veggie to its own specific surface point rather than
//     one shared flat floor (e.g. one veggie on a table, another on
//     the ground beside it). Takes priority over arGroundY for any
//     veggie it covers; veggies not listed fall through to arGroundY,
//     which itself falls through to the old fixed constant.
//
//   - arOcclusion ({ [vegId]: boolean }, default {}): from a future
//     depth-occlusion bridge — true means a real-world object is
//     currently between the camera and that veggie. An occluded veggie:
//       1. Has its 3D model hidden (group.visible = false — physics/AI
//          keeps running underneath so it doesn't desync or teleport
//          when it reappears, only the render is suppressed).
//       2. Is dropped from the lock-on bracket UI (lockLayer).
//       3. Is dropped from CaptureThrow's targets list entirely, so a
//          throw literally cannot register a hit on it — matching real
//          ARKit/ARCore occlusion, where a hidden object can't be
//          aimed at until the player physically moves for a clear line
//          of sight.
//     The "LOCKS: N IN SIGHT" telemetry tag now counts only
//     non-occluded targets, since an occluded veggie isn't actually
//     "in sight".
//
//   A small "🟢 AR ANCHORED" telemetry tag appears whenever arGroundY is
//   non-null, purely as a debugging/QA signal that the native bridge is
//   actually feeding real data through — easy to spot at a glance during
//   on-device testing versus the fallback fixed floor.
//
// On top of the previous revision (idle-stand visual wiring, the
// 'round_timeout' -> 'round-timeout' event-name fix, and removal of the
// dead 'submit-round-score' emit) — all of that is UNCHANGED below.

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import CaptureThrow from './CaptureThrow';
import Veggie3DModel from '../components/veggies/VeggieModel';
import {
  AR_TRIGGER_DISTANCE_METERS,
  CATCH_TRIGGER_DISTANCE_METERS,
  MODEL_BASE_SCALE,
  GLITCH_TARGET_SCALE_MULTIPLIER,
  CAMERA_EYE_HEIGHT_METERS,
  RARITY_BY_SPECIES,
  PERSONALITY_CHASE_OVERRIDE,
} from '../config/gameConfig';
import Leaderboard from './Leaderboard';
import CollectionBook, { recordCatch } from './CollectionBook';
import { useVeggieEvasion } from '../hooks/useVeggieEvasion';

const EARTH_RADIUS_M = 6371000;
const FOV_ANGLE_DEG = 60;
const CATCH_ME_TAUNT_DISTANCE_M = 8;

const MIN_SCENE_DEPTH = 1.6;
const MAX_SCENE_DEPTH = 11;
const METERS_TO_SCENE_DIVISOR = 5;
const MAX_PITCH_DEG = 60;

const FALLBACK_SESSION_SECONDS = 55;
const TIMER_SECONDS_BY_MODE = { indoor: 45, outdoor: 60 };

const LOCK_RADIUS_PX = 80;

const TOTAL_ROUNDS = 3;
const ROUND_POINT_TIERS = { 1: 100, 2: 300, 3: 600 };
const GLITCH_ROUND_POINTS = 1000;
const VACUUM_WINDOW_MS = 1200;

const CAPTURE_RESULT_TIMEOUT_MS = 3500;

const RUN_AMPLITUDE = 1.8;
const RUN_SPEED = 2;
const JUMP_SCARE_DELAY_MS = 4500;
const JUMP_SCARE_DURATION_MS = 900;

const GLITCH_SPEED_MULTIPLIER = 3.0;

const RETICLE_SNAPSHOT_INTERVAL_MS = 100;

const KNOWN_VEGGIE_SPECIES = ['tomato', 'broccoli', 'golden', 'banana', 'grapes', 'strawberry'];

const LEADERBOARD_TOP_GAP_PX = 10;

// --- Blinding counter-attack ---
const BLIND_ATTACK_DURATION_MS = 1400;
const BLIND_ATTACK_COOLDOWN_MS = 3000;
const REAL_MISS_LABELS = ['TOO FAR', 'NOT AIMED', 'NEAR MISS', 'BREAKOUT'];

function detectMobileCapable() {
  if (typeof window === 'undefined') return true;
  const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
  const hasOrientation = typeof DeviceOrientationEvent !== 'undefined';
  return hasTouch && hasOrientation;
}

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

function distanceMeters(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
  const dLat = toRad(lat2 - lat1); const dLng = toRad(lng2 - lng1);
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

function CameraPitchRig({ pitchDeg }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.rotation.x = toRad(-pitchDeg);
  });
  return null;
}

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

function seedFromId(id) {
  let h = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 1000) / 1000 * Math.PI * 2;
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
  isOccluded,
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
      // PATCH I: use this node's resolved AR floor (real per-veggie
      // anchor, or the real detected ground plane, or the old fixed
      // constant — see rawTargetNodes below for the resolution order)
      // instead of a single hardcoded constant every veggie shared.
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
    // PATCH I: `visible` toggles purely the render — processEvasionFrame
    // above still runs every frame regardless, via useFrame, so an
    // occluded veggie keeps moving/evading underneath and won't jump or
    // desync the instant it's no longer blocked by a real object.
    <group ref={groupRef} visible={!isOccluded}>
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

export default function GameCanvas({
  connectionStatus = 'idle', roomCode = '', playerId = null, mySlot = 'oggy-blue',
  selfPosition = null, deviceHeading = 0, players = {}, veggies = {}, matchPhase = null,
  initialTimingMode = null,
  targetVegId = null,
  // PATCH I: new optional AR-bridge props — all default to "off", full
  // fallback to pre-patch behavior. See file-header note for details.
  arGroundY = null,
  arAnchors = {},
  arOcclusion = {},
  onExit
}) {
  const [isMobileCapable] = useState(detectMobileCapable);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraState, setCameraState] = useState('initializing');
  const [windowDims, setWindowDims] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [popups, setPopups] = useState([]);
  const [missPopups, setMissPopups] = useState([]);
  const [caughtIds, setCaughtIds] = useState(() => new Set());
  const [captureResolutions, setCaptureResolutions] = useState([]);
  const [devicePitch, setDevicePitch] = useState(0);

  const [collectionOpen, setCollectionOpen] = useState(false);

  const [blindAttack, setBlindAttack] = useState(null);
  const blindCooldownRef = useRef(new Map());

  const topBarRef = useRef(null);
  const [leaderboardTop, setLeaderboardTop] = useState(96);

  useEffect(() => {
    const node = topBarRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect?.height ?? node.offsetHeight;
        setLeaderboardTop(Math.ceil(h + LEADERBOARD_TOP_GAP_PX));
      }
    });
    observer.observe(node);
    setLeaderboardTop(Math.ceil(node.offsetHeight + LEADERBOARD_TOP_GAP_PX));
    return () => observer.disconnect();
  }, []);

  const [motionPermission, setMotionPermission] = useState(() => {
    const needsPrompt = typeof DeviceOrientationEvent !== 'undefined'
      && typeof DeviceOrientationEvent.requestPermission === 'function';
    return needsPrompt ? 'pending' : 'granted';
  });

  const requestMotionPermission = useCallback(async () => {
    try {
      const result = await DeviceOrientationEvent.requestPermission();
      setMotionPermission(result === 'granted' ? 'granted' : 'denied');
    } catch {
      setMotionPermission('denied');
    }
  }, []);

  const timerBaseSeconds = TIMER_SECONDS_BY_MODE[initialTimingMode] ?? FALLBACK_SESSION_SECONDS;
  const [secondsLeft, setSecondsLeft] = useState(timerBaseSeconds);

  const [matchRound, setMatchRound] = useState(1);
  const [isGlitched, setIsGlitched] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

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

  useEffect(() => {
    const handleResize = () => setWindowDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => clearTimeout(attemptTimeoutRef.current);
  }, []);

  const currentRoundPoints = isGlitched ? GLITCH_ROUND_POINTS : (ROUND_POINT_TIERS[matchRound] ?? ROUND_POINT_TIERS[1]);

  const submitRoundScore = useCallback(() => {
    if (scoreSubmitted) return;
    setScoreSubmitted(true);
  }, [scoreSubmitted]);

  const advanceRound = useCallback(() => {
    setMatchRound((prevRound) => {
      if (prevRound >= TOTAL_ROUNDS) {
        submitRoundScore();
        setTimeout(() => onExit?.(), 400);
        return prevRound;
      }
      const nextRound = prevRound + 1;
      setSecondsLeft(timerBaseSeconds);
      setVacuumLock(null);
      timerFrozenRef.current = false;
      lockedSinceRef.current.clear();
      setJumpScaredIds(new Set());
      return nextRound;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitRoundScore, timerBaseSeconds, onExit]);

  useEffect(() => {
    if (matchRound === TOTAL_ROUNDS) {
      setIsGlitched(true);
    }
  }, [matchRound]);

  useEffect(() => {
    setSecondsLeft(timerBaseSeconds);
    const intervalId = setInterval(() => {
      if (timerFrozenRef.current) return;
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          advanceRound();
          return timerBaseSeconds;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerBaseSeconds]);

  useEffect(() => {
    if (!isMobileCapable) return undefined;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setCameraState('ready');
        }
      } catch { setCameraState('denied'); }
    }
    startCamera();
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, [isMobileCapable]);

  useEffect(() => {
    if (!isMobileCapable) return undefined;
    if (motionPermission !== 'granted') return undefined;
    function handleOrientation(e) {
      if (e.beta == null) return;
      const tilt = e.beta - 90;
      setDevicePitch(Math.max(-MAX_PITCH_DEG, Math.min(MAX_PITCH_DEG, tilt)));
    }
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, [isMobileCapable, motionPermission]);

  useEffect(() => {
    if (!isMobileCapable) return undefined;
    if (!window.socket) return undefined;
    const socket = window.socket;

    const handleCaughtBroadcast = (data) => {
      if (!data) return;

      if (data.vegId) {
        setCaughtIds((prev) => {
          const next = new Set(prev);
          next.add(data.vegId);
          return next;
        });
      }

      if (data.playerId !== socket.id) return;

      if (data.species) {
        recordCatch(data.species);
      }

      const newPopup = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: `+${data.points ?? 0}`,
        speciesName: (data.species || 'CAUGHT').toUpperCase(),
        isPerfect: data.quality === 'perfect',
      };
      setPopups((prev) => [...prev, newPopup]);
      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== newPopup.id));
      }, 3000);

      advanceRound();
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
        window.setTimeout(() => {
          timerFrozenRef.current = false;
          setVacuumLock((prev) => (prev?.targetId === resolution.vegId ? null : prev));
        }, VACUUM_WINDOW_MS);
      } else {
        timerFrozenRef.current = false;
        const newMiss = { id: resolution.id, text: label };
        setMissPopups((prev) => [...prev, newMiss]);
        setTimeout(() => {
          setMissPopups((prev) => prev.filter((p) => p.id !== newMiss.id));
        }, 1400);

        const vegId = resolution.vegId;
        if (vegId && REAL_MISS_LABELS.includes(label)) {
          const now = Date.now();
          const nextEligible = blindCooldownRef.current.get(vegId) || 0;
          if (now >= nextEligible) {
            blindCooldownRef.current.set(vegId, now + BLIND_ATTACK_COOLDOWN_MS);
            setBlindAttack({ id: vegId, startedAt: now });
            window.setTimeout(() => {
              setBlindAttack((prev) => (prev?.id === vegId && prev.startedAt === now ? null : prev));
            }, BLIND_ATTACK_DURATION_MS);
          }
        }
      }
    };

    const handleRoundTimeout = (data) => {
      if (data?.roomCode && roomCode && data.roomCode !== roomCode) return;
      advanceRound();
    };

    socket.on('veggieCaught', handleCaughtBroadcast);
    socket.on('capture-result', handleCaptureResult);
    socket.on('round-timeout', handleRoundTimeout);
    return () => {
      socket.off('veggieCaught', handleCaughtBroadcast);
      socket.off('capture-result', handleCaptureResult);
      socket.off('round-timeout', handleRoundTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobileCapable, roomCode, advanceRound]);

  // PATCH I: per-node floor resolution order —
  //   1. arAnchors[id].y       (most precise: this specific veggie's own
  //                             detected surface point)
  //   2. arGroundY              (one shared detected floor for the whole
  //                             scene)
  //   3. -CAMERA_EYE_HEIGHT_METERS (old fixed fallback — unchanged
  //                             behavior when no AR bridge is connected)
  const rawTargetNodes = useMemo(() => {
    if (!selfPosition || !veggies || typeof veggies !== 'object') return [];
    const projectedList = [];

    Object.entries(veggies).forEach(([id, node]) => {
      if (!node || node.lat == null || node.lng == null) return;
      const dist = distanceMeters(selfPosition.lat, selfPosition.lng, node.lat, node.lng);
      if (dist > AR_TRIGGER_DISTANCE_METERS) return;

      const bearing = bearingDegrees(selfPosition.lat, selfPosition.lng, node.lat, node.lng);
      const relAngle = ((bearing - deviceHeading + 540) % 360) - 180;

      if (Math.abs(relAngle) <= FOV_ANGLE_DEG / 2) {
        const relAngleRad = toRad(relAngle);
        const sceneDepth = metersToSceneDepth(dist);

        const worldX = Math.sin(relAngleRad) * sceneDepth;
        const worldZ = -Math.cos(relAngleRad) * sceneDepth;
        const resolvedFloorY = arAnchors?.[id]?.y ?? (arGroundY != null ? arGroundY : -CAMERA_EYE_HEIGHT_METERS);

        projectedList.push({
          id,
          position: [worldX, resolvedFloorY, worldZ],
          floorY: resolvedFloorY,
          facing: -relAngleRad,
          species: (node.species || node.type || KNOWN_VEGGIE_SPECIES[0]).toLowerCase(),
          teamColor: node.teamColor || 'yellow',
          distance: dist,
          isGolden: (node.species || node.type) === 'golden',
          runSeed: seedFromId(id),
        });
      }
    });

    return projectedList;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [veggies, selfPosition, deviceHeading, arGroundY, arAnchors]);

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

  // PATCH I: occluded veggies never make it into captureTargets — no
  // lock-on bracket, and CaptureThrow can't register a direct hit or a
  // nearest-target fallback hit on something not in this list.
  const captureTargets = useMemo(() => {
    return targetNodes
      .filter((node) => !arOcclusion[node.id])
      .map((node) => {
        const live = liveVeggieSnapshot[node.id];
        const x = live ? live.x : node.position[0];
        const z = live ? live.z : node.position[2];
        const worldY = live ? live.worldY : node.position[1];
        const fleaRadius = live?.fleaRadius;
        const projected = projectToScreen([x, worldY, z], windowDims.w, windowDims.h, FOV_ANGLE_DEG, fleaRadius);
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
  }, [targetNodes, liveVeggieSnapshot, windowDims, arOcclusion]);

  const lockRings = useMemo(() => {
    const cx = windowDims.w / 2;
    const cy = windowDims.h / 2;
    return captureTargets.map((t) => {
      const dx = t.x - cx;
      const dy = t.y - cy;
      const distToCenter = Math.sqrt(dx * dx + dy * dy);
      const inRealRange = t.distance <= CATCH_TRIGGER_DISTANCE_METERS;
      const locked = distToCenter <= LOCK_RADIUS_PX && inRealRange;
      const fill = Math.max(0, Math.min(1, 1 - distToCenter / (LOCK_RADIUS_PX * 3)));
      const vacuuming = vacuumLock?.targetId === t.id;
      const jumpScared = jumpScaredIds.has(t.id);
      return { ...t, locked, inRealRange, fill, vacuuming, jumpScared };
    });
  }, [captureTargets, windowDims, vacuumLock, jumpScaredIds]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const stillLockedIds = new Set(lockRings.filter((r) => r.locked && !r.vacuuming).map((r) => r.id));

      for (const id of stillLockedIds) {
        if (!lockedSinceRef.current.has(id)) {
          lockedSinceRef.current.set(id, now);
        }
      }
      for (const id of Array.from(lockedSinceRef.current.keys())) {
        if (!stillLockedIds.has(id)) lockedSinceRef.current.delete(id);
      }

      stillLockedIds.forEach((id) => {
        const lockedSince = lockedSinceRef.current.get(id);
        if (lockedSince != null && now - lockedSince >= JUMP_SCARE_DELAY_MS) {
          setJumpScaredIds((prev) => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            return next;
          });
          lockedSinceRef.current.set(id, now);
          window.setTimeout(() => {
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
    if (targetNode && targetNode.distance > CATCH_TRIGGER_DISTANCE_METERS) {
      return;
    }
    // PATCH I: redundant safety net — captureTargets already excludes
    // occluded ids so CaptureThrow shouldn't be able to dispatch one at
    // all, but this guards against a stale/cached target slipping
    // through a race between an occlusion update and an in-flight throw.
    if (arOcclusion[id]) {
      return;
    }

    timerFrozenRef.current = true;
    lockedSinceRef.current.delete(id);
    setJumpScaredIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    clearTimeout(attemptTimeoutRef.current);
    attemptTimeoutRef.current = window.setTimeout(() => {
      timerFrozenRef.current = false;
    }, CAPTURE_RESULT_TIMEOUT_MS);

    window.socket?.emit('capture-attempt', { vegId: id, quality });
  }, [targetNodes, arOcclusion]);

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

  // PATCH I: "in sight" should mean actually visible — an occluded
  // veggie is present in the room but not something the player can
  // currently see or aim at, so it no longer inflates this count.
  const visibleTargetCount = useMemo(
    () => targetNodes.filter((n) => !arOcclusion[n.id]).length,
    [targetNodes, arOcclusion]
  );

  if (!isMobileCapable) {
    return (
      <div style={styles.desktopBlockWrap}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@500;600&display=swap');
        `}</style>
        <div style={styles.desktopBlockIcon}>📵</div>
        <h2 style={styles.desktopBlockTitle}>MOBILE DEVICE REQUIRED</h2>
        <p style={styles.desktopBlockBody}>
          This is an AR game — it needs your phone's rear camera, compass, and GPS
          to place vegetables in the real world around you. None of that exists on
          a desktop or laptop browser.
        </p>
        <p style={styles.desktopBlockSub}>
          Open this page on your phone (Chrome or Safari) instead — no app install needed.
        </p>
        {onExit && (
          <button onClick={onExit} style={styles.fleeBtn}>GO BACK</button>
        )}
      </div>
    );
  }

  return (
    <div style={{ ...styles.viewport, ...(isGlitched ? styles.viewportShaking : {}) }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800;900&family=Rajdhani:wght@500;600;700&display=swap');

        @keyframes popupTextAnimation {
          0% { opacity: 0; transform: translate(-50%, -30%) scale(0.7); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
          30% { transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -70%) scale(1); }
        }
        @keyframes missTextAnimation {
          0% { opacity: 0; transform: translate(-50%, -30%) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          75% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -60%) scale(0.95); }
        }
        @keyframes securedFlash {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.6) rotate(-4deg); }
          25% { opacity: 1; transform: translate(-50%, -50%) scale(1.12) rotate(2deg); }
          40% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          85% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9) rotate(0deg); }
        }
        @keyframes timerPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        @keyframes mePulse {
          0%, 100% { box-shadow: 0 0 0 rgba(255,140,0,0.0); background: rgba(255,140,0,0.14); }
          50% { box-shadow: 0 0 14px rgba(255,140,0,0.55); background: rgba(255,140,0,0.24); }
        }
        @keyframes glitchPanic {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2px, 1px); }
          20% { transform: translate(2px, -1px); }
          30% { transform: translate(-1px, 2px); }
          40% { transform: translate(1px, -2px); }
          50% { transform: translate(-2px, -1px); }
          60% { transform: translate(2px, 1px); }
          70% { transform: translate(-1px, -2px); }
          80% { transform: translate(1px, 2px); }
          90% { transform: translate(-2px, 0); }
        }
        @keyframes glitchBannerDrop {
          0% { transform: translateY(-100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes glitchTextFlicker {
          0%, 100% { opacity: 1; }
          45% { opacity: 1; }
          47% { opacity: 0.3; }
          49% { opacity: 1; }
          72% { opacity: 1; }
          74% { opacity: 0.2; }
          76% { opacity: 1; }
        }
        @keyframes maxSuctionPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.08); }
        }
        @keyframes blindAttackPulse {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>

      {cameraState === 'denied' ? (
        <div style={styles.cameraErrorOverlay}><h3>CAMERA ACCESS REJECTED</h3></div>
      ) : (
        <video ref={videoRef} autoPlay playsInline muted style={styles.videoBackdrop} />
      )}
      <div style={styles.videoScrim} />

      {blindAttack && (
        <div
          style={{
            ...styles.blindAttackOverlay,
            animation: 'blindAttackPulse 0.3s ease-out',
          }}
        />
      )}

      {motionPermission === 'pending' && (
        <div style={styles.cameraErrorOverlay}>
          <h3>ENABLE AR SENSORS</h3>
          <p style={{ marginBottom: 16, maxWidth: 280 }}>
            Tap below to allow compass &amp; motion access — needed to lock veggies to their real-world positions.
          </p>
          <button style={styles.fleeBtn} onClick={requestMotionPermission}>
            ENABLE MOTION ACCESS
          </button>
        </div>
      )}

      {myMode === 'indoor' && (
        <div style={styles.alignmentBarWrap}>
          <div style={styles.alignmentBar} />
          <div style={styles.alignmentBarLabel}>ALIGN DEVICE TO CENTER LINE</div>
        </div>
      )}

      <Canvas
        style={styles.threeLayer}
        dpr={[1, Math.min(window.devicePixelRatio || 1, 2)]}
        camera={{ position: [0, 0, 0], fov: FOV_ANGLE_DEG, near: 0.1, far: 100 }}
        gl={{
          alpha: true,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        <CameraPitchRig pitchDeg={devicePitch} />
        <Environment preset="apartment" background={false} />
        <hemisphereLight skyColor="#ffffff" groundColor="#4a4a4a" intensity={0.5} />
        <directionalLight position={[3, 6, 4]} intensity={1.8} />
        <ambientLight intensity={0.45} />

        {targetNodes.map((node) => {
          const isThisGlitchTarget = isGlitched && node.id === glitchTargetId;
          const isThisOccluded = !!arOcclusion[node.id];
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
              isOccluded={isThisOccluded}
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

      <div style={styles.lockLayer}>
        {lockRings.map((ring) => {
          const color = ring.vacuuming ? '#ffbe1a' : ring.locked ? '#39ff6e' : '#ff3b3b';
          const size = ring.radius * 2.6;
          const distLabel = `${ring.species.toUpperCase()} ${(ring.distance).toFixed(1)}m`;
          return (
            <div
              key={`bracket-${ring.id}`}
              style={{
                ...styles.bracketWrap,
                left: ring.x,
                top: ring.y,
                width: size,
                height: size,
                ...(ring.jumpScared ? { animation: 'timerPulse 0.15s ease-in-out infinite' } : {}),
              }}
            >
              <div style={{ ...styles.bracketCorner, ...styles.bracketTL, borderColor: color }} />
              <div style={{ ...styles.bracketCorner, ...styles.bracketTR, borderColor: color }} />
              <div style={{ ...styles.bracketCorner, ...styles.bracketBL, borderColor: color }} />
              <div style={{ ...styles.bracketCorner, ...styles.bracketBR, borderColor: color }} />

              {ring.vacuuming ? (
                <div style={{ ...styles.bracketLabel, color: '#ffbe1a', animation: 'maxSuctionPulse 0.35s ease-in-out infinite' }}>
                  MAX SUCTION
                </div>
              ) : ring.locked ? (
                <div style={{ ...styles.bracketLabel, color: '#39ff6e' }}>
                  LOCK TARGET ENGAGED · {distLabel}
                </div>
              ) : !ring.inRealRange ? (
                <div style={{ ...styles.bracketLabel, color: '#ff8f85' }}>
                  GET CLOSER · {distLabel}
                </div>
              ) : (
                <div style={{ ...styles.bracketLabel, color: '#ff8f85' }}>
                  {distLabel}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CaptureThrow
        targets={captureTargets}
        onAttempt={handleCaptureAttempt}
        captureResolutions={captureResolutions}
        disabled={cameraState !== 'ready'}
        screenW={windowDims.w}
        screenH={windowDims.h}
      />

      {isGlitched && (
        <div style={styles.glitchBanner}>
          <span style={{ animation: 'glitchTextFlicker 2.4s infinite' }}>
            ⚠️ AREA OVERLOAD — TARGET VALUE EXPLODED TO {GLITCH_ROUND_POINTS} PTS ⚠️
          </span>
        </div>
      )}

      <div ref={topBarRef} style={styles.topBar}>
        <div style={styles.topBarHeader}>
          <span style={styles.scanDot} />
          SATELLITE SCANNING AREA
        </div>
        <div style={styles.telemetryRow}>
          <div style={styles.ptsTag}>
            <span style={styles.ptsNumber}>{myScore.toLocaleString()}</span> PTS
          </div>
          <div style={styles.telemetryTag}>
            ARENA: <span style={{ color: '#00e5e5' }}>{roomCode || 'LOCAL'}</span>
          </div>
          <div style={styles.telemetryTag}>
            ROUND: <span style={{ color: '#c084fc' }}>{matchRound}/{TOTAL_ROUNDS}</span>
          </div>
          <div style={{ ...styles.telemetryTag, ...(isGlitched ? { borderColor: 'rgba(255,190,26,0.7)' } : {}) }}>
            TIER: <span style={{ color: isGlitched ? '#ffbe1a' : '#39ff88' }}>{currentRoundPoints} PTS</span>
          </div>
          <div style={styles.telemetryTag}>
            COMPASS: <span style={{ color: '#39ff88' }}>{Math.round(deviceHeading)}°</span>
          </div>
          <div
            style={{
              ...styles.telemetryTag,
              animation: secondsLeft <= 10 ? 'timerPulse 0.6s ease-in-out infinite' : 'none',
            }}
          >
            TIME: <span style={{ color: timerColor, fontWeight: 900 }}>{vacuumLock ? '⏸' : secondsLeft}s</span>
          </div>
          <div style={styles.telemetryTag}>
            LOCKS: <span style={{ color: '#ffbe1a' }}>{visibleTargetCount} IN SIGHT</span>
          </div>
          {myMode && (
            <div style={styles.telemetryTag}>
              {myMode === 'gps' ? '🛰 OUTDOOR GPS' : '📶 INDOOR SENSOR'}
            </div>
          )}
          {arGroundY != null && (
            <div style={{ ...styles.telemetryTag, borderColor: 'rgba(57,255,136,0.5)' }}>
              🟢 AR ANCHORED
            </div>
          )}
          <button
            style={styles.collectionBtn}
            onClick={() => setCollectionOpen(true)}
          >
            📖 COLLECTION
          </button>
        </div>
      </div>

      {rankedPlayers.length > 0 && (
        <div style={{ ...styles.leaderboardWidget, top: leaderboardTop }}>
          <div style={styles.leaderboardTitle}>LEADERBOARD</div>
          {rankedPlayers.slice(0, 4).map((p, idx) => (
            <div
              key={p.slot}
              style={{
                ...styles.leaderboardRow,
                ...(p.slot === mySlot ? styles.leaderboardRowMe : {}),
              }}
            >
              <span style={styles.leaderboardRank}>
                {idx === 0 ? '👑' : `#${idx + 1}`}
              </span>
              <span style={styles.leaderboardName}>
                {p.name}
                {idx === 0 && <span style={styles.crownLabel}> CROWN MASTER</span>}
                {p.slot === mySlot && <span style={styles.youLabel}> (You)</span>}
              </span>
              <span style={styles.leaderboardScore}>{p.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {popups.map((popup) => (
        <div key={popup.id} style={styles.scoreBurstWrapper}>
          <div style={styles.securedFlashTag}>SECURED! 💥</div>
          {popup.isPerfect && <div style={styles.perfectTag}>PERFECT!</div>}
          <h1 style={styles.bigScoreLabel}>{popup.text}</h1>
          <h2 style={styles.speciesTextCard}>{popup.speciesName}</h2>
          <button
            style={styles.shareBtn}
            onClick={async () => {
              const shareText = `I just secured a ${popup.speciesName} and scored ${popup.text}! 🥕📸`;
              const shareUrl = window.location.origin;
              if (navigator.share) {
                try {
                  await navigator.share({ text: shareText, url: shareUrl });
                } catch {
                  // user cancelled the share sheet — no action needed
                }
              } else if (navigator.clipboard) {
                try {
                  await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                  alert('Copied! Paste it anywhere to share your catch.');
                } catch {
                  // clipboard write blocked — silently ignore, button just won't do anything
                }
              }
            }}
          >
            📤 SHARE
          </button>
        </div>
      ))}

      {missPopups.map((miss) => (
        <div key={miss.id} style={styles.missBurstWrapper}>
          <h1 style={styles.missLabel}>{miss.text}</h1>
        </div>
      ))}

      <div style={styles.controlDeck}>
        <button onClick={onExit} style={styles.fleeBtn}>← RADAR</button>
      </div>

      <CollectionBook open={collectionOpen} onClose={() => setCollectionOpen(false)} />
    </div>
  );
}

const FONT_HEADER = "'Orbitron', 'Rajdhani', monospace";
const FONT_BODY = "'Rajdhani', 'Orbitron', monospace";

const styles = {
  viewport: { position: 'absolute', inset: 0, zIndex: 10, background: '#04060a', display: 'flex', flexDirection: 'column', overflow: 'hidden', overflowX: 'hidden', userSelect: 'none', fontFamily: FONT_BODY, maxWidth: '100vw' },
  viewportShaking: { animation: 'glitchPanic 0.25s linear infinite' },
  videoBackdrop: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 },
  videoScrim: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,6,10,0.2) 0%, rgba(4,6,10,0.5) 100%)', zIndex: 1 },
  threeLayer: { position: 'absolute', inset: 0, zIndex: 20, background: 'transparent', pointerEvents: 'none' },
  cameraErrorOverlay: { position: 'absolute', inset: 0, zIndex: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d111a', color: '#ff4d4d', padding: '30px', textAlign: 'center' },

  desktopBlockWrap: { position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 30%, #101826 0%, #04060a 70%)', color: '#fff', padding: '40px 24px', textAlign: 'center', fontFamily: FONT_BODY },
  desktopBlockIcon: { fontSize: 48, marginBottom: 18, filter: 'drop-shadow(0 0 12px rgba(255,63,52,0.5))' },
  desktopBlockTitle: { fontFamily: FONT_HEADER, fontSize: 20, fontWeight: 900, letterSpacing: '2px', color: '#ffbe1a', margin: '0 0 14px 0', textShadow: '0 0 14px rgba(255,190,26,0.4)' },
  desktopBlockBody: { fontSize: 15, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)', maxWidth: 400, margin: '0 0 10px 0' },
  desktopBlockSub: { fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.55)', maxWidth: 380, margin: '0 0 26px 0' },

  blindAttackOverlay: {
    position: 'absolute', inset: 0, zIndex: 140,
    background: 'radial-gradient(ellipse at center, rgba(120,180,40,0.35) 0%, rgba(20,40,10,0.85) 75%)',
    backdropFilter: 'blur(6px)',
    pointerEvents: 'none',
  },

  alignmentBarWrap: { position: 'absolute', top: '50%', left: 0, right: 0, zIndex: 22, transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' },
  alignmentBar: { width: '86%', height: 2, background: 'rgba(255,255,255,0.75)', boxShadow: '0 0 10px rgba(255,255,255,0.6)' },
  alignmentBarLabel: { marginTop: 6, color: 'rgba(255,255,255,0.85)', fontFamily: FONT_HEADER, fontSize: 10, letterSpacing: '1.5px', textShadow: '0 0 6px rgba(0,0,0,0.8)' },

  glitchBanner: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 60, background: 'linear-gradient(90deg, #8a0000, #ff2b2b, #8a0000)', color: '#fff', fontFamily: FONT_HEADER, fontWeight: 800, fontSize: 12, letterSpacing: '1px', textAlign: 'center', padding: '9px 10px', boxShadow: '0 4px 18px rgba(255,0,0,0.5)', animation: 'glitchBannerDrop 0.4s ease-out', pointerEvents: 'none' },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, background: 'linear-gradient(180deg, rgba(6,10,18,0.92) 0%, rgba(6,10,18,0.55) 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px 12px', pointerEvents: 'none', boxSizing: 'border-box', maxWidth: '100%' },
  topBarHeader: { display: 'flex', alignItems: 'center', gap: '6px', color: '#ffbe1a', fontFamily: FONT_HEADER, fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '10px', textShadow: '0 0 8px rgba(255,190,26,0.4)' },
  scanDot: { width: 7, height: 7, borderRadius: '50%', background: '#ffbe1a', boxShadow: '0 0 8px 2px rgba(255,190,26,0.8)', animation: 'timerPulse 1.4s ease-in-out infinite' },
  telemetryRow: { display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', rowGap: '8px' },
  telemetryTag: { background: 'rgba(10, 16, 30, 0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '7px 14px', color: '#fff', fontFamily: FONT_HEADER, fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', whiteSpace: 'nowrap' },
  ptsTag: { background: 'rgba(10, 16, 30, 0.85)', border: '1px solid rgba(255,190,26,0.4)', borderRadius: '7px', padding: '7px 14px', color: '#ffbe1a', fontFamily: FONT_HEADER, fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', boxShadow: '0 0 12px rgba(255,190,26,0.18)', whiteSpace: 'nowrap' },
  ptsNumber: { color: '#ffe066', fontWeight: 900, fontSize: '13px' },
  collectionBtn: { background: 'rgba(10, 16, 30, 0.85)', border: '1px solid rgba(31,174,110,0.5)', borderRadius: '7px', padding: '7px 14px', color: '#39ff88', fontFamily: FONT_HEADER, fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', cursor: 'pointer', pointerEvents: 'auto', whiteSpace: 'nowrap' },

  leaderboardWidget: { position: 'absolute', right: 14, zIndex: 30, width: 210, maxWidth: 'calc(100vw - 28px)', background: 'rgba(8,12,22,0.92)', border: '1.5px solid #ffbe1a', borderRadius: '10px', padding: '10px 10px 8px', boxShadow: '0 0 16px rgba(255,190,26,0.2)', pointerEvents: 'none', transition: 'top 0.15s ease-out' },
  leaderboardTitle: { color: '#ffbe1a', fontFamily: FONT_HEADER, fontSize: '11px', fontWeight: 800, letterSpacing: '2px', marginBottom: '8px', textAlign: 'center' },
  leaderboardRow: { display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', padding: '6px 7px', marginBottom: '5px', background: 'rgba(255,255,255,0.04)' },
  leaderboardRowMe: { animation: 'mePulse 1.8s ease-in-out infinite', border: '1px solid rgba(255,140,0,0.45)' },
  leaderboardRank: { fontSize: '13px', width: '20px', textAlign: 'center' },
  leaderboardName: { flex: 1, color: '#fff', fontFamily: FONT_BODY, fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  crownLabel: { color: '#ffbe1a', fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px' },
  youLabel: { color: '#ff9d3f', fontSize: '10px', fontWeight: 700 },
  leaderboardScore: { color: '#39ff88', fontFamily: FONT_HEADER, fontSize: '12px', fontWeight: 800 },

  lockLayer: { position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none' },
  bracketWrap: { position: 'absolute', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  bracketCorner: { position: 'absolute', width: '26%', height: '26%', borderStyle: 'solid', borderWidth: 0 },
  bracketTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  bracketTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  bracketBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  bracketBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  bracketLabel: { position: 'absolute', bottom: -18, fontFamily: FONT_HEADER, fontSize: 8.5, fontWeight: 800, letterSpacing: '0.5px', whiteSpace: 'nowrap', textShadow: '0 0 6px rgba(0,0,0,0.8)' },

  controlDeck: { position: 'absolute', top: 14, left: 14, zIndex: 50 },
  fleeBtn: { background: 'rgba(255,63,52,0.92)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '999px', color: '#fff', fontFamily: FONT_HEADER, fontWeight: 800, fontSize: '11px', letterSpacing: '0.5px', padding: '9px 16px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,63,52,0.4)' },
  scoreBurstWrapper: { position: 'fixed', top: '25%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1000, pointerEvents: 'none', animation: 'popupTextAnimation 3s ease-out forwards' },
  securedFlashTag: { fontSize: '20px', fontWeight: '900', color: '#ffbe1a', fontFamily: FONT_HEADER, letterSpacing: '2px', textShadow: '2px 2px 0px #000, 0 0 16px rgba(255,190,26,0.8)', marginBottom: '4px', animation: 'securedFlash 0.9s ease-out' },
  perfectTag: { fontSize: '16px', fontWeight: '900', color: '#3cd6ff', fontFamily: FONT_HEADER, letterSpacing: '2px', textShadow: '2px 2px 0px #000, 0 0 12px rgba(60,214,255,0.7)', marginBottom: '2px' },
  bigScoreLabel: { fontSize: '72px', fontWeight: '900', color: '#ffbe1a', fontFamily: FONT_HEADER, margin: 0, textShadow: '4px 4px 0px #000, 0 0 30px rgba(255,190,26,0.6)', letterSpacing: '2px' },
  speciesTextCard: { fontSize: '32px', fontWeight: '800', color: '#fff', fontFamily: FONT_HEADER, margin: '4px 0 0 0', textShadow: '3px 3px 0px #000', letterSpacing: '1px' },
  shareBtn: { marginTop: 14, pointerEvents: 'auto', background: 'rgba(255,255,255,0.12)', border: '2px solid #ffbe1a', color: '#ffbe1a', fontFamily: FONT_HEADER, fontWeight: 'bold', fontSize: 12, padding: '8px 18px', borderRadius: 20, cursor: 'pointer', backdropFilter: 'blur(4px)' },
  missBurstWrapper: { position: 'fixed', top: '38%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 999, pointerEvents: 'none', animation: 'missTextAnimation 1.2s ease-out forwards' },
  missLabel: { fontSize: '30px', fontWeight: '800', color: '#ff6b5e', fontFamily: FONT_HEADER, margin: 0, textShadow: '2px 2px 0px #000, 0 0 14px rgba(255,80,60,0.5)', letterSpacing: '1.5px' },
};
