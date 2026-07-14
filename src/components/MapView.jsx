// src/components/MapView.jsx
//
// Stage 3: Tactical Radar Overworld.
//
// WHAT CHANGED (this revision — hybrid gps/indoor support):
//
// This screen was built entirely around real GPS distance: "walk 40m
// north and it'll rise up the list." That assumption breaks indoors —
// raw phone GPS is typically only accurate to 5-20m outdoors and
// commonly degrades past 50m (or loses its fix entirely) indoors, which
// is well past CATCH_RADIUS_METERS (15m). The new hybrid server.js
// already handles this server-side: it classifies each player as 'gps'
// or 'indoor' mode per-update based on reported accuracy, and indoor-
// mode captures are validated by compass-heading against each veggie's
// fixed `bearing` field instead of lat/lng distance (see server.js's
// getPlayerMode + capture-attempt handler). This file previously had no
// awareness of that distinction at all — it always computed distance
// from lat/lng, meaning indoor players would see wildly jittering
// "distance" numbers (or a permanently-out-of-range radar) even while
// standing right next to a real target.
//
// 1. NEW: `clientTrackingMode` — a client-side ESTIMATE of gps vs
//    indoor mode, mirroring server.js's own threshold
//    (accuracy <= 25m = gps). This is display-only; the server is still
//    the sole authority on which mode actually gets used for capture
//    validation. Purpose here is purely to pick the right radar/UI
//    behavior, not to gate anything security-relevant.
// 2. NEW: veggiesWithGeo now branches on that mode. In gps mode,
//    behavior is unchanged (real lat/lng distance + bearing). In indoor
//    mode, walking-distance math is skipped entirely — each veggie's
//    fixed `bearing` (added to every spawned veggie by the new
//    server.js) is used directly instead, since that's the same value
//    the server itself validates indoor captures against. Distance is
//    left `null` for indoor entries rather than showing a meaningless
//    jittery number.
// 3. NEW: radar placement, the veggie list, and the bottom action card
//    all render an indoor-appropriate variant when distance is null —
//    "SCAN {compass}" instead of "{N}m {compass}", veggies pinned at a
//    fixed radar ring (bearing-only, no distance ring), and the CATCH
//    flow no longer gates on a 15m radius (meaningless indoors) — any
//    currently-spawned veggie is treated as an available AR target, and
//    the actual capture success/fail is still decided server-side by
//    the heading-cone check once the player is in the AR view.
// 4. NEW: top HUD bar shows a TRACKING MODE sector alongside the
//    existing GPS ACCURACY readout, so indoor players understand why
//    the radar behaves differently instead of it looking broken.
//
// (Carried over): VEGGIE_POINTS/VEGGIE_META matching the current
// 6-veggie roster, App.jsx's real prop contract
// (roomCode/playerId/mySlot/onEnterAR/onExit), MapView staying pure
// radar-display-and-handoff (capture-attempt itself still lives in
// GameCanvas.jsx at stage 4), motion-permission gating on the CATCH tap.

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  connectSocket,
  subscribeToRoom,
  makeThrottledLocationWriter,
} from '../lib/gameClient';
import { requestMotionPermission } from '../lib/motionPermission';

const GOLD = '#ffbe1a';
const GOLD_SOFT = 'rgba(255, 190, 26, 0.15)';
const GREEN = '#39ff88';
const CYAN = '#3cd6ff';
const RED = '#ff3b3b';
const INK = '#f5f0e8';
const DIM = '#666';

const CATCH_RADIUS_METERS = 15;
// Client-side mirror of server.js's GPS_MODE_ACCURACY_THRESHOLD_M.
// Display-only — picks which radar UI to render. The server independently
// re-derives the real mode from the accuracy value it actually receives,
// so this never needs to be perfectly in sync to stay safe, only to stay
// visually sensible.
const CLIENT_GPS_MODE_ACCURACY_THRESHOLD_M = 25;

