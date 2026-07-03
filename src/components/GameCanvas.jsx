import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import VeggieSprite from './veggies/VeggieSprite.jsx';
import CaptureThrow from './CaptureThrow.jsx';
import Scoreboard from './Scoreboard.jsx';
import RadarIndicator from './RadarIndicator.jsx';
import ObstacleCollisionOverlay from './ObstacleCollisionOverlay.jsx';
import PlayerStampedeOverlay from './PlayerStampedeOverlay.jsx';
import PerspectiveGridOverlay from './PerspectiveGridOverlay.jsx';
import ViewfinderBox from './ViewfinderBox.jsx';
import { ScorePopupLayer, useScorePopups } from './ScorePopup.jsx';
import { useVeggieTaunt } from './veggies/useVeggieTaunt.js';
import { OBSTACLE_ZONES } from '../config/obstacles.js';
import {
  fetchPlayers,
  fetchVeggies,
  subscribeToRoom,
  captureVeggie,
  makeThrottledLocationWriter,
} from '../lib/gameClient.js';

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

// GPS write throttle — see gameClient.makeThrottledLocationWriter. Tuned to
// stay well under Supabase Realtime's free-tier message quota with a few
// concurrent players: ~1 write per 3s per player, or on a 5m move,
// whichever comes first.
const LOCATION_WRITE_MIN_INTERVAL_MS = 3000;
const LOCATION_WRITE_MIN_DISTANCE_M = 5;

// ---------------------------------------------------------------------------
// Geo math — accurate haversine distance/bearing (good at any latitude,
// unlike a flat equirectangular approximation).
// ---------------------------------------------------------------------------
const EARTH_RADIUS_M = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

