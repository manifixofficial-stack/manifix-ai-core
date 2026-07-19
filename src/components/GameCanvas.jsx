// src/components/GameCanvas.jsx
//
// WHAT CHANGED (this revision — "live evasion physics wiring"):
//
// Everything from the previous "bugfix + collection wiring" revision is
// preserved (CAMERA_EYE_HEIGHT_METERS fix, CollectionBook wiring, round/
// timer/glitch state machine, vacuum capture window, telemetry bar,
// leaderboard). This revision wires in useVeggieEvasion so veggies
// actually move like a Pokémon-GO-style encounter instead of standing at
// a fixed GPS-derived spot with a cosmetic sine-wave sway:
//
//   A) Each visible veggie is now rendered through a new
//      <AnimatedVeggieTarget> component (defined below, rendered inside
//      <Canvas>) that calls useVeggieEvasion().processEvasionFrame every
//      3D frame and imperatively moves a wrapping <group> — floor-locked
//      on Y, running TOWARD the player by default (chaseMode), settling
//      into an orbit once close, and periodically ducking into
//      obstacle_hide so the player has to search for it again — exactly
//      the hook's built-in behavior, just actually connected now.
//   B) The old GPS-anchor position (`targetNodes`) is now only the
//      *spawn point* + the real-world `distanceMeters` used to gate
//      idle/greeting/running — it no longer also carries the manual
//      Round-3 "teleport jitter", which is superseded by the hook's own
//      dash/aggressive-charge/hide states. `isGlitched`/`glitchTargetId`
//      are kept for the HUD banner and the model's hyperSpeed/scale
//      visual cue, just not for hand-rolled position math anymore.
//   C) Real device compass heading (`deviceHeading`, already tracked via
//      the existing `deviceorientation`-driven bearing math above) is
//      passed into the hook as `deviceHeadingDeg`, so obstacle_hide
//      actually uses where the player is physically facing.
//   D) `capture-result` (existing socket event) now also feeds a failed
//      catch into the hook's break-out model via a small pending-attempt
//      ref, so a missed throw can trigger an aggressive_charge burst.
//   E) The 2D scanner-bracket reticle (`captureTargets`/`lockRings`) now
//      tracks each veggie's LIVE animated position instead of the static
//      GPS anchor, via a throttled (~10/sec) snapshot of a per-frame ref
//      — full 60fps state churn isn't needed for a DOM overlay, and
//      avoids janking the 3D layer with React re-renders every frame.
//
// F) (THIS PATCH — "server-confirmed vacuum animation") Previously,
//    `handleCaptureAttempt` opened `vacuumLock` (which drives
//    VeggieModel's `isVacuuming` prop) immediately on every dispatched
//    throw, hit or miss — because CaptureThrow.jsx always calls
//    `onAttempt` once it resolves against *some* target (direct hit OR
//    nearest-fallback on a total miss; see CaptureThrow's own
//    file-header ASSUMPTION). That meant every miss near a veggie still
//    played the full "gulp" shrink-and-suck animation, and after the
//    1.2s window VeggieModel's `onCatch` fired unconditionally — wiping
//    that veggie's evasion-hook physics/AI state
//    (`clearVeggieState`) on a WHIFF, not just a real catch.
//
//    Fixed by decoupling "a throw was dispatched" from "the vacuum/catch
//    animation should play": `handleCaptureAttempt` now only freezes the
//    round timer and emits `capture-attempt` — it no longer touches
//    `vacuumLock`. `vacuumLock` is now opened ONLY inside
//    `handleCaptureResult`, and only when the server confirms
//    `data.success === true`. A miss unfreezes the timer immediately
//    instead of waiting out a vacuum window that should never have
//    started. A new `attemptTimeoutRef` safety-unfreezes the timer if a
//    `capture-result` never arrives at all (dropped socket message),
//    mirroring the equivalent defensive timeout already in
//    CaptureThrow.jsx.
//
// G) (THIS PATCH — "respect MapView's selected target") Added the
//    `targetVegId` prop App.jsx was already sending on every AR
//    hand-off but this component previously ignored entirely (it
//    wasn't even in the destructured prop list). See the prop's own
//    doc comment above `export default function GameCanvas` for full
//    details — short version: when set, only that one veggie is
//    shown/tracked; when omitted, behavior is unchanged from before.
//
// HONEST CAVEAT ON "HIDING IN A REAL ENVIRONMENT": there's no depth
// sensing/LiDAR here, so a veggie can't actually duck behind your real
// couch or wall. "Hiding" is simulated the same way Pokémon GO does it —
// it moves out of frame / behind the player's current facing direction
// (via deviceHeadingDeg) so you have to physically turn to find it
// again. That's a legitimate, working mechanic — just not literal
// occlusion by real-world geometry.
//
// HONEST CAVEAT ON GLB ASSETS: this file only ever passed a `type`/
// `species` string down to Veggie3DModel — the actual GLTFLoader/GLB
// loading for the six species (tomato, broccoli, golden, banana,
// grapes, strawberry per project history) lives in VeggieModel.jsx, not
// here, and that file wasn't provided, so it isn't touched by this
// revision. This file cannot generate the .glb 3D model files
// themselves either — that's 3D authoring, not code — it can only wire
// up which species string gets requested and where it's positioned.
//
// STILL UNRESOLVED / SERVER-SIDE (unchanged from before):
//   1. `round_timeout` — this file listens for it; nothing emits it yet.
//   2. `submit-round-score` — emitted at the end of Round 3; nothing
//      persists it server-side yet.
//   3. Real 3D vacuum-suck mesh animation lives in VeggieModel, not here.
//   4. Round-3 glitch target selection is still client-local (nearest
//      visible). Make it server-authoritative if it needs to be synced
//      across players.
//
// Nothing below invents scoring — actual point awards still come from
// the server via `data.points` on `veggieCaught`, exactly as before.

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import CaptureThrow from './CaptureThrow';
// ASSUMED PROPS on Veggie3DModel (I don't have this file's real source
// — adjust to match if different):
//   veggieId        string   — stable id, used as React key upstream
//   type            string   — species, e.g. 'broccoli' | 'tomato'
//   position        [x,y,z]  — LOCAL position inside the wrapping group
//                              this revision nests it in — pass [0,0,0]
//                              since the group now owns world placement
//   distanceMeters  number   — real-world distance, for internal LOD/pop-in
//   teamColor       string   — cosmetic tint
//   scale           number   — base mesh scale multiplier (chunky = 1.4);
//                              multiplies with the wrapping group's own
//                              evasion-driven scale, doesn't replace it
//   runAmplitude    number   — ASSUMPTION: this drives a local leg/body
//                              sway animation baked into the mesh (not a
//                              world-position offset) — if this file's
//                              real implementation actually moves world
//                              position, it will double up with the new
//                              group-level movement below and should be
//                              zeroed out or removed instead
//   runSpeed        number   — sine frequency multiplier for the run cycle
//   runSeed         number   — per-instance phase offset so veggies don't
//                              all run in lockstep
//   leanEnabled     bool     — whether to tilt the upper body into turns
//   hyperSpeed      bool     — Round-3 flag: faster run-cycle animation
//   isJumpScared    bool     — true for a short burst after a player has
//                              stared at it too long without firing
//   isVacuuming     bool     — true ONLY during a SERVER-CONFIRMED capture
//                              freeze window (see patch note F above) —
//                              no longer set optimistically on every
//                              dispatched throw
//   isCaught        bool     — persistent caught state (existing behavior)
//   onCatch(id)              — existing callback, fired once the local
//                              vacuum/shrink animation finishes
import Veggie3DModel from '../components/veggies/VeggieModel';
import { AR_TRIGGER_DISTANCE_METERS, MODEL_BASE_SCALE, GLITCH_TARGET_SCALE_MULTIPLIER, CAMERA_EYE_HEIGHT_METERS } from '../config/gameConfig';
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