const VEGGIE_POINTS = { golden: 10, banana: 5, tomato: 3, grapes: 2, strawberry: 2, broccoli: 1 };
const VEGGIE_META = {
  golden: { emoji: '✨', label: 'GOLDEN VEGGIE', color: '#f1c40f' },
  tomato: { emoji: '🍅', label: 'TOMATO', color: '#ff3b30' },
  broccoli: { emoji: '🥦', label: 'BROCCOLI', color: '#2ecc71' },
  banana: { emoji: '🍌', label: 'BANANA', color: '#ffd23b' },
  grapes: { emoji: '🍇', label: 'GRAPES', color: '#8e44ad' },
  strawberry: { emoji: '🍓', label: 'STRAWBERRY', color: '#ff4d6d' },
};
const DEFAULT_VEGGIE_META = { emoji: '❔', label: 'UNKNOWN CROP', color: DIM };

const RADAR_RANGE_M = 120;
const RADAR_PIXEL_RADIUS = 150;
// Fixed ring position for indoor-mode targets, which have a bearing but
// no meaningful distance — placed at a consistent mid-ring radius so
// they read as "somewhere in the room in this direction" rather than
// implying a real measured distance.
const INDOOR_TARGET_PIXEL_RADIUS = RADAR_PIXEL_RADIUS * 0.62;
const EARTH_RADIUS_M = 6371000;

