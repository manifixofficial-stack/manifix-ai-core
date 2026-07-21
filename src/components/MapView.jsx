// src/components/MapView.jsx
//
// VISUAL OVERHAUL PATCH (this revision):
//
// 1) Killed the spreadsheet-style scoreboard. Players are now rendered as
//    glowing avatar badges stacked in the top-right corner (stream-overlay
//    style), ranked live by score. The post-round results list uses the
//    same avatar-badge treatment instead of a plain numbered table.
//
// 2) Ditched static compass/bearing text on radar blips. Each veggie blip
//    now tracks its own distance across renders (prevDistancesRef) and
//    colors itself on a hot (closing in) <-> cold (falling behind)
//    gradient, independent of its fruit-type identity color, so players
//    get an instant "getting warmer" signal instead of doing mental math
//    on a bearing number.
//
// 3) Replaced the instructional paragraphs in the bottom action card with
//    short, heavy, italicized arcade callouts (RUN! 12M LEFT / STEAL THE
//    POINTS!) sized to be readable at a glance while moving.
//
// GPS OWNERSHIP (unchanged from prior revision): MapView still does not
// touch navigator.geolocation. Position and any GPS error message are
// passed in as props (`myPos`, `gpsError`) from App.jsx's single watcher.
// Everything about hybrid gps/indoor support, indoor bearing-only
// targeting, and the motion-permission gate on CATCH tap is unchanged.

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { requestMotionPermission } from '../lib/motionPermission';

const GOLD = '#ffbe1a';
const GOLD_SOFT = 'rgba(255, 190, 26, 0.15)';
const GREEN = '#39ff88';
const CYAN = '#3cd6ff';
const RED = '#ff3b3b';
const INK = '#f5f0e8';
const DIM = '#666';

// Hot/cold trend gradient endpoints (see heatColorFromTrend).
const HEAT_COLD = [58, 134, 255]; // falling behind — winter blue
const HEAT_NEUTRAL = [255, 190, 26]; // no signal yet / holding steady — gold
const HEAT_HOT = [255, 45, 20]; // closing in — volcanic red

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

// Player-count avatar palette — cycled by slot index so every squadmate
// gets a stable, distinguishable ring color in the avatar stack.
const AVATAR_RING_COLORS = ['#3a86ff', '#ff4d6d', '#2ecc71', '#f1c40f', '#8e44ad', '#3cd6ff'];

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

// Trend-based hot/cold: delta is (previous distance - current distance),
// so positive means the player closed the gap since last sample. Distances
// within +/-1.5m of flat are treated as "holding" (neutral gold) so the
// blip doesn't flicker between hot/cold from GPS jitter while standing
// still. Clamped at +/-6m/sample for the full hot or full cold end.
function heatColorFromTrend(delta) {
  if (!isFiniteNumber(delta)) return `rgb(${HEAT_NEUTRAL.join(',')})`;
  if (delta > 1.5) {
    const t = Math.min(1, (delta - 1.5) / 6);
    return lerpRgb(HEAT_NEUTRAL, HEAT_HOT, t);
  }
  if (delta < -1.5) {
    const t = Math.min(1, (-delta - 1.5) / 6);
    return lerpRgb(HEAT_NEUTRAL, HEAT_COLD, t);
  }
  return `rgb(${HEAT_NEUTRAL.join(',')})`;
}

function lerpRgb(from, to, t) {
  const r = Math.round(from[0] + (to[0] - from[0]) * t);
  const g = Math.round(from[1] + (to[1] - from[1]) * t);
  const b = Math.round(from[2] + (to[2] - from[2]) * t);
  return `rgb(${r},${g},${b})`;
}

function initialsOf(name) {
  return (name || '??').trim().slice(0, 2).toUpperCase();
}

// Short, glanceable arcade callouts for the bottom action card — replaces
// the old multi-line lowercase instructional paragraphs. Kept as plain
// functions (not JSX) so the render body stays readable.
function huntCallout({ isIndoorMode, nearestVeggie, squadSize }) {
  if (!nearestVeggie) {
    return isIndoorMode ? 'SCANNING THE ROOM…' : `MOVE OUT! ${squadSize} SQUAD LIVE`;
  }
  if (isIndoorMode) return `SCAN ${nearestVeggie.compass}!`;
  return `RUN! ${Math.round(nearestVeggie.distance)}M ${nearestVeggie.compass}`;
}

