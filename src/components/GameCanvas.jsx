// src/components/GameCanvas.jsx
//
// PHASE 2 MIGRATION — ViroReact real AR (ground-anchored) replaces the
// Three.js/vision-camera "basic camera" tier described in this file's
// old header comment. That comment documented deliberately shipping
// ONLY the basic-camera tier and marked `// AR_HOOK:` as the extension
// point for this exact migration — this revision is that extension.
//
// WHAT CHANGED vs the previous revision:
//   <Camera> (vision-camera)              -> <ViroARSceneNavigator>
//   <Canvas> (react-three-fiber)           -> GameCanvasARScene.jsx
//                                             (loaded BY the navigator,
//                                             own file since Viro scenes
//                                             are separate React roots)
//   AnimatedVeggieTarget (r3f useFrame)    -> moved into
//                                             GameCanvasARScene.jsx;
//                                             evasion math itself
//                                             (useVeggieEvasion) UNCHANGED,
//                                             just called from a
//                                             setInterval loop here
//                                             instead of r3f's useFrame,
//                                             since Viro has no useFrame
//                                             equivalent.
//   projectToScreen() manual FOV math      -> Viro's native
//                                             getScreenPositionOfWorldPosition
//                                             (called inside
//                                             GameCanvasARScene.jsx,
//                                             reported back up via
//                                             onVeggieScreenPositionsUpdate)
//   GroundShadow (fixed floorY guess)      -> real ARCore/ARKit plane
//                                             tracking via onTrackingUpdated
//                                             in GameCanvasARScene.jsx —
//                                             veggies now sit on your
//                                             ACTUAL floor.
//   CameraPitchRig (manual DeviceMotion)   -> DROPPED. Viro's AR camera
//                                             is driven by the real
//                                             ARCore/ARKit pose, not a
//                                             manual pitch estimate —
//                                             this whole rig is now
//                                             redundant/wrong to keep.
//
// EVERYTHING ELSE IN THIS FILE — the socket wiring, round/points/glitch
// state machine, capture-lock ring geometry (still 2D screen-space
// math, unchanged), popups, HUD, leaderboard, blind-attack overlay,
// jump-scare timing — is UNCHANGED. Only the render tree's AR/3D layer
// and the per-frame evasion loop's driver changed.
//
// KNOWN GAP CARRIED FORWARD: multi-device shared anchors (Cloud
// Anchors, so 30 phones see the SAME veggie in the SAME real-world
// spot) are NOT part of this revision — this gives each phone its OWN
// locally-anchored AR view. Real position sync between players still
// happens the old way, via server.js's veggies-update broadcast
// (lat/lng), same as before. Shared Cloud Anchors is a separate,
// larger piece of work (see project setup README, Step "Indoor Cloud
// Anchors").

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Share,
} from 'react-native';
import { ViroARSceneNavigator } from '@reactvision/react-viro';
import GameCanvasARScene from './GameCanvasARScene';
import CaptureThrow from './CaptureThrow';
import {
  AR_TRIGGER_DISTANCE_METERS,
  CATCH_TRIGGER_DISTANCE_METERS,
  RARITY_BY_SPECIES,
  PERSONALITY_CHASE_OVERRIDE,
} from '../config/gameConfig';
import { useVeggieEvasion } from '../hooks/useVeggieEvasion';

const EARTH_RADIUS_M = 6371000;

const FALLBACK_SESSION_SECONDS = 55;
const TIMER_SECONDS_BY_MODE = { indoor: 45, outdoor: 60 };

const LOCK_RADIUS_PX = 80;
const TOTAL_ROUNDS = 3;
const VACUUM_WINDOW_MS = 1200;
const CAPTURE_RESULT_TIMEOUT_MS = 3500;
const JUMP_SCARE_DELAY_MS = 4500;
const JUMP_SCARE_DURATION_MS = 900;
const KNOWN_VEGGIE_SPECIES = ['tomato', 'broccoli', 'golden', 'banana', 'grapes', 'strawberry'];
const BLIND_ATTACK_DURATION_MS = 1400;
const BLIND_ATTACK_COOLDOWN_MS = 3000;
const REAL_MISS_LABELS = ['TOO FAR', 'NOT AIMED', 'NEAR MISS', 'BREAKOUT'];
const EVASION_TICK_MS = 66; // ~15fps evasion update — matches old dtSeconds clamp of 1/15

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

