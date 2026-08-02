// src/screens/GameCanvas.native.jsx
//
// THIS REVISION — added ARCore-unavailable fallback:
//   PROBLEM: on devices without ARCore support (or with a broken/
//   uninstallable "Google Play Services for AR"), ViroARSceneNavigator
//   triggers a native install prompt that can never complete. Because
//   that install screen is native and outside JS, onTrackingUpdated /
//   onReady in GameCanvasARScene never fire, so arStatus stayed
//   'loading' forever and the whole screen froze — no code path ever
//   moved past it.
//
//   FIX: AR_READY_TIMEOUT_MS timer starts on mount. If arStatus hasn't
//   reached 'ready' within that window, arUnavailable flips true,
//   ViroARSceneNavigator is unmounted, and a fallback tap-to-capture
//   list (FallbackCaptureList) renders instead — same
//   handleARCaptureAttempt() capture path, no camera required. This
//   guarantees the core capture loop is testable/playable on any
//   device, ARCore-certified or not.
//
// Everything else unchanged from the prior revision.

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Share, ScrollView } from 'react-native';
import { ViroARSceneNavigator } from '@reactvision/react-viro';
import GameCanvasARScene from './GameCanvasARScene';

const FALLBACK_SESSION_SECONDS = 55;
const TOTAL_ROUNDS = 3;
const VACUUM_WINDOW_MS = 1200;
const CAPTURE_RESULT_TIMEOUT_MS = 3500;
const BLIND_ATTACK_DURATION_MS = 1400;
const BLIND_ATTACK_COOLDOWN_MS = 3000;
const REAL_MISS_LABELS = ['TOO FAR', 'NOT AIMED', 'NEAR MISS', 'BREAKOUT'];
const AR_READY_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------
// Popups
// ---------------------------------------------------------------------

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
    <Animated.View
      pointerEvents="box-none"
      style={[styles.scoreBurstWrapper, { opacity: anim, transform: [{ translateY }, { scale }] }]}
    >
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
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [50, -100] });
  return (
    <Animated.View pointerEvents="none" style={[styles.vacuumFlashLabel, { opacity: anim, transform: [{ translateY }] }]}>
      <Text style={styles.vacuumFlashText}>🎉 SECURED! +{points} PTS</Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------
// Fallback capture UI — used when ARCore never becomes ready
// ---------------------------------------------------------------------

function FallbackCaptureList({ veggies, matchPhase, vacuumingId, onCapture }) {
  const liveVeggies = matchPhase === 'live' ? veggies : [];
  return (
    <View style={styles.fallbackWrap} pointerEvents="box-none">
      <View style={styles.fallbackBanner}>
        <Text style={styles.fallbackBannerText}>
          📡 AR CAMERA UNAVAILABLE ON THIS DEVICE — TAP TO CAPTURE BELOW
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.fallbackList}>
        {liveVeggies.length === 0 && (
          <Text style={styles.fallbackEmptyText}>No targets in range yet…</Text>
        )}
        {liveVeggies.map((veg) => {
          const veggieId = veg.id ?? veg.veggieId;
          const isVacuuming = vacuumingId === veggieId;
          return (
            <TouchableOpacity
              key={veggieId}
              style={[styles.fallbackCard, isVacuuming && styles.fallbackCardLocked]}
              disabled={isVacuuming}
              onPress={() => onCapture({ veggieId, success: true })}
            >
              <Text style={styles.fallbackCardTitle}>{(veg.species || veg.type || 'VEGGIE').toUpperCase()}</Text>
              <Text style={styles.fallbackCardMeta}>
                {veg.distance != null ? `${Math.round(veg.distance)}m away` : 'distance unknown'}
              </Text>
              <Text style={styles.fallbackCardCta}>{isVacuuming ? 'SECURING…' : 'TAP TO CAPTURE'}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------
// GameCanvas
// ---------------------------------------------------------------------

export default function GameCanvas({
  roomCode = '',
  playerId = null,
  veggies = [],
  matchPhase = null,
  socket = null,
  myPos = null,
  deviceHeading = 0,
  onExit,
}) {
  const [popups, setPopups] = useState([]);
  const [missPopups, setMissPopups] = useState([]);
  const [captureResolutions, setCaptureResolutions] = useState([]);

  const [blindAttack, setBlindAttack] = useState(null);
  const blindCooldownRef = useRef(new Map());

  const [topBarHeight, setTopBarHeight] = useState(96);

  // GameCanvasARScene renders its own loading/tracking-lost/error state
  // internally; this is only mirrored here so the HUD telemetry bar can
  // show status. Same role arStatus played with UnityARView before.
  const [arStatus, setArStatus] = useState('loading');

  // arUnavailable: null = still checking, true/false = known result.
  // ViroARSceneNavigator only mounts once this is explicitly false —
  // mounting it at all is what triggers ARCore's native install flow,
  // so on unsupported devices we must never mount it in the first place.
  //
  // TEMP_SKIP_AR_CHECK: isARSupportedOnDevice() itself has been confirmed
  // to trigger the same native "not compatible" Play Store redirect on
  // unsupported hardware (known ViroReact issue, not fixable from here).
  // Until that's resolved, force fallback mode unconditionally so the
  // core capture loop is testable today. Flip this back to run the real
  // check once testing on ARCore-supported hardware.
  const TEMP_SKIP_AR_CHECK = true;
  const [arUnavailable, setArUnavailable] = useState(TEMP_SKIP_AR_CHECK ? true : null);

  useEffect(() => {
    if (TEMP_SKIP_AR_CHECK) {
      setArStatus('unavailable');
      return undefined;
    }
    // Real ARCore check intentionally left out for now — importing
    // ViroUtils crashed at module load in this project's installed
    // @reactvision/react-viro version (isARSupportedOnDevice was
    // undefined). Re-add once confirmed working against the exact
    // installed version.
    setArUnavailable(true);
    setArStatus('unavailable');
    return undefined;
  }, []);

  // Secondary safety net: even once ViroARSceneNavigator is mounted (AR
  // reported as supported), if onReady never fires within this window
  // (e.g. TRANSIENT/UNKNOWN result, flaky tracking init), fall back
  // rather than sit on a frozen screen.
  const arStatusRef = useRef(arStatus);
  useEffect(() => {
    arStatusRef.current = arStatus;
  }, [arStatus]);

  useEffect(() => {
    if (arUnavailable !== false) return undefined; // only run once navigator is actually mounted
    const timeoutId = setTimeout(() => {
      if (arStatusRef.current !== 'ready') {
        setArUnavailable(true);
        setArStatus('unavailable');
      }
    }, AR_READY_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [arUnavailable]);

  const [players, setPlayers] = useState([]);

  const timerBaseSeconds = FALLBACK_SESSION_SECONDS;
  const [secondsLeft, setSecondsLeft] = useState(timerBaseSeconds);

  const [matchRound, setMatchRound] = useState(1);
  const [currentRoundPoints, setCurrentRoundPoints] = useState(100);
  const [isGlitched, setIsGlitched] = useState(false);
  const [stageDeadline, setStageDeadline] = useState(null);

  const [vacuumLock, setVacuumLock] = useState(null);
  const timerFrozenRef = useRef(false);
  const attemptTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(attemptTimeoutRef.current), []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (timerFrozenRef.current || stageDeadline == null) return;
      setSecondsLeft(Math.max(0, Math.ceil((stageDeadline - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [stageDeadline]);

  // ---- players-update self-subscription ----------------------------
  useEffect(() => {
    if (!socket) return undefined;
    const handlePlayersUpdate = (rows) => {
      setPlayers(Array.isArray(rows) ? rows : Object.values(rows || {}));
    };
    socket.on('players-update', handlePlayersUpdate);
    return () => socket.off('players-update', handlePlayersUpdate);
  }, [socket]);

  // ---- gameplay socket events ----------------------------------------
  useEffect(() => {
    if (!socket) return undefined;

    const handleCaughtBroadcast = (data) => {
      if (!data) return;
      if (data.playerId !== socket.id) return;
      setPopups((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          text: `+${data.points ?? 0}`,
          speciesName: (data.species || 'CAUGHT').toUpperCase(),
          isPerfect: data.quality === 'perfect',
        },
      ]);
    };

    const handleCaptureResult = (data) => {
      if (!data) return;
      clearTimeout(attemptTimeoutRef.current);
      const label = data.success ? null : data.label || 'MISSED';
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

      if (resolution.success) {
        if (resolution.vegId) {
          setVacuumLock({ targetId: resolution.vegId, expiresAt: Date.now() + VACUUM_WINDOW_MS });
        }
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
    };

    const handleRoundTimeoutEvt = () => {
      timerFrozenRef.current = false;
      setVacuumLock(null);
    };

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

  // ---- AR scene <- server capture relay -------------------------------
  const handleARCaptureAttempt = useCallback(
    (payload) => {
      if (!payload?.veggieId) return;

      timerFrozenRef.current = true;
      clearTimeout(attemptTimeoutRef.current);
      attemptTimeoutRef.current = setTimeout(() => {
        timerFrozenRef.current = false;
      }, CAPTURE_RESULT_TIMEOUT_MS);

      socket?.emit('capture-attempt', {
        vegId: payload.veggieId,
        quality: payload.success ? 'good' : undefined,
      });
    },
    [socket]
  );

  const timerColor = secondsLeft <= 10 ? '#ff3f34' : secondsLeft <= 20 ? '#ffbe1a' : '#39ff88';

  const myPlayerRow = useMemo(
    () => players.find((p) => p && p.id === playerId) || null,
    [players, playerId]
  );
  const myScore = myPlayerRow?.score ?? 0;

  const rankedPlayers = useMemo(() => {
    return players
      .map((p) => ({
        id: p.id,
        name: p.name || 'PILOT',
        score: p.score ?? 0,
        isMe: p.id === playerId,
      }))
      .sort((a, b) => b.score - a.score);
  }, [players, playerId]);

  const arRoundState = matchPhase === 'live' ? 'active' : matchPhase === 'victory' ? 'ended' : 'paused';

  const arStatusLabel =
    arStatus === 'unavailable' ? 'OFFLINE' : arStatus === 'ready' ? 'READY' : arStatus.toUpperCase();
  const arStatusColor =
    arStatus === 'ready' ? '#39ff88' : arStatus === 'unavailable' ? '#ff9d3f' : '#ffbe1a';

  return (
    <View style={styles.viewport}>
      {arUnavailable === null ? (
        <View style={styles.checkingWrap}>
          <Text style={styles.checkingText}>Checking AR support…</Text>
        </View>
      ) : arUnavailable === false ? (
        <ViroARSceneNavigator
          style={StyleSheet.absoluteFill}
          autofocus
          initialScene={{ scene: GameCanvasARScene }}
          viroAppProps={{
            roomCode,
            playerId,
            veggies,
            matchPhase,
            roundState: arRoundState,
            myPos,
            deviceHeading,
            isGlitched,
            vacuumingId: vacuumLock?.targetId ?? null,
            onReady: () => setArStatus('ready'),
            onTrackingChange: (isTracking) => setArStatus(isTracking ? 'ready' : 'tracking_lost'),
            onCaptureAttempt: handleARCaptureAttempt,
            onError: () => {
              setArUnavailable(true);
              setArStatus('unavailable');
            },
          }}
        />
      ) : (
        <FallbackCaptureList
          veggies={veggies}
          matchPhase={matchPhase}
          vacuumingId={vacuumLock?.targetId ?? null}
          onCapture={handleARCaptureAttempt}
        />
      )}

      {blindAttack && <View style={styles.blindAttackOverlay} pointerEvents="none" />}

      {vacuumLock && <VacuumFlash points={currentRoundPoints} />}

      {isGlitched && (
        <View style={styles.glitchBanner} pointerEvents="none">
          <Text style={styles.glitchBannerText}>⚠️ GLITCH SURGE — TARGETS MOVING ERRATICALLY ⚠️</Text>
        </View>
      )}

      <View
        style={styles.topBar}
        pointerEvents="none"
        onLayout={(e) => setTopBarHeight(e.nativeEvent.layout.height + 10)}
      >
        <View style={styles.topBarHeader}>
          <View style={styles.scanDot} />
          <Text style={styles.topBarHeaderText}>HUNTING FOR TARGETS</Text>
        </View>
        <View style={styles.telemetryRow}>
          <View style={styles.ptsTag}>
            <Text style={styles.ptsNumber}>{myScore.toLocaleString()}</Text>
            <Text style={styles.ptsTagText}> PTS</Text>
          </View>
          <View style={styles.telemetryTag}>
            <Text style={styles.telemetryTagText}>
              ARENA: <Text style={{ color: '#00e5e5' }}>{roomCode || 'LOCAL'}</Text>
            </Text>
          </View>
          <View style={styles.telemetryTag}>
            <Text style={styles.telemetryTagText}>
              ROUND: <Text style={{ color: '#c084fc' }}>{matchRound}/{TOTAL_ROUNDS}</Text>
            </Text>
          </View>
          <View style={[styles.telemetryTag, isGlitched && { borderColor: 'rgba(255,190,26,0.7)' }]}>
            <Text style={styles.telemetryTagText}>
              TIER: <Text style={{ color: isGlitched ? '#ffbe1a' : '#39ff88' }}>{currentRoundPoints} PTS</Text>
            </Text>
          </View>
          <View style={styles.telemetryTag}>
            <Text style={styles.telemetryTagText}>
              TIME: <Text style={{ color: timerColor, fontWeight: '900' }}>{vacuumLock ? '⏸' : secondsLeft}s</Text>
            </Text>
          </View>
          <View style={styles.telemetryTag}>
            <Text style={styles.telemetryTagText}>
              AR: <Text style={{ color: arStatusColor }}>{arStatusLabel}</Text>
            </Text>
          </View>
        </View>
      </View>

      {rankedPlayers.length > 0 && (
        <View style={[styles.leaderboardWidget, { top: topBarHeight }]} pointerEvents="none">
          <Text style={styles.leaderboardTitle}>LEADERBOARD</Text>
          {rankedPlayers.slice(0, 4).map((p, idx) => (
            <View key={p.id} style={[styles.leaderboardRow, p.isMe && styles.leaderboardRowMe]}>
              <Text style={styles.leaderboardRank}>{idx === 0 ? '👑' : `#${idx + 1}`}</Text>
              <Text style={styles.leaderboardName} numberOfLines={1}>
                {p.name}
                {idx === 0 && <Text style={styles.crownLabel}> CROWN MASTER</Text>}
                {p.isMe && <Text style={styles.youLabel}> (You)</Text>}
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

  checkingWrap: { ...StyleSheet.absoluteFillObject, backgroundColor: '#04060a', alignItems: 'center', justifyContent: 'center' },
  checkingText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },

  fallbackWrap: { ...StyleSheet.absoluteFillObject, backgroundColor: '#04060a', paddingTop: 140 },
  fallbackBanner: {
    backgroundColor: 'rgba(255,157,63,0.15)',
    borderWidth: 1,
    borderColor: '#ff9d3f',
    marginHorizontal: 14,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  fallbackBannerText: { color: '#ff9d3f', fontWeight: '700', fontSize: 11, textAlign: 'center' },
  fallbackList: { paddingHorizontal: 14, paddingBottom: 40, gap: 10 },
  fallbackEmptyText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40, fontSize: 13 },
  fallbackCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 14,
  },
  fallbackCardLocked: { opacity: 0.5 },
  fallbackCardTitle: { color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 4 },
  fallbackCardMeta: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 8 },
  fallbackCardCta: { color: '#ffbe1a', fontWeight: '700', fontSize: 12, letterSpacing: 1 },

  blindAttackOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,40,10,0.6)' },

  glitchBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#c21f1f',
    paddingVertical: 9,
    paddingHorizontal: 10,
    zIndex: 60,
  },
  glitchBannerText: { color: '#fff', fontWeight: '800', fontSize: 12, textAlign: 'center', letterSpacing: 1 },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(6,10,18,0.85)',
    padding: 12,
    zIndex: 30,
  },
  topBarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  topBarHeaderText: { color: '#ffbe1a', fontWeight: '700', fontSize: 11, letterSpacing: 1.5, marginLeft: 6 },
  scanDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ffbe1a' },
  telemetryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  telemetryTag: {
    backgroundColor: 'rgba(10,16,30,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 7,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  telemetryTagText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  ptsTag: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10,16,30,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,190,26,0.4)',
    borderRadius: 7,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  ptsNumber: { color: '#ffe066', fontWeight: '900', fontSize: 13 },
  ptsTagText: { color: '#ffbe1a', fontWeight: '700', fontSize: 11 },

  leaderboardWidget: {
    position: 'absolute',
    right: 14,
    width: 210,
    backgroundColor: 'rgba(8,12,22,0.92)',
    borderWidth: 1.5,
    borderColor: '#ffbe1a',
    borderRadius: 10,
    padding: 10,
    zIndex: 30,
  },
  leaderboardTitle: { color: '#ffbe1a', fontWeight: '800', fontSize: 11, letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
    padding: 6,
    marginBottom: 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  leaderboardRowMe: { borderWidth: 1, borderColor: 'rgba(255,140,0,0.45)' },
  leaderboardRank: { fontSize: 13, width: 20, textAlign: 'center' },
  leaderboardName: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '600' },
  crownLabel: { color: '#ffbe1a', fontSize: 9, fontWeight: '800' },
  youLabel: { color: '#ff9d3f', fontSize: 10, fontWeight: '700' },
  leaderboardScore: { color: '#39ff88', fontWeight: '800', fontSize: 12 },

  controlDeck: { position: 'absolute', top: 14, left: 14, zIndex: 50 },
  fleeBtn: { backgroundColor: 'rgba(255,63,52,0.92)', borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 },
  fleeBtnText: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },

  scoreBurstWrapper: { position: 'absolute', top: '20%', left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
  securedFlashTag: { fontSize: 20, fontWeight: '900', color: '#ffbe1a', letterSpacing: 2, marginBottom: 4 },
  perfectTag: { fontSize: 16, fontWeight: '900', color: '#3cd6ff', letterSpacing: 2, marginBottom: 2 },
  bigScoreLabel: { fontSize: 60, fontWeight: '900', color: '#ffbe1a', letterSpacing: 2 },
  speciesTextCard: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 1, marginTop: 4 },
  shareBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2,
    borderColor: '#ffbe1a',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  shareBtnText: { color: '#ffbe1a', fontWeight: 'bold', fontSize: 12 },

  missBurstWrapper: { position: 'absolute', top: '35%', left: 0, right: 0, alignItems: 'center', zIndex: 999 },
  missLabel: { fontSize: 28, fontWeight: '800', color: '#ff6b5e', letterSpacing: 1.5 },

  vacuumFlashLabel: { position: 'absolute', top: '28%', left: 0, right: 0, alignItems: 'center', zIndex: 998 },
  vacuumFlashText: { fontSize: 22, fontWeight: '900', color: '#ffbe1a', letterSpacing: 1 },
});