// Timer base by lobby mode. Falls back to the original fixed session
// length if a caller doesn't pass `initialTimingMode` at all, so this
// stays backward compatible with existing usages of GameCanvas.
const FALLBACK_SESSION_SECONDS = 55;
const TIMER_SECONDS_BY_MODE = { indoor: 45, outdoor: 60 };

// Lock-on reticle: how close (in px) a target's screen position needs to
// be to the viewport center before it reports "locked".
const LOCK_RADIUS_PX = 80;

// Round system
const TOTAL_ROUNDS = 3;
const ROUND_POINT_TIERS = { 1: 100, 2: 300, 3: 600 };
const GLITCH_ROUND_POINTS = 1000;
const VACUUM_WINDOW_MS = 1200;

// Safety unfreeze: how long to wait for a `capture-result` socket event
// after dispatching `capture-attempt` before giving up and unfreezing
// the round timer anyway. A dropped socket message should never
// permanently freeze the clock. Mirrors CaptureThrow.jsx's own
// RESOLUTION_WAIT_TIMEOUT_MS defensive timeout.
const CAPTURE_RESULT_TIMEOUT_MS = 3500;

// "Sentient running" mesh-level animation (leg/body sway baked into the
// model itself — see the runAmplitude caveat in the Veggie3DModel props
// note above). World-space movement is now handled by the evasion hook,
// not by these.
const RUN_AMPLITUDE = 1.8;
const RUN_SPEED = 2;
const JUMP_SCARE_DELAY_MS = 4500; // hesitation window before a startle-leap
const JUMP_SCARE_DURATION_MS = 900;

// Round-3 hyper-speed visual cue multiplier for whichever target is
// currently `glitchTargetId` — actual movement now comes from the
// evasion hook's own aggressive_charge/dash states, this only scales the
// mesh's run-cycle animation and model size for the "something's very
// wrong with this one" read.
const GLITCH_SPEED_MULTIPLIER = 3.0;

// How often the 2D reticle overlay (DOM, outside the WebGL canvas)
// re-samples each veggie's live 3D position. Full 60fps state churn
// isn't needed for a screen-space overlay; ~10/sec is visually smooth
// and avoids re-rendering the whole overlay tree every 3D frame.
const RETICLE_SNAPSHOT_INTERVAL_MS = 100;