function distanceMeters(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingDegrees(lat1, lng1, lat2, lng2) {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function chaseModeForSpecies(species) {
  if (Object.prototype.hasOwnProperty.call(PERSONALITY_CHASE_OVERRIDE, species)) {
    return PERSONALITY_CHASE_OVERRIDE[species];
  }
  const tier = RARITY_BY_SPECIES[species];
  return tier === 'rare' || tier === 'ultra_rare';
}

function seedFromId(id) {
  let h = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 1000 * Math.PI * 2;
}

// --- popup components — UNCHANGED from previous revision ---

function ScorePopup({ popup, onDone }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(anim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [30, -100] });
  const scale = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.7, 1.05, 1] });

  const handleShare = async () => {
    try {
      await Share.share({ message: `I just secured a ${popup.speciesName} and scored ${popup.text}! 🥕📸` });
    } catch {}
  };

  return (
    <Animated.View pointerEvents="box-none" style={[styles.scoreBurstWrapper, { opacity: anim, transform: [{ translateY }, { scale }] }]}>
      <Text style={styles.securedFlashTag}>SECURED! 💥</Text>
      {popup.isPerfect && <Text style={styles.perfectTag}>PERFECT!</Text>}
      <Text style={styles.bigScoreLabel}>{popup.text}</Text>
      <Text style={styles.speciesTextCard}>{popup.speciesName}</Text>
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>📤 SHARE</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function MissPopup({ miss, onDone }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(700),
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(onDone);
  }, []);
  return (
    <Animated.View pointerEvents="none" style={[styles.missBurstWrapper, { opacity: anim }]}>
      <Text style={styles.missLabel}>{miss.text}</Text>
    </Animated.View>
  );
}

function VacuumFlash({ points }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start(); }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [50, -100] });
  return (
    <Animated.View pointerEvents="none" style={[styles.vacuumFlashLabel, { opacity: anim, transform: [{ translateY }] }]}>
      <Text style={styles.vacuumFlashText}>🎉 SECURED! +{points} PTS</Text>
    </Animated.View>
  );
}

