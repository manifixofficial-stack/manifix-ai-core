// components/GameCanvas.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import VeggieSprite from './veggies/VeggieSprite.jsx';
import HackedTargetSprite from './veggies/HackedTargetSprite.jsx';
import CaptureThrow from './CaptureThrow.jsx';
import Scoreboard from './Scoreboard.jsx';
import RadarIndicator from './RadarIndicator.jsx';
import ObstacleCollisionOverlay from './ObstacleCollisionOverlay.jsx';
import PlayerStampedeOverlay from './PlayerStampedeOverlay.jsx';
import PerspectiveGridOverlay from './PerspectiveGridOverlay.jsx';
import ViewfinderBox from './ViewfinderBox.jsx';
import BatteryDrainSim, { useBatteryDrainSim } from './BatteryDrainSim.jsx';
import { ScorePopupLayer, useScorePopups } from './ScorePopup.jsx';
import { useVeggieTaunt } from './veggies/useVeggieTaunt.js';
import { useVeggieEvasion } from '../hooks/useVeggieEvasion.js';
import useARPlaneDetection from '../hooks/useARPlaneDetection.js';
import { OBSTACLE_ZONES } from '../config/obstacles.js';
import {
  metersBetween,
  bearingDegrees,
  normalizeRelAngle,
  bearingScreenPos,
} from '../utils/spatialGeoMath.js';
import {
  fetchPlayers,
  fetchVeggies,
  subscribeToRoom,
  captureVeggie,
  makeThrottledLocationWriter,
} from '../lib/gameClient.js';
import {
  isARDepthSupported,
  requestARDepthSession,
  startDepthLoop,
  sampleCenterDepthMeters,
} from '../lib/arDepthClient.js';
import {
  HACKED_TARGET_VEGGIE_TYPE,
  subscribeToHackedFlag,
  spawnHackedTarget,
} from '../lib/hackedEventClient.js';

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------
const CAMOUFLAGE_DISTANCE_METERS = 30;
const REVEAL_DISTANCE_METERS = 12;
const CATCH_RADIUS_METERS = 5;
const VISIBILITY_RADIUS_METERS = 45;   // veggies inside this range are drawn on the AR view
const TRACKING_RADIUS_METERS = 300;    // radar arrow tracks veggies out to this range
const SIM_METERS_PER_SEC = 4;          // keyboard-simulated walking speed
const FOV_DEG = 65;                    // assumed horizontal FOV of a rear phone camera
const OBSTACLE_TRIGGER_METERS = 8;
const THROW_TARGET_RADIUS_PX = 32;     // hit radius CaptureThrow uses against on-screen veggies
const VIEWFINDER_SIZE_PX = 96;         // must match ViewfinderBox's default `size` prop

// Viewfinder proximity-scale — how far (in meters) out the reticle starts
// growing as the nearest tracked veggie closes in, and the max multiplier
// it can reach right at catch range. Mirrors the "expand as you get
// physically closer" feel from the AR mock, but driven off the same
// closestOverallDistance signal the audio radar already uses, so both
// features agree on what "close" means.
const VIEWFINDER_SCALE_RANGE_METERS = 30;
const VIEWFINDER_MAX_SCALE_BONUS = 0.4;

// Herd-multiplier threshold — see PlayerStampedeOverlay integration below.
// Matches the "45m radius" nearby-player range already described in that
// component's docs; once more than this many players are inside it, we
// ask PlayerStampedeOverlay to render its heavier "herd" visual instead
// of just the plain proximity warning.
const STAMPEDE_HERD_THRESHOLD = 3;
const STAMPEDE_HERD_RADIUS_METERS = 45;

// GPS write throttle — see gameClient.makeThrottledLocationWriter. Tuned to
// stay well under Supabase Realtime's free-tier message quota with a few
// concurrent players: ~1 write per 3s per player, or on a 5m move,
// whichever comes first.
const LOCATION_WRITE_MIN_INTERVAL_MS = 3000;
const LOCATION_WRITE_MIN_DISTANCE_M = 5;

// Directional audio radar — proximity "ping" that speeds up as the nearest
// tracked veggie gets closer. Interval interpolates linearly between
// PING_INTERVAL_MAX_MS (far / at tracking range) and PING_INTERVAL_MIN_MS
// (at/inside catch range). Muted by default until the player opts in, since
// autoplay-audio policies require a user gesture and some players will be
// in a public/shared space.
const PING_INTERVAL_MAX_MS = 1400;
const PING_INTERVAL_MIN_MS = 220;
const PING_FREQ_HZ = 880;

// AR depth-sensing / plane-detection — fully optional enhancement layer on
// top of the existing camera-feed + GPS AR view. Off by default: it
// requires a WebXR-capable browser (practically: Android Chrome) and a
// second user gesture to start an immersive-ar session, so we only offer
// the toggle once isARDepthSupported() confirms the device can do it, and
// we never auto-start it. When active, it's used to (a) show a small
// "surfaces found" HUD and (b) soft-gate the CATCH button if the thing
// directly in front of the camera is implausibly close (i.e. the player
// is probably pointed at a wall/hand and not an open catch lane).
const AR_DEPTH_WALL_GATE_METERS = 0.6;

const VEGGIE_ICON = { carrot: '🥕', tomato: '🍅', broccoli: '🥦', golden: '⭐' };

