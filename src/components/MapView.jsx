// src/components/MapViewjsx
//
// REACT NATIVE PORT of MapView.jsx (web build using framer-motion, raw
// DOM elements, CSS gradients/blur/masks).
//
// ============================================================================
// Library / API swaps made for RN (same conventions as RoomJoin.native.jsx)
// ============================================================================
//   framer-motion (motion.div, AnimatePresence)  -> Animated (RN core).
//                                                    Panel-switch cross-
//                                                    fade approximated with
//                                                    a local Fade wrapper
//                                                    instead of true exit
//                                                    animations — AnimatePresence
//                                                    has no RN equivalent.
//   <div>/<button>/<span>                         -> View/TouchableOpacity/Text.
//   backdropFilter: blur(...)                     -> DROPPED. Panels use a
//                                                    more opaque solid
//                                                    background instead,
//                                                    same choice as
//                                                    RoomJoin.native.jsx.
//   CSS gradient backgrounds                      -> DROPPED to flat colors.
//                                                    Pulling in
//                                                    expo-linear-gradient
//                                                    for a handful of subtle
//                                                    gradients wasn't worth
//                                                    a new native dependency;
//                                                    revisit if the flat
//                                                    panels read as too flat
//                                                    on device.
//   maskImage/scanGrid radial fade                -> DROPPED. RN has no CSS
//                                                    mask-image. The scan
//                                                    grid is decorative and
//                                                    was at 0.012 opacity on
//                                                    web anyway — omitted
//                                                    rather than faked.
//   boxShadow: '0 0 Npx color'                     -> Approximated with RN's
//                                                    shadowColor/Radius/
//                                                    Offset (iOS) +
//                                                    elevation (Android).
//                                                    Glow will read softer
//                                                    on Android; RN has no
//                                                    true CSS-style glow.
//   'translate(calc(-50% + Xpx), Ypx)' strings    -> transform: [{translateX},
//                                                    {translateY}] with the
//                                                    node's own half-width/
//                                                    height baked in as a
//                                                    constant offset (RN
//                                                    transforms don't support
//                                                    percentage or calc()).
//   px-string style values ('32px')               -> unitless numbers.
//
// Unchanged logic (still lives here, same behavior/contract):
//   distanceMeters, bearingDegrees, bearingToCompass, heatColorFromTrend,
//   veggiesWithGeo/teammatesWithGeo derivation, indoor/gps mode
//   classification, CATCH_RADIUS_METERS gating, huntCallout/captureCallout
//   text logic, onEnterAR/onExit contract, myPos/gpsError prop ownership
//   (still App.jsx's GPS watcher only — this file still never touches
//   location APIs directly).
//
// FIX (this revision) — `veggies`/`players` were being shadowed by local
// useState([]) that nothing ever updated, so this component silently
// ignored the veggies/players props App.js was already passing in. That
// made nearestVeggie/activeCaptureTarget permanently null, so the CATCH
// button never appeared and onEnterAR never fired. veggies/players are
// now read directly from props (with safe [] fallbacks) instead of local
// state — see safeVeggies/safePlayers below.
//
// RISK FLAG — not fixed here, not verifiable from this file alone:
//   `requestMotionPermission` is imported from '../lib/motionPermission',
//   same path as the web version. If that helper's *implementation* calls
//   a browser API (e.g. `DeviceMotionEvent.requestPermission()`, which is
//   a Safari-only API for the web build's iOS motion gate), it will fail
//   silently or throw on RN. I haven't seen that file's contents, so I
//   can't confirm either way — check it before shipping. If it does need
//   porting, it's the same category of fix as PrivacyModal/TermsModal
//   were: a small platform-specific rewrite, likely using expo-sensors'
//   permission calls instead.

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, Dimensions } from 'react-native';
import { requestMotionPermission } from '../lib/motionPermission';

const GOLD = '#ffbe1a';
const GOLD_SOFT = 'rgba(255, 190, 26, 0.15)';
const GREEN = '#39ff88';
const CYAN = '#3cd6ff';
const RED = '#ff3b3b';
const INK = '#f5f0e8';
const DIM = '#666';

const HEAT_COLD = [58, 134, 255];
const HEAT_NEUTRAL = [255, 190, 26];
const HEAT_HOT = [255, 45, 20];

const CATCH_RADIUS_METERS = 15;
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
const INDOOR_TARGET_PIXEL_RADIUS = RADAR_PIXEL_RADIUS * 0.62;
const EARTH_RADIUS_M = 6371000;