export default function GameCanvas({
  connectionStatus = 'idle',
  roomCode = '',
  playerId = null,
  mySlot = 'oggy-blue',
  selfPosition = null,
  deviceHeading = 0,
  players = {},
  veggies = {},
  matchPhase = null,
  initialTimingMode = null,
  targetVegId = null,
  socket = null,
  onExit,
}) {
  const [windowDims, setWindowDims] = useState(() => Dimensions.get('window'));
  const [popups, setPopups] = useState([]);
  const [missPopups, setMissPopups] = useState([]);
  const [caughtIds, setCaughtIds] = useState(() => new Set());
  const [captureResolutions, setCaptureResolutions] = useState([]);

  const [blindAttack, setBlindAttack] = useState(null);
  const blindCooldownRef = useRef(new Map());

  const [topBarHeight, setTopBarHeight] = useState(96);

  // Replaces vision-camera's hasPermission/cameraDevice — Viro manages
  // camera access internally as part of its AR session, so there's no
  // separate camera-permission dance to do here. groundReady comes from
  // GameCanvasARScene's onTrackingUpdated instead.
  const [groundReady, setGroundReady] = useState(false);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setWindowDims(window));
    return () => sub?.remove?.();
  }, []);

  const timerBaseSeconds = TIMER_SECONDS_BY_MODE[initialTimingMode] ?? FALLBACK_SESSION_SECONDS;
  const [secondsLeft, setSecondsLeft] = useState(timerBaseSeconds);

  const [matchRound, setMatchRound] = useState(1);
  const [currentRoundPoints, setCurrentRoundPoints] = useState(100);
  const [isGlitched, setIsGlitched] = useState(false);
  const [stageDeadline, setStageDeadline] = useState(null);

  const [vacuumLock, setVacuumLock] = useState(null);
  const timerFrozenRef = useRef(false);
  const attemptTimeoutRef = useRef(null);

  const lockedSinceRef = useRef(new Map());
  const [jumpScaredIds, setJumpScaredIds] = useState(() => new Set());
  const [glitchTargetId, setGlitchTargetId] = useState(null);

  const { processEvasionFrame, clearVeggieState } = useVeggieEvasion();
  const pendingCatchAttemptsRef = useRef({});
  const liveVeggieRef = useRef({});
  const [screenPositions, setScreenPositions] = useState({});

  const handleScreenPositionsUpdate = useCallback((results) => {
    setScreenPositions((prev) => {
      const next = { ...prev };
      results.forEach(({ id, x, y }) => { next[id] = { x, y }; });
      return next;
    });
  }, []);

  useEffect(() => () => clearTimeout(attemptTimeoutRef.current), []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (timerFrozenRef.current || stageDeadline == null) return;
      setSecondsLeft(Math.max(0, Math.ceil((stageDeadline - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [stageDeadline]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleCaughtBroadcast = (data) => {
      if (!data) return;
      if (data.vegId) setCaughtIds((prev) => new Set(prev).add(data.vegId));
      if (data.playerId !== socket.id) return;
      setPopups((prev) => [...prev, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: `+${data.points ?? 0}`,
        speciesName: (data.species || 'CAUGHT').toUpperCase(),
        isPerfect: data.quality === 'perfect',
      }]);
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
      if (resolution.vegId) pendingCatchAttemptsRef.current[resolution.vegId] = { success: resolution.success };

      if (resolution.success) {
        if (resolution.vegId) setVacuumLock({ targetId: resolution.vegId, expiresAt: Date.now() + VACUUM_WINDOW_MS });
        setTimeout(() => {
          timerFrozenRef.current = false;
          setVacuumLock((prev) => (prev?.targetId === resolution.vegId ? null : prev));
        }, VACUUM_WINDOW_MS);
      } else {
        timerFrozenRef.current = false;
        setMissPopups((prev) => [...prev, { id: resolution.id, text: label }]);
        const vegId = resolution.vegId;
        if (vegId && REAL_MISS_LABELS.includes(label)) {
          const now = Date.now();
          const nextEligible = blindCooldownRef.current.get(vegId) || 0;
          if (now >= nextEligible) {
            blindCooldownRef.current.set(vegId, now + BLIND_ATTACK_COOLDOWN_MS);
            setBlindAttack({ id: vegId, startedAt: now });
            setTimeout(() => {
              setBlindAttack((prev) => (prev?.id === vegId && prev.startedAt === now ? null : prev));
            }, BLIND_ATTACK_DURATION_MS);
          }
        }
      }
    };

    const handleRoundStart = (data) => {
      if (!data) return;
      setMatchRound(data.round || 1);
      setCurrentRoundPoints(data.pointValue ?? 100);
      setStageDeadline(Date.now() + timerBaseSeconds * 1000);
      setVacuumLock(null);
      timerFrozenRef.current = false;
      lockedSinceRef.current.clear();
      setJumpScaredIds(new Set());
      setCaughtIds(new Set());
    };

    const handleRoundTimeoutEvt = () => { timerFrozenRef.current = false; setVacuumLock(null); };
    const handleGlitchPulse = (data) => setIsGlitched(!!data?.active);

    socket.on('veggieCaught', handleCaughtBroadcast);
    socket.on('capture-result', handleCaptureResult);
    socket.on('round-timeout', handleRoundTimeoutEvt);
    socket.on('round-start', handleRoundStart);
    socket.on('glitch-pulse', handleGlitchPulse);
    return () => {
      socket.off('veggieCaught', handleCaughtBroadcast);
      socket.off('capture-result', handleCaptureResult);
      socket.off('round-timeout', handleRoundTimeoutEvt);
      socket.off('round-start', handleRoundStart);
      socket.off('glitch-pulse', handleGlitchPulse);
    };
  }, [socket, timerBaseSeconds]);

  const rawTargetNodes = useMemo(() => {
    if (!selfPosition || !veggies || typeof veggies !== 'object') return [];
    const list = [];
    Object.entries(veggies).forEach(([id, node]) => {
      if (!node || node.lat == null || node.lng == null) return;
      const dist = distanceMeters(selfPosition.lat, selfPosition.lng, node.lat, node.lng);
      if (dist > AR_TRIGGER_DISTANCE_METERS) return;

      const bearing = bearingDegrees(selfPosition.lat, selfPosition.lng, node.lat, node.lng);
      const relAngle = ((bearing - deviceHeading + 540) % 360) - 180;
      const relAngleRad = toRad(relAngle);
      const sceneDepth = Math.min(11, Math.max(1.6, dist / 5));
      const worldX = Math.sin(relAngleRad) * sceneDepth;
      const worldZ = -Math.cos(relAngleRad) * sceneDepth;

      list.push({
        id,
        position: [worldX, 0, worldZ],
        species: (node.species || node.type || KNOWN_VEGGIE_SPECIES[0]).toLowerCase(),
        teamColor: node.teamColor || 'yellow',
        distance: dist,
        isGolden: (node.species || node.type) === 'golden',
        runSeed: seedFromId(id),
      });
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [veggies, selfPosition, deviceHeading]);

  const targetNodes = useMemo(() => {
    if (!targetVegId) return rawTargetNodes;
    return rawTargetNodes.filter((n) => n.id === targetVegId);
  }, [rawTargetNodes, targetVegId]);

  useEffect(() => {
    if (targetNodes.length === 0) { setGlitchTargetId(null); return; }
    const nearest = targetNodes.reduce((a, b) => (a.distance <= b.distance ? a : b));
    setGlitchTargetId((prev) => (prev === nearest.id ? prev : nearest.id));
  }, [targetNodes]);

  useEffect(() => {
    let lastTs = Date.now();
    const intervalId = setInterval(() => {
      const now = Date.now();
      const dt = Math.min((now - lastTs) / 1000, 1 / 15);
      lastTs = now;

      targetNodes.forEach((node) => {
        const live = liveVeggieRef.current[node.id] || { x: node.position[0], z: node.position[2] };
        const pending = pendingCatchAttemptsRef.current[node.id];
        let catchAttempted = false, catchLockSuccess = false;
        if (pending) {
          catchAttempted = true;
          catchLockSuccess = !!pending.success;
          delete pendingCatchAttemptsRef.current[node.id];
        }

        const result = processEvasionFrame(node.id, {
          distanceMeters: node.distance,
          worldX: live.x,
          worldZ: live.z,
          dtSeconds: dt,
          deviceHeadingDeg: deviceHeading,
          catchAttempted,
          catchLockSuccess,
          catchDifficulty: node.isGolden ? 0.8 : 0.3,
          chaseMode: chaseModeForSpecies(node.species),
          floorY: 0,
        });

        liveVeggieRef.current[node.id] = {
          x: live.x + result.dx,
          z: live.z + result.dz,
          worldY: result.worldY,
          fleaRadius: result.fleaRadius,
          state: result.state,
        };
      });
    }, EVASION_TICK_MS);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetNodes, deviceHeading]);

  useEffect(() => {
    return () => {
      const currentIds = new Set(targetNodes.map((n) => n.id));
      Object.keys(liveVeggieRef.current).forEach((id) => {
        if (!currentIds.has(id)) {
          clearVeggieState(id);
          delete liveVeggieRef.current[id];
        }
      });
    };
  }, [targetNodes, clearVeggieState]);

  const captureTargets = useMemo(() => {
    return targetNodes
      .map((node) => {
        const sp = screenPositions[node.id];
        if (!sp || sp.x == null || sp.y == null) return null;
        return { id: node.id, species: node.species, distance: node.distance, x: sp.x, y: sp.y, radius: 60 };
      })
      .filter(Boolean);
  }, [targetNodes, screenPositions]);

  const lockRings = useMemo(() => {
    const cx = windowDims.width / 2;
    const cy = windowDims.height / 2;
    return captureTargets.map((t) => {
      const dx = t.x - cx, dy = t.y - cy;
      const distToCenter = Math.sqrt(dx * dx + dy * dy);
      const inRealRange = t.distance <= CATCH_TRIGGER_DISTANCE_METERS;
      const locked = distToCenter <= LOCK_RADIUS_PX && inRealRange;
      const vacuuming = vacuumLock?.targetId === t.id;
      const jumpScared = jumpScaredIds.has(t.id);
      return { ...t, locked, inRealRange, vacuuming, jumpScared };
    });
  }, [captureTargets, windowDims, vacuumLock, jumpScaredIds]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const stillLockedIds = new Set(lockRings.filter((r) => r.locked && !r.vacuuming).map((r) => r.id));
      for (const id of stillLockedIds) if (!lockedSinceRef.current.has(id)) lockedSinceRef.current.set(id, now);
      for (const id of Array.from(lockedSinceRef.current.keys())) if (!stillLockedIds.has(id)) lockedSinceRef.current.delete(id);

      stillLockedIds.forEach((id) => {
        const lockedSince = lockedSinceRef.current.get(id);
        if (lockedSince != null && now - lockedSince >= JUMP_SCARE_DELAY_MS) {
          setJumpScaredIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
          lockedSinceRef.current.set(id, now);
          setTimeout(() => {
            setJumpScaredIds((prev) => { if (!prev.has(id)) return prev; const next = new Set(prev); next.delete(id); return next; });
          }, JUMP_SCARE_DURATION_MS);
        }
      });
    }, 250);
    return () => clearInterval(intervalId);
  }, [lockRings]);

  const handleCaptureAttempt = useCallback((id, quality) => {
    const targetNode = targetNodes.find((n) => n.id === id);
    if (targetNode && targetNode.distance > CATCH_TRIGGER_DISTANCE_METERS) return;

    timerFrozenRef.current = true;
    lockedSinceRef.current.delete(id);
    setJumpScaredIds((prev) => { if (!prev.has(id)) return prev; const next = new Set(prev); next.delete(id); return next; });

    clearTimeout(attemptTimeoutRef.current);
    attemptTimeoutRef.current = setTimeout(() => { timerFrozenRef.current = false; }, CAPTURE_RESULT_TIMEOUT_MS);

    socket?.emit('capture-attempt', { vegId: id, quality });
  }, [targetNodes, socket]);

  const timerColor = secondsLeft <= 10 ? '#ff3f34' : secondsLeft <= 20 ? '#ffbe1a' : '#39ff88';
  const myScore = players?.[mySlot]?.score ?? 0;
  const myMode = players?.[mySlot]?.mode;

  const rankedPlayers = useMemo(() => {
    return Object.entries(players || {})
      .map(([slot, p]) => ({ slot, name: p?.name || (slot === mySlot ? 'You' : slot), score: p?.score ?? 0 }))
      .sort((a, b) => b.score - a.score);
  }, [players, mySlot]);

  const visibleTargetCount = targetNodes.length;

  return (
    <View style={styles.viewport}>
      <ViroARSceneNavigator
        style={StyleSheet.absoluteFill}
        autofocus={true}
        initialScene={{ scene: GameCanvasARScene }}
        viroAppProps={{
          targetNodes,
          glitchTargetId,
          isGlitched,
          jumpScaredIds,
          vacuumingId: vacuumLock?.targetId ?? null,
          caughtIds,
          onVeggieScreenPositionsUpdate: handleScreenPositionsUpdate,
          onGroundReady: setGroundReady,
        }}
      />

      {!groundReady && (
        <View style={styles.groundScanOverlay} pointerEvents="none">
          <Text style={styles.groundScanText}>📡 SCANNING SURROUNDINGS...</Text>
          <Text style={styles.groundScanSubtext}>Slowly pan your camera around</Text>
        </View>
      )}

      {blindAttack && <View style={styles.blindAttackOverlay} pointerEvents="none" />}

      {myMode === 'indoor' && (
        <View style={styles.alignmentBarWrap} pointerEvents="none">
          <View style={styles.alignmentBar} />
          <Text style={styles.alignmentBarLabel}>ALIGN DEVICE TO CENTER LINE</Text>
        </View>
      )}

      {vacuumLock && <VacuumFlash points={currentRoundPoints} />}

      <View style={styles.lockLayer} pointerEvents="none">
        {lockRings.map((ring) => {
          const color = ring.vacuuming ? '#ffbe1a' : ring.locked ? '#39ff6e' : '#ff3b3b';
          const size = ring.radius * 2.6;
          const distLabel = `${ring.species.toUpperCase()} ${ring.distance.toFixed(1)}m`;
          const label = ring.vacuuming ? 'MAX SUCTION' : ring.locked ? `LOCKED ON! · ${distLabel}` : !ring.inRealRange ? `MOVE CLOSER! · ${distLabel}` : distLabel;
          const labelColor = ring.vacuuming ? '#ffbe1a' : ring.locked ? '#39ff6e' : '#ff8f85';
          return (
            <View key={`bracket-${ring.id}`} style={[styles.bracketWrap, { left: ring.x - size / 2, top: ring.y - size / 2, width: size, height: size }]}>
              <View style={[styles.bracketCorner, styles.bracketTL, { borderColor: color }]} />
              <View style={[styles.bracketCorner, styles.bracketTR, { borderColor: color }]} />
              <View style={[styles.bracketCorner, styles.bracketBL, { borderColor: color }]} />
              <View style={[styles.bracketCorner, styles.bracketBR, { borderColor: color }]} />
              <Text style={[styles.bracketLabel, { color: labelColor }]}>{label}</Text>
            </View>
          );
        })}
      </View>

      <CaptureThrow
        targets={captureTargets}
        onAttempt={handleCaptureAttempt}
        captureResolutions={captureResolutions}
        disabled={!groundReady}
        screenW={windowDims.width}
        screenH={windowDims.height}
      />

      {isGlitched && (
        <View style={styles.glitchBanner} pointerEvents="none">
          <Text style={styles.glitchBannerText}>⚠️ GLITCH SURGE — TARGETS MOVING ERRATICALLY ⚠️</Text>
        </View>
      )}

      <View style={styles.topBar} pointerEvents="none" onLayout={(e) => setTopBarHeight(e.nativeEvent.layout.height + 10)}>
        <View style={styles.topBarHeader}>
          <View style={styles.scanDot} />
          <Text style={styles.topBarHeaderText}>HUNTING FOR TARGETS</Text>
        </View>
        <View style={styles.telemetryRow}>
          <View style={styles.ptsTag}><Text style={styles.ptsNumber}>{myScore.toLocaleString()}</Text><Text style={styles.ptsTagText}> PTS</Text></View>
          <View style={styles.telemetryTag}><Text style={styles.telemetryTagText}>ARENA: <Text style={{ color: '#00e5e5' }}>{roomCode || 'LOCAL'}</Text></Text></View>
          <View style={styles.telemetryTag}><Text style={styles.telemetryTagText}>ROUND: <Text style={{ color: '#c084fc' }}>{matchRound}/{TOTAL_ROUNDS}</Text></Text></View>
          <View style={[styles.telemetryTag, isGlitched && { borderColor: 'rgba(255,190,26,0.7)' }]}>
            <Text style={styles.telemetryTagText}>TIER: <Text style={{ color: isGlitched ? '#ffbe1a' : '#39ff88' }}>{currentRoundPoints} PTS</Text></Text>
          </View>
          <View style={styles.telemetryTag}><Text style={styles.telemetryTagText}>COMPASS: <Text style={{ color: '#39ff88' }}>{Math.round(deviceHeading)}°</Text></Text></View>
          <View style={styles.telemetryTag}><Text style={styles.telemetryTagText}>TIME: <Text style={{ color: timerColor, fontWeight: '900' }}>{vacuumLock ? '⏸' : secondsLeft}s</Text></Text></View>
          <View style={styles.telemetryTag}><Text style={styles.telemetryTagText}>LOCKS: <Text style={{ color: '#ffbe1a' }}>{visibleTargetCount} IN SIGHT</Text></Text></View>
          {myMode && (
            <View style={styles.telemetryTag}><Text style={styles.telemetryTagText}>{myMode === 'gps' ? '🛰 OUTDOOR GPS' : '📶 INDOOR SENSOR'}</Text></View>
          )}
        </View>
      </View>

      {rankedPlayers.length > 0 && (
        <View style={[styles.leaderboardWidget, { top: topBarHeight }]} pointerEvents="none">
          <Text style={styles.leaderboardTitle}>LEADERBOARD</Text>
          {rankedPlayers.slice(0, 4).map((p, idx) => (
            <View key={p.slot} style={[styles.leaderboardRow, p.slot === mySlot && styles.leaderboardRowMe]}>
              <Text style={styles.leaderboardRank}>{idx === 0 ? '👑' : `#${idx + 1}`}</Text>
              <Text style={styles.leaderboardName} numberOfLines={1}>
                {p.name}
                {idx === 0 && <Text style={styles.crownLabel}> CROWN MASTER</Text>}
                {p.slot === mySlot && <Text style={styles.youLabel}> (You)</Text>}
              </Text>
              <Text style={styles.leaderboardScore}>{p.score.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      {popups.map((popup) => (
        <ScorePopup key={popup.id} popup={popup} onDone={() => setPopups((prev) => prev.filter((p) => p.id !== popup.id))} />
      ))}
      {missPopups.map((miss) => (
        <MissPopup key={miss.id} miss={miss} onDone={() => setMissPopups((prev) => prev.filter((p) => p.id !== miss.id))} />
      ))}

      <View style={styles.controlDeck}>
        <TouchableOpacity onPress={onExit} style={styles.fleeBtn}>
          <Text style={styles.fleeBtnText}>← RADAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { ...StyleSheet.absoluteFillObject, backgroundColor: '#04060a' },

  groundScanOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(4,6,10,0.55)', zIndex: 80 },
  groundScanText: { color: '#39ff88', fontWeight: '900', fontSize: 16, marginBottom: 6 },
  groundScanSubtext: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },

  blindAttackOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,40,10,0.6)' },

  alignmentBarWrap: { position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center' },
  alignmentBar: { width: '86%', height: 2, backgroundColor: 'rgba(255,255,255,0.75)' },
  alignmentBarLabel: { marginTop: 6, color: 'rgba(255,255,255,0.85)', fontSize: 10, letterSpacing: 1.5 },

  glitchBanner: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#c21f1f', paddingVertical: 9, paddingHorizontal: 10, zIndex: 60 },
  glitchBannerText: { color: '#fff', fontWeight: '800', fontSize: 12, textAlign: 'center', letterSpacing: 1 },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(6,10,18,0.85)', padding: 12, zIndex: 30 },
  topBarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  topBarHeaderText: { color: '#ffbe1a', fontWeight: '700', fontSize: 11, letterSpacing: 1.5, marginLeft: 6 },
  scanDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ffbe1a' },
  telemetryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  telemetryTag: { backgroundColor: 'rgba(10,16,30,0.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 7, paddingVertical: 6, paddingHorizontal: 12 },
  telemetryTagText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  ptsTag: { flexDirection: 'row', backgroundColor: 'rgba(10,16,30,0.85)', borderWidth: 1, borderColor: 'rgba(255,190,26,0.4)', borderRadius: 7, paddingVertical: 6, paddingHorizontal: 12 },
  ptsNumber: { color: '#ffe066', fontWeight: '900', fontSize: 13 },
  ptsTagText: { color: '#ffbe1a', fontWeight: '700', fontSize: 11 },

  leaderboardWidget: { position: 'absolute', right: 14, width: 210, backgroundColor: 'rgba(8,12,22,0.92)', borderWidth: 1.5, borderColor: '#ffbe1a', borderRadius: 10, padding: 10, zIndex: 30 },
  leaderboardTitle: { color: '#ffbe1a', fontWeight: '800', fontSize: 11, letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 6, padding: 6, marginBottom: 5, backgroundColor: 'rgba(255,255,255,0.04)' },
  leaderboardRowMe: { borderWidth: 1, borderColor: 'rgba(255,140,0,0.45)' },
  leaderboardRank: { fontSize: 13, width: 20, textAlign: 'center' },
  leaderboardName: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '600' },
  crownLabel: { color: '#ffbe1a', fontSize: 9, fontWeight: '800' },
  youLabel: { color: '#ff9d3f', fontSize: 10, fontWeight: '700' },
  leaderboardScore: { color: '#39ff88', fontWeight: '800', fontSize: 12 },

  lockLayer: { ...StyleSheet.absoluteFillObject, zIndex: 25 },
  bracketWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  bracketCorner: { position: 'absolute', width: '26%', height: '26%', borderColor: '#fff' },
  bracketTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  bracketTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bracketBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bracketBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  bracketLabel: { position: 'absolute', bottom: -18, fontSize: 8.5, fontWeight: '800', letterSpacing: 0.5 },

  controlDeck: { position: 'absolute', top: 14, left: 14, zIndex: 50 },
  fleeBtn: { backgroundColor: 'rgba(255,63,52,0.92)', borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 },
  fleeBtnText: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },

  scoreBurstWrapper: { position: 'absolute', top: '20%', left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
  securedFlashTag: { fontSize: 20, fontWeight: '900', color: '#ffbe1a', letterSpacing: 2, marginBottom: 4 },
  perfectTag: { fontSize: 16, fontWeight: '900', color: '#3cd6ff', letterSpacing: 2, marginBottom: 2 },
  bigScoreLabel: { fontSize: 60, fontWeight: '900', color: '#ffbe1a', letterSpacing: 2 },
  speciesTextCard: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 1, marginTop: 4 },
  shareBtn: { marginTop: 14, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 2, borderColor: '#ffbe1a', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20 },
  shareBtnText: { color: '#ffbe1a', fontWeight: 'bold', fontSize: 12 },

  missBurstWrapper: { position: 'absolute', top: '35%', left: 0, right: 0, alignItems: 'center', zIndex: 999 },
  missLabel: { fontSize: 28, fontWeight: '800', color: '#ff6b5e', letterSpacing: 1.5 },
});