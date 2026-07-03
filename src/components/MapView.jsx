import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchPlayers,
  fetchVeggies,
  subscribeToRoom,
  makeThrottledLocationWriter,
} from '../lib/gameClient';

// ---------------------------------------------------------------------------
// MapView — the "radar screen" step between CharacterSelect and GameCanvas.
//
// Shows a neon-grid map, the player's own avatar pulsing at the center, and
// every nearby Veggimon as a blip positioned by real bearing + distance —
// same haversine math GameCanvas.jsx already uses for AR placement, just
// projected onto a flat 2D radar instead of camera screen space, so a veggie
// caught here and one caught in AR agree on where "close" actually is.
//
// Tapping a blip that's within ENTRY_RADIUS_METERS calls onEnterAR(veggieId)
// — App.jsx wires that to advance stage 3 -> stage 4 (GameCanvas). Tapping a
// blip that's still too far just gives a gentle "get closer" nudge instead.
// ---------------------------------------------------------------------------

const MAP_RADIUS_METERS = 160;   // world distance the radar disc represents edge-to-edge
const ENTRY_RADIUS_METERS = 40;  // how close a veggie needs to be to enter AR on tap
const PULSE_COUNT = 3;

const VEGGIE_ICON = { carrot: '🥕', tomato: '🍅', broccoli: '🥦', golden: '⭐' };
const VEGGIE_COLOR = { carrot: '#ff9f1c', tomato: '#ff4d4d', broccoli: '#39ff88', golden: '#ffca28' };

const SLOT_COLORS = {
  'oggy-blue': '#3a86ff',
  'jack-green': '#2ecc71',
  'olivia-pink': '#ff006e',
  'bob-purple': '#8338ec',
};

// ---------------------------------------------------------------------------
// Geo math — identical conventions to GameCanvas.jsx (haversine distance,
// true-north bearing) so "how far" and "which way" never disagree between
// the map screen and the AR screen a player lands in next.
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

// Projects a bearing/distance pair onto the radar disc. North is up
// (bearing 0 = straight up), matching a conventional map orientation
// rather than the heading-relative rotation GameCanvas uses for AR.
function radarPosition(bearingDeg, distanceM, discRadiusPx) {
  const clamped = Math.min(distanceM, MAP_RADIUS_METERS);
  const r = (clamped / MAP_RADIUS_METERS) * discRadiusPx;
  const rad = toRad(bearingDeg);
  return {
    x: Math.sin(rad) * r,
    y: -Math.cos(rad) * r,
    atEdge: distanceM > MAP_RADIUS_METERS,
  };
}

const LOCATION_WRITE_MIN_INTERVAL_MS = 3000;
const LOCATION_WRITE_MIN_DISTANCE_M = 5;