const AVATAR_RING_COLORS = ['#3a86ff', '#ff4d6d', '#2ecc71', '#f1c40f', '#8e44ad', '#3cd6ff'];

// Node sizes baked in as constants so radar-position transforms can bake
// in a fixed half-size offset (RN transforms can't express '-50%').
const LOCAL_NODE_SIZE = 32;
const TEAMMATE_NODE_SIZE = 20;
const TARGET_NODE_SIZE = 28;

function toRad(deg) { return (deg * Math.PI) / 180; }
function toDeg(rad) { return (rad * 180) / Math.PI; }
function isFiniteNumber(n) { return typeof n === 'number' && Number.isFinite(n); }

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

// Simple fade/slide mount wrapper — RN's answer to AnimatePresence for
// panel switching. Not a true crossfade between two panels (RN has no
// layout-animation-on-unmount by default), just a fade-in on the panel
// that's currently showing. Good enough for a bottom action card that
// swaps content instantly; revisit with react-native-reanimated's
// layout animations if a true crossfade is wanted later.
function Fade({ children, panelKey }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [panelKey, anim]);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// Continuous radar sweep — replaces framer-motion's `animate={{rotate:360}}`.
function RadarSweep() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 4000, easing: (t) => t, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return <Animated.View style={[styles.radarSweepBeam, { transform: [{ rotate }] }]} />;
}

// Pulsing target marker — replaces framer-motion's scale keyframe loop.
function PulsingTarget({ children, style }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] });
  return (
    <Animated.View style={[style, { transform: [...(style.transform || []), { scale }] }]}>
      {children}
    </Animated.View>
  );
}

