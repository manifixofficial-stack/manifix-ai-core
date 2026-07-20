// src/components/GameCanvas.jsx
//
// THIS REVISION — native-WebView AR fix + dedup + denied-state UI:
//
//   1. NEW isNative prop (forwarded from main.jsx -> App.jsx -> here).
//      Capacitor's Android WebView doesn't implement real WebXR
//      sessions — navigator.xr can exist and isSessionSupported can
//      even resolve true, but requestSession then fails or hangs with
//      no usable passthrough. The XR support-check effect now skips
//      straight to xrState='unsupported' when isNative is true, so the
//      "Start AR Hunt" button — which could never actually work inside
//      the app shell — is never shown there in the first place.
//   2. DUPLICATE RENDER BLOCK REMOVED: the xrState === 'idle' gate
//      screen was rendered twice back-to-back at identical position,
//      stacked directly on top of each other. Kept only the complete
//      version (with the "SKIP — USE BASIC CAMERA" fallback button).
//   3. requiredFeatures no longer includes 'local-floor' — if a device
//      supports immersive-ar + hit-test but not local-floor tracking
//      specifically, the ENTIRE session request was thrown away, not
//      just that one feature, silently dropping xrState to 'denied'
//      with no UI for that state at all. local-floor moved to
//      optionalFeatures.
//   4. NEW: a real 'denied' render branch, so a failed session request
//      is never invisible to the player — previously there was no UI
//      for it at all, which is indistinguishable from "button does
//      nothing."
//
// Everything else — real WebXR depth-sensing occlusion, ground
// anchoring, evasion AI hookup, capture-throw, glitch mode,
// leaderboard, popups, blind-attack, idle-stand wiring — is UNCHANGED
// from the prior revision.

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

const BLIND_ATTACK_DURATION_MS = 1400;
const BLIND_ATTACK_COOLDOWN_MS = 3000;
const REAL_MISS_LABELS = ['TOO FAR', 'NOT AIMED', 'NEAR MISS', 'BREAKOUT'];

const AR_GROUND_SYNC_INTERVAL_MS = 200;

const OCCLUSION_DEPTH_MARGIN_M = 0.15;
const OCCLUSION_SYNC_INTERVAL_MS = 150;

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