export default function MapView({ roomCode, playerId, mySlot, onEnterAR, onExit }) {
  const [playerPos, setPlayerPos] = useState(null);
  const [heading, setHeading] = useState(0);
  const [veggies, setVeggies] = useState([]);
  const [players, setPlayers] = useState([]);
  const [permissionError, setPermissionError] = useState('');
  const [toast, setToast] = useState(null);
  const [discSize, setDiscSize] = useState(Math.min(340, window.innerWidth - 48));

  const watchIdRef = useRef(null);
  const orientationCleanupRef = useRef(null);
  const locationWriterRef = useRef(null);
  const toastTimerRef = useRef(null);

  // -------------------------------------------------------------------
  // Geolocation — continuous watch, same accuracy/interval profile as
  // GameCanvas.jsx so the transition into AR doesn't cause a visible jump.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionError('This device does not support location services.');
      return undefined;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setPlayerPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setPermissionError('Location permission is required to see the map.'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Compass heading — used only to rotate the little avatar wedge so it
  // visually "faces" the way the phone is pointed; the radar itself stays
  // north-up so blips don't spin every time the player turns.
  useEffect(() => {
    const handleOrientation = (event) => {
      let h = null;
      if (typeof event.webkitCompassHeading === 'number') {
        h = event.webkitCompassHeading;
      } else if (typeof event.alpha === 'number') {
        h = (360 - event.alpha) % 360;
      }
      if (h !== null) setHeading(h);
    };
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      orientationCleanupRef.current = () =>
        window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
      orientationCleanupRef.current = () =>
        window.removeEventListener('deviceorientation', handleOrientation, true);
    }
    return () => orientationCleanupRef.current?.();
  }, []);

  useEffect(() => {
    const onResize = () => setDiscSize(Math.min(340, window.innerWidth - 48));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // -------------------------------------------------------------------
  // Supabase: initial fetch + realtime — same pattern GameCanvas.jsx uses,
  // so veggie/player state is already warm by the time AR mounts.
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
        console.error('[MapView] initial fetch failed', err);
      }
    })();

    const unsubscribe = subscribeToRoom(roomCode, {
      onPlayerChange: (payload) => {
        setPlayers((prev) => {
          if (payload.eventType === 'DELETE') return prev.filter((p) => p.id !== payload.old.id);
          const idx = prev.findIndex((p) => p.id === payload.new.id);
          if (idx === -1) return [...prev, payload.new];
          const next = [...prev];
          next[idx] = payload.new;
          return next;
        });
      },
      onVeggieChange: (payload) => {
        setVeggies((prev) => {
          if (payload.eventType === 'DELETE') return prev.filter((v) => v.id !== payload.old.id);
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

  // Throttled GPS writer — keeps this player's dot live on every other
  // player's map/radar too, same throttle profile as GameCanvas.jsx.
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

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const showToast = useCallback((message) => {
    clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 1800);
  }, []);

  // -------------------------------------------------------------------
  // Derived blip data
  // -------------------------------------------------------------------
  const discRadiusPx = discSize / 2;

  const veggieBlips = useMemo(() => {
    if (!playerPos) return [];
    return veggies.map((v) => {
      const vPos = { lat: v.latitude, lng: v.longitude };
      const distance = metersBetween(playerPos, vPos);
      const bearing = bearingDegrees(playerPos, vPos);
      const { x, y, atEdge } = radarPosition(bearing, distance, discRadiusPx - 22);
      return { ...v, type: v.veggie_type, distance, bearing, x, y, atEdge };
    });
  }, [veggies, playerPos, discRadiusPx]);

  const playerBlips = useMemo(() => {
    if (!playerPos) return [];
    return players
      .filter((p) => p.id !== playerId && p.latitude != null && p.longitude != null)
      .map((p) => {
        const pPos = { lat: p.latitude, lng: p.longitude };
        const distance = metersBetween(playerPos, pPos);
        const bearing = bearingDegrees(playerPos, pPos);
        const { x, y, atEdge } = radarPosition(bearing, distance, discRadiusPx - 22);
        return { ...p, distance, bearing, x, y, atEdge };
      });
  }, [players, playerId, playerPos, discRadiusPx]);

  const nearestVeggie = useMemo(() => {
    if (!veggieBlips.length) return null;
    return veggieBlips.reduce((a, b) => (a.distance < b.distance ? a : b));
  }, [veggieBlips]);

  const handleBlipTap = useCallback(
    (veggie) => {
      if (veggie.distance <= ENTRY_RADIUS_METERS) {
        onEnterAR?.(veggie.id);
      } else {
        showToast(`Get closer — ${Math.round(veggie.distance - ENTRY_RADIUS_METERS)}m to go`);
      }
    },
    [onEnterAR, showToast]
  );

  return (
    <div style={styles.wrap}>
      <div style={styles.scanGrid} />

      <div style={styles.topBar}>
        <div style={styles.roomChip}>ARENA {roomCode}</div>
        <button style={styles.exitBtn} onClick={onExit}>✕</button>
      </div>

      {nearestVeggie && (
        <div style={styles.trackerChip}>
          <span>{VEGGIE_ICON[nearestVeggie.type] || '🥕'}</span>
          <span>
            Nearest: {Math.round(nearestVeggie.distance)}m
            {nearestVeggie.distance <= ENTRY_RADIUS_METERS ? ' — TAP TO HUNT' : ''}
          </span>
        </div>
      )}

      {permissionError ? (
        <div style={styles.permissionCard}>
          <p style={styles.permissionText}>{permissionError}</p>
        </div>
      ) : !playerPos ? (
        <div style={styles.permissionCard}>
          <p style={styles.permissionText}>Locking satellite position…</p>
        </div>
      ) : (
        <div style={{ ...styles.discOuter, width: discSize, height: discSize }}>
          {/* Radar rings */}
          <div style={styles.discRing1} />
          <div style={styles.discRing2} />
          <div style={styles.discRing3} />

          {/* Player pulse rings, centered */}
          {Array.from({ length: PULSE_COUNT }).map((_, i) => (
            <motion.div
              key={i}
              style={styles.pulseRing}
              initial={{ scale: 0.2, opacity: 0.55 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: 'easeOut',
                delay: (i * 2.6) / PULSE_COUNT,
              }}
            />
          ))}

          {/* Other players */}
          <AnimatePresence>
            {playerBlips.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{
                  opacity: p.atEdge ? 0.55 : 1,
                  scale: 1,
                  x: p.x,
                  y: p.y,
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                style={styles.playerBlip}
              >
                <span
                  style={{
                    ...styles.playerDot,
                    background: SLOT_COLORS[p.slot_id] || '#8a8a93',
                    boxShadow: `0 0 8px ${SLOT_COLORS[p.slot_id] || '#8a8a93'}`,
                  }}
                />
                <span style={styles.playerLabel}>{p.name}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Veggimon blips */}
          <AnimatePresence>
            {veggieBlips.map((v) => {
              const inRange = v.distance <= ENTRY_RADIUS_METERS;
              const color = VEGGIE_COLOR[v.type] || '#ffca28';
              return (
                <motion.button
                  key={v.id}
                  type="button"
                  onClick={() => handleBlipTap(v)}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{
                    opacity: v.atEdge ? 0.6 : 1,
                    scale: inRange ? [1, 1.12, 1] : 1,
                    x: v.x,
                    y: v.y,
                  }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={
                    inRange
                      ? { scale: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } }
                      : { type: 'spring', stiffness: 140, damping: 16 }
                  }
                  style={{
                    ...styles.veggieBlip,
                    border: `2px solid ${color}`,
                    boxShadow: inRange ? `0 0 18px ${color}` : `0 0 6px ${color}88`,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{VEGGIE_ICON[v.type] || '🥕'}</span>
                  {inRange && <span style={{ ...styles.blipRing, borderColor: color }} />}
                </motion.button>
              );
            })}
          </AnimatePresence>

          {/* Player avatar, always centered, wedge rotates with heading */}
          <div style={styles.avatarWrap}>
            <div style={{ ...styles.avatarWedge, transform: `rotate(${heading}deg)` }} />
            <div
              style={{
                ...styles.avatarDot,
                background: SLOT_COLORS[mySlot] || '#ffca28',
                boxShadow: `0 0 14px ${SLOT_COLORS[mySlot] || '#ffca28'}`,
              }}
            />
          </div>
        </div>
      )}

      <p style={styles.helpText}>
        {veggieBlips.length === 0
          ? 'Scanning the yard for hidden veggies…'
          : 'Walk toward a blip, then tap it once it glows to start the hunt.'}
      </p>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={styles.toast}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  wrap: {
    position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', background: '#08080a', overflow: 'hidden',
    fontFamily: "'Fredoka', sans-serif", color: '#f5f5f7',
  },
  scanGrid: {
    position: 'absolute', inset: 0, zIndex: 0,
    backgroundImage:
      'linear-gradient(rgba(57,255,136,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,136,0.06) 1px, transparent 1px)',
    backgroundSize: '28px 28px',
    maskImage: 'radial-gradient(ellipse at 50% 40%, black 0%, transparent 78%)',
    WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 0%, transparent 78%)',
  },
  topBar: {
    position: 'relative', zIndex: 2, width: '100%', boxSizing: 'border-box',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px',
  },
  roomChip: {
    fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700,
    letterSpacing: 1, color: '#39ff88', background: 'rgba(57,255,136,0.08)',
    border: '1px solid rgba(57,255,136,0.3)', borderRadius: 999, padding: '6px 14px',
  },
  exitBtn: {
    width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.4)',
    color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: 14, cursor: 'pointer',
  },
  trackerChip: {
    position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 8,
    fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 0.5,
    color: '#FFD700', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)',
    borderRadius: 999, padding: '6px 14px', marginBottom: 10,
  },
  permissionCard: {
    position: 'relative', zIndex: 2, marginTop: 60, textAlign: 'center',
    color: '#e0c98a', fontSize: 13, maxWidth: 280,
  },
  permissionText: { lineHeight: 1.5 },
  discOuter: {
    position: 'relative', zIndex: 2, borderRadius: '50%',
    background: 'radial-gradient(circle at 50% 50%, rgba(57,255,136,0.08) 0%, rgba(8,8,10,0.9) 72%)',
    border: '2px solid rgba(57,255,136,0.35)',
    boxShadow: '0 0 40px rgba(57,255,136,0.12), inset 0 0 40px rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  discRing1: {
    position: 'absolute', inset: '18%', borderRadius: '50%', border: '1px solid rgba(57,255,136,0.18)',
  },
  discRing2: {
    position: 'absolute', inset: '38%', borderRadius: '50%', border: '1px solid rgba(57,255,136,0.18)',
  },
  discRing3: {
    position: 'absolute', inset: '58%', borderRadius: '50%', border: '1px solid rgba(57,255,136,0.18)',
  },
  pulseRing: {
    position: 'absolute', width: 40, height: 40, borderRadius: '50%',
    border: '2px solid #39ff88', pointerEvents: 'none',
  },
  avatarWrap: {
    position: 'absolute', width: 28, height: 28, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarDot: {
    width: 16, height: 16, borderRadius: '50%', border: '2px solid #08080a', zIndex: 3,
  },
  avatarWedge: {
    position: 'absolute', top: -14, left: '50%', width: 0, height: 0,
    marginLeft: -6, borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
    borderBottom: '12px solid rgba(255,215,0,0.7)', transformOrigin: '50% 26px',
  },
  playerBlip: {
    position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
  },
  playerDot: { width: 12, height: 12, borderRadius: '50%', border: '2px solid #08080a' },
  playerLabel: {
    fontFamily: "'Orbitron', monospace", fontSize: 8, color: '#f5f5f7',
    background: 'rgba(0,0,0,0.55)', padding: '1px 6px', borderRadius: 999, whiteSpace: 'nowrap',
  },
  veggieBlip: {
    position: 'absolute', width: 34, height: 34, borderRadius: '50%',
    background: 'rgba(8,8,10,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', padding: 0,
  },
  blipRing: {
    position: 'absolute', inset: -6, borderRadius: '50%', border: '2px solid', opacity: 0.6,
  },
  helpText: {
    position: 'relative', zIndex: 2, marginTop: 18, fontSize: 12, color: '#8a8a93',
    textAlign: 'center', maxWidth: 260, lineHeight: 1.5, padding: '0 20px',
  },
  toast: {
    position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
    background: 'rgba(18,16,12,0.92)', border: '1px solid rgba(255,215,0,0.4)',
    color: '#FFD700', fontFamily: "'Orbitron', monospace", fontSize: 11,
    padding: '10px 20px', borderRadius: 999, whiteSpace: 'nowrap',
  },
};