export default function MapView({
  roomCode,
  playerId,
  mySlot,
  myPos,
  gpsError,
  veggies,
  players,
  onEnterAR,
  onExit,
}) {
  // veggies/players now come straight from props (App.js's subscribeToRoom
  // state) instead of local useState. Previously this component declared
  // its own local `players`/`veggies` state initialized to [] that nothing
  // ever updated, silently shadowing the real data App.js was already
  // passing down — that's why nearestVeggie/activeCaptureTarget were
  // always null and the CATCH button never appeared. Safe fallbacks below
  // just guard against a parent ever rendering <MapView /> before data
  // arrives (e.g. mount order edge cases), not a real source of state.
  const safeVeggies = veggies || [];
  const safePlayers = players || [];

  const [glitchActive, setGlitchActive] = useState(false);
  const [matchTick, setMatchTick] = useState(null);
  const [roundResults, setRoundResults] = useState(null);
  const [radarRotating, setRadarRotating] = useState(true);
  const [enteringAR, setEnteringAR] = useState(false);
  const [motionError, setMotionError] = useState('');

  // NOTE: same as the web file's own note — room subscription (players/
  // veggies/tick/go/round-end/glitch) is assumed to live here exactly as
  // it did before this visual patch. Not shown in the source I was given,
  // so not touched; wire it back in if your actual file has that
  // useEffect + subscribeToRoom block here.

  const selfPlayer = useMemo(
    () => safePlayers.find((p) => p.id === playerId) || null,
    [safePlayers, playerId]
  );
  const teammates = useMemo(
    () => safePlayers.filter((p) => p.id !== playerId),
    [safePlayers, playerId]
  );
  const myScore = selfPlayer?.score ?? 0;
  const myDisplayName = selfPlayer?.name || 'ME';
  const squadSize = safePlayers.length || 1;

  const clientTrackingMode = useMemo(() => {
    if (selfPlayer?.mode === 'gps' || selfPlayer?.mode === 'indoor') return selfPlayer.mode;
    if (!myPos) return 'unknown';
    if (isFiniteNumber(myPos.accuracy) && myPos.accuracy <= CLIENT_GPS_MODE_ACCURACY_THRESHOLD_M) return 'gps';
    return 'indoor';
  }, [selfPlayer, myPos]);
  const isIndoorMode = clientTrackingMode === 'indoor';

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

  const prevVeggieDistancesRef = useRef(new Map());

  const veggiesWithGeo = useMemo(() => {
    if (!myPos) return [];
    const mapped = safeVeggies.map((v) => {
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
  }, [safeVeggies, myPos, isIndoorMode]);

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

  const panelKey = roundResults ? 'results' : activeCaptureTarget ? 'catch' : 'nav';

  return (
    <View style={styles.screen}>
      <View style={styles.topHudBar}>
        <View style={styles.hudMetaSector}>
          <Text style={styles.hudLabelText}>ARENA ZONE</Text>
          <Text style={styles.hudValueText}>{roomCode ? roomCode.toUpperCase() : 'ARENA-1'}</Text>
        </View>
        <View style={styles.hudMetaSector}>
          <Text style={styles.hudLabelText}>SQUAD LINK</Text>
          <Text style={[styles.hudValueText, { color: connectionColor }]}>⚡ {connectionLabel}</Text>
        </View>
        <View style={styles.hudMetaSector}>
          <Text style={styles.hudLabelText}>TRACKING</Text>
          <Text style={[styles.hudValueText, { color: modeColor }]}>{modeLabel}</Text>
        </View>
      </View>

      {rosterWithRank.length > 0 && (
        <View style={styles.avatarStack}>
          {rosterWithRank.slice(0, 6).map((p, rank) => (
            <View
              key={p.id || p.name || rank}
              style={[
                styles.avatarBadge,
                {
                  borderColor: rank === 0 ? GOLD : p.ringColor,
                  marginLeft: rank === 0 ? 0 : -10,
                  zIndex: 10 - rank,
                  shadowColor: rank === 0 ? GOLD : p.ringColor,
                },
              ]}
            >
              <Text style={[styles.avatarInitials, { color: p.isSelf ? GOLD : INK }]}>
                {initialsOf(p.name || (p.isSelf ? myDisplayName : 'OP'))}
              </Text>
              <Text style={styles.avatarScoreChip}>{p.score ?? 0}</Text>
            </View>
          ))}
        </View>
      )}

      {matchTick != null && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownNumber}>{matchTick}</Text>
          <Text style={styles.countdownLabel}>SQUAD SPRINT INCOMING</Text>
        </View>
      )}

      <View style={styles.radarContainerChassis}>
        <View style={styles.radarOuterRing}>
          <View style={styles.radarMidRing}>
            <View style={styles.radarInnerRing}>
              {radarRotating && <RadarSweep />}

              <View style={styles.localPlayerAnchorNode}>
                <Text style={styles.playerInitialsBadge}>{myDisplayName.slice(0, 2).toUpperCase()}</Text>
              </View>

              {!myPos && (
                <Text style={styles.radarWaitingLabel}>{gpsError || 'ACQUIRING GPS FIX…'}</Text>
              )}

              {teammatesWithGeo.map((mate) => {
                const pixelDist = Math.min(mate.distance, RADAR_RANGE_M) * (RADAR_PIXEL_RADIUS / RADAR_RANGE_M);
                const { x, y } = bearingToRadarXY(mate.bearing, pixelDist);
                return (
                  <View
                    key={mate.id}
                    style={[
                      styles.teammateMarkerNode,
                      {
                        borderColor: '#3a86ff',
                        shadowColor: '#3a86ff',
                        transform: [
                          { translateX: x - TEAMMATE_NODE_SIZE / 2 },
                          { translateY: y - TEAMMATE_NODE_SIZE / 2 },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.teammateAvatarInitials}>{initialsOf(mate.name)}</Text>
                  </View>
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
                  <PulsingTarget
                    key={v.id}
                    style={[
                      styles.targetEntityMarkerNode,
                      {
                        borderColor: v.heatColor,
                        borderStyle: beyondRange ? 'dashed' : 'solid',
                        shadowColor: v.heatColor,
                        transform: [
                          { translateX: x - TARGET_NODE_SIZE / 2 },
                          { translateY: y - TARGET_NODE_SIZE / 2 },
                        ],
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 15 }}>{meta.emoji}</Text>
                  </PulsingTarget>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      {!!motionError && (
        <Fade panelKey="motion-error">
          <View style={[styles.captureFeedbackBanner, { borderColor: RED }]}>
            <Text style={{ color: RED, fontWeight: '700', fontSize: 12 }}>{motionError}</Text>
          </View>
        </Fade>
      )}

      <View style={styles.bottomControlDeck}>
        <Fade panelKey={panelKey}>
          {roundResults ? (
            <View style={styles.tacticalActionCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={{ color: GOLD, fontSize: 9, fontFamily: 'monospace', fontWeight: '700' }}>
                  ● ROUND COMPLETE
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.resultsAvatarRow}>
                {roundResults.slice(0, 6).map((r, i) => (
                  <View key={r.slot_id || i} style={styles.resultAvatarCol}>
                    <View
                      style={[
                        styles.avatarBadge,
                        {
                          borderColor: i === 0 ? GOLD : AVATAR_RING_COLORS[i % AVATAR_RING_COLORS.length],
                          shadowColor: i === 0 ? GOLD : AVATAR_RING_COLORS[i % AVATAR_RING_COLORS.length],
                        },
                      ]}
                    >
                      <Text style={styles.avatarInitials}>{initialsOf(r.name)}</Text>
                    </View>
                    <Text style={styles.resultRankLabel}>#{i + 1}</Text>
                    <Text style={styles.resultScoreLabel}>{r.score} PTS</Text>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity onPress={onExit} style={[styles.primaryActionButton, { backgroundColor: GOLD }]}>
                <Text style={styles.primaryActionButtonText}>EXIT MATRIX</Text>
              </TouchableOpacity>
            </View>
          ) : activeCaptureTarget ? (
            <View style={[styles.tacticalActionCard, { borderColor: GREEN, borderWidth: 2 }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={{ color: GREEN, fontWeight: '700', fontSize: 9, fontFamily: 'monospace' }}>
                  ● {isIndoorMode ? 'TARGET NEARBY' : 'CATCH ZONE'}
                </Text>
                <Text style={styles.targetMetricsText}>
                  +{(VEGGIE_POINTS[activeCaptureTarget.type] ?? 1) * (glitchActive ? 2 : 1)} PTS
                  {glitchActive ? ' ×2' : ''}
                </Text>
              </View>
              <Text style={styles.bigActionTitle}>
                {captureCallout({ isIndoorMode, activeCaptureTarget })}
              </Text>
              <TouchableOpacity
                onPress={handleCatchTap}
                disabled={enteringAR}
                style={[styles.primaryActionButton, { backgroundColor: enteringAR ? '#333' : GREEN }]}
              >
                <Text style={[styles.primaryActionButtonText, { color: enteringAR ? '#888' : '#000' }]}>
                  {enteringAR ? 'LAUNCHING AR…' : isIndoorMode ? 'SCAN ROOM' : 'CATCH'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tacticalActionCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={{ color: GOLD, fontSize: 9, fontFamily: 'monospace', fontWeight: '700' }}>● HUNTING</Text>
                <Text style={styles.targetMetricsText}>SCORE: {myScore}</Text>
              </View>
              <Text style={[styles.bigActionTitle, { color: gpsError ? RED : INK, fontSize: gpsError ? 17 : 26 }]}>
                {gpsError || huntCallout({ isIndoorMode, nearestVeggie, squadSize })}
              </Text>
              <View style={styles.actionButtonsInlineFlexRow}>
                <TouchableOpacity
                  onPress={() => setRadarRotating((prev) => !prev)}
                  style={[styles.secondaryUtilityButton, { borderColor: GOLD_SOFT }]}
                >
                  <Text style={{ color: GOLD, fontFamily: 'monospace', fontWeight: '700', fontSize: 11 }}>
                    {radarRotating ? 'PAUSE SWEEP' : 'START SWEEP'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onExit}
                  style={[styles.secondaryUtilityButton, { borderColor: 'rgba(255,59,59,0.15)' }]}
                >
                  <Text style={{ color: RED, fontFamily: 'monospace', fontWeight: '700', fontSize: 11 }}>
                    EXIT MATRIX
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Fade>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#040508' },

  topHudBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    flexDirection: 'row', gap: 20, paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: 'rgba(5,8,16,0.92)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  hudMetaSector: { flexDirection: 'column', gap: 2 },
  hudLabelText: { fontSize: 8.5, fontFamily: 'monospace', fontWeight: '700', color: '#444', letterSpacing: 0.5 },
  hudValueText: { fontSize: 12, fontFamily: 'monospace', fontWeight: '900', color: INK, letterSpacing: 0.5 },

  avatarStack: { position: 'absolute', top: 14, right: 16, zIndex: 25, flexDirection: 'row-reverse' },
  avatarBadge: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#0a0e16', borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  avatarInitials: { fontSize: 11, fontFamily: 'monospace', fontWeight: '900' },
  avatarScoreChip: {
    position: 'absolute', bottom: -7, fontSize: 8, fontFamily: 'monospace', fontWeight: '900',
    color: '#000', backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1,
  },

  countdownOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 60, backgroundColor: 'rgba(4,5,8,0.85)',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  countdownNumber: {
    fontSize: 96, fontWeight: '900', fontFamily: 'monospace', color: GOLD,
    textShadowColor: GOLD, textShadowRadius: 30, textShadowOffset: { width: 0, height: 0 },
  },
  countdownLabel: { fontSize: 13, fontFamily: 'monospace', letterSpacing: 2, color: '#888', fontStyle: 'italic' },

  radarContainerChassis: {
    alignSelf: 'center', width: 320, height: 320, alignItems: 'center', justifyContent: 'center', marginTop: 76,
  },
  radarOuterRing: {
    width: '100%', height: '100%', borderRadius: 160, borderWidth: 1.5, borderColor: 'rgba(255,190,26,0.06)',
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,14,22,0.25)',
  },
  radarMidRing: {
    width: '70%', height: '70%', borderRadius: 120, borderWidth: 1, borderColor: 'rgba(255,190,26,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  radarInnerRing: {
    width: '45%', height: '40%', borderRadius: 80, borderWidth: 1, borderColor: 'rgba(255,190,26,0.04)',
    borderStyle: 'dashed', position: 'relative', alignItems: 'center', justifyContent: 'center',
  },
  radarSweepBeam: {
    position: 'absolute', top: '50%', left: '50%', width: 160, height: 160,
    backgroundColor: 'rgba(255,190,26,0.06)', borderRadius: 80,
  },
  radarWaitingLabel: {
    position: 'absolute', top: '50%', width: 220, textAlign: 'center', transform: [{ translateX: -110 }, { translateY: 60 }],
    fontSize: 10, fontFamily: 'monospace', color: '#888', letterSpacing: 0.5,
  },
  localPlayerAnchorNode: {
    position: 'absolute', top: '50%', left: '50%',
    width: LOCAL_NODE_SIZE, height: LOCAL_NODE_SIZE, borderRadius: LOCAL_NODE_SIZE / 2,
    backgroundColor: '#0a0e16', borderWidth: 1.5, borderColor: GOLD,
    alignItems: 'center', justifyContent: 'center', zIndex: 30,
    transform: [{ translateX: -LOCAL_NODE_SIZE / 2 }, { translateY: -LOCAL_NODE_SIZE / 2 }],
    shadowColor: GOLD, shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  playerInitialsBadge: { fontSize: 10, fontFamily: 'monospace', fontWeight: '900', color: GOLD },
  teammateMarkerNode: {
    position: 'absolute', top: '50%', left: '50%',
    width: TEAMMATE_NODE_SIZE, height: TEAMMATE_NODE_SIZE, borderRadius: TEAMMATE_NODE_SIZE / 2,
    backgroundColor: '#0a0e16', borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 25,
    shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 5,
  },
  teammateAvatarInitials: { fontSize: 7, fontFamily: 'monospace', fontWeight: '900', color: '#fff' },
  targetEntityMarkerNode: {
    position: 'absolute', top: '50%', left: '50%',
    width: TARGET_NODE_SIZE, height: TARGET_NODE_SIZE, borderRadius: TARGET_NODE_SIZE / 2,
    backgroundColor: 'rgba(4,5,8,0.8)', borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 28,
    shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  captureFeedbackBanner: {
    position: 'absolute', top: 90, alignSelf: 'center', zIndex: 70, paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, backgroundColor: 'rgba(4,5,8,0.9)',
  },
  bottomControlDeck: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 24, backgroundColor: 'rgba(4,5,8,0.9)',
  },
  tacticalActionCard: {
    width: '100%', maxWidth: 420, backgroundColor: 'rgba(10,14,22,0.96)',
    borderWidth: 1.5, borderColor: GOLD_SOFT, borderRadius: 24, padding: 20, gap: 8,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  targetMetricsText: { color: '#666', fontSize: 9, fontFamily: 'monospace', fontWeight: '700' },
  bigActionTitle: {
    fontSize: 26, fontWeight: '900', fontFamily: 'monospace', fontStyle: 'italic', color: INK,
    marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  resultsAvatarRow: { flexGrow: 0, paddingVertical: 6 },
  resultAvatarCol: { alignItems: 'center', gap: 4, marginRight: 14 },
  resultRankLabel: { fontSize: 9, fontFamily: 'monospace', color: '#888', fontWeight: '700' },
  resultScoreLabel: { fontSize: 10, fontFamily: 'monospace', color: GOLD, fontWeight: '900' },
  primaryActionButton: { width: '100%', borderRadius: 14, paddingVertical: 16, marginTop: 8, alignItems: 'center' },
  primaryActionButtonText: { fontFamily: 'monospace', fontWeight: '700', fontSize: 13, letterSpacing: 0.5, color: '#000' },
  actionButtonsInlineFlexRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  secondaryUtilityButton: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1.5,
  },
});