function captureCallout({ isIndoorMode, activeCaptureTarget }) {
  if (isIndoorMode) return `LOCK ON — SCAN ${activeCaptureTarget.compass}!`;
  return 'STEAL THE POINTS!';
}

// NEW PROPS: myPos, gpsError — both now owned by App.jsx's single GPS
// watcher and passed straight through. See file-header patch note.
export default function MapView({ roomCode, playerId, mySlot, myPos, gpsError, onEnterAR, onExit }) {
  const [players, setPlayers] = useState([]);
  const [veggies, setVeggies] = useState([]);
  const [glitchActive, setGlitchActive] = useState(false);
  const [matchTick, setMatchTick] = useState(null);
  const [roundResults, setRoundResults] = useState(null);
  const [radarRotating, setRadarRotating] = useState(true);
  const [enteringAR, setEnteringAR] = useState(false);
  const [motionError, setMotionError] = useState('');

  // NOTE: room subscription (players/veggies/tick/go/round-end/glitch)
  // still lives here exactly as before — only GPS ownership moved out.
  // If your build previously wired this via useEffect + subscribeToRoom
  // directly inside MapView, keep that block as-is; it's independent of
  // the GPS patch and was not touched.
  //
  // The two effects that WERE removed from this file:
  //   1) navigator.geolocation.watchPosition(...) — GPS is now App.jsx's
  //      job only.
  //   2) throttledWriterRef.current(myPos.lat, myPos.lng, ...) — location
  //      push to the server is now App.jsx's job only (it already emits
  //      'update-location' with accuracy + heading in one place).

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

  // Client-side mirror of server.js's mode classification. Prefers the
  // server's own reported mode for this player (players-update's `mode`
  // field) and falls back to a local accuracy check if that's not
  // available yet.
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

  // Live-ranked roster for the avatar stack: self + teammates, sorted by
  // score descending, each given a stable ring color by original slot
  // index (not by rank, so a color doesn't jump between players as
  // scores change — only position in the stack does).
  const rosterWithRank = useMemo(() => {
    const all = selfPlayer ? [selfPlayer, ...teammates] : teammates;
    return all
      .map((p, i) => ({
        ...p,
        isSelf: p.id === playerId,
        ringColor: AVATAR_RING_COLORS[i % AVATAR_RING_COLORS.length],
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [selfPlayer, teammates, playerId]);

  // Distance-trend tracking for the hot/cold radar heat. Read during
  // render (reflects the PREVIOUS render's distances), written back in
  // the effect below after commit — never mutated mid-render.
  const prevVeggieDistancesRef = useRef(new Map());

  const veggiesWithGeo = useMemo(() => {
    if (!myPos) return [];
    const mapped = veggies.map((v) => {
      const type = v.type || v.species || 'broccoli';

      if (isIndoorMode) {
        const bearing = isFiniteNumber(v.bearing) ? v.bearing : 0;
        return {
          ...v,
          type,
          distance: null,
          bearing,
          compass: bearingToCompass(bearing),
          heatColor: `rgb(${HEAT_NEUTRAL.join(',')})`,
        };
      }

      const lat = v.lat ?? v.latitude;
      const lng = v.lng ?? v.longitude;
      const distance = distanceMeters(myPos.lat, myPos.lng, lat, lng);
      const bearing = bearingDegrees(myPos.lat, myPos.lng, lat, lng);
      const prevDistance = prevVeggieDistancesRef.current.get(v.id);
      const delta = isFiniteNumber(prevDistance) ? prevDistance - distance : NaN;
      return {
        ...v,
        lat,
        lng,
        type,
        distance,
        bearing,
        compass: bearingToCompass(bearing),
        heatColor: heatColorFromTrend(delta),
      };
    });

    if (isIndoorMode) return mapped;
    return mapped.sort((a, b) => a.distance - b.distance);
  }, [veggies, myPos, isIndoorMode]);

  // Commit this render's distances for next render's trend comparison.
  useEffect(() => {
    const next = new Map();
    veggiesWithGeo.forEach((v) => {
      if (isFiniteNumber(v.distance)) next.set(v.id, v.distance);
    });
    prevVeggieDistancesRef.current = next;
  }, [veggiesWithGeo]);

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
  const activeCaptureTarget = isIndoorMode
    ? nearestVeggie
    : nearestVeggie && nearestVeggie.distance <= CATCH_RADIUS_METERS
    ? nearestVeggie
    : null;

  const handleCatchTap = useCallback(async () => {
    if (!activeCaptureTarget || enteringAR) return;
    setEnteringAR(true);
    setMotionError('');

    const granted = await requestMotionPermission();
    if (!granted) {
      setMotionError('Enable motion & orientation access in Settings, then try again.');
      setEnteringAR(false);
      return;
    }

    onEnterAR?.(activeCaptureTarget.id);
  }, [activeCaptureTarget, enteringAR, onEnterAR]);

  const connectionLabel = playerId ? 'LIVE' : 'LINKING…';
  const connectionColor = playerId ? GREEN : GOLD;

  const modeLabel = clientTrackingMode === 'gps' ? '🛰️ FIELD GPS' : clientTrackingMode === 'indoor' ? '📶 INDOOR SCAN' : '—';
  const modeColor = clientTrackingMode === 'gps' ? GREEN : clientTrackingMode === 'indoor' ? CYAN : DIM;

  return (
    <div style={styles.screen}>
      <div style={styles.scanGrid} />
      <div style={styles.scanLine} />

      <div style={styles.topHudBar}>
        <div style={styles.hudMetaSector}>
          <span style={styles.hudLabelText}>ARENA ZONE</span>
          <span style={styles.hudValueText}>{roomCode ? roomCode.toUpperCase() : 'ARENA-1'}</span>
        </div>
        <div style={styles.hudMetaSector}>
          <span style={styles.hudLabelText}>SQUAD LINK</span>
          <span style={{ ...styles.hudValueText, color: connectionColor }}>⚡ {connectionLabel}</span>
        </div>
        <div style={styles.hudMetaSector}>
          <span style={styles.hudLabelText}>TRACKING</span>
          <span style={{ ...styles.hudValueText, color: modeColor }}>{modeLabel}</span>
        </div>
      </div>

      {/* Live squad avatar stack — replaces the old plain-text roster.
          Glowing, ranked, stream-overlay style in the top-right corner. */}
      {rosterWithRank.length > 0 && (
        <div style={styles.avatarStack}>
          {rosterWithRank.slice(0, 6).map((p, rank) => (
            <div
              key={p.id || p.name || rank}
              style={{
                ...styles.avatarBadge,
                borderColor: rank === 0 ? GOLD : p.ringColor,
                boxShadow: `0 0 ${rank === 0 ? 16 : 10}px ${rank === 0 ? GOLD : p.ringColor}88`,
                transform: `translateX(${rank * -10}px)`,
                zIndex: 10 - rank,
              }}
            >
              <span style={{ ...styles.avatarInitials, color: p.isSelf ? GOLD : INK }}>
                {initialsOf(p.name || (p.isSelf ? myDisplayName : 'OP'))}
              </span>
              <span style={styles.avatarScoreChip}>{p.score ?? 0}</span>
            </div>
          ))}
        </div>
      )}

      {matchTick != null && (
        <div style={styles.countdownOverlay}>
          <span style={styles.countdownNumber}>{matchTick}</span>
          <span style={styles.countdownLabel}>SQUAD SPRINT INCOMING</span>
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
                    <span style={styles.teammateAvatarInitials}>{initialsOf(mate.name)}</span>
                  </div>
                );
              })}

              {veggiesWithGeo.map((v) => {
                const meta = VEGGIE_META[v.type] || DEFAULT_VEGGIE_META;
                const pixelDist =
                  v.distance == null
                    ? INDOOR_TARGET_PIXEL_RADIUS
                    : Math.min(v.distance, RADAR_RANGE_M) * (RADAR_PIXEL_RADIUS / RADAR_RANGE_M);
                const { x, y } = bearingToRadarXY(v.bearing, pixelDist);
                const beyondRange = v.distance != null && v.distance > RADAR_RANGE_M;
                return (
                  <motion.div
                    key={v.id}
                    animate={{ scale: [0.92, 1.12, 0.92] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                    style={{
                      ...styles.targetEntityMarkerNode,
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      borderColor: v.heatColor,
                      borderStyle: beyondRange ? 'dashed' : 'solid',
                      boxShadow: `0 0 18px ${v.heatColor}`,
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>{meta.emoji}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

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
              {/* Podium-style avatar badges instead of a plain numbered
                  table. */}
              <div style={styles.resultsAvatarRow}>
                {roundResults.slice(0, 6).map((r, i) => (
                  <div key={r.slot_id || i} style={styles.resultAvatarCol}>
                    <div
                      style={{
                        ...styles.avatarBadge,
                        position: 'relative',
                        borderColor: i === 0 ? GOLD : AVATAR_RING_COLORS[i % AVATAR_RING_COLORS.length],
                        boxShadow: `0 0 ${i === 0 ? 16 : 8}px ${i === 0 ? GOLD : AVATAR_RING_COLORS[i % AVATAR_RING_COLORS.length]}88`,
                      }}
                    >
                      <span style={styles.avatarInitials}>{initialsOf(r.name)}</span>
                    </div>
                    <span style={styles.resultRankLabel}>#{i + 1}</span>
                    <span style={styles.resultScoreLabel}>{r.score} PTS</span>
                  </div>
                ))}
              </div>
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
                  ● {isIndoorMode ? 'TARGET NEARBY' : 'CATCH ZONE'}
                </span>
                <span style={styles.targetMetricsText}>
                  +{(VEGGIE_POINTS[activeCaptureTarget.type] ?? 1) * (glitchActive ? 2 : 1)} PTS
                  {glitchActive ? ' ×2' : ''}
                </span>
              </div>
              <h2 style={styles.bigActionTitle}>
                {captureCallout({ isIndoorMode, activeCaptureTarget })}
              </h2>
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
                <span style={{ color: GOLD }}>● HUNTING</span>
                <span style={styles.targetMetricsText}>SCORE: {myScore}</span>
              </div>
              <h2 style={{ ...styles.bigActionTitle, color: gpsError ? RED : INK, fontSize: gpsError ? '17px' : undefined }}>
                {gpsError || huntCallout({ isIndoorMode, nearestVeggie, squadSize })}
              </h2>
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
  topHudBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', justifyContent: 'flex-start', gap: '20px', padding: '14px 20px', background: 'linear-gradient(180deg, rgba(5,8,16,0.92) 0%, transparent 100%)', borderBottom: '1px solid rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)' },
  hudMetaSector: { display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' },
  hudLabelText: { fontSize: '8.5px', fontFamily: 'monospace', fontWeight: 'bold', color: '#444', letterSpacing: '0.5px' },
  hudValueText: { fontSize: '12px', fontFamily: 'monospace', fontWeight: '900', color: INK, letterSpacing: '0.5px' },

  // --- Avatar stack (top-right, stream-overlay style) ---
  avatarStack: { position: 'absolute', top: '14px', right: '16px', zIndex: 25, display: 'flex', flexDirection: 'row-reverse', justifyContent: 'flex-start', paddingLeft: '40px' },
  avatarBadge: { position: 'relative', width: '40px', height: '40px', borderRadius: '50%', background: '#0a0e16', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarInitials: { fontSize: '11px', fontFamily: 'monospace', fontWeight: '900' },
  avatarScoreChip: { position: 'absolute', bottom: '-7px', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', fontFamily: 'monospace', fontWeight: '900', color: '#000', background: GOLD, borderRadius: '8px', padding: '1px 5px', whiteSpace: 'nowrap' },

  countdownOverlay: { position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(4,5,8,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  countdownNumber: { fontSize: '96px', fontWeight: '900', fontFamily: 'monospace', color: GOLD, textShadow: `0 0 30px ${GOLD}` },
  countdownLabel: { fontSize: '13px', fontFamily: 'monospace', letterSpacing: '2px', color: '#888', fontStyle: 'italic' },
  radarContainerChassis: { position: 'relative', zIndex: 10, width: 'min(86vw, 360px)', height: 'min(86vw, 360px)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '76px 0 20px' },
  radarOuterRing: { width: '100%', height: '100%', borderRadius: '50%', border: '1.5px solid rgba(255,190,26,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(10,14,22,0.4) 0%, transparent 100%)' },
  radarMidRing: { width: '70%', height: '70%', borderRadius: '50%', border: '1px solid rgba(255,190,26,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  radarInnerRing: { position: 'relative', width: '45%', height: '40%', borderRadius: '50%', border: '1px dashed rgba(255,190,26,0.04)' },
  radarSweepBeam: { position: 'absolute', top: '50%', left: '50%', width: '160px', height: '160px', transformOrigin: 'top left', background: 'linear-gradient(45deg, rgba(255,190,26,0.08) 0%, transparent 45%)', pointerEvents: 'none' },
  radarWaitingLabel: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, 60px)', width: '220px', textAlign: 'center', fontSize: '10px', fontFamily: 'monospace', color: '#888', letterSpacing: '0.5px' },
  localPlayerAnchorNode: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '32px', height: '32px', borderRadius: '50%', background: '#0a0e16', border: `1.5px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, boxShadow: `0 0 20px ${GOLD}` },
  playerInitialsBadge: { fontSize: '10px', fontFamily: 'monospace', fontWeight: '900', color: GOLD },
  teammateMarkerNode: { position: 'absolute', top: '50%', left: '50%', width: '20px', height: '20px', borderRadius: '50%', background: '#0a0e16', border: '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25, transition: 'all 0.3s ease' },
  teammateAvatarInitials: { fontSize: '7px', fontFamily: 'monospace', fontWeight: '900', color: '#fff' },
  targetEntityMarkerNode: { position: 'absolute', top: '50%', left: '50%', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(4,5,8,0.8)', border: '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 28, cursor: 'pointer', transition: 'border-color 0.4s ease, box-shadow 0.4s ease' },
  captureFeedbackBanner: { position: 'absolute', top: '90px', zIndex: 70, padding: '8px 18px', borderRadius: '10px', border: '1.5px solid', background: 'rgba(4,5,8,0.9)', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.5px' },
  bottomControlDeck: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, display: 'flex', justifyContent: 'center', padding: '24px 16px', background: 'linear-gradient(0deg, rgba(4,5,8,0.95) 0%, transparent 100%)' },
  tacticalActionCard: { width: '100%', maxWidth: '420px', background: 'rgba(10,14,22,0.96)', border: `1.5px solid ${GOLD_SOFT}`, borderRadius: '24px', padding: '20px 24px', boxSizing: 'border-box', backdropFilter: 'blur(15px)', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' },
  cardHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.5px' },
  targetMetricsText: { color: '#666' },

  // Big arcade callout — replaces the old descriptive paragraph.
  bigActionTitle: { fontSize: '26px', fontWeight: '900', fontFamily: 'monospace', fontStyle: 'italic', color: INK, margin: '4px 0 0 0', letterSpacing: '0.5px', lineHeight: '1.1', textTransform: 'uppercase' },

  resultsAvatarRow: { display: 'flex', gap: '14px', overflowX: 'auto', padding: '6px 0 4px' },
  resultAvatarCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 },
  resultRankLabel: { fontSize: '9px', fontFamily: 'monospace', color: '#888', fontWeight: 'bold' },
  resultScoreLabel: { fontSize: '10px', fontFamily: 'monospace', color: GOLD, fontWeight: '900' },

  primaryActionButton: { width: '100%', border: 'none', borderRadius: '14px', padding: '16px', marginTop: '8px', boxSizing: 'border-box', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease', letterSpacing: '0.5px' },
  actionButtonsInlineFlexRow: { display: 'flex', gap: '12px', width: '100%', marginTop: '8px' },
  secondaryUtilityButton: { flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '12px', boxSizing: 'border-box', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s ease', outline: 'none' },
};