// Six known vegetable species this project has shipped GLB models for
// (per project history) — kept here only as a documentation/fallback
// reference for `species`/`type` strings; the actual GLTFLoader/GLB
// wiring per species lives in VeggieModel.jsx, not this file.
const KNOWN_VEGGIE_SPECIES = ['tomato', 'broccoli', 'golden', 'banana', 'grapes', 'strawberry'];

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

// halfWidthUnits is now optional so a veggie's own dynamic `fleaRadius`
// (from the evasion hook — grows as it visually scales up close to the
// camera) can be passed in instead of the fixed constant, keeping throw
// hit-testing accurate as the model grows/shrinks with depth.
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

// Rotates the R3F camera to match device pitch (tilting the phone up/down)
// so AR targets anchor to a real ground plane instead of floating at a
// fixed screen height regardless of how the phone is angled. Heading
// (yaw) is still handled upstream via bearing math, not here.
function CameraPitchRig({ pitchDeg }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.rotation.x = toRad(-pitchDeg);
  });
  return null;
}

// Flat, soft-edged circle rendered on the ground under each veggie so it
// doesn't look like it's floating disconnected from the room. Sized and
// darkened by distance — nearer targets get a bigger, denser shadow.
// Now rendered as a child of the animated group (local position), so
// `position` here is local to that group, not a world coordinate.
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

// Cheap deterministic per-id phase seed so veggies don't all run in
// lockstep sine phase — same id always gets the same seed within a
// session, which is enough (this doesn't need to be cryptographic).
function seedFromId(id) {
  let h = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 1000) / 1000 * Math.PI * 2;
}

// ── AnimatedVeggieTarget ───────────────────────────────────────────────
// Rendered inside <Canvas>, one per visible veggie. Owns the actual
// live physics: on every 3D frame it calls the shared
// useVeggieEvasion().processEvasionFrame for this veggie's id, and
// imperatively moves/scales a wrapping <group> ref — floor-locked,
// running toward the player, settling into an orbit up close, and
// periodically hiding — instead of going through React state (which
// would mean a full re-render 60x/sec).
//
// `node.position` (the GPS-bearing-derived anchor computed in
// targetNodes below) is only used to SEED the local animated position
// the first time this id appears — after that, the evasion hook fully
// owns where it is, the same way the hook already treats the player as
// fixed at the world origin.
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
    // Seed exactly once per mounted instance of this id — if the same id
    // re-mounts after being cleared (caught + later respawned under a
    // reused id, unlikely but defensive), it seeds fresh from wherever
    // it's spawning this time rather than an old ref value.
    if (!seededRef.current) {
      posRef.current = { x: node.position[0], z: node.position[2] };
      seededRef.current = true;
    }
    return () => {
      clearVeggieState(node.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id]);

  useFrame((_, delta) => {
    if (isVacuuming) {
      // Frozen during the capture window — hold last transform, don't
      // keep simulating movement out from under the "MAX SUCTION" beat.
      return;
    }

    // Consume any pending catch-attempt result (set by GameCanvas's
    // capture-result socket handler) so a missed throw can roll the
    // hook's break-out model into an aggressive_charge burst.
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
      dtSeconds: Math.min(delta, 1 / 15), // clamp huge deltas (tab backgrounded, etc.)
      deviceHeadingDeg,
      catchAttempted,
      catchLockSuccess,
      // Golden veggies are the rarer/harder catch, per the six known
      // species — this only feeds the break-out chance math.
      catchDifficulty: node.isGolden ? 0.8 : 0.3,
      floorY: -CAMERA_EYE_HEIGHT_METERS,
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
      // Local player stepped on this veggie's dropped hazard trail —
      // surfaced upward in case the caller wants to react (e.g. a
      // screen-wide slip effect). Not wired to anything yet beyond the
      // callback so it doesn't silently vanish.
      onLiveUpdate(node.id, { spinoutTriggered: true });
    }

    // Throttled-elsewhere: write the raw live position/state into the
    // shared ref every frame (cheap), and let the interval-driven
    // snapshot (in GameCanvas) decide when to actually re-render the 2D
    // reticle overlay from it.
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
        isJumpScared={jumpScared}
        isVacuuming={isVacuuming}
        isCaught={isCaught}
        onCatch={onLocalCatch}
      />
    </group>
  );
}