function gpsToLocalMeters(lat0, lng0, lat, lng) {
  const dLat = toRad(lat - lat0);
  const dLng = toRad(lng - lng0);
  const north = dLat * EARTH_RADIUS_M;
  const east = dLng * EARTH_RADIUS_M * Math.cos(toRad(lat0));
  return { east, north };
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

function projectWorldToScreenXR(worldVec3, camera, screenW, screenH, halfWidthUnits = APPROX_MODEL_HALF_WIDTH_SCENE_UNITS) {
  const p = worldVec3.clone().project(camera);
  if (p.z > 1 || p.z < -1) return null;

  const screenX = (p.x * 0.5 + 0.5) * screenW;
  const screenY = (1 - (p.y * 0.5 + 0.5)) * screenH;

  const dist = Math.max(0.05, camera.position.distanceTo(worldVec3));
  const vFovRad = toRad(camera.fov || FOV_ANGLE_DEG);
  const focalLengthPx = (screenH / 2) / Math.tan(vFovRad / 2);
  const radius = Math.max(MIN_SCREEN_HIT_RADIUS_PX, (halfWidthUnits / dist) * focalLengthPx);

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

function XRSessionBridge({ session, referenceSpaceType = 'local-floor', onEnded }) {
  const { gl } = useThree();
  useEffect(() => {
    if (!session) return undefined;
    let cancelled = false;

    gl.xr.enabled = true;
    try {
      gl.xr.setReferenceSpaceType(referenceSpaceType);
    } catch (err) {
      console.warn('[GameCanvas] setReferenceSpaceType failed, falling back to local', err);
      gl.xr.setReferenceSpaceType('local');
    }

    gl.xr.setSession(session).catch((err) => {
      if (!cancelled) console.error('[GameCanvas] gl.xr.setSession failed', err);
    });

    const handleEnd = () => onEnded?.();
    session.addEventListener('end', handleEnd);

    return () => {
      cancelled = true;
      session.removeEventListener('end', handleEnd);
      gl.xr.enabled = false;
    };
  }, [session, gl, referenceSpaceType, onEnded]);

  return null;
}

function ARGroundAnchor({ session, onGroundY }) {
  const { gl } = useThree();
  const hitTestSourceRef = useRef(null);
  const lastSyncRef = useRef(0);
  const gotFirstHitRef = useRef(false);

  useEffect(() => {
    if (!session) return undefined;
    let cancelled = false;

    session.requestReferenceSpace('viewer').then((viewerSpace) => {
      if (cancelled) return;
      session.requestHitTestSource({ space: viewerSpace }).then((source) => {
        if (!cancelled) hitTestSourceRef.current = source;
      }).catch((err) => {
        console.warn('[GameCanvas] requestHitTestSource failed — device may not support hit-test.', err);
      });
    }).catch((err) => {
      console.warn('[GameCanvas] requestReferenceSpace(viewer) failed', err);
    });

    return () => {
      cancelled = true;
      hitTestSourceRef.current = null;
      gotFirstHitRef.current = false;
    };
  }, [session]);

  useFrame((_, __, frame) => {
    if (!frame || !hitTestSourceRef.current) return;
    const refSpace = gl.xr.getReferenceSpace();
    if (!refSpace) return;

    const results = frame.getHitTestResults(hitTestSourceRef.current);
    if (results.length === 0) return;

    const pose = results[0].getPose(refSpace);
    if (!pose) return;

    const now = performance.now();
    if (!gotFirstHitRef.current || now - lastSyncRef.current > AR_GROUND_SYNC_INTERVAL_MS) {
      gotFirstHitRef.current = true;
      lastSyncRef.current = now;
      onGroundY(pose.transform.position.y);
    }
  });

  return null;
}

function ARDepthOcclusion({ session, targetNodesRef, liveVeggieRef, onOcclusionUpdate, onDepthSupportChange }) {
  const { gl, camera } = useThree();
  const lastSyncRef = useRef(0);
  const depthSupportedRef = useRef(null);
  const scratchVec = useRef(new THREE.Vector3());

  useEffect(() => {
    depthSupportedRef.current = null;
  }, [session]);

  useFrame((_, __, frame) => {
    if (!frame || typeof frame.getDepthInformation !== 'function') {
      if (depthSupportedRef.current !== false) {
        depthSupportedRef.current = false;
        onDepthSupportChange(false);
      }
      return;
    }

    const refSpace = gl.xr.getReferenceSpace();
    if (!refSpace) return;
    const pose = frame.getViewerPose(refSpace);
    if (!pose || pose.views.length === 0) return;

    const view = pose.views[0];
    let depthInfo;
    try {
      depthInfo = frame.getDepthInformation(view);
    } catch (err) {
      if (depthSupportedRef.current !== false) {
        depthSupportedRef.current = false;
        onDepthSupportChange(false);
      }
      return;
    }
    if (!depthInfo) return;

    if (depthSupportedRef.current !== true) {
      depthSupportedRef.current = true;
      onDepthSupportChange(true);
    }

    const now = performance.now();
    if (now - lastSyncRef.current < OCCLUSION_SYNC_INTERVAL_MS) return;
    lastSyncRef.current = now;

    const nodes = targetNodesRef.current;
    const live = liveVeggieRef.current;
    const nextOcclusion = {};

    for (const node of nodes) {
      const l = live[node.id];
      const wx = l?.x ?? node.position[0];
      const wy = l?.worldY ?? node.position[1];
      const wz = l?.z ?? node.position[2];

      scratchVec.current.set(wx, wy, wz);
      const projected = scratchVec.current.clone().project(camera);
      if (projected.z > 1 || projected.z < -1) continue;

      const nx = projected.x * 0.5 + 0.5;
      const ny = 1 - (projected.y * 0.5 + 0.5);
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) continue;

      let realDepthM;
      try {
        realDepthM = depthInfo.getDepthInMeters(nx, ny);
      } catch {
        continue;
      }
      if (!realDepthM || !Number.isFinite(realDepthM) || realDepthM <= 0) continue;

      const veggieDistM = camera.position.distanceTo(scratchVec.current);
      nextOcclusion[node.id] = realDepthM < veggieDistM - OCCLUSION_DEPTH_MARGIN_M;
    }

    onOcclusionUpdate(nextOcclusion);
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
  xrActive,
  screenW,
  screenH,
}) {
  const groupRef = useRef();
  const posRef = useRef({ x: node.position[0], z: node.position[2] });
  const seededRef = useRef(false);
  const worldVecRef = useRef(new THREE.Vector3());

  const { camera } = useThree();

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

    let screenProjection = null;
    if (xrActive && groupRef.current) {
      worldVecRef.current.set(posRef.current.x, result.worldY, posRef.current.z);
      groupRef.current.getWorldPosition(worldVecRef.current);
      screenProjection = projectWorldToScreenXR(worldVecRef.current, camera, screenW, screenH, result.fleaRadius);
    }

    onLiveUpdate(node.id, {
      x: posRef.current.x,
      z: posRef.current.z,
      worldY: result.worldY,
      fleaRadius: result.fleaRadius,
      state: result.state,
      screenX: screenProjection?.x,
      screenY: screenProjection?.y,
      screenRadius: screenProjection?.radius,
    });
  });

  return (
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
  arGroundY: arGroundYProp = null,
  arAnchors = {},
  arOcclusion = {},
  isNative = false,
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

  // ---- WebXR AR session state ----
  // 'checking' | 'unsupported' | 'idle' | 'requesting' | 'active' | 'denied'
  const [xrState, setXrState] = useState('checking');
  const [xrSession, setXrSession] = useState(null);
  const [internalArGroundY, setInternalArGroundY] = useState(null);
  const arOriginRef = useRef(null);

  const [internalArOcclusion, setInternalArOcclusion] = useState({});
  const [depthOcclusionSupported, setDepthOcclusionSupported] = useState(null);
  const targetNodesRef = useRef([]);

  const effectiveOcclusion = useMemo(
    () => ({ ...internalArOcclusion, ...arOcclusion }),
    [internalArOcclusion, arOcclusion]
  );

  const handleOcclusionUpdate = useCallback((next) => {
    setInternalArOcclusion(next);
  }, []);

  const xrActive = xrState === 'active' && !!xrSession;
  const effectiveGroundY = arGroundYProp != null ? arGroundYProp : internalArGroundY;

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

  // ---- detect WebXR immersive-ar support on mount ----
  // FIX: Capacitor's Android WebView doesn't implement real WebXR
  // sessions — skip straight to 'unsupported' there so the AR-gate
  // button, which could never actually work inside the app shell, is
  // never shown in the first place.
  useEffect(() => {
    if (!isMobileCapable) return undefined;

    if (isNative) {
      setXrState('unsupported');
      return undefined;
    }

    let cancelled = false;

    if (!navigator.xr || typeof navigator.xr.isSessionSupported !== 'function') {
      setXrState('unsupported');
      return undefined;
    }

    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
      if (cancelled) return;
      setXrState(supported ? 'idle' : 'unsupported');
    }).catch(() => {
      if (!cancelled) setXrState('unsupported');
    });

    return () => { cancelled = true; };
  }, [isMobileCapable, isNative]);

  // ---- start an immersive-ar session ----
  // FIX: 'local-floor' moved from requiredFeatures to optionalFeatures
  // — previously, a device supporting immersive-ar + hit-test but not
  // local-floor tracking specifically would have the ENTIRE session
  // request thrown away, not just that feature, silently dropping
  // xrState to 'denied' with (previously) no UI for that state at all.
  const startXRSession = useCallback(async () => {
    if (!navigator.xr) return;
    setXrState('requesting');
    try {
      const overlayRoot = document.getElementById('veggie-ar-dom-overlay');
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: overlayRoot
          ? ['dom-overlay', 'depth-sensing', 'local-floor']
          : ['depth-sensing', 'local-floor'],
        depthSensing: {
          usagePreference: ['cpu-optimized'],
          dataFormatPreference: ['luminance-alpha', 'float32'],
        },
        ...(overlayRoot ? { domOverlay: { root: overlayRoot } } : {}),
      });
      setXrSession(session);
      setXrState('active');
    } catch (err) {
      console.warn('[GameCanvas] immersive-ar session request failed/denied', err);
      setXrState('denied');
    }
  }, []);

  const handleXRSessionEnded = useCallback(() => {
    setXrSession(null);
    setXrState('idle');
    setInternalArGroundY(null);
    arOriginRef.current = null;
  }, []);

  const handleGroundY = useCallback((y) => {
    setInternalArGroundY(y);
  }, []);

  useEffect(() => {
    if (!xrActive) return;
    if (arOriginRef.current) return;
    if (internalArGroundY == null) return;
    if (!selfPosition) return;
    arOriginRef.current = { lat: selfPosition.lat, lng: selfPosition.lng };
  }, [xrActive, internalArGroundY, selfPosition]);

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
    if (xrActive) return undefined;
    if (xrState === 'requesting') return undefined;

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
  }, [isMobileCapable, xrActive, xrState]);

  useEffect(() => {
    if (!xrActive) return;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [xrActive]);

  useEffect(() => {
    if (!isMobileCapable) return undefined;
    if (xrActive) return undefined;
    if (motionPermission !== 'granted') return undefined;
    function handleOrientation(e) {
      if (e.beta == null) return;
      const tilt = e.beta - 90;
      setDevicePitch(Math.max(-MAX_PITCH_DEG, Math.min(MAX_PITCH_DEG, tilt)));
    }
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, [isMobileCapable, motionPermission, xrActive]);

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

  const rawTargetNodes = useMemo(() => {
    if (!selfPosition || !veggies || typeof veggies !== 'object') return [];
    const projectedList = [];

    Object.entries(veggies).forEach(([id, node]) => {
      if (!node || node.lat == null || node.lng == null) return;
      const dist = distanceMeters(selfPosition.lat, selfPosition.lng, node.lat, node.lng);
      if (dist > AR_TRIGGER_DISTANCE_METERS) return;

      const resolvedFloorY = arAnchors?.[id]?.y ?? (effectiveGroundY != null ? effectiveGroundY : -CAMERA_EYE_HEIGHT_METERS);

      let worldX;
      let worldZ;

      if (xrActive && arOriginRef.current) {
        const { east, north } = gpsToLocalMeters(
          arOriginRef.current.lat, arOriginRef.current.lng, node.lat, node.lng
        );
        worldX = east;
        worldZ = -north;
      } else {
        const bearing = bearingDegrees(selfPosition.lat, selfPosition.lng, node.lat, node.lng);
        const relAngle = ((bearing - deviceHeading + 540) % 360) - 180;
        if (Math.abs(relAngle) > FOV_ANGLE_DEG / 2) return;
        const relAngleRad = toRad(relAngle);
        const sceneDepth = metersToSceneDepth(dist);
        worldX = Math.sin(relAngleRad) * sceneDepth;
        worldZ = -Math.cos(relAngleRad) * sceneDepth;
      }

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
  }, [veggies, selfPosition, deviceHeading, effectiveGroundY, arAnchors, xrActive]);

  const targetNodes = useMemo(() => {
    if (!targetVegId) return rawTargetNodes;
    return rawTargetNodes.filter((n) => n.id === targetVegId);
  }, [rawTargetNodes, targetVegId]);

  useEffect(() => {
    targetNodesRef.current = targetNodes;
  }, [targetNodes]);

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
      .filter((node) => !effectiveOcclusion[node.id])
      .map((node) => {
        const live = liveVeggieSnapshot[node.id];

        if (xrActive) {
          if (!live || live.screenX == null || live.screenY == null) return null;
          return {
            id: node.id,
            species: node.species,
            distance: node.distance,
            x: live.screenX,
            y: live.screenY,
            radius: live.screenRadius || MIN_SCREEN_HIT_RADIUS_PX,
          };
        }

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
  }, [targetNodes, liveVeggieSnapshot, windowDims, effectiveOcclusion, xrActive]);

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
    if (effectiveOcclusion[id]) {
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
  }, [targetNodes, effectiveOcclusion]);

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

  const visibleTargetCount = useMemo(
    () => targetNodes.filter((n) => !effectiveOcclusion[n.id]).length,
    [targetNodes, effectiveOcclusion]
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
    <div id="veggie-ar-dom-overlay" style={{ ...styles.viewport, ...(isGlitched ? styles.viewportShaking : {}) }}>
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

      {!xrActive && (
        cameraState === 'denied' ? (
          <div style={styles.cameraErrorOverlay}><h3>CAMERA ACCESS REJECTED</h3></div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted style={styles.videoBackdrop} />
        )
      )}
      {!xrActive && <div style={styles.videoScrim} />}

      {/* FIX: was rendered twice at identical position — kept only the
          complete version (with SKIP fallback). Also never shown at
          all inside the Capacitor app shell, since isNative forces
          xrState straight to 'unsupported'. */}
      {xrState === 'idle' && (
        <div style={styles.cameraErrorOverlay}>
          <h3>REAL AR AVAILABLE</h3>
          <p style={{ marginBottom: 16, maxWidth: 280 }}>
            Your device supports real ground-locked AR — vegetables will stand on the actual floor and hide behind real objects.
          </p>
          <button style={styles.fleeBtn} onClick={startXRSession}>
            🌱 START AR HUNT
          </button>
          <button
            style={{ ...styles.fleeBtn, marginTop: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)' }}
            onClick={() => setXrState('unsupported')}
          >
            SKIP — USE BASIC CAMERA
          </button>
        </div>
      )}

      {xrState === 'requesting' && (
        <div style={styles.cameraErrorOverlay}>
          <h3>STARTING AR…</h3>
        </div>
      )}

      {/* NEW: previously a failed session request (e.g. local-floor
          declined) silently dropped xrState to 'denied' with NO render
          branch at all — indistinguishable from "the button does
          nothing." Now it's a real, actionable screen. */}
      {xrState === 'denied' && (
        <div style={styles.cameraErrorOverlay}>
          <h3>AR SESSION FAILED TO START</h3>
          <p style={{ marginBottom: 16, maxWidth: 280 }}>
            Your device declined the AR session — this can happen if a required
            AR feature isn't supported, or if Google Play Services for AR needs
            updating. Falling back to basic camera mode still works fine.
          </p>
          <button style={styles.fleeBtn} onClick={startXRSession}>
            TRY AGAIN
          </button>
          <button
            style={{ ...styles.fleeBtn, marginTop: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)' }}
            onClick={() => setXrState('unsupported')}
          >
            USE BASIC CAMERA INSTEAD
          </button>
        </div>
      )}

      {blindAttack && (
        <div
          style={{
            ...styles.blindAttackOverlay,
            animation: 'blindAttackPulse 0.3s ease-out',
          }}
        />
      )}

      {!xrActive && motionPermission === 'pending' && (
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

      {!xrActive && myMode === 'indoor' && (
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
        {xrActive && <XRSessionBridge session={xrSession} onEnded={handleXRSessionEnded} />}
        {xrActive && <ARGroundAnchor session={xrSession} onGroundY={handleGroundY} />}
        {xrActive && (
          <ARDepthOcclusion
            session={xrSession}
            targetNodesRef={targetNodesRef}
            liveVeggieRef={liveVeggieRef}
            onOcclusionUpdate={handleOcclusionUpdate}
            onDepthSupportChange={setDepthOcclusionSupported}
          />
        )}
        {!xrActive && <CameraPitchRig pitchDeg={devicePitch} />}

        <Environment preset="apartment" background={false} />
        <hemisphereLight skyColor="#ffffff" groundColor="#4a4a4a" intensity={0.5} />
        <directionalLight position={[3, 6, 4]} intensity={1.8} />
        <ambientLight intensity={0.45} />

        {targetNodes.map((node) => {
          const isThisGlitchTarget = isGlitched && node.id === glitchTargetId;
          const isThisOccluded = !!effectiveOcclusion[node.id];
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
              xrActive={xrActive}
              screenW={windowDims.w}
              screenH={windowDims.h}
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
        disabled={!xrActive && cameraState !== 'ready'}
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
          {xrActive && effectiveGroundY != null && (
            <div style={{ ...styles.telemetryTag, borderColor: 'rgba(57,255,136,0.5)' }}>
              🟢 AR ANCHORED
            </div>
          )}
          {xrActive && (
            <div style={{ ...styles.telemetryTag, borderColor: 'rgba(60,214,255,0.5)' }}>
              📡 REAL AR
            </div>
          )}
          {xrActive && depthOcclusionSupported === true && (
            <div style={{ ...styles.telemetryTag, borderColor: 'rgba(255,190,26,0.5)' }}>
              🌫️ REAL OCCLUSION
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