function metersBetween(a, b) {
  if (!a || !b) return Infinity;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function bearingDegrees(a, b) {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Wrap a bearing delta to (-180, 180]
function normalizeRelAngle(deg) {
  return ((deg + 540) % 360) - 180;
}

// Projects a veggie into screen space using its bearing *relative to where
// the phone is actually pointing* (heading), not a fixed north-up radial
// layout.
function bearingScreenPos(relAngle, dist, screenW, screenH) {
  const nx = 0.5 + (relAngle / (FOV_DEG / 2)) * 0.5;
  const ny = Math.max(0.02, Math.min(1, 1 - dist / VISIBILITY_RADIUS_METERS));
  const zFactor = 0.7 + (1.0 - ny) * 0.9;
  const x = screenW / 2 + (nx - 0.5) * screenW / zFactor;
  const y = screenH * (0.15 + ny * 0.8);
  const scale = 1.1 / zFactor;
  return { x, y, scale };
}

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

  // Permission gate (camera + geolocation + compass)
  const [permissionStage, setPermissionStage] = useState('idle');
  const [permissionError, setPermissionError] = useState('');

  const [heading, setHeading] = useState(0);
  const [captureOverlay, setCaptureOverlay] = useState(null);

  const keyVelRef = useRef({ x: 0, y: 0 });
  const keysHeldRef = useRef(new Set());
  const headingRef = useRef(0);
  const streamRef = useRef(null);
  const watchIdRef = useRef(null);
  const orientationCleanupRef = useRef(null);
  const locationWriterRef = useRef(null);

  const { tauntFromFrame } = useVeggieTaunt();

  // Floating "+points" popups fired on capture — see ScorePopup.jsx
  const { popups: scorePopups, spawnPopup, removePopup } = useScorePopups();

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
      if (videoRef.current) videoRef.current.srcObject = stream;

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

  const enterSimMode = useCallback(() => {
    setSimMode(true);
    setPermissionStage('ready');
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (orientationCleanupRef.current) orientationCleanupRef.current();
    };
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
      if (!KEY_VECTORS[k] || controlsLocked) return;
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
  }, [simMode, controlsLocked]);

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
        const targetHeading = (toDeg(Math.atan2(x, -y)) + 360) % 360;
        headingRef.current = targetHeading;
        setHeading(targetHeading);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [simMode, playerPos]);

  // -------------------------------------------------------------------
  // Supabase: initial fetch + realtime subscription
  //
  // Replaces the old single 'game-state' socket event. Postgres doesn't
  // push a full-state snapshot on every change the way the old tick engine
  // did — instead we seed local state once via fetch, then patch it
  // incrementally from postgres_changes payloads.
  // -------------------------------------------------------------------
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

  // -------------------------------------------------------------------
  // Obstacle zones + nearby-stampede warning
  //
  // FIX: previously duplicated ObstacleCollisionOverlay/PlayerStampede-
  // Overlay's own internal logic here (activeObstacle/nearbyStampede
  // state) and then rendered those components with props they don't
  // actually accept (`obstacle`, `count`) — so the real components' own
  // proximity checks, cooldown timers, and rendering never ran; only this
  // dead parallel logic did. Both components are now handed the raw
  // inputs they're actually built for (playerPos/obstacles/onLockChange
  // and players/selfId/playerPos/screenW/screenH) and manage their own
  // state internally — see render section below. controlsLocked is now
  // driven purely by ObstacleCollisionOverlay's onLockChange callback.
  // -------------------------------------------------------------------
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

  // -------------------------------------------------------------------
  // Derived view data — bearing-relative, heading-corrected positions
  // -------------------------------------------------------------------
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
            const screenPos = bearingScreenPos(relAngle, dist, dims.w, dims.h);
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

  // Spatialized taunt audio — feeds whatever's currently in view (on-screen
  // + just-off-screen) to useVeggieTaunt, which handles its own per-veggie
  // cooldown and distance falloff. Was built (useVeggieTaunt.js) but never
  // actually called from anywhere before this.
  useEffect(() => {
    tauntFromFrame([...visibleVeggies, ...edgeVeggies]);
  }, [visibleVeggies, edgeVeggies, tauntFromFrame]);

  // CaptureThrow needs {id, x, y, radius} targets in screen space — only
  // sensible for veggies already projected onto the visible AR view.
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

  // Vanguard viewfinder lock-on: true when any currently-visible veggie's
  // projected screen position falls inside the centered ViewfinderBox.
  // Drives ViewfinderBox's highlighted/pulsing state.
  const targetInFrame = useMemo(
    () =>
      visibleVeggies.some(
        (v) =>
          Math.abs(v.x - crosshairX) < VIEWFINDER_SIZE_PX / 2 &&
          Math.abs(v.y - crosshairY) < VIEWFINDER_SIZE_PX / 2
      ),
    [visibleVeggies, crosshairX, crosshairY]
  );

  // Capture now goes through the atomic capture_veggie RPC instead of an
  // 'capture-attempt' emit + waiting on a 'veggieCaught' broadcast. The
  // response comes back synchronously from the same call, so success/fail
  // handling lives right here instead of in a separate event listener that
  // has to match the request up after the fact.
  //
  // FIX: captureVeggie() per gameClient.js's real signature only takes
  // (veggieId, playerId) — the extra playerPos.lat/lng args previously
  // sent here were silently dropped by JS (not a hard error), but they
  // implied a server-side proximity check that capture_veggie() doesn't
  // currently perform. Flagging rather than inventing one: if you want
  // anti-cheat distance validation on captures, that needs to be added to
  // capture_veggie() in supabase/schema.sql and gameClient.js's wrapper
  // updated to send lat/lng again — this call now just matches what
  // actually exists today.
  //
  // FIX: the captured veggie's real type is now looked up locally
  // (from the last-known `veggies` state, before it's removed) instead
  // of hardcoding 'carrot' in the celebration popup.
  //
  // NOTE: capture_veggie()'s success-case return shape isn't documented
  // in gameClient.js's comments (only the failure shape is:
  // { success:false, reason:'already_gone' }). The field reads below
  // try a couple of plausible names defensively — confirm the real
  // column/return names against supabase/schema.sql and simplify once
  // confirmed.
  //
  // NEW: also looks the veggie up in `visibleVeggies` (not just `veggies`)
  // to grab its last-known screen x/y, so the floating "+points" popup
  // (ScorePopup) spawns at the exact spot the veggie was caught instead of
  // defaulting to screen center.
  const handleCatch = useCallback(
    async (veggieId) => {
      if (controlsLocked || !playerId) return;
      const caughtVeggie = veggies.find((v) => v.id === veggieId);
      const caughtScreenPos = visibleVeggies.find((v) => v.id === veggieId);
      try {
        const result = await captureVeggie(veggieId, playerId);
        if (!result?.success) return; // someone else caught it first, or it's already gone

        setVeggies((prev) => prev.filter((v) => v.id !== veggieId));

        const points = result.points ?? result.points_gained ?? 0;
        const newScore = result.new_score ?? result.updated_score ?? null;
        const playerName = result.player_name ?? nickname;

        setFlashPoints(points);
        setCaptureOverlay({
          veggieType: caughtVeggie?.veggie_type || 'carrot',
          points,
          playerName,
          newScore,
        });
        spawnPopup({
          x: caughtScreenPos?.x ?? crosshairX,
          y: caughtScreenPos?.y ?? crosshairY,
          value: points,
        });
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => setFlashPoints(null), 1200);
        setTimeout(() => setCaptureOverlay(null), 1800);
      } catch (err) {
        console.error('[GameCanvas] capture failed', err);
      }
    },
    [playerId, controlsLocked, veggies, visibleVeggies, nickname, spawnPopup, crosshairX, crosshairY]
  );

  // Bottom CATCH button — grabs whichever visible veggie is currently
  // within CATCH_RADIUS_METERS, if any. CaptureThrow (the swipe-fling
  // gesture layer) remains available at the same time for the more
  // active capture mechanic; this button is the simple one-tap fallback.
  const nearestCatchable = visibleVeggies.find((v) => v.distance <= CATCH_RADIUS_METERS);
  const handleCatchButtonTap = useCallback(() => {
    if (nearestCatchable) handleCatch(nearestCatchable.id);
  }, [nearestCatchable, handleCatch]);

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

      {/* 3D vanishing-point radar grid, drawn directly over the camera feed */}
      <PerspectiveGridOverlay />

      <Scoreboard
        players={Object.fromEntries(players.map((p) => [p.slot_id, { name: p.name, score: p.score }]))}
        mySlot={players.find((p) => p.id === playerId)?.slot_id}
        flashPoints={flashPoints}
      />

      <button style={styles.exitBtn} onClick={onExit}>✕</button>

      {/* FIX: real props this component actually accepts — it manages its
          own proximity detection, cooldown, and lockout timing internally
          and reports lock state back up via onLockChange. */}
      <ObstacleCollisionOverlay
        playerPos={playerPos}
        obstacles={OBSTACLE_ZONES}
        onLockChange={setControlsLocked}
      />

      {/* FIX: real props this component actually accepts — it computes
          who's nearby (and from which real-world bearing) internally. */}
      <PlayerStampedeOverlay
        players={stampedePlayers}
        selfId={playerId}
        playerPos={playerPos}
        screenW={dims.w}
        screenH={dims.h}
      />

      {nearestTracked && (
        <RadarIndicator
          type={nearestTracked.type}
          distanceMeters={nearestTracked.distance}
          bearingDeg={nearestTracked.bearing}
          headingDeg={heading}
        />
      )}

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

      {/* Vanguard viewfinder — replaces the old plain circular crosshair.
          Lights up green + shows a lock label once a visible veggie's
          projected position sits inside it (targetInFrame). */}
      <ViewfinderBox centerX={crosshairX} centerY={crosshairY} active={targetInFrame} size={VIEWFINDER_SIZE_PX} />

      {visibleVeggies.map((v) => (
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
          screenW={dims.w}
          screenH={dims.h}
          crosshairX={crosshairX}
          crosshairY={crosshairY}
          onCatch={handleCatch}
        />
      ))}

      {/* FIX: was built but never mounted. Full-screen swipe-to-throw
          gesture layer, sits above the camera/sprites but below the exit
          button and capture popup (z-index 38 vs 45/50). Disabled during
          an obstacle lockout same as the rest of the controls. */}
      <CaptureThrow
        targets={throwTargets}
        onHit={handleCatch}
        onMiss={() => {}}
        screenW={dims.w}
        screenH={dims.h}
        disabled={controlsLocked}
      />

      {/* Floating "+points" LED popups, one per recent catch */}
      <ScorePopupLayer popups={scorePopups} onPopupDone={removePopup} />

      {captureOverlay && (
        <div style={styles.captureVignette}>
          <div style={styles.captureCircle}>
            <span style={{ fontSize: '64px' }}>
              {VEGGIE_ICON[captureOverlay.veggieType] || '🥕'}
            </span>
          </div>
          <h2 style={styles.captureLabel}>+{captureOverlay.points || 0}</h2>
        </div>
      )}

      {simMode && <div style={styles.simHint}>WASD / Arrow keys to move</div>}

      <div style={styles.bottomBar}>
        {/* FIX: previously had no onClick at all — a fully inert button.
            Now catches whichever visible veggie is in range, as a simple
            one-tap alternative to the CaptureThrow swipe gesture above. */}
        <button
          style={{
            ...styles.catchBtn,
            opacity: nearestCatchable ? 1 : 0.5,
          }}
          disabled={controlsLocked || !nearestCatchable}
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
  exitBtn: {
    position: 'absolute', top: 10, right: 100, zIndex: 50, width: 30, height: 30, borderRadius: '50%',
    background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer',
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
    position: 'absolute', zIndex: 20, color: '#FFD700', fontWeight: 800, fontSize: 11,
    fontFamily: "'Orbitron', monospace", textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
    pointerEvents: 'none',
  },
  captureVignette: {
    position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(circle at center, transparent 0%, rgba(8,8,10,0.85) 72%)',
    pointerEvents: 'none',
  },
  captureCircle: {
    width: '150px', height: '150px', borderRadius: '50%', backgroundColor: '#F5F0E8',
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px #FFD700',
  },
  captureLabel: {
    fontSize: '28px', fontWeight: 800, marginTop: '16px', color: '#FFD700',
    textShadow: '2px 2px 0px #000', fontFamily: "'Orbitron', sans-serif", letterSpacing: '1px',
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