export default function GameCanvas({
  connectionStatus = 'idle', roomCode = '', playerId = null, mySlot = 'oggy-blue',
  selfPosition = null, deviceHeading = 0, players = {}, veggies = {}, matchPhase = null,
  // NEW: lobby-selected timing mode ('indoor' | 'outdoor'). Optional —
  // omitting it preserves the old fixed 55s session length.
  initialTimingMode = null,
  // NEW (bug fix): App.jsx already sends this — the specific veggie id
  // MapView's radar CATCH button selected before handing off to this
  // AR screen — but this component previously had no `targetVegId` in
  // its prop list at all, so it was silently dropped and every visible
  // veggie was shown regardless of what was actually tapped. When
  // provided, only that one veggie is rendered/tracked here, matching
  // the original MapView -> "pick one target, then enter AR" flow. When
  // omitted (e.g. testing this component directly), all currently
  // GPS-visible veggies are shown, same as before.
  targetVegId = null,
  onExit
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraState, setCameraState] = useState('initializing');
  const [windowDims, setWindowDims] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [popups, setPopups] = useState([]);
  const [missPopups, setMissPopups] = useState([]);
  const [caughtIds, setCaughtIds] = useState(() => new Set());
  const [captureResolutions, setCaptureResolutions] = useState([]);
  const [devicePitch, setDevicePitch] = useState(0);

  // NEW: local UI toggle for the collection drawer. CollectionBook
  // manages its own caught-species state internally (off the
  // `veggieGo:collectionUpdated` window event) — this is just
  // open/closed, nothing about which species are found lives here.
  const [collectionOpen, setCollectionOpen] = useState(false);

  // Session/round timer base — driven by initialTimingMode, falls back
  // to the original fixed constant if the prop isn't passed.
  const timerBaseSeconds = TIMER_SECONDS_BY_MODE[initialTimingMode] ?? FALLBACK_SESSION_SECONDS;
  const [secondsLeft, setSecondsLeft] = useState(timerBaseSeconds);

  // ── Round state machine ─────────────────────────────────────────
  const [matchRound, setMatchRound] = useState(1);
  const [isGlitched, setIsGlitched] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // ── Vacuum capture window (drives VeggieModel's isVacuuming prop) ─
  // IMPORTANT (patch F): this is now opened ONLY from handleCaptureResult
  // once the server confirms a hit — never optimistically from
  // handleCaptureAttempt. See the file-header patch note for why.
  const [vacuumLock, setVacuumLock] = useState(null); // { targetId, expiresAt } | null
  const timerFrozenRef = useRef(false);
  // Safety-unfreeze timer for an in-flight capture-attempt that never
  // gets a capture-result back (dropped socket message). Cleared the
  // moment a real capture-result arrives.
  const attemptTimeoutRef = useRef(null);

  // ── Sentient-run / jump-scare bookkeeping ────────────────────────
  const lockedSinceRef = useRef(new Map()); // id -> ms timestamp first locked
  const [jumpScaredIds, setJumpScaredIds] = useState(() => new Set());

  // ── Round-3 glitch target (HUD/visual cue only now — see header) ──
  const [glitchTargetId, setGlitchTargetId] = useState(null);

  // ── Live evasion physics (NEW) ────────────────────────────────────
  const { processEvasionFrame, clearVeggieState } = useVeggieEvasion();
  // Pending catch attempts, keyed by vegId, consumed by AnimatedVeggieTarget
  // on its next frame to feed the break-out probability model.
  const pendingCatchAttemptsRef = useRef({});
  // Raw live position/state per veggie, written every 3D frame by
  // AnimatedVeggieTarget; snapshotted into React state on a slower
  // interval below so the 2D reticle overlay updates smoothly without
  // forcing a full re-render 60x/sec.
  const liveVeggieRef = useRef({});
  const [liveVeggieSnapshot, setLiveVeggieSnapshot] = useState({});

  const handleLiveUpdate = useCallback((id, patch) => {
    liveVeggieRef.current[id] = { ...(liveVeggieRef.current[id] || {}), ...patch };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Shallow-copy so React sees a new reference and re-renders the
      // memoized overlay computations below.
      setLiveVeggieSnapshot({ ...liveVeggieRef.current });
    }, RETICLE_SNAPSHOT_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup the capture-attempt safety timer on unmount.
  useEffect(() => {
    return () => clearTimeout(attemptTimeoutRef.current);
  }, []);

  // Current round's HUD point tier — explodes to GLITCH_ROUND_POINTS
  // once Round 3's glitch state kicks in.
  const currentRoundPoints = isGlitched ? GLITCH_ROUND_POINTS : (ROUND_POINT_TIERS[matchRound] ?? ROUND_POINT_TIERS[1]);

  // SERVER TODO #2: this is the only place that "saves" a round score
  // from the client. It emits a socket event with everything the server
  // needs to write a MongoDB Atlas document — but the actual
  // persistence has to happen server-side. A browser should never hold
  // MongoDB credentials directly.
  const submitRoundScore = useCallback(() => {
    if (scoreSubmitted) return;
    setScoreSubmitted(true);
    const finalScore = players?.[mySlot]?.score ?? 0;
    window.socket?.emit('submit-round-score', {
      roomCode,
      playerId,
      slot: mySlot,
      round: matchRound,
      score: finalScore,
      glitched: isGlitched,
      completedAt: Date.now(),
    });
  }, [scoreSubmitted, players, mySlot, roomCode, playerId, matchRound, isGlitched]);

  // Advances the round: rounds 1-2 just reset the clock and move on
  // (the next vegetable set is expected to arrive via the `veggies`
  // prop from the parent/socket layer, same as it already does today —
  // this file doesn't own veggie spawning). Round 3 ending finalizes
  // the match instead of looping.
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

  // Round 3 glitch trigger — fires once, the moment Round 3 begins.
  useEffect(() => {
    if (matchRound === TOTAL_ROUNDS) {
      setIsGlitched(true);
    }
  }, [matchRound]);

  // Room-wide round countdown. Ticks once per second, but SKIPS the
  // decrement while a vacuum capture window has the clock frozen. Hits
  // 0 -> advances the round (or ends the match on Round 3).
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
  }, []);

  useEffect(() => {
    function handleOrientation(e) {
      if (e.beta == null) return;
      const tilt = e.beta - 90;
      setDevicePitch(Math.max(-MAX_PITCH_DEG, Math.min(MAX_PITCH_DEG, tilt)));
    }
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  useEffect(() => {
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

      // NEW: record this species in the local player's persistent
      // collection. Placed after the playerId check on purpose — the
      // vegId add above happens for EVERY player's catch (shared visual
      // state, so the mesh disappears for everyone), but the collection
      // is per-player, so only "did I personally catch this" should
      // unlock a card.
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

      // A successful local catch ends the current round early (per round
      // spec: "every time the timer hits zero OR a catch succeeds").
      advanceRound();
    };

    const handleCaptureResult = (data) => {
      if (!data) return;

      // A real result arrived — the safety-unfreeze timer from
      // handleCaptureAttempt is no longer needed for this attempt.
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

      // NEW: feed this result to the evasion hook's break-out model —
      // AnimatedVeggieTarget consumes and clears this on its next frame.
      if (resolution.vegId) {
        pendingCatchAttemptsRef.current[resolution.vegId] = { success: resolution.success };
      }

      if (resolution.success) {
        // PATCH F: only now — once the server has actually confirmed a
        // hit — open the local vacuum/capture-animation window. This is
        // what drives VeggieModel's isVacuuming prop and, in turn, its
        // one-shot onCatch callback at the end of that window.
        if (resolution.vegId) {
          setVacuumLock({ targetId: resolution.vegId, expiresAt: Date.now() + VACUUM_WINDOW_MS });
        }
        window.setTimeout(() => {
          timerFrozenRef.current = false;
          setVacuumLock((prev) => (prev?.targetId === resolution.vegId ? null : prev));
        }, VACUUM_WINDOW_MS);
      } else {
        // A miss resolves immediately — no vacuum animation was ever
        // started for it (see handleCaptureAttempt below), so there's
        // no window to wait out. Just unfreeze the round timer.
        timerFrozenRef.current = false;
        const newMiss = { id: resolution.id, text: label };
        setMissPopups((prev) => [...prev, newMiss]);
        setTimeout(() => {
          setMissPopups((prev) => prev.filter((p) => p.id !== newMiss.id));
        }, 1400);
      }
    };

    // SERVER TODO #1: nothing currently emits `round_timeout`. Add an
    // authoritative per-round timer on the server and broadcast this
    // event when it hits 0, so every client in the room ends the round
    // in sync instead of relying purely on each phone's local clock.
    const handleRoundTimeout = (data) => {
      if (data?.roomCode && roomCode && data.roomCode !== roomCode) return;
      advanceRound();
    };

    socket.on('veggieCaught', handleCaughtBroadcast);
    socket.on('capture-result', handleCaptureResult);
    socket.on('round_timeout', handleRoundTimeout);
    return () => {
      socket.off('veggieCaught', handleCaughtBroadcast);
      socket.off('capture-result', handleCaptureResult);
      socket.off('round_timeout', handleRoundTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, advanceRound]);

  // Spawn anchors: GPS-bearing-derived spawn point + real-world
  // distanceMeters (still gates idle/greeting/running in the hook) for
  // every currently-visible veggie. No longer mutates position with a
  // manual jitter — AnimatedVeggieTarget owns real movement now.
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
        // Floor plane comes from the evasion hook's floorY param now
        // (fed CAMERA_EYE_HEIGHT_METERS directly), so this anchor's own Y
        // is only used as the initial seed before the hook takes over.
        const worldY = -CAMERA_EYE_HEIGHT_METERS;

        projectedList.push({
          id,
          position: [worldX, worldY, worldZ],
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
  }, [veggies, selfPosition, deviceHeading]);

  // NEW (bug fix, see targetVegId prop note above): everything below
  // this point already reads `targetNodes` — filtering happens here,
  // once, so no downstream logic (capture targets, reticle, glitch
  // target selection, LOCKS count) needed to change to respect a
  // MapView-selected target.
  const targetNodes = useMemo(() => {
    if (!targetVegId) return rawTargetNodes;
    return rawTargetNodes.filter((n) => n.id === targetVegId);
  }, [rawTargetNodes, targetVegId]);

  // Nearest visible target is still tracked for the Round-3 HUD/visual
  // cue (bigger model, faster run-cycle animation) — actual excitement
  // (dash bursts, aggressive charges, hiding) now comes from the
  // evasion hook itself, not from picking this id specially.
  useEffect(() => {
    if (targetNodes.length === 0) {
      setGlitchTargetId(null);
      return;
    }
    const nearest = targetNodes.reduce((a, b) => (a.distance <= b.distance ? a : b));
    setGlitchTargetId((prev) => (prev === nearest.id ? prev : nearest.id));
  }, [targetNodes]);

  // 2D scanner-bracket reticle data now reads each veggie's LIVE
  // animated position (from the throttled liveVeggieSnapshot) rather
  // than the static GPS anchor, falling back to the anchor for a veggie
  // that hasn't reported a live frame yet (e.g. the very first tick
  // after spawning).
  const captureTargets = useMemo(() => {
    return targetNodes
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
  }, [targetNodes, liveVeggieSnapshot, windowDims]);

  // Scanner-bracket reticle data: same underlying screen coords as
  // before, plus a "locked" flag and whether this specific target is
  // mid-vacuum (drives the "MAX SUCTION" state) or mid-jump-scare.
  const lockRings = useMemo(() => {
    const cx = windowDims.w / 2;
    const cy = windowDims.h / 2;
    return captureTargets.map((t) => {
      const dx = t.x - cx;
      const dy = t.y - cy;
      const distToCenter = Math.sqrt(dx * dx + dy * dy);
      const locked = distToCenter <= LOCK_RADIUS_PX;
      const fill = Math.max(0, Math.min(1, 1 - distToCenter / (LOCK_RADIUS_PX * 3)));
      const vacuuming = vacuumLock?.targetId === t.id;
      const jumpScared = jumpScaredIds.has(t.id);
      return { ...t, locked, fill, vacuuming, jumpScared };
    });
  }, [captureTargets, windowDims, vacuumLock, jumpScaredIds]);

  // Proximity jump-scare watchdog: if a target has been sitting locked
  // in the center reticle for JUMP_SCARE_DELAY_MS without a capture
  // attempt, flag it as jump-scared for a short burst, then reset its
  // lock timer so it can trigger again later.
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const stillLockedIds = new Set(lockRings.filter((r) => r.locked && !r.vacuuming).map((r) => r.id));

      // Start/refresh timers for newly-locked targets; clear timers for
      // anything no longer locked.
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
          lockedSinceRef.current.set(id, now); // reset so it can re-trigger later
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

  // Wraps the original onAttempt so a capture attempt freezes the round
  // clock while we wait for the server's verdict.
  //
  // PATCH F: this NO LONGER opens vacuumLock. Previously it did so
  // immediately on every dispatched throw — hit or miss — which made
  // every miss near a veggie play the full vacuum/catch animation and
  // then fire VeggieModel's onCatch unconditionally, wiping that
  // veggie's evasion-hook state on a whiff. vacuumLock is now only ever
  // opened from handleCaptureResult, and only once the server confirms
  // `success: true`. A defensive attemptTimeoutRef unfreezes the timer
  // if capture-result never arrives at all.
  const handleCaptureAttempt = useCallback((id, quality) => {
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
  }, []);

  const timerColor = secondsLeft <= 10 ? '#ff3f34' : secondsLeft <= 20 ? '#ffbe1a' : '#39ff88';

  const myScore = players?.[mySlot]?.score ?? 0;
  const myMode = players?.[mySlot]?.mode; // 'gps' | 'indoor' | null (unknown yet)

  const rankedPlayers = useMemo(() => {
    return Object.entries(players || {})
      .map(([slot, p]) => ({
        slot,
        name: p?.name || (slot === mySlot ? 'You' : slot),
        score: p?.score ?? 0,
      }))
      .sort((a, b) => b.score - a.score);
  }, [players, mySlot]);

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
      `}</style>

      {cameraState === 'denied' ? (
        <div style={styles.cameraErrorOverlay}><h3>CAMERA ACCESS REJECTED</h3></div>
      ) : (
        <video ref={videoRef} autoPlay playsInline muted style={styles.videoBackdrop} />
      )}
      <div style={styles.videoScrim} />

      {/* Indoor face-tracking alignment bar — only shown for players in
          indoor/sensor mode, same source (`players[mySlot].mode`) the
          HUD badge below already reads. */}
      {myMode === 'indoor' && (
        <div style={styles.alignmentBarWrap}>
          <div style={styles.alignmentBar} />
          <div style={styles.alignmentBarLabel}>ALIGN DEVICE TO CENTER LINE</div>
        </div>
      )}

      <Canvas
        style={styles.threeLayer}
        dpr={[1, Math.min(window.devicePixelRatio || 1, 3)]}
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
        <hemisphereLight skyColor="#ffffff" groundColor="#4a4a4a" intensity={0.6} />
        <directionalLight position={[3, 6, 4]} intensity={2.4} />
        <directionalLight position={[-3, 2, -2]} intensity={0.8} />
        <ambientLight intensity={0.35} />

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

      {/* Scanner-bracket reticle overlay — four corner brackets per
          target, reusing the same screen coords as before. Shows a
          distance readout + "LOCK TARGET ENGAGED" once centered,
          "MAX SUCTION" during that target's vacuum window. */}
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

      {/* ── Round 3 glitch banner ──────────────────────────────────── */}
      {isGlitched && (
        <div style={styles.glitchBanner}>
          <span style={{ animation: 'glitchTextFlicker 2.4s infinite' }}>
            ⚠️ AREA OVERLOAD — TARGET VALUE EXPLODED TO {GLITCH_ROUND_POINTS} PTS ⚠️
          </span>
        </div>
      )}

      {/* ── Top telemetry bar ─────────────────────────────────────── */}
      <div style={styles.topBar}>
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
            LOCKS: <span style={{ color: '#ffbe1a' }}>{targetNodes.length} IN SIGHT</span>
          </div>
          {myMode && (
            <div style={styles.telemetryTag}>
              {myMode === 'gps' ? '🛰 OUTDOOR GPS' : '📶 INDOOR SENSOR'}
            </div>
          )}
          {/* NEW: opens the collection drawer. Sits in the same
              pointer-events-enabled telemetry row so it's reachable
              mid-match without blocking the AR view underneath. */}
          <button
            style={styles.collectionBtn}
            onClick={() => setCollectionOpen(true)}
          >
            📖 COLLECTION
          </button>
        </div>
      </div>

      {/* ── Floating leaderboard widget ───────────────────────────── */}
      {rankedPlayers.length > 0 && (
        <div style={styles.leaderboardWidget}>
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
        <button onClick={onExit} style={styles.fleeBtn}>RETURN TO RADAR</button>
      </div>

      {matchPhase === 'ended' && (
        <Leaderboard players={players} mySlot={mySlot} onClose={onExit} />
      )}

      {/* NEW: collection drawer. Uncontrolled — it manages its own
          caught-species state off the veggieGo:collectionUpdated
          window event, we just own whether it's open. */}
      <CollectionBook open={collectionOpen} onClose={() => setCollectionOpen(false)} />
    </div>
  );
}

const FONT_HEADER = "'Orbitron', 'Rajdhani', monospace";
const FONT_BODY = "'Rajdhani', 'Orbitron', monospace";

const styles = {
  viewport: { position: 'absolute', inset: 0, zIndex: 10, background: '#04060a', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none', fontFamily: FONT_BODY },
  viewportShaking: { animation: 'glitchPanic 0.25s linear infinite' },
  videoBackdrop: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 },
  videoScrim: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,6,10,0.2) 0%, rgba(4,6,10,0.5) 100%)', zIndex: 1 },
  threeLayer: { position: 'absolute', inset: 0, zIndex: 20, background: 'transparent', pointerEvents: 'none' },
  cameraErrorOverlay: { position: 'absolute', inset: 0, zIndex: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d111a', color: '#ff4d4d', padding: '30px', textAlign: 'center' },

  // Indoor alignment bar
  alignmentBarWrap: { position: 'absolute', top: '50%', left: 0, right: 0, zIndex: 22, transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' },
  alignmentBar: { width: '86%', height: 2, background: 'rgba(255,255,255,0.75)', boxShadow: '0 0 10px rgba(255,255,255,0.6)' },
  alignmentBarLabel: { marginTop: 6, color: 'rgba(255,255,255,0.85)', fontFamily: FONT_HEADER, fontSize: 10, letterSpacing: '1.5px', textShadow: '0 0 6px rgba(0,0,0,0.8)' },

  // Glitch banner
  glitchBanner: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 60, background: 'linear-gradient(90deg, #8a0000, #ff2b2b, #8a0000)', color: '#fff', fontFamily: FONT_HEADER, fontWeight: 800, fontSize: 12, letterSpacing: '1px', textAlign: 'center', padding: '9px 10px', boxShadow: '0 4px 18px rgba(255,0,0,0.5)', animation: 'glitchBannerDrop 0.4s ease-out', pointerEvents: 'none' },

  // Top telemetry bar
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, background: 'linear-gradient(180deg, rgba(6,10,18,0.92) 0%, rgba(6,10,18,0.55) 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px 12px', pointerEvents: 'none' },
  topBarHeader: { display: 'flex', alignItems: 'center', gap: '6px', color: '#ffbe1a', fontFamily: FONT_HEADER, fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '10px', textShadow: '0 0 8px rgba(255,190,26,0.4)' },
  scanDot: { width: 7, height: 7, borderRadius: '50%', background: '#ffbe1a', boxShadow: '0 0 8px 2px rgba(255,190,26,0.8)', animation: 'timerPulse 1.4s ease-in-out infinite' },
  telemetryRow: { display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' },
  telemetryTag: { background: 'rgba(10, 16, 30, 0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '7px 14px', color: '#fff', fontFamily: FONT_HEADER, fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' },
  ptsTag: { background: 'rgba(10, 16, 30, 0.85)', border: '1px solid rgba(255,190,26,0.4)', borderRadius: '7px', padding: '7px 14px', color: '#ffbe1a', fontFamily: FONT_HEADER, fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', boxShadow: '0 0 12px rgba(255,190,26,0.18)' },
  ptsNumber: { color: '#ffe066', fontWeight: 900, fontSize: '13px' },
  // Collection button — same tag visual language as telemetryTag, but
  // pointer-events re-enabled (parent row disables them) since this one
  // is actually clickable.
  collectionBtn: { background: 'rgba(10, 16, 30, 0.85)', border: '1px solid rgba(31,174,110,0.5)', borderRadius: '7px', padding: '7px 14px', color: '#39ff88', fontFamily: FONT_HEADER, fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', cursor: 'pointer', pointerEvents: 'auto' },

  // Leaderboard widget
  leaderboardWidget: { position: 'absolute', top: 96, right: 14, zIndex: 30, width: 210, background: 'rgba(8,12,22,0.92)', border: '1.5px solid #ffbe1a', borderRadius: '10px', padding: '10px 10px 8px', boxShadow: '0 0 16px rgba(255,190,26,0.2)', pointerEvents: 'none' },
  leaderboardTitle: { color: '#ffbe1a', fontFamily: FONT_HEADER, fontSize: '11px', fontWeight: 800, letterSpacing: '2px', marginBottom: '8px', textAlign: 'center' },
  leaderboardRow: { display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', padding: '6px 7px', marginBottom: '5px', background: 'rgba(255,255,255,0.04)' },
  leaderboardRowMe: { animation: 'mePulse 1.8s ease-in-out infinite', border: '1px solid rgba(255,140,0,0.45)' },
  leaderboardRank: { fontSize: '13px', width: '20px', textAlign: 'center' },
  leaderboardName: { flex: 1, color: '#fff', fontFamily: FONT_BODY, fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  crownLabel: { color: '#ffbe1a', fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px' },
  youLabel: { color: '#ff9d3f', fontSize: '10px', fontWeight: 700 },
  leaderboardScore: { color: '#39ff88', fontFamily: FONT_HEADER, fontSize: '12px', fontWeight: 800 },

  // Scanner-bracket reticle
  lockLayer: { position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none' },
  bracketWrap: { position: 'absolute', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  bracketCorner: { position: 'absolute', width: '26%', height: '26%', borderStyle: 'solid', borderWidth: 0 },
  bracketTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  bracketTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  bracketBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  bracketBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  bracketLabel: { position: 'absolute', bottom: -18, fontFamily: FONT_HEADER, fontSize: 8.5, fontWeight: 800, letterSpacing: '0.5px', whiteSpace: 'nowrap', textShadow: '0 0 6px rgba(0,0,0,0.8)' },

  controlDeck: { position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 50 },
  fleeBtn: { background: '#ff3f34', border: 'none', borderRadius: '999px', color: '#fff', fontFamily: FONT_HEADER, fontWeight: 800, fontSize: '13px', letterSpacing: '0.5px', padding: '14px 30px', cursor: 'pointer', boxShadow: '0 4px 18px rgba(255,63,52,0.45)' },
  scoreBurstWrapper: { position: 'fixed', top: '25%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1000, pointerEvents: 'none', animation: 'popupTextAnimation 3s ease-out forwards' },
  securedFlashTag: { fontSize: '20px', fontWeight: '900', color: '#ffbe1a', fontFamily: FONT_HEADER, letterSpacing: '2px', textShadow: '2px 2px 0px #000, 0 0 16px rgba(255,190,26,0.8)', marginBottom: '4px', animation: 'securedFlash 0.9s ease-out' },
  perfectTag: { fontSize: '16px', fontWeight: '900', color: '#3cd6ff', fontFamily: FONT_HEADER, letterSpacing: '2px', textShadow: '2px 2px 0px #000, 0 0 12px rgba(60,214,255,0.7)', marginBottom: '2px' },
  bigScoreLabel: { fontSize: '72px', fontWeight: '900', color: '#ffbe1a', fontFamily: FONT_HEADER, margin: 0, textShadow: '4px 4px 0px #000, 0 0 30px rgba(255,190,26,0.6)', letterSpacing: '2px' },
  speciesTextCard: { fontSize: '32px', fontWeight: '800', color: '#fff', fontFamily: FONT_HEADER, margin: '4px 0 0 0', textShadow: '3px 3px 0px #000', letterSpacing: '1px' },
  shareBtn: { marginTop: 14, pointerEvents: 'auto', background: 'rgba(255,255,255,0.12)', border: '2px solid #ffbe1a', color: '#ffbe1a', fontFamily: FONT_HEADER, fontWeight: 'bold', fontSize: 12, padding: '8px 18px', borderRadius: 20, cursor: 'pointer', backdropFilter: 'blur(4px)' },
  missBurstWrapper: { position: 'fixed', top: '38%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 999, pointerEvents: 'none', animation: 'missTextAnimation 1.2s ease-out forwards' },
  missLabel: { fontSize: '30px', fontWeight: '800', color: '#ff6b5e', fontFamily: FONT_HEADER, margin: 0, textShadow: '2px 2px 0px #000, 0 0 14px rgba(255,80,60,0.5)', letterSpacing: '1.5px' },
};