// `playerId` here is the player_scores.id UUID from claim_character — this
// replaces the old Socket.io `selfId` (socket.id), since identity now lives
// in Postgres, not in a transient socket connection.
export default function GameCanvas({ roomCode, nickname, playerId, onExit }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [playerPos, setPlayerPos] = useState(null);
  const [simMode, setSimMode] = useState(false);
  const [players, setPlayers] = useState([]);
  const [veggies, setVeggies] = useState([]);
  const [flashPoints, setFlashPoints] = useState(null);
  const [controlsLocked, setControlsLocked] = useState(false);

  // Set of veggie ids currently under an active CaptureThrow net-lock. Fed
  // by onLockStart/onMiss/onHit from CaptureThrow below, and consumed by
  // each VeggieSprite's `locked` prop so its evasion AI freezes in place
  // instead of fighting the net. This is purely a local/visual concept
  // right now — it does NOT stop another player's client from also
  // locking the same veggie. That needs the capture_attempts table +
  // two-phase RPC already scoped separately; until that exists, two
  // players' nets can both land on the same veggie and only one capture
  // call will actually succeed (the loser just sees their lock silently
  // do nothing when captureVeggie() comes back { success: false }).
  const [lockedVeggieIds, setLockedVeggieIds] = useState(() => new Set());

  // Permission gate (camera + geolocation + compass)
  const [permissionStage, setPermissionStage] = useState('idle');
  const [permissionError, setPermissionError] = useState('');

  const [heading, setHeading] = useState(0);
  const [captureOverlay, setCaptureOverlay] = useState(null);

  // Directional audio radar toggle — off by default (autoplay-audio
  // policies need a user gesture, and pinging by default is intrusive in
  // shared spaces). Player flips this on from the in-game control.
  const [radarAudioEnabled, setRadarAudioEnabled] = useState(false);

  // AR depth-sensing state. `arDepthSupported` is null until we've checked
  // (avoids flashing the button then hiding it), then true/false.
  // `arDepthActive` reflects whether an immersive-ar XRSession is
  // currently live. `xrHandle` holds { xrSession, referenceSpace, stop }
  // from arDepthClient — kept in state (not just a ref) because
  // useARPlaneDetection needs xrSession/referenceSpace to re-run its
  // effect when a session starts/stops.
  const [arDepthSupported, setARDepthSupported] = useState(null);
  const [arDepthActive, setARDepthActive] = useState(false);
  const [arDepthError, setARDepthError] = useState('');
  const [xrHandle, setXrHandle] = useState(null);
  const [centerDepthMeters, setCenterDepthMeters] = useState(null);

  // NEW: whether the room's is_hacked flag is currently on. Drives the
  // one-shot Hacked Target spawn effect below — see
  // lib/hackedEventClient.js for the actual DB read/insert.
  const [roomHacked, setRoomHacked] = useState(false);
  const hackedSpawnAttemptedRef = useRef(false);

  const keyVelRef = useRef({ x: 0, y: 0 });
  const keysHeldRef = useRef(new Set());
  const headingRef = useRef(0);
  const streamRef = useRef(null);
  const watchIdRef = useRef(null);
  const orientationCleanupRef = useRef(null);
  const locationWriterRef = useRef(null);
  const audioCtxRef = useRef(null);
  const pingTimeoutRef = useRef(null);
  const depthLoopStopRef = useRef(null);

  const { tauntFromFrame } = useVeggieTaunt();

  // Floating "+points" popups fired on capture — see ScorePopup.jsx
  const { popups: scorePopups, spawnPopup, removePopup } = useScorePopups();

  // Live plane tracking, driven by the active XR depth session (if any).
  // No-ops (empty planes, isSupported stays null) whenever xrHandle is
  // null, i.e. for the entire camera+GPS AR flow this game normally
  // runs — this hook only does anything once a player has explicitly
  // opted into AR depth mode.
  const { planes: arPlanes, planeCount: arPlaneCount, wallPlanes, floorPlanes } = useARPlaneDetection({
    xrSession: xrHandle?.xrSession ?? null,
    referenceSpace: xrHandle?.referenceSpace ?? null,
    enabled: arDepthActive,
  });

  // NEW: in-game battery drain sim. Reads heading turn-rate (live AR mode)
  // or keyboard velocity magnitude (sim mode) to derive drain — see
  // components/BatteryDrainSim.jsx for the actual math. `batteryLocked`
  // gets OR'd into the same controlsLocked gate ObstacleCollisionOverlay
  // already drives, so CATCH/movement respects whichever lock is active
  // without the two systems needing to know about each other.
  const { energyPercent, locked: batteryLocked, plugInPowerBank } = useBatteryDrainSim({
    headingDeg: heading,
    simVelocity: keyVelRef.current,
    simMode,
    enabled: permissionStage === 'ready',
  });

  // -------------------------------------------------------------------
  // Compass tracking
  // -------------------------------------------------------------------
  const startCompass = useCallback(() => {
    const handleOrientation = (event) => {
      let h = null;
      if (typeof event.webkitCompassHeading === 'number') {
        h = event.webkitCompassHeading;
      } else if (typeof event.alpha === 'number') {
        h = (360 - event.alpha) % 360;
      }
      if (h !== null) {
        headingRef.current = h;
        setHeading(h);
      }
    };

    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      return () => window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    }
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  // -------------------------------------------------------------------
  // Geolocation tracking
  // -------------------------------------------------------------------
  const startGeolocation = useCallback(() => {
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setPlayerPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }, []);

  const requestPermissions = useCallback(async () => {
    setPermissionStage('requesting');
    setPermissionError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;

      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
      ) {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result !== 'granted') throw new Error('Compass permission was denied.');
      }

      if (!navigator.geolocation) {
        throw new Error('This device does not support location services.');
      }

      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setPlayerPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            resolve();
          },
          (err) => reject(new Error('Location permission denied or unavailable: ' + err.message)),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });

      orientationCleanupRef.current = startCompass();
      startGeolocation();
      setSimMode(false);
      setPermissionStage('ready');
    } catch (err) {
      setPermissionError(err.message || 'Permission was denied.');
      setPermissionStage('denied');
    }
  }, [startCompass, startGeolocation]);

  useEffect(() => {
    if (permissionStage === 'ready' && !simMode && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      const playPromise = videoRef.current.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((err) => {
          console.error('[GameCanvas] video play failed', err);
        });
      }
    }
  }, [permissionStage, simMode]);

  const enterSimMode = useCallback(() => {
    setSimMode(true);
    setPermissionStage('ready');
  }, []);

  // Once the base AR flow is up (or we're in sim mode — checking is
  // harmless either way), probe whether this browser/device can even
  // negotiate an immersive-ar + depth-sensing session. This is read-only
  // capability detection, no permission prompt involved, so it's safe to
  // run without a user gesture.
  useEffect(() => {
    if (permissionStage !== 'ready') return;
    let cancelled = false;
    isARDepthSupported().then((supported) => {
      if (!cancelled) setARDepthSupported(supported);
    });
    return () => {
      cancelled = true;
    };
  }, [permissionStage]);

  const stopARDepth = useCallback(async () => {
    if (depthLoopStopRef.current) {
      depthLoopStopRef.current();
      depthLoopStopRef.current = null;
    }
    if (xrHandle) {
      await xrHandle.stop();
    }
    setXrHandle(null);
    setARDepthActive(false);
    setCenterDepthMeters(null);
  }, [xrHandle]);

  // User-gesture-gated toggle for AR depth mode. Requesting the session
  // can fail for lots of legitimate reasons (device asleep on depth
  // hardware, another app holding the camera, user backed out of the
  // native AR permission prompt) — surfaced via arDepthError instead of
  // throwing, since a failed depth session should never take down the
  // base camera+GPS game underneath it.
  const toggleARDepth = useCallback(async () => {
    if (arDepthActive) {
      await stopARDepth();
      return;
    }

    setARDepthError('');
    try {
      const handle = await requestARDepthSession({
        domOverlayRoot: containerRef.current,
        onSessionEnd: () => {
          // Covers the user backing out via the browser/OS's own AR UI,
          // not just our own stop() button.
          depthLoopStopRef.current = null;
          setXrHandle(null);
          setARDepthActive(false);
          setCenterDepthMeters(null);
        },
      });

      depthLoopStopRef.current = startDepthLoop({
        xrSession: handle.xrSession,
        referenceSpace: handle.referenceSpace,
        onFrame: ({ frame, view }) => {
          const meters = sampleCenterDepthMeters(frame, view);
          if (meters != null) setCenterDepthMeters(meters);
        },
      });

      setXrHandle(handle);
      setARDepthActive(true);
    } catch (err) {
      console.error('[GameCanvas] AR depth session request failed', err);
      setARDepthError(err.message || 'Could not start AR depth mode.');
      setARDepthActive(false);
      setXrHandle(null);
    }
  }, [arDepthActive, stopARDepth]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (orientationCleanupRef.current) orientationCleanupRef.current();
      if (pingTimeoutRef.current) clearTimeout(pingTimeoutRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (depthLoopStopRef.current) depthLoopStopRef.current();
      // Fire-and-forget: XRSession.end() is async but there's no unmounted
      // component left around to await it into.
      if (xrHandle) xrHandle.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (simMode && !playerPos) setPlayerPos({ lat: 37.7749, lng: -122.4194 });
  }, [simMode, playerPos]);

  // Keyboard-driven sim movement (WASD / arrow keys)
  useEffect(() => {
    if (!simMode) return undefined;

    const KEY_VECTORS = {
      arrowup: { x: 0, y: -1 }, w: { x: 0, y: -1 },
      arrowdown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
      arrowleft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
      arrowright: { x: 1, y: 0 }, d: { x: 1, y: 0 },
    };

    const recomputeVelocity = () => {
      let x = 0;
      let y = 0;
      keysHeldRef.current.forEach((k) => {
        const v = KEY_VECTORS[k];
        if (v) { x += v.x; y += v.y; }
      });
      const len = Math.hypot(x, y) || 1;
      keyVelRef.current = { x: x / len, y: y / len };
    };

    const handleKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (!KEY_VECTORS[k] || controlsLocked || batteryLocked) return;
      keysHeldRef.current.add(k);
      recomputeVelocity();
    };
    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      keysHeldRef.current.delete(k);
      recomputeVelocity();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keysHeldRef.current.clear();
      keyVelRef.current = { x: 0, y: 0 };
    };
  }, [simMode, controlsLocked, batteryLocked]);

  useEffect(() => {
    if (!simMode) return undefined;
    let raf;
    let last = performance.now();
    const tick = (ts) => {
      const dt = (ts - last) / 1000;
      last = ts;
      const { x, y } = keyVelRef.current;
      if ((x || y) && playerPos) {
        setPlayerPos((p) => ({
          lat: p.lat - (y * SIM_METERS_PER_SEC * dt) / 111320,
          lng: p.lng + (x * SIM_METERS_PER_SEC * dt) / (111320 * Math.cos((p.lat * Math.PI) / 180)),
        }));
        const targetHeading = (Math.atan2(x, -y) * 180) / Math.PI;
        const normalizedHeading = (targetHeading + 360) % 360;
        headingRef.current = normalizedHeading;
        setHeading(normalizedHeading);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [simMode, playerPos]);

  useEffect(() => {
    if (!roomCode) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const [initialPlayers, initialVeggies] = await Promise.all([
          fetchPlayers(roomCode),
          fetchVeggies(roomCode),
        ]);
        if (!cancelled) {
          setPlayers(initialPlayers);
          setVeggies(initialVeggies);
        }
      } catch (err) {
        console.error('[GameCanvas] initial fetch failed', err);
      }
    })();

    const unsubscribe = subscribeToRoom(roomCode, {
      onPlayerChange: (payload) => {
        setPlayers((prev) => {
          if (payload.eventType === 'DELETE') {
            return prev.filter((p) => p.id !== payload.old.id);
          }
          const idx = prev.findIndex((p) => p.id === payload.new.id);
          if (idx === -1) return [...prev, payload.new];
          const next = [...prev];
          next[idx] = payload.new;
          return next;
        });
      },
      onVeggieChange: (payload) => {
        setVeggies((prev) => {
          if (payload.eventType === 'DELETE') {
            return prev.filter((v) => v.id !== payload.old.id);
          }
          const idx = prev.findIndex((v) => v.id === payload.new.id);
          if (idx === -1) return [...prev, payload.new];
          const next = [...prev];
          next[idx] = payload.new;
          return next;
        });
      },
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [roomCode]);

  // NEW: subscribe to the room's is_hacked flag. See
  // lib/hackedEventClient.js for the read/realtime-subscribe details.
  useEffect(() => {
    if (!roomCode) return undefined;
    const unsubscribe = subscribeToHackedFlag(roomCode, setRoomHacked);
    return unsubscribe;
  }, [roomCode]);

  // NEW: once we're hacked AND we have a live player position, spawn the
  // Hacked Target pinned to that position — once per mount, guarded by
  // hackedSpawnAttemptedRef so a GPS update a moment later doesn't fire a
  // second spawn attempt (spawnHackedTarget() is itself idempotent
  // server-side too, this is just to avoid a burst of redundant calls
  // from every client in the room reacting to the same flag flip at
  // once).
  useEffect(() => {
    if (!roomHacked || !playerPos || !roomCode) return;
    if (hackedSpawnAttemptedRef.current) return;
    hackedSpawnAttemptedRef.current = true;

    spawnHackedTarget(roomCode, playerPos).catch((err) => {
      console.error('[GameCanvas] hacked target spawn failed', err);
      // Allow a retry on the next position update rather than getting
      // stuck permanently un-spawned after one transient failure.
      hackedSpawnAttemptedRef.current = false;
    });
  }, [roomHacked, playerPos, roomCode]);

  // Throttled GPS writer — one instance per playerId for the life of the match.
  useEffect(() => {
    if (!playerId) return;
    locationWriterRef.current = makeThrottledLocationWriter(playerId, {
      minIntervalMs: LOCATION_WRITE_MIN_INTERVAL_MS,
      minDistanceMeters: LOCATION_WRITE_MIN_DISTANCE_M,
    });
  }, [playerId]);

  useEffect(() => {
    if (!playerPos) return;
    locationWriterRef.current?.(playerPos.lat, playerPos.lng);
  }, [playerPos]);

  const stampedePlayers = useMemo(
    () =>
      players
        .filter((p) => p.latitude != null && p.longitude != null)
        .map((p) => ({
          id: p.id,
          lat: p.latitude,
          lng: p.longitude,
          nickname: p.name,
          characterId: p.slot_id,
        })),
    [players]
  );

  // NEW: count of other players inside the herd radius, computed from the
  // same haversine math everything else uses. This is purely a derived
  // number handed to PlayerStampedeOverlay as a prop — the overlay itself
  // owns whether/how to render the heavier "herd" visual once this
  // crosses STAMPEDE_HERD_THRESHOLD; GameCanvas just supplies the count so
  // PlayerStampedeOverlay doesn't have to duplicate haversine math for
  // itself.
  const nearbyPlayerCount = useMemo(() => {
    if (!playerPos) return 0;
    return stampedePlayers.filter(
      (p) => p.id !== playerId && metersBetween(playerPos, p) <= STAMPEDE_HERD_RADIUS_METERS
    ).length;
  }, [stampedePlayers, playerPos, playerId]);
  const herdModeActive = nearbyPlayerCount > STAMPEDE_HERD_THRESHOLD;

  const { visibleVeggies, edgeVeggies, nearestTracked } = useMemo(() => {
    const visible = [];
    const edge = [];
    let nearest = null;

    if (playerPos) {
      veggies.forEach((v) => {
        const vPos = { lat: v.latitude, lng: v.longitude };
        const dist = metersBetween(playerPos, vPos);
        const bearing = bearingDegrees(playerPos, vPos);
        const relAngle = normalizeRelAngle(bearing - headingRef.current);

        if (dist <= VISIBILITY_RADIUS_METERS) {
          if (Math.abs(relAngle) <= FOV_DEG / 2) {
            const screenPos = bearingScreenPos(relAngle, dist, dims.w, dims.h, {
              fovDeg: FOV_DEG,
              visibilityRadiusM: VISIBILITY_RADIUS_METERS,
            });
            visible.push({ ...v, type: v.veggie_type, distance: dist, relAngle, ...screenPos });
          } else {
            edge.push({ ...v, type: v.veggie_type, distance: dist, relAngle, side: relAngle < 0 ? 'left' : 'right' });
          }
        } else if (dist <= TRACKING_RADIUS_METERS) {
          if (!nearest || dist < nearest.distance) {
            nearest = { ...v, type: v.veggie_type, distance: dist, bearing };
          }
        }
      });
    }

    return { visibleVeggies: visible, edgeVeggies: edge, nearestTracked: nearest };
  }, [veggies, playerPos, dims.w, dims.h, heading]);

  useEffect(() => {
    tauntFromFrame([...visibleVeggies, ...edgeVeggies]);
  }, [visibleVeggies, edgeVeggies, tauntFromFrame]);

  const closestOverallDistance = useMemo(() => {
    const candidates = [
      ...visibleVeggies.map((v) => v.distance),
      ...edgeVeggies.map((v) => v.distance),
      ...(nearestTracked ? [nearestTracked.distance] : []),
    ];
    if (candidates.length === 0) return null;
    return Math.min(...candidates);
  }, [visibleVeggies, edgeVeggies, nearestTracked]);

  // NEW: viewfinder proximity scale — grows the reticle toward
  // 1 + VIEWFINDER_MAX_SCALE_BONUS as closestOverallDistance shrinks
  // toward CATCH_RADIUS_METERS, using the same distance signal that
  // already drives the audio radar's ping rate. Sits at 1.0 with nothing
  // nearby so the box doesn't shrink below its base size while scanning.
  const nearestTargetScale = useMemo(() => {
    if (closestOverallDistance == null) return 1.0;
    const clamped = Math.max(CATCH_RADIUS_METERS, Math.min(VIEWFINDER_SCALE_RANGE_METERS, closestOverallDistance));
    const t = 1 - (clamped - CATCH_RADIUS_METERS) / (VIEWFINDER_SCALE_RANGE_METERS - CATCH_RADIUS_METERS);
    return 1.0 + t * VIEWFINDER_MAX_SCALE_BONUS;
  }, [closestOverallDistance]);

  useEffect(() => {
    if (!radarAudioEnabled) {
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
        pingTimeoutRef.current = null;
      }
      return undefined;
    }

    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return undefined;
      audioCtxRef.current = new Ctx();
    }
    const ctx = audioCtxRef.current;

    const playPing = (gainLevel) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = PING_FREQ_HZ;
      osc.type = 'sine';
      gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    };

    const scheduleNext = () => {
      if (closestOverallDistance == null) {
        pingTimeoutRef.current = setTimeout(scheduleNext, PING_INTERVAL_MAX_MS);
        return;
      }
      const clamped = Math.max(CATCH_RADIUS_METERS, Math.min(TRACKING_RADIUS_METERS, closestOverallDistance));
      const t = (clamped - CATCH_RADIUS_METERS) / (TRACKING_RADIUS_METERS - CATCH_RADIUS_METERS);
      const interval = PING_INTERVAL_MIN_MS + t * (PING_INTERVAL_MAX_MS - PING_INTERVAL_MIN_MS);
      const gainLevel = 0.05 + (1 - t) * 0.15;
      playPing(gainLevel);
      pingTimeoutRef.current = setTimeout(scheduleNext, interval);
    };

    scheduleNext();
    return () => {
      if (pingTimeoutRef.current) clearTimeout(pingTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radarAudioEnabled, closestOverallDistance]);

  const toggleRadarAudio = useCallback(() => {
    setRadarAudioEnabled((prev) => !prev);
  }, []);

  const throwTargets = useMemo(
    () =>
      visibleVeggies.map((v) => ({
        id: v.id,
        x: v.x,
        y: v.y,
        radius: THROW_TARGET_RADIUS_PX * (v.scale || 1),
      })),
    [visibleVeggies]
  );

  const crosshairX = dims.w / 2;
  const crosshairY = dims.h / 2;

  const targetInFrame = useMemo(
    () =>
      visibleVeggies.some(
        (v) =>
          Math.abs(v.x - crosshairX) < VIEWFINDER_SIZE_PX / 2 &&
          Math.abs(v.y - crosshairY) < VIEWFINDER_SIZE_PX / 2
      ),
    [visibleVeggies, crosshairX, crosshairY]
  );

  // On a successful catch, also clear the veggie out of lockedVeggieIds.
  // Without this, if capture_veggie() ever comes back successful for an
  // id that's still marked locked (shouldn't normally race, but state
  // cleanup should never depend on "shouldn't"), the Set would keep a
  // dead entry forever since nothing else ever clears it once the veggie
  // itself is gone from `veggies`.
  const handleCatch = useCallback(
    async (veggieId) => {
      if (controlsLocked || batteryLocked || !playerId) return;
      const caughtVeggie = veggies.find((v) => v.id === veggieId);
      const caughtScreenPos = visibleVeggies.find((v) => v.id === veggieId);
      try {
        const result = await captureVeggie(veggieId, playerId);
        setLockedVeggieIds((prev) => {
          if (!prev.has(veggieId)) return prev;
          const next = new Set(prev);
          next.delete(veggieId);
          return next;
        });
        if (!result?.success) return; // someone else caught it first, or it's already gone

        setVeggies((prev) => prev.filter((v) => v.id !== veggieId));

        const points = result.points ?? result.points_gained ?? 0;
        const newScore = result.new_score ?? result.updated_score ?? null;
        const playerName = result.player_name ?? nickname;
        const isHackedCatch = caughtVeggie?.veggie_type === HACKED_TARGET_VEGGIE_TYPE;

        setFlashPoints(points);
        setCaptureOverlay({
          veggieType: caughtVeggie?.veggie_type || 'carrot',
          points,
          playerName,
          newScore,
          legendary: isHackedCatch,
        });
        spawnPopup({
          x: caughtScreenPos?.x ?? crosshairX,
          y: caughtScreenPos?.y ?? crosshairY,
          value: points,
        });
        confetti({
          particleCount: isHackedCatch ? 160 : 60,
          spread: isHackedCatch ? 100 : 70,
          origin: { y: 0.6 },
        });
        setTimeout(() => setFlashPoints(null), 1200);
        setTimeout(() => setCaptureOverlay(null), isHackedCatch ? 2600 : 1800);
      } catch (err) {
        console.error('[GameCanvas] capture failed', err);
        setLockedVeggieIds((prev) => {
          if (!prev.has(veggieId)) return prev;
          const next = new Set(prev);
          next.delete(veggieId);
          return next;
        });
      }
    },
    [playerId, controlsLocked, batteryLocked, veggies, visibleVeggies, nickname, spawnPopup, crosshairX, crosshairY]
  );

  // Fires the instant CaptureThrow's net lands on a target, before its
  // hold timer starts. Marks the veggie as locked so its VeggieSprite
  // freezes evasion. This is also the seam for a future server-side
  // optimistic-lock call (capture_attempts insert) — nothing hits the
  // network here yet, it's purely local UI state.
  const handleLockStart = useCallback((veggieId) => {
    setLockedVeggieIds((prev) => {
      if (prev.has(veggieId)) return prev;
      const next = new Set(prev);
      next.add(veggieId);
      return next;
    });
  }, []);

  // Fires when a projectile misses in flight (no veggieId) or when a lock
  // breaks — target vanished or drifted out of LOCK_BREAK_RADIUS_PX (has
  // a veggieId). Only clears lockedVeggieIds when an id is actually
  // present; a plain flight-miss has nothing to clear.
  const handleThrowMiss = useCallback((veggieId) => {
    if (!veggieId) return;
    setLockedVeggieIds((prev) => {
      if (!prev.has(veggieId)) return prev;
      const next = new Set(prev);
      next.delete(veggieId);
      return next;
    });
  }, []);

  // If AR depth mode is active and the center of the viewport reads
  // implausibly close, the player is almost certainly aiming at a wall,
  // their own hand, or another obstruction rather than an actual catch
  // lane. Soft-gate (not hard block) the button in that case — this
  // never overrides ObstacleCollisionOverlay's GPS-zone lock, it just
  // adds a second, camera-grounded signal on top of it.
  const arWallBlocked =
    arDepthActive && centerDepthMeters != null && centerDepthMeters < AR_DEPTH_WALL_GATE_METERS;

  const nearestCatchable = visibleVeggies.find((v) => v.distance <= CATCH_RADIUS_METERS);
  const catchDisabled = controlsLocked || batteryLocked || !nearestCatchable || arWallBlocked;
  const handleCatchButtonTap = useCallback(() => {
    if (nearestCatchable && !arWallBlocked && !batteryLocked) handleCatch(nearestCatchable.id);
  }, [nearestCatchable, arWallBlocked, batteryLocked, handleCatch]);

  if (permissionStage !== 'ready') {
    return (
      <div style={styles.permissionWrapper}>
        <h1 style={styles.permissionTitle}>VEGGIE GO — AR HUNT</h1>
        <p style={styles.permissionText}>
          This mode uses your camera, live location, and compass to pin vegetables
          to real spots around you. No device? Play in simulation mode instead
          and move with WASD or the arrow keys.
        </p>
        {permissionError ? <p style={styles.permissionError}>{permissionError}</p> : null}
        <button
          style={styles.permissionButton}
          onClick={requestPermissions}
          disabled={permissionStage === 'requesting'}
        >
          {permissionStage === 'requesting' ? 'REQUESTING ACCESS…' : 'START AR HUNT'}
        </button>
        <button style={styles.simButton} onClick={enterSimMode}>
          PLAY IN SIMULATION MODE
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={styles.wrap}>
      {!simMode && (
        <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
      )}
      {simMode && <div style={styles.simBackground} />}

      <PerspectiveGridOverlay />

      {/* BUG FIX (leaderboard collision): Scoreboard now sits in its own
          stacking context above the top-right icon row via explicit
          zIndex, and the icon row (exit / radar-audio / AR-depth) is
          anchored far enough right (see styles.exitBtn/.radarAudioBtn/
          .arDepthBtn `right` offsets below) that it can't overlap
          Scoreboard's own layout even on narrow viewports. If you still
          see a leftover "Leaderboard X ⬜" label after this, that text
          isn't coming from Scoreboard.jsx or GameCanvas.jsx at all —
          it's very likely a stray/legacy debug overlay component still
          mounted somewhere in MainLayout.jsx or AppRouter.jsx. Grep your
          repo for the literal string "Leaderboard" (capital L) — that
          component's name doesn't match your actual Scoreboard.jsx, which
          is the fastest way it could be surviving a refactor unnoticed. */}
      <div style={styles.scoreboardLayer}>
        <Scoreboard
          players={Object.fromEntries(players.map((p) => [p.slot_id, { name: p.name, score: p.score }]))}
          mySlot={players.find((p) => p.id === playerId)?.slot_id}
          flashPoints={flashPoints}
        />
      </div>

      <button style={styles.exitBtn} onClick={onExit}>✕</button>

      <button
        style={{
          ...styles.radarAudioBtn,
          background: radarAudioEnabled ? 'rgba(57,255,136,0.85)' : 'rgba(0,0,0,0.4)',
          color: radarAudioEnabled ? '#08080a' : '#fff',
        }}
        onClick={toggleRadarAudio}
        title="Toggle proximity audio radar"
      >
        {radarAudioEnabled ? '🔊' : '🔈'}
      </button>

      {/* AR depth-sensing toggle. Only rendered once capability detection
          has resolved true — no point showing a button that will just
          error out on unsupported browsers/devices. Sim mode has no
          camera/XR surface to anchor a session to, so it's hidden there
          too. */}
      {!simMode && arDepthSupported && (
        <button
          style={{
            ...styles.arDepthBtn,
            background: arDepthActive ? 'rgba(88,166,255,0.85)' : 'rgba(0,0,0,0.4)',
            color: arDepthActive ? '#08080a' : '#fff',
          }}
          onClick={toggleARDepth}
          title="Toggle AR depth + surface detection"
        >
          {arDepthActive ? '🧊' : '◻︎'}
        </button>
      )}

      {/* NEW: in-game battery meter + out-of-battery lockout gate. */}
      <BatteryDrainSim
        energyPercent={energyPercent}
        locked={batteryLocked}
        onPlugIn={plugInPowerBank}
      />

      <ObstacleCollisionOverlay
        playerPos={playerPos}
        obstacles={OBSTACLE_ZONES}
        onLockChange={setControlsLocked}
      />

      {/* NEW: nearbyPlayerCount/herdModeActive feed the heavier "herd"
          visual — see PlayerStampedeOverlay.jsx for the actual rendering
          of the extra sprinting silhouettes. Passing the pre-computed
          count avoids that component needing its own haversine math. */}
      <PlayerStampedeOverlay
        players={stampedePlayers}
        selfId={playerId}
        playerPos={playerPos}
        screenW={dims.w}
        screenH={dims.h}
        nearbyPlayerCount={nearbyPlayerCount}
        herdModeActive={herdModeActive}
        herdThreshold={STAMPEDE_HERD_THRESHOLD}
      />

      {nearestTracked && (
        <RadarIndicator
          type={nearestTracked.type}
          distanceMeters={nearestTracked.distance}
          bearingDeg={nearestTracked.bearing}
          headingDeg={heading}
        />
      )}

      {/* BUG FIX (canvas projection clipping): the "Xm away" edge label
          previously sat in the same stacking context as the veggie icons
          below it with no explicit isolation, so PerspectiveGridOverlay's
          grid lines (drawn after it in some paint orders) could clip
          through the label. Wrapping each label in its own
          isolate-stacking div with a higher zIndex than the grid overlay
          fixes the paint order regardless of DOM position. */}
      {edgeVeggies.map((v) => (
        <div
          key={`edge-${v.id}`}
          style={{
            ...styles.edgeIndicator,
            [v.side === 'left' ? 'left' : 'right']: 12,
            top: dims.h * 0.4,
            transform: `translateY(-50%) rotate(${v.side === 'left' ? -90 : 90}deg)`,
          }}
        >
          <span style={{ transform: `rotate(${v.side === 'left' ? 90 : -90}deg)`, display: 'inline-block' }}>
            ▲ {Math.round(v.distance)}m
          </span>
        </div>
      ))}

      {/* NEW: activeScale/status feed the dynamic proximity-zoom + label
          behavior — see ViewfinderBox.jsx. `status` flips to 'locking'
          while CaptureThrow has an active net-lock (lockedVeggieIds
          non-empty), so the reticle's "SYNCING..." flash lines up with a
          real lock/hold cycle rather than being purely decorative. */}
      <ViewfinderBox
        centerX={crosshairX}
        centerY={crosshairY}
        active={targetInFrame}
        size={VIEWFINDER_SIZE_PX}
        status={lockedVeggieIds.size > 0 ? 'locking' : 'searching'}
        activeScale={nearestTargetScale}
      />

      {visibleVeggies.map((v) =>
        v.type === HACKED_TARGET_VEGGIE_TYPE ? (
          // NEW: legendary hacked-target entity — rendered with its own
          // sprite (original design, see HackedTargetSprite.jsx) rather
          // than going through VeggieSprite's normal camouflage/reveal
          // pipeline, since it should never be hidden once spawned.
          <div
            key={v.id}
            style={{
              position: 'absolute',
              left: v.x,
              top: v.y,
              transform: `translate(-50%, -50%) scale(${v.scale || 1})`,
              zIndex: 25,
              cursor: v.distance <= CATCH_RADIUS_METERS ? 'pointer' : 'default',
            }}
            onClick={() => v.distance <= CATCH_RADIUS_METERS && handleCatch(v.id)}
          >
            <HackedTargetSprite
              scale={v.scale}
              catchMode={v.distance <= CATCH_RADIUS_METERS}
              locked={lockedVeggieIds.has(v.id)}
            />
          </div>
        ) : (
          <VeggieSprite
            key={v.id}
            id={v.id}
            type={v.type}
            distance={v.distance}
            camouflageDistance={CAMOUFLAGE_DISTANCE_METERS}
            revealDistance={REVEAL_DISTANCE_METERS}
            gpsX={v.x}
            gpsY={v.y}
            scale={v.scale}
            catchMode={v.distance <= CATCH_RADIUS_METERS}
            locked={lockedVeggieIds.has(v.id)}
            screenW={dims.w}
            screenH={dims.h}
            crosshairX={crosshairX}
            crosshairY={crosshairY}
            onCatch={handleCatch}
          />
        )
      )}

      {/* Wires onLockStart (marks lockedVeggieIds) and onMiss (clears it
          on a broken/expired lock) alongside the existing onHit. Previously
          onMiss was a no-op — that was fine when a miss couldn't have a
          target attached to it, but now a broken lock does carry a
          veggieId that needs cleaning up, or that veggie's sprite would
          stay frozen forever thinking it's still netted. */}
      <CaptureThrow
        targets={throwTargets}
        onHit={handleCatch}
        onMiss={handleThrowMiss}
        onLockStart={handleLockStart}
        screenW={dims.w}
        screenH={dims.h}
        disabled={controlsLocked || batteryLocked}
      />

      <ScorePopupLayer popups={scorePopups} onPopupDone={removePopup} />

      {/* Minimal AR depth HUD — surface count + center-of-frame distance,
          plus the wall-gate warning when it's actively suppressing the
          CATCH button. Deliberately not drawing plane outlines here
          (that's a bigger perspective-projection job left for
          PerspectiveGridOverlay/a follow-up); this is just enough
          feedback for a player to understand why CATCH might be
          disabled. */}
      {arDepthActive && (
        <div style={styles.arDepthHud}>
          <div>SURFACES: {arPlaneCount} ({floorPlanes.length} floor / {wallPlanes.length} wall)</div>
          <div>
            CENTER DEPTH: {centerDepthMeters != null ? `${centerDepthMeters.toFixed(2)}m` : '—'}
          </div>
          {arWallBlocked && <div style={styles.arDepthWarning}>TOO CLOSE — AIM AT OPEN SPACE</div>}
        </div>
      )}
      {arDepthError && <div style={styles.arDepthErrorToast}>{arDepthError}</div>}

      {captureOverlay && (
        <div style={styles.captureVignette}>
          <div
            style={{
              ...styles.captureCircle,
              boxShadow: captureOverlay.legendary ? '0 0 90px #ff3355' : '0 0 60px #FFD700',
            }}
          >
            <span style={{ fontSize: '64px' }}>
              {captureOverlay.legendary ? '⚠' : VEGGIE_ICON[captureOverlay.veggieType] || '🥕'}
            </span>
          </div>
          <h2
            style={{
              ...styles.captureLabel,
              color: captureOverlay.legendary ? '#ff3355' : '#FFD700',
            }}
          >
            +{captureOverlay.points || 0}
          </h2>
          {captureOverlay.legendary && <p style={styles.legendaryLabel}>HACKED TARGET NEUTRALIZED</p>}
        </div>
      )}

      {simMode && <div style={styles.simHint}>WASD / Arrow keys to move</div>}

      <div style={styles.bottomBar}>
        <button
          style={{
            ...styles.catchBtn,
            opacity: nearestCatchable && !arWallBlocked && !batteryLocked ? 1 : 0.5,
          }}
          disabled={catchDisabled}
          onClick={handleCatchButtonTap}
        >
          CATCH
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: { position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#000' },
  video: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  simBackground: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(180deg, #6ee7b7 0%, #86efac 45%, #4ade80 100%)',
  },
  scoreboardLayer: {
    position: 'absolute', top: 0, left: 0, right: 90, zIndex: 30, pointerEvents: 'none',
  },
  exitBtn: {
    position: 'absolute', top: 10, right: 140, zIndex: 50, width: 30, height: 30, borderRadius: '50%',
    background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer',
  },
  radarAudioBtn: {
    position: 'absolute', top: 10, right: 100, zIndex: 50, width: 30, height: 30, borderRadius: '50%',
    border: 'none', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  arDepthBtn: {
    position: 'absolute', top: 10, right: 60, zIndex: 50, width: 30, height: 30, borderRadius: '50%',
    border: 'none', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  arDepthHud: {
    position: 'absolute', top: 50, right: 12, zIndex: 50, padding: '6px 10px', borderRadius: 8,
    background: 'rgba(0,0,0,0.5)', color: '#58a6ff', fontFamily: "'Orbitron', monospace",
    fontSize: 10, letterSpacing: 0.5, textAlign: 'right', pointerEvents: 'none',
  },
  arDepthWarning: { color: '#FFD700', marginTop: 4 },
  arDepthErrorToast: {
    position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)', zIndex: 55,
    padding: '6px 12px', borderRadius: 8, background: 'rgba(255,92,92,0.85)', color: '#08080a',
    fontFamily: "'Fredoka', sans-serif", fontSize: 12, maxWidth: '80%', textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 40,
  },
  simHint: {
    position: 'absolute', bottom: 84, left: 0, right: 0, textAlign: 'center', zIndex: 40,
    color: 'rgba(255,255,255,0.75)', fontFamily: "'Orbitron', monospace", fontSize: 11,
    letterSpacing: 0.5, pointerEvents: 'none',
  },
  catchBtn: {
    padding: '14px 32px', borderRadius: 999, border: '2px solid rgba(255,255,255,0.4)',
    background: 'rgba(57,255,136,0.85)', color: '#08080a', fontWeight: 800, fontSize: 14, letterSpacing: 1,
    cursor: 'pointer',
  },
  edgeIndicator: {
    position: 'absolute', zIndex: 35, isolation: 'isolate', color: '#FFD700', fontWeight: 800, fontSize: 11,
    fontFamily: "'Orbitron', monospace", textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
    pointerEvents: 'none', whiteSpace: 'nowrap', overflow: 'visible',
  },
  captureVignette: {
    position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(circle at center, transparent 0%, rgba(8,8,10,0.85) 72%)',
    pointerEvents: 'none',
  },
  captureCircle: {
    width: '150px', height: '150px', borderRadius: '50%', backgroundColor: '#F5F0E8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  captureLabel: {
    fontSize: '28px', fontWeight: 800, marginTop: '16px',
    textShadow: '2px 2px 0px #000', fontFamily: "'Orbitron', sans-serif", letterSpacing: '1px',
  },
  legendaryLabel: {
    marginTop: 6, fontSize: 11, letterSpacing: 2, color: '#ff3355',
    fontFamily: "'Orbitron', sans-serif", fontWeight: 700,
  },
  permissionWrapper: {
    minHeight: '100vh', backgroundColor: '#08080a', color: '#F5F0E8',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '32px', fontFamily: "'Fredoka', sans-serif", textAlign: 'center',
  },
  permissionTitle: {
    fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: '30px',
    color: '#FFD700', letterSpacing: '2px', marginBottom: '16px',
  },
  permissionText: { fontSize: '14px', color: '#e0c98a', maxWidth: '340px', marginBottom: '24px', lineHeight: 1.5 },
  permissionError: { color: '#ff5c5c', fontSize: '13px', marginBottom: '16px', maxWidth: '320px' },
  permissionButton: {
    background: 'linear-gradient(180deg, #FFD700, #B8860B)', color: '#08080a', fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700, fontSize: '17px', letterSpacing: '1.5px', border: 'none', borderRadius: '10px',
    padding: '14px 36px', cursor: 'pointer', marginBottom: '14px',
  },
  simButton: {
    background: 'transparent', color: '#e0c98a', fontFamily: "'Orbitron', sans-serif",
    fontWeight: 600, fontSize: '12px', letterSpacing: '1px', border: '1px solid rgba(224,201,138,0.4)',
    borderRadius: '8px', padding: '10px 24px', cursor: 'pointer',
  },
};