function toRad(deg) { return (deg * Math.PI) / 180; }
function toDeg(rad) { return (rad * 180) / Math.PI; }

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function distanceMeters(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingDegrees(lat1, lng1, lat2, lng2) {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const COMPASS_LETTERS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
function bearingToCompass(bearing) {
  return COMPASS_LETTERS[Math.round(bearing / 45) % 8];
}

function bearingToRadarXY(bearing, pixelDist) {
  const rad = toRad(bearing - 90);
  return { x: Math.cos(rad) * pixelDist, y: Math.sin(rad) * pixelDist };
}

export default function MapView({ roomCode, playerId, mySlot, onEnterAR, onExit }) {
  const [myPos, setMyPos] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [players, setPlayers] = useState([]);
  const [veggies, setVeggies] = useState([]);
  const [glitchActive, setGlitchActive] = useState(false);
  const [matchTick, setMatchTick] = useState(null);
  const [roundResults, setRoundResults] = useState(null);
  const [radarRotating, setRadarRotating] = useState(true);
  const [enteringAR, setEnteringAR] = useState(false);
  const [motionError, setMotionError] = useState('');

  const throttledWriterRef = useRef(null);
  if (!throttledWriterRef.current) {
    throttledWriterRef.current = makeThrottledLocationWriter({ minIntervalMs: 3000, minDistanceMeters: 5 });
  }

  // 1. Real GPS tracking loop.
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('This device has no GPS sensor available.');
      return undefined;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setMyPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsError('');
      },
      (err) => {
        setGpsError(
          err && err.code === 1
            ? 'Location permission denied — enable it in site settings.'
            : 'GPS signal unavailable. Move outdoors or check location services.'
        );
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 2. Push our real position to the server (throttled), whenever it updates.
  //    FIX (hybrid gps/indoor wiring): now also forwards `accuracy` — see
  //    gameClient.js's updateLocation()/makeThrottledLocationWriter()
  //    header notes. This screen doesn't track device heading (that only
  //    starts once iOS motion permission is granted on CATCH tap, see
  //    App.jsx's compass listener effect gated on stage >= 4), so heading
  //    is intentionally omitted here rather than sending a stale/fake
  //    value — the server simply treats a missing heading as "no compass
  //    yet" for indoor-mode captures, which is accurate at this stage.
  useEffect(() => {
    if (!myPos) return;
    throttledWriterRef.current(myPos.lat, myPos.lng, { accuracy: myPos.accuracy });
  }, [myPos]);

  // 3. Live room subscription — players/veggies/tick/go/round-end/glitch,
  // on the ONE shared socket gameClient.js already opened and joined on.
  // No second connectSocket() call here; connectSocket() is idempotent
  // (returns the existing socket if already connected) so this is safe,
  // but subscribeToRoom() attaches its own listeners regardless of who's
  // calling it, layered on top of App.jsx's own subscribeToRoom() call.
  useEffect(() => {
    if (!roomCode) return undefined;
    connectSocket();

    const unsubscribe = subscribeToRoom(roomCode, {
      onPlayersUpdate: (list) => setPlayers(Array.isArray(list) ? list : []),
      onVeggiesUpdate: (obj) => setVeggies(Object.values(obj || {})),
      onTick: (data) => setMatchTick(data?.tick ?? null),
      onGo: () => setMatchTick(null),
      onRoundEnd: (ranked) => setRoundResults(Array.isArray(ranked) ? ranked : []),
      onGlitch: (data) => setGlitchActive(!!data?.active),
      onCountdownCancelled: () => setMatchTick(null),
    });

    return unsubscribe;
  }, [roomCode]);

  const selfPlayer = useMemo(
    () => players.find((p) => p.id === playerId) || null,
    [players, playerId]
  );
  const teammates = useMemo(
    () => players.filter((p) => p.id !== playerId),
    [players, playerId]
  );
  const myScore = selfPlayer?.score ?? 0;
  const myDisplayName = selfPlayer?.name || 'ME';
  const squadSize = players.length || 1;

  // NEW: client-side mirror of server.js's mode classification — see
  // header note #1. Prefers the server's own reported mode for this
  // player (players-update's `mode` field, once GameCanvas/App.jsx have
  // surfaced it) and falls back to a local accuracy check if that's not
  // available yet (e.g. before the first players-update tick arrives).
  const clientTrackingMode = useMemo(() => {
    if (selfPlayer?.mode === 'gps' || selfPlayer?.mode === 'indoor') return selfPlayer.mode;
    if (!myPos) return 'unknown';
    if (isFiniteNumber(myPos.accuracy) && myPos.accuracy <= CLIENT_GPS_MODE_ACCURACY_THRESHOLD_M) return 'gps';
    return 'indoor';
  }, [selfPlayer, myPos]);
  const isIndoorMode = clientTrackingMode === 'indoor';

  const squadStatusLabel = useMemo(() => {
    if (squadSize <= 1) return 'AWAITING SQUAD';
    if (squadSize === 2) return 'DUO MATRIX ACTIVE';
    if (squadSize === 3) return 'TRIO APEX RUNNING';
    if (squadSize === 4) return 'CORE FOUR LOCK ON';
    if (squadSize === 5) return 'SQUAD STRIKE ONLINE';
    return 'CLIQUE OVERLORD FORCE ON';
  }, [squadSize]);

  // NEW: branches on clientTrackingMode — see header note #2. Indoor
  // entries carry `distance: null` and use the veggie's fixed `bearing`
  // (from server.js) directly instead of deriving one from lat/lng,
  // since indoor lat/lng is too noisy to trust for direction either.
  const veggiesWithGeo = useMemo(() => {
    if (!myPos) return [];
    const mapped = veggies.map((v) => {
      const type = v.type || v.species || 'broccoli';

      if (isIndoorMode) {
        const bearing = isFiniteNumber(v.bearing) ? v.bearing : 0;
        return { ...v, type, distance: null, bearing, compass: bearingToCompass(bearing) };
      }

      const lat = v.lat ?? v.latitude;
      const lng = v.lng ?? v.longitude;
      const distance = distanceMeters(myPos.lat, myPos.lng, lat, lng);
      const bearing = bearingDegrees(myPos.lat, myPos.lng, lat, lng);
      return { ...v, lat, lng, type, distance, bearing, compass: bearingToCompass(bearing) };
    });

    // Distance-sort only makes sense in gps mode — indoors there's no
    // meaningful "nearest", every spawned veggie is equally reachable
    // via AR heading-scan, so leave server order as-is.
    if (isIndoorMode) return mapped;
    return mapped.sort((a, b) => a.distance - b.distance);
  }, [veggies, myPos, isIndoorMode]);

  const teammatesWithGeo = useMemo(() => {
    if (!myPos || isIndoorMode) return [];
    return teammates.map((p) => {
      const lat = p.lat ?? p.latitude;
      const lng = p.lng ?? p.longitude;
      const distance = distanceMeters(myPos.lat, myPos.lng, lat, lng);
      const bearing = bearingDegrees(myPos.lat, myPos.lng, lat, lng);
      return { ...p, distance, bearing };
    });
  }, [teammates, myPos, isIndoorMode]);

  const nearestVeggie = veggiesWithGeo[0] || null;
  // NEW: in indoor mode there's no reliable distance to gate on (that's
  // the whole reason the server switched to heading-based validation for
  // these players) — any currently-spawned veggie is treated as an
  // available AR target. The real accept/reject decision still happens
  // server-side once the player is in GameCanvas's AR view and attempts
  // a capture (heading-cone check against the veggie's fixed bearing).
  const activeCaptureTarget = isIndoorMode
    ? nearestVeggie
    : nearestVeggie && nearestVeggie.distance <= CATCH_RADIUS_METERS
    ? nearestVeggie
    : null;

  // CATCH tap: request motion permission (iOS gate; no-op elsewhere) from
  // inside this real tap handler, THEN hand off to GameCanvas via
  // onEnterAR(vegId) — this component never attempts the capture itself.
  const handleCatchTap = useCallback(async () => {
    if (!activeCaptureTarget || enteringAR) return;
    setEnteringAR(true);
    setMotionError('');

    const granted = await requestMotionPermission();
    if (!granted) {
      setMotionError('Motion & orientation access is needed for AR targeting — enable it in Settings and try again.');
      setEnteringAR(false);
      return;
    }

    onEnterAR?.(activeCaptureTarget.id);
  }, [activeCaptureTarget, enteringAR, onEnterAR]);

  const connectionLabel = playerId ? 'LIVE' : 'CONNECTING…';
  const connectionColor = playerId ? GREEN : GOLD;

  const modeLabel = clientTrackingMode === 'gps' ? '🛰️ OUTDOOR GPS' : clientTrackingMode === 'indoor' ? '📶 INDOOR SENSOR' : '—';
  const modeColor = clientTrackingMode === 'gps' ? GREEN : clientTrackingMode === 'indoor' ? CYAN : DIM;

  return (
    <div style={styles.screen}>
      <div style={styles.scanGrid} />
      <div style={styles.scanLine} />

      <div style={styles.topHudBar}>
        <div style={styles.hudMetaSector}>
          <span style={styles.hudLabelText}>INSTANCE FREQUENCY SECTOR:</span>
          <span style={styles.hudValueText}>{roomCode ? roomCode.toUpperCase() : 'ARENA-STAGE'}</span>
        </div>
        <div style={styles.hudMetaSector}>
          <span style={styles.hudLabelText}>LOBBY STATUS FIELD:</span>
          <span style={{ ...styles.hudValueText, color: GREEN }}>{squadStatusLabel}</span>
        </div>
        <div style={styles.hudMetaSector}>
          <span style={styles.hudLabelText}>LINK STATUS:</span>
          <span style={{ ...styles.hudValueText, color: connectionColor }}>⚡ {connectionLabel}</span>
        </div>
        {/* NEW: read-only tracking-mode indicator — see header note #4. */}
        <div style={styles.hudMetaSector}>
          <span style={styles.hudLabelText}>TRACKING MODE:</span>
          <span style={{ ...styles.hudValueText, color: modeColor }}>{modeLabel}</span>
        </div>
        <div style={styles.hudMetaSector}>
          <span style={styles.hudLabelText}>GPS ACCURACY:</span>
          <span style={styles.hudValueText}>{myPos?.accuracy != null ? `±${Math.round(myPos.accuracy)}M` : '—'}</span>
        </div>
      </div>

      {matchTick != null && (
        <div style={styles.countdownOverlay}>
          <span style={styles.countdownNumber}>{matchTick}</span>
          <span style={styles.countdownLabel}>MATCH STARTING</span>
        </div>
      )}

      <div style={styles.radarContainerChassis}>
        <div style={styles.radarOuterRing}>
          <div style={styles.radarMidRing}>
            <div style={styles.radarInnerRing}>
              {radarRotating && (
                <motion.div
                  style={styles.radarSweepBeam}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                />
              )}

              <div style={styles.localPlayerAnchorNode}>
                <span style={styles.playerInitialsBadge}>{myDisplayName.slice(0, 2).toUpperCase()}</span>
              </div>

              {!myPos && (
                <div style={styles.radarWaitingLabel}>{gpsError || 'ACQUIRING GPS FIX…'}</div>
              )}

              {/* Teammate markers only make sense with real relative
                  positions — skipped entirely in indoor mode (see
                  teammatesWithGeo above), since indoor lat/lng doesn't
                  reliably tell two nearby phones apart anyway. */}
              {teammatesWithGeo.map((mate) => {
                const pixelDist = Math.min(mate.distance, RADAR_RANGE_M) * (RADAR_PIXEL_RADIUS / RADAR_RANGE_M);
                const { x, y } = bearingToRadarXY(mate.bearing, pixelDist);
                return (
                  <div
                    key={mate.id}
                    style={{
                      ...styles.teammateMarkerNode,
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      borderColor: '#3a86ff',
                      boxShadow: '0 0 12px #3a86ff',
                    }}
                  >
                    <span style={styles.markerTagHandleText}>{(mate.name || 'OPERATOR').toUpperCase()}</span>
                  </div>
                );
              })}

              {veggiesWithGeo.map((v) => {
                const meta = VEGGIE_META[v.type] || DEFAULT_VEGGIE_META;
                // NEW: indoor entries (distance === null) pin to a fixed
                // ring radius — only the bearing angle is meaningful.
                const pixelDist =
                  v.distance == null
                    ? INDOOR_TARGET_PIXEL_RADIUS
                    : Math.min(v.distance, RADAR_RANGE_M) * (RADAR_PIXEL_RADIUS / RADAR_RANGE_M);
                const { x, y } = bearingToRadarXY(v.bearing, pixelDist);
                const beyondRange = v.distance != null && v.distance > RADAR_RANGE_M;
                return (
                  <motion.div
                    key={v.id}
                    animate={{ scale: [0.95, 1.05, 0.95] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    style={{
                      ...styles.targetEntityMarkerNode,
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      borderColor: meta.color,
                      borderStyle: beyondRange ? 'dashed' : 'solid',
                      boxShadow: `0 0 15px ${meta.color}66`,
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>{meta.emoji}</span>
                    <span style={{ ...styles.entityDistanceOverlayText, background: `${meta.color}dd` }}>
                      {v.distance == null ? `SCAN ${v.compass}` : `${Math.round(v.distance)}M ${v.compass}`}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {myPos && veggiesWithGeo.length > 0 && !roundResults && (
        <div style={styles.veggieListPanel}>
          {veggiesWithGeo.slice(0, 4).map((v) => {
            const meta = VEGGIE_META[v.type] || DEFAULT_VEGGIE_META;
            const pts = VEGGIE_POINTS[v.type] ?? 1;
            return (
              <div key={v.id} style={styles.veggieListRow}>
                <span>{meta.emoji}</span>
                <span style={{ color: meta.color, fontWeight: 'bold' }}>{meta.label}</span>
                <span style={styles.veggieListDist}>
                  {v.distance == null ? `SCAN ${v.compass}` : `${Math.round(v.distance)}M ${v.compass}`} · {glitchActive ? pts * 2 : pts}PTS
                </span>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {motionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ ...styles.captureFeedbackBanner, borderColor: RED, color: RED }}
          >
            {motionError}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={styles.bottomControlDeck}>
        <AnimatePresence mode="wait">
          {roundResults ? (
            <motion.div
              key="results-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={styles.tacticalActionCard}
            >
              <div style={styles.cardHeaderRow}>
                <span style={{ color: GOLD }}>● ROUND COMPLETE</span>
              </div>
              {roundResults.slice(0, 6).map((r, i) => (
                <div key={r.slot_id || i} style={styles.resultRow}>
                  <span>{i + 1}. {r.name}</span>
                  <span style={{ color: GOLD, fontWeight: 'bold' }}>{r.score} PTS</span>
                </div>
              ))}
              <button onClick={onExit} style={{ ...styles.primaryActionButton, background: GOLD, color: '#000' }}>
                EXIT MATRIX
              </button>
            </motion.div>
          ) : activeCaptureTarget ? (
            <motion.div
              key="catch-panel"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ ...styles.tacticalActionCard, border: `2px solid ${GREEN}`, boxShadow: '0 10px 40px rgba(57,255,136,0.25)' }}
            >
              <div style={styles.cardHeaderRow}>
                <span style={{ color: GREEN, fontWeight: 'bold' }}>
                  ● {isIndoorMode ? 'TARGET DETECTED NEARBY' : 'CAPTURE ZONE DETECTED'}
                </span>
                <span style={styles.targetMetricsText}>
                  VALUE: +{(VEGGIE_POINTS[activeCaptureTarget.type] ?? 1) * (glitchActive ? 2 : 1)} PTS
                  {glitchActive ? ' (×2 GLITCH)' : ''}
                </span>
              </div>
              <h2 style={styles.targetHeaderTitleText}>
                {(VEGGIE_META[activeCaptureTarget.type] || DEFAULT_VEGGIE_META).label} IN RANGE
              </h2>
              <p style={styles.targetActionParagraphText}>
                {isIndoorMode
                  ? `Somewhere to the ${activeCaptureTarget.compass} in the room — enter AR and scan that direction to lock on.`
                  : `${Math.round(activeCaptureTarget.distance)}m ${activeCaptureTarget.compass} — within the ${CATCH_RADIUS_METERS}m catch radius.`}
              </p>
              <button
                onClick={handleCatchTap}
                disabled={enteringAR}
                style={{
                  ...styles.primaryActionButton,
                  background: enteringAR ? '#333' : `linear-gradient(135deg, ${GREEN}, #2ecc71)`,
                  color: enteringAR ? '#888' : '#000',
                  cursor: enteringAR ? 'not-allowed' : 'pointer',
                }}
              >
                {enteringAR ? 'LAUNCHING AR…' : isIndoorMode ? 'SCAN ROOM' : 'CATCH'}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="nav-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={styles.tacticalActionCard}
            >
              <div style={styles.cardHeaderRow}>
                <span style={{ color: GOLD }}>● RADAR RECONNAISSANCE ACTIVE</span>
                <span style={styles.targetMetricsText}>SCORE: {myScore}</span>
              </div>
              {gpsError ? (
                <h2 style={{ ...styles.targetHeaderTitleText, color: RED, fontSize: '15px' }}>{gpsError}</h2>
              ) : nearestVeggie ? (
                <>
                  <h2 style={styles.targetHeaderTitleText}>
                    {isIndoorMode ? 'DETECTED' : 'NEAREST'}: {(VEGGIE_META[nearestVeggie.type] || DEFAULT_VEGGIE_META).label}
                  </h2>
                  <p style={styles.targetActionParagraphText}>
                    {isIndoorMode
                      ? `Somewhere to the ${nearestVeggie.compass} — no need to walk, just turn and scan with the camera in AR.`
                      : `${Math.round(nearestVeggie.distance)}m to the ${nearestVeggie.compass} — walk that way and it'll rise up the list.`}
                  </p>
                </>
              ) : (
                <p style={styles.targetActionParagraphText}>
                  {isIndoorMode
                    ? `Scanning the room for hidden vegetables. Syncing ${squadSize} active squad unit${squadSize === 1 ? '' : 's'}.`
                    : `Walk outdoors to align your coordinates with hidden vegetable parameters. Syncing ${squadSize} active squad unit${squadSize === 1 ? '' : 's'}.`}
                </p>
              )}
              <div style={styles.actionButtonsInlineFlexRow}>
                <button
                  onClick={() => setRadarRotating((prev) => !prev)}
                  style={{ ...styles.secondaryUtilityButton, border: `1.5px solid ${GOLD_SOFT}`, color: GOLD }}
                >
                  {radarRotating ? 'PAUSE SWEEP' : 'START SWEEP'}
                </button>
                <button
                  onClick={onExit}
                  style={{ ...styles.secondaryUtilityButton, border: '1.5px solid rgba(255,59,59,0.15)', color: RED }}
                >
                  EXIT MATRIX
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const styles = {
  screen: { position: 'fixed', inset: 0, background: '#040508', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', userSelect: 'none' },
  scanGrid: { position: 'absolute', inset: 0, zIndex: 1, backgroundImage: 'linear-gradient(rgba(255,186,26,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,186,26,0.012) 1px, transparent 1px)', backgroundSize: '32px 32px', maskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 85%)', WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 85%)' },
  scanLine: { position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(180deg, transparent, rgba(255,186,26,0.015) 50%, transparent 100%)', backgroundSize: '100% 10px', pointerEvents: 'none' },
  topHudBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '16px 24px', background: 'linear-gradient(180deg, rgba(5,8,16,0.92) 0%, transparent 100%)', borderBottom: '1px solid rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)' },
  hudMetaSector: { display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' },
  hudLabelText: { fontSize: '8.5px', fontFamily: 'monospace', fontWeight: 'bold', color: '#444', letterSpacing: '0.5px' },
  hudValueText: { fontSize: '12px', fontFamily: 'monospace', fontWeight: '900', color: INK, letterSpacing: '0.5px' },
  countdownOverlay: { position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(4,5,8,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  countdownNumber: { fontSize: '96px', fontWeight: '900', fontFamily: 'monospace', color: GOLD, textShadow: `0 0 30px ${GOLD}` },
  countdownLabel: { fontSize: '13px', fontFamily: 'monospace', letterSpacing: '2px', color: '#888' },
  radarContainerChassis: { position: 'relative', zIndex: 10, width: 'min(86vw, 360px)', height: 'min(86vw, 360px)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '76px 0 20px' },
  radarOuterRing: { width: '100%', height: '100%', borderRadius: '50%', border: '1.5px solid rgba(255,190,26,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(10,14,22,0.4) 0%, transparent 100%)' },
  radarMidRing: { width: '70%', height: '70%', borderRadius: '50%', border: '1px solid rgba(255,190,26,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  radarInnerRing: { position: 'relative', width: '45%', height: '40%', borderRadius: '50%', border: '1px dashed rgba(255,190,26,0.04)' },
  radarSweepBeam: { position: 'absolute', top: '50%', left: '50%', width: '160px', height: '160px', transformOrigin: 'top left', background: 'linear-gradient(45deg, rgba(255,190,26,0.08) 0%, transparent 45%)', pointerEvents: 'none' },
  radarWaitingLabel: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, 60px)', width: '220px', textAlign: 'center', fontSize: '10px', fontFamily: 'monospace', color: '#888', letterSpacing: '0.5px' },
  localPlayerAnchorNode: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '32px', height: '32px', borderRadius: '50%', background: '#0a0e16', border: `1.5px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, boxShadow: `0 0 20px ${GOLD}` },
  playerInitialsBadge: { fontSize: '10px', fontFamily: 'monospace', fontWeight: '900', color: GOLD },
  teammateMarkerNode: { position: 'absolute', top: '50%', left: '50%', width: '8px', height: '8px', borderRadius: '50%', background: '#000', border: '2px solid transparent', zIndex: 25, transition: 'all 0.3s ease' },
  markerTagHandleText: { position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '7.5px', fontFamily: 'monospace', fontWeight: 'bold', color: '#fff', opacity: 0.5, whiteSpace: 'nowrap' },
  targetEntityMarkerNode: { position: 'absolute', top: '50%', left: '50%', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(4,5,8,0.75)', border: '1.5px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 28, cursor: 'pointer' },
  entityDistanceOverlayText: { position: 'absolute', bottom: '-16px', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', fontFamily: 'monospace', fontWeight: 'bold', color: '#000', padding: '1px 4px', borderRadius: '4px', whiteSpace: 'nowrap' },
  veggieListPanel: { position: 'relative', zIndex: 20, width: 'min(90vw, 420px)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px', padding: '10px 14px', background: 'rgba(10,14,22,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' },
  veggieListRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'monospace' },
  veggieListDist: { marginLeft: 'auto', color: '#888' },
  captureFeedbackBanner: { position: 'absolute', top: '90px', zIndex: 70, padding: '8px 18px', borderRadius: '10px', border: '1.5px solid', background: 'rgba(4,5,8,0.9)', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.5px' },
  bottomControlDeck: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, display: 'flex', justifyContent: 'center', padding: '24px 16px', background: 'linear-gradient(0deg, rgba(4,5,8,0.95) 0%, transparent 100%)' },
  tacticalActionCard: { width: '100%', maxWidth: '420px', background: 'rgba(10,14,22,0.96)', border: `1.5px solid ${GOLD_SOFT}`, borderRadius: '24px', padding: '20px 24px', boxSizing: 'border-box', backdropFilter: 'blur(15px)', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' },
  cardHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.5px' },
  targetMetricsText: { color: '#666' },
  targetHeaderTitleText: { fontSize: '18px', fontWeight: '900', fontFamily: 'monospace', color: INK, margin: '4px 0 0 0', letterSpacing: '0.5px' },
  targetActionParagraphText: { fontSize: '11px', color: '#888', fontFamily: 'sans-serif', margin: 0, lineHeight: '1.4' },
  resultRow: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'monospace', color: INK, padding: '3px 0' },
  primaryActionButton: { width: '100%', border: 'none', borderRadius: '14px', padding: '16px', marginTop: '8px', boxSizing: 'border-box', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease', letterSpacing: '0.5px' },
  actionButtonsInlineFlexRow: { display: 'flex', gap: '12px', width: '100%', marginTop: '8px' },
  secondaryUtilityButton: { flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '12px', boxSizing: 'border-box', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s ease', outline: 'none' },
};
