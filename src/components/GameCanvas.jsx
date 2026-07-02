import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import VeggieSprite from './veggies/VeggieSprite.jsx';
import Scoreboard from './Scoreboard.jsx';
import RadarIndicator from './RadarIndicator.jsx';
import ObstacleCollisionOverlay from './ObstacleCollisionOverlay.jsx';
import PlayerStampedeOverlay from './PlayerStampedeOverlay.jsx';
import { OBSTACLE_ZONES } from '../config/obstacles.js';
import { socket, EVENTS } from '../socket.js';

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
// layout. This is what makes objects stay pinned to their real-world spot
// as the player physically turns — the piece the north-fixed version was
// missing.
function bearingScreenPos(relAngle, dist, screenW, screenH) {
  const nx = 0.5 + (relAngle / (FOV_DEG / 2)) * 0.5;
  const ny = Math.max(0.02, Math.min(1, 1 - dist / VISIBILITY_RADIUS_METERS));
  const zFactor = 0.7 + (1.0 - ny) * 0.9;
  const x = screenW / 2 + (nx - 0.5) * screenW / zFactor;
  const y = screenH * (0.15 + ny * 0.8);
  const scale = 1.1 / zFactor;
  return { x, y, scale };
}

export default function GameCanvas({ roomCode, nickname, selfId, onExit }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [playerPos, setPlayerPos] = useState(null);
  const [simMode, setSimMode] = useState(false);
  const [players, setPlayers] = useState([]);
  const [veggies, setVeggies] = useState([]);
  const [flashPoints, setFlashPoints] = useState(null);
  const [controlsLocked, setControlsLocked] = useState(false);

  // Permission gate (camera + geolocation + compass), mirroring the
  // explicit idle -> requesting -> ready/denied flow so failures surface a
  // real message instead of silently falling back.
  const [permissionStage, setPermissionStage] = useState('idle');
  const [permissionError, setPermissionError] = useState('');

  const [heading, setHeading] = useState(0);
  const [activeObstacle, setActiveObstacle] = useState(null);
  const [nearbyStampede, setNearbyStampede] = useState(null);
  const [captureOverlay, setCaptureOverlay] = useState(null);

  const keyVelRef = useRef({ x: 0, y: 0 });
  const keysHeldRef = useRef(new Set());
  const headingRef = useRef(0);
  const streamRef = useRef(null);
  const watchIdRef = useRef(null);
  const orientationCleanupRef = useRef(null);

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
      () => {}, // keep whatever the last known position was rather than hard-failing mid-game
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }, []);

  // -------------------------------------------------------------------
  // Unified permission request: camera -> compass (iOS gesture-gated) ->
  // one-shot location fix -> start watchers. Falls back to keyboard-driven
  // simulation mode on request if the person doesn't have/want camera+GPS.
  // -------------------------------------------------------------------
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

  // -------------------------------------------------------------------
  // Viewport size tracking
  // -------------------------------------------------------------------
  useEffect(() => {
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Seed a fake origin once simulation mode kicks in
  useEffect(() => {
    if (simMode && !playerPos) setPlayerPos({ lat: 37.7749, lng: -122.4194 });
  }, [simMode, playerPos]);

  // Keyboard-driven sim movement (WASD / arrow keys) — replaces the old
  // on-screen joystick. Holding a direction key sets a unit velocity vector;
  // releasing it clears that axis. There's no real compass in sim mode, so
  // movement direction also drives a virtual heading, keeping the same
  // FOV-relative projection logic used for real AR play.
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
  // Socket wiring
  // -------------------------------------------------------------------
  useEffect(() => {
    const onGameState = (state) => {
      setPlayers(state.players || []);
      setVeggies(state.vegetables || []);
    };
    const onCaptureResult = ({ veggieId, success, points, veggieType, playerName, playerColor, newScore }) => {
      if (success) {
        setVeggies((prev) => prev.filter((v) => v.id !== veggieId));
        setFlashPoints(points);
        setCaptureOverlay({ veggieType: veggieType || 'carrot', points, playerName, playerColor, newScore });
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => setFlashPoints(null), 1200);
        setTimeout(() => setCaptureOverlay(null), 1800);
      }
    };
    const onPointSteal = ({ targetId }) => {
      if (targetId === selfId) {
        confetti({ particleCount: 20, spread: 40, colors: ['#f87171'], origin: { y: 0.3 } });
        if ('vibrate' in navigator) navigator.vibrate([40, 30, 15]);
      }
    };

    socket.on(EVENTS.GAME_STATE, onGameState);
    socket.on(EVENTS.CAPTURE_RESULT, onCaptureResult);
    socket.on(EVENTS.POINT_STEAL, onPointSteal);

    return () => {
      socket.off(EVENTS.GAME_STATE, onGameState);
      socket.off(EVENTS.CAPTURE_RESULT, onCaptureResult);
      socket.off(EVENTS.POINT_STEAL, onPointSteal);
    };
  }, [selfId]);

  // Push location updates to the server
  useEffect(() => {
    if (!playerPos) return;
    socket.emit(EVENTS.LOCATION_UPDATE, { roomCode, lat: playerPos.lat, lng: playerPos.lng });
  }, [playerPos, roomCode]);

  // -------------------------------------------------------------------
  // Obstacle zones — flag when the player walks into one, and let a
  // nearby-stampede warning fire if several other players converge nearby.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!playerPos) return;
    const hit = (OBSTACLE_ZONES || []).find(
      (z) => metersBetween(playerPos, { lat: z.lat, lng: z.lng }) <= (z.radiusMeters || OBSTACLE_TRIGGER_METERS)
    );
    setActiveObstacle(hit || null);
    setControlsLocked(!!hit);
  }, [playerPos]);

  useEffect(() => {
    if (!playerPos) return;
    const nearbyCount = players.filter(
      (p) => p.id !== selfId && p.lat != null && p.lng != null &&
        metersBetween(playerPos, p) <= CAMOUFLAGE_DISTANCE_METERS
    ).length;
    setNearbyStampede(nearbyCount >= 3 ? nearbyCount : null);
  }, [players, playerPos, selfId]);

  // -------------------------------------------------------------------
  // Derived view data — bearing-relative, heading-corrected positions
  // -------------------------------------------------------------------
  const visibleVeggies = [];
  const edgeVeggies = [];
  let nearestTracked = null;

  if (playerPos) {
    veggies.forEach((v) => {
      const dist = metersBetween(playerPos, v);
      const bearing = bearingDegrees(playerPos, v);
      const relAngle = normalizeRelAngle(bearing - headingRef.current);

      if (dist <= VISIBILITY_RADIUS_METERS) {
        if (Math.abs(relAngle) <= FOV_DEG / 2) {
          const screenPos = bearingScreenPos(relAngle, dist, dims.w, dims.h);
          visibleVeggies.push({ ...v, distance: dist, relAngle, ...screenPos });
        } else {
          // In range but outside the camera's field of view — show as an
          // edge indicator instead of just disappearing.
          edgeVeggies.push({ ...v, distance: dist, relAngle, side: relAngle < 0 ? 'left' : 'right' });
        }
      } else if (dist <= TRACKING_RADIUS_METERS) {
        if (!nearestTracked || dist < nearestTracked.distance) {
          nearestTracked = { ...v, distance: dist, bearing };
        }
      }
    });
  }

  const handleCatch = useCallback(
    (veggieId) => {
      if (controlsLocked) return;
      socket.emit(EVENTS.CAPTURE_ATTEMPT, { roomCode, veggieId });
    },
    [roomCode, controlsLocked]
  );

  const handleTackleNearest = useCallback(() => {
    if (controlsLocked) return;
    socket.emit(EVENTS.ATTEMPT_TACKLE, { roomCode });
  }, [roomCode, controlsLocked]);

  const crosshairX = dims.w / 2;
  const crosshairY = dims.h / 2;

  // -------------------------------------------------------------------
  // Permission gate screen
  // -------------------------------------------------------------------
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

      <Scoreboard players={players} selfId={selfId} flashPoints={flashPoints} />

      <button style={styles.exitBtn} onClick={onExit}>✕</button>

      {activeObstacle && (
        <ObstacleCollisionOverlay obstacle={activeObstacle} onDismiss={() => setControlsLocked(false)} />
      )}

      {nearbyStampede && <PlayerStampedeOverlay count={nearbyStampede} />}

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

      {/* Crosshair, always centered */}
      <div style={{ ...styles.crosshair, left: crosshairX - 14, top: crosshairY - 14 }} />

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

      {captureOverlay && (
        <div style={styles.captureVignette}>
          <div style={styles.captureCircle}>
            <span style={{ fontSize: '64px' }}>
              {{ carrot: '🥕', tomato: '🍅', broccoli: '🥦', golden: '⭐' }[captureOverlay.veggieType] || '🥕'}
            </span>
          </div>
          <h2 style={styles.captureLabel}>+{captureOverlay.points || 0}</h2>
        </div>
      )}

      {simMode && <div style={styles.simHint}>WASD / Arrow keys to move</div>}

      <div style={styles.bottomBar}>
        <button style={styles.catchBtn} onClick={handleTackleNearest} disabled={controlsLocked}>
          TACKLE
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
  crosshair: {
    position: 'absolute', width: 28, height: 28, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.8)', zIndex: 25, pointerEvents: 'none',
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
    background: 'rgba(239,68,68,0.85)', color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: 1,
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
