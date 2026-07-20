// src/App.jsx — React Native rewrite
//
// Ported off the Capacitor/web version. What changed and why:
//
//   - navigator.geolocation           -> @react-native-community/geolocation
//     (RN core dropped navigator.geolocation years ago; this is the
//     standard drop-in replacement with the same callback shape)
//   - window.location / URLSearchParams -> Linking.getInitialURL(), parsed
//     manually. This is now ASYNC (RN has no synchronous location object),
//     so the initial room code is read in an effect instead of a ref
//     computed at render time.
//   - window.socket.emit(...)        -> getSocket() from ./lib/gameClient.
//     A `window` global for the socket doesn't fit RN — this assumes
//     gameClient exports a getSocket() accessor for the active connection.
//     ADAPT THIS if your actual gameClient module shape differs.
//   - <audio> tag                    -> react-native-sound. Needs native
//     linking (autolinked on RN CLI >=0.60) and the asset bundled — see
//     the goSoundRef setup below.
//   - deviceorientation/deviceorientationabsolute (compass) -> there is no
//     direct RN equivalent event. This uses react-native-sensors'
//     magnetometer and computes heading via atan2. You'll need to add
//     `NSMotionUsageDescription` to Info.plist (iOS); Android needs no
//     runtime permission for the magnetometer.
//   - hasMotionPermissionCached()    -> dropped. That existed to work
//     around iOS Safari's DeviceMotionEvent.requestPermission() gate,
//     which doesn't exist in RN. Motion sensors just work once the
//     Info.plist string above is present.
//   - framer-motion / AnimatePresence -> react-native-reanimated's
//     Animated.View with `entering`/`exiting` layout animations, which is
//     the closest RN analog (mount/unmount transitions keyed the same way).
//     Needs react-native-reanimated installed + Babel plugin configured.
//   - CSS (boxShadow, backdropFilter, vw/vh, position: fixed) -> RN
//     StyleSheet with shadow*/elevation, no blur (backdropFilter has no
//     built-in RN equivalent — approximated here with a translucent
//     background; use @react-native-community/blur if you want a real blur).
//   - window.history.replaceState(shareable URL) -> dropped. No browser
//     history in RN. If you want a "share this room" affordance, build it
//     with the Share API separately — it doesn't belong in this effect.
//
// NOT translated here (out of scope for this file, need their own pass):
//   - GameCanvas: your web version's AR runs on Three.js/WebXR, which has
//     no RN equivalent. It'll need a native AR path
//     (ViroReact / react-native-vision-camera + a 3D layer) — that's a
//     separate, bigger piece of work than this file.
//   - MapView, ConnectionStatus, Scoreboard: assumed to already be, or to
//     become, RN components accepting the same props as before.
//   - RoomJoin.jsx: still needs its own RN port (View/Text, react-native-svg,
//     PanResponder or reanimated gesture handler for the swipe-to-deploy).

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  AppState,
  Linking,
  PermissionsAndroid,
  Pressable,
} from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import Geolocation from '@react-native-community/geolocation';
import Sound from 'react-native-sound';
import { magnetometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';

import ConnectionStatus from './components/ConnectionStatus';
import RoomJoin from './components/RoomJoin';
import MapView from './components/MapView';
import GameCanvas from './components/GameCanvas';
import Scoreboard from './components/Scoreboard';
import { joinRoom, subscribeToRoom, getSocket } from './lib/gameClient';
import { POSITION_SYNC_THROTTLE_MS, RARITY_BY_SPECIES } from './config/gameConfig';
import { connectTickServer } from './lib/tickClient';

const SLOT_COLORS = {
  SLOT_01: '#3a86ff',
  SLOT_02: '#2ecc71',
  SLOT_03: '#ff006e',
  SLOT_04: '#8338ec',
  SLOT_05: '#e74c3c',
  SLOT_06: '#f1c40f',
};

const MATCH_PHASE = {
  COUNTDOWN: 'COUNTDOWN',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
};

function toConnectionPhase(tickStatus) {
  if (tickStatus === 'connected' || tickStatus === 'joined') return 'local';
  if (tickStatus === 'disconnected' || tickStatus === 'error' || tickStatus === 'failed') return 'disconnected';
  return 'idle';
}

function veggiesPayloadToArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') return Object.values(payload);
  return [];
}

// Manual query-string pull from a deep link, since RN has no
// window.location / URLSearchParams for the app's own URL.
function extractRoomCodeFromUrl(url) {
  if (!url) return '';
  const match = url.match(/[?&]room=([^&]+)/i);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]).trim().toUpperCase();
  } catch {
    return match[1].trim().toUpperCase();
  }
}

async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location permission',
        message: 'Veggie Go needs your location to find the arena and nearby veggies.',
        buttonPositive: 'Allow',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  // iOS: @react-native-community/geolocation triggers the system prompt
  // itself on first use, but requesting explicitly avoids a race where
  // getCurrentPosition fires before the user has answered.
  const auth = await Geolocation.requestAuthorization('whenInUse');
  return auth === 'granted';
}

export default function App({ isNative = true } = {}) {
  // --- Room Join Gate ---
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [initialRoomCode, setInitialRoomCode] = useState('');

  useEffect(() => {
    let isMounted = true;
    Linking.getInitialURL().then((url) => {
      if (isMounted && url) setInitialRoomCode(extractRoomCodeFromUrl(url));
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      const code = extractRoomCodeFromUrl(url);
      if (code) setInitialRoomCode(code);
    });
    return () => {
      isMounted = false;
      sub.remove();
    };
  }, []);

  // --- Mode Gate ---
  const [isRoomLeader, setIsRoomLeader] = useState(false);
  const [timingModeChosen, setTimingModeChosen] = useState(false);
  const [pendingTimingMode, setPendingTimingMode] = useState('outdoor');

  // --- Navigation & Flow Router ---
  const [stage, setStage] = useState('MAP'); // 'MAP' | 'ARENA'
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [veggies, setVeggies] = useState([]);
  const [mySlot, setMySlot] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [myName, setMyName] = useState('');
  const [myPosition, setMyPosition] = useState(null);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeVegId, setActiveVegId] = useState(null);

  const [gpsError, setGpsError] = useState('');

  // --- Server-authoritative geofence (radar circle) ---
  const [geofence, setGeofence] = useState(null); // { lat, lng, radiusMeters }

  // --- Dynamic Match State Parameters ---
  const [matchPhase, setMatchPhase] = useState(null);
  const [countdownTick, setCountdownTick] = useState(3);
  const [showGoBurst, setShowGoBurst] = useState(false);
  const [victoryData, setVictoryData] = useState(null);
  const [tickStatus, setTickStatus] = useState('idle');

  // --- Core References ---
  const goSoundRef = useRef(null);
  const tickConnectionRef = useRef(null);
  const gpsWatchIdRef = useRef(null);
  const lastSentPositionRef = useRef(null);
  const lastSentAtRef = useRef(0);
  const myPositionRef = useRef(null);
  const deviceHeadingRef = useRef(0);
  const myPlayerIdRef = useRef(null);
  const magnetometerSubRef = useRef(null);

  useEffect(() => {
    myPositionRef.current = myPosition;
  }, [myPosition]);

  useEffect(() => {
    deviceHeadingRef.current = deviceHeading;
  }, [deviceHeading]);

  useEffect(() => {
    myPlayerIdRef.current = myPlayerId;
  }, [myPlayerId]);

  // Load the "go" sound once. Expects go.mp3 bundled under
  // android/app/src/main/res/raw/go.mp3 (Android) and added to the Xcode
  // project (iOS) — react-native-sound looks it up by bare filename.
  useEffect(() => {
    Sound.setCategory('Playback');
    goSoundRef.current = new Sound('go.mp3', Sound.MAIN_BUNDLE, (err) => {
      if (err) console.warn('[App] failed to load go.mp3', err);
    });
    return () => {
      goSoundRef.current?.release();
      goSoundRef.current = null;
    };
  }, []);

  // ---- Room join, triggered by RoomJoin's onJoin({ room, name }) -------
  const handleJoinRoom = async ({ room, name }) => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setErrorMessage('Location permission is required to join this arena.');
      setGpsError('Location permission denied — enable it in device settings.');
      return;
    }

    setErrorMessage('');
    setTickStatus('connecting');
    setMyName(name);

    const targetRoom = room.trim().toUpperCase();
    setRoomCode(targetRoom);

    Geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude, accuracy } = pos.coords;
          const joined = await joinRoom(targetRoom, latitude, longitude, name);

          if (joined && joined.success === false) {
            setErrorMessage(joined.message || 'Could not join that arena. Try a different code.');
            setTickStatus('failed');
            return;
          }

          if (joined?.playerId) {
            setMyPlayerId(joined.playerId);
          }

          setIsRoomLeader(!!joined?.isLeader);
          setPendingTimingMode(joined?.timingMode || 'outdoor');
          setMyPosition({ lat: latitude, lng: longitude, accuracy });
          setGpsError('');

          if (joined?.geofence) {
            setGeofence({
              lat: joined.geofence.lat,
              lng: joined.geofence.lng,
              radiusMeters: joined.geofence.radiusMeters,
            });
          }

          if (joined?.slotId) {
            setMySlot(joined.slotId);
            setHasJoinedRoom(true);
          } else {
            setErrorMessage('All slots in this arena are full right now.');
            setTickStatus('failed');
            return;
          }

          setTickStatus('joined');
        } catch (err) {
          console.error('[App] join failed', err);
          setErrorMessage('Could not reach the game server. Check your connection and try again.');
          setTickStatus('failed');
        }
      },
      () => {
        setErrorMessage('Location permission is required to join this arena.');
        setGpsError('Location permission denied — enable it in device settings.');
        setTickStatus('failed');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  };

  // --- Multi-User Room Real-time Subscription Pipeline ---
  useEffect(() => {
    if (!roomCode) return undefined;

    const unsubscribe = subscribeToRoom(roomCode, {
      onPlayersUpdate: (rows) => setPlayers(Array.isArray(rows) ? rows : []),
      onVeggiesUpdate: (rows) => setVeggies(veggiesPayloadToArray(rows)),

      onTimingModeUpdated: (data) => {
        setPendingTimingMode(data?.mode || 'outdoor');
        setTimingModeChosen(true);
      },
      onPromotedToLeader: (data) => {
        setIsRoomLeader(true);
        setPendingTimingMode(data?.timingMode || 'outdoor');
        setTimingModeChosen(false);
      },
    });

    return unsubscribe;
  }, [roomCode]);

  // ---- Continuous GPS Watcher Loop -------------------------------------
  useEffect(() => {
    if (!myPlayerId) return undefined;

    gpsWatchIdRef.current = Geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const now = Date.now();
        const last = lastSentPositionRef.current;
        const elapsed = now - lastSentAtRef.current;

        setMyPosition({ lat: latitude, lng: longitude, accuracy });
        setGpsError('');

        if (elapsed < POSITION_SYNC_THROTTLE_MS) return;
        if (last && last.lat === latitude && last.lng === longitude) return;

        lastSentPositionRef.current = { lat: latitude, lng: longitude };
        lastSentAtRef.current = now;

        const socket = getSocket();
        if (socket && socket.connected) {
          socket.emit('update-location', {
            lat: latitude,
            lng: longitude,
            accuracy: typeof accuracy === 'number' ? accuracy : undefined,
            heading: deviceHeadingRef.current,
          });
        }
      },
      (err) => {
        console.error('[App] geolocation watch error', err);
        setGpsError(
          err && err.code === 1
            ? 'Location permission denied — enable it in device settings.'
            : 'GPS signal unavailable. Move outdoors or check location services.'
        );
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000, distanceFilter: 0 }
    );

    return () => {
      if (gpsWatchIdRef.current !== null) Geolocation.clearWatch(gpsWatchIdRef.current);
    };
  }, [myPlayerId]);

  // ---- Compass heading via magnetometer ---------------------------------
  // No RN equivalent of deviceorientation/deviceorientationabsolute — this
  // computes a heading from raw magnetometer x/y instead. Accuracy will
  // differ from the browser's fused compass value; if that matters, swap
  // in a dedicated heading library later.
  useEffect(() => {
    setUpdateIntervalForType(SensorTypes.magnetometer, 200);
    magnetometerSubRef.current = magnetometer.subscribe(
      ({ x, y }) => {
        let heading = Math.atan2(y, x) * (180 / Math.PI);
        if (heading < 0) heading += 360;
        setDeviceHeading(heading);
      },
      (err) => console.warn('[App] magnetometer unavailable', err)
    );
    return () => {
      magnetometerSubRef.current?.unsubscribe();
      magnetometerSubRef.current = null;
    };
  }, []);

  // ---- App foreground/background awareness (was window focus) ----------
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      // Reserved: re-check anything that needs a refresh on foreground
      // (e.g. re-validate the socket connection). No-op today.
    });
    return () => sub.remove();
  }, []);

  // ---- Socket.io Tick Game Server Coordination Loop --------------------
  useEffect(() => {
    if (!roomCode || !myPlayerId) return undefined;

    tickConnectionRef.current = connectTickServer(roomCode, myPositionRef.current, {
      onStatusChange: setTickStatus,

      onTick: (n) => {
        setStage('ARENA');
        setMatchPhase(MATCH_PHASE.COUNTDOWN);
        setCountdownTick(n);
      },

      onGo: () => {
        setStage('ARENA');
        setMatchPhase(MATCH_PHASE.ACTIVE);
        setShowGoBurst(true);
        goSoundRef.current?.play((success) => {
          if (!success) console.warn('[App] go.mp3 playback failed');
        });
        setTimeout(() => setShowGoBurst(false), 650);
      },

      onRoundEnd: (results) => {
        const safeResults = Array.isArray(results) ? results : [];
        const sorted = [...safeResults].sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));

        const mapped = sorted.map((r) => ({
          name: r?.name || 'EXPLORER',
          score: r?.score ?? 0,
          color: SLOT_COLORS[r?.slot_id] || '#00d2d3',
        }));

        let absoluteWinner = { name: 'EXPLORER_1', color: '#00d2d3', score: 0 };
        if (mapped && mapped.length > 0) absoluteWinner = mapped[0];

        setVictoryData({
          winnerName: absoluteWinner.name || 'EXPLORER_1',
          winnerColor: absoluteWinner.color || '#00d2d3',
          results: mapped,
        });

        setMatchPhase(MATCH_PHASE.ENDED);
      },

      onCountdownCancelled: (data) => {
        setMatchPhase(null);
        setStage('MAP');
        setErrorMessage(
          data?.reason === 'player-left'
            ? 'A player left the lobby — match start was cancelled.'
            : 'Match start was cancelled.'
        );
      },
    });

    return () => {
      tickConnectionRef.current?.disconnect();
      tickConnectionRef.current = null;
    };
  }, [roomCode, myPlayerId]);

  // ---- ACTION HANDLERS ----

  const handleSelectVeggieTarget = (vegId) => {
    setActiveVegId(vegId);
    setStage('ARENA');
  };

  const handleReturnToRadar = () => {
    setActiveVegId(null);
    setStage('MAP');
  };

  const handleInstantReplay = () => {
    // No window.location.reload() equivalent — reset state directly instead.
    setVictoryData(null);
    setMatchPhase(null);
    setStage('MAP');
    setHasJoinedRoom(false);
    setTimingModeChosen(false);
    setRoomCode('');
  };

  const handlePickTimingMode = (mode) => {
    getSocket()?.emit('set-timing-mode', { mode });
    setPendingTimingMode(mode);
    setTimingModeChosen(true);
  };

  // ---- DATA RE-SHAPING FOR RENDERING, WITH NULL-GUARDS ----

  const myColor = mySlot ? SLOT_COLORS[mySlot] : '#00d2d3';

  const myPlayerRow = Array.isArray(players) ? players.find((p) => p && p.id === myPlayerId) : null;
  const myDisplayName = myPlayerRow ? myPlayerRow.name : myName || mySlot || 'EXPLORER_1';

  const playersMap = useMemo(() => {
    if (!Array.isArray(players)) return {};
    return Object.fromEntries(
      players.map((p) => {
        const fallbackSlot = p?.slot_id || 'SLOT_01';
        return [
          fallbackSlot,
          { slotId: fallbackSlot, name: p?.name || 'PILOT', score: p?.score ?? 0, character: fallbackSlot },
        ];
      })
    );
  }, [players]);

  const leaderboard = useMemo(() => {
    if (!Array.isArray(players)) return [];
    return [...players]
      .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
      .map((p, index) => ({
        playerId: p?.id || `unknown-${index}`,
        name: p?.name || 'PILOT',
        colorSlot: p?.slot_id || 'SLOT_01',
        score: p?.score ?? 0,
        rank: index + 1,
      }));
  }, [players]);

  const playersBySlot = useMemo(() => {
    if (!Array.isArray(players)) return {};
    return Object.fromEntries(
      players.map((p, index) => {
        const slotId = p?.slot_id || `SLOT_0${index + 1}`;
        return [
          slotId,
          {
            lat: p?.latitude,
            lng: p?.longitude,
            name: p?.name || 'PILOT',
            colorSlot: slotId,
            score: p?.score ?? 0,
            mode: p?.mode || null,
          },
        ];
      })
    );
  }, [players]);

  const veggiesById = useMemo(() => {
    if (!Array.isArray(veggies)) return {};
    return Object.fromEntries(
      veggies.map((v, index) => {
        const species = v?.species ?? v?.veggie_type ?? 'broccoli';
        return [
          v?.id || `unknown-${index}`,
          {
            lat: v?.lat ?? v?.latitude,
            lng: v?.lng ?? v?.longitude,
            species,
            rarity: RARITY_BY_SPECIES[species] ?? 'common',
          },
        ];
      })
    );
  }, [veggies]);

  const selfPosition = useMemo(() => {
    if (!Array.isArray(players)) return myPosition;
    const self = players.find((p) => p && p.id === myPlayerId);
    if (self && self.latitude != null && self.longitude != null) {
      return { lat: self.latitude, lng: self.longitude };
    }
    return myPosition;
  }, [players, myPlayerId, myPosition]);

  const connectionPhase = toConnectionPhase(tickStatus);

  // ---- ROOM JOIN GATE ----
  if (!hasJoinedRoom) {
    return (
      <RoomJoin
        onJoin={handleJoinRoom}
        error={errorMessage}
        connecting={tickStatus === 'connecting'}
        initialRoomCode={initialRoomCode}
      />
    );
  }

  // ---- MODE GATE SCREEN ----
  if (!timingModeChosen) {
    return (
      <View style={styles.appContainer}>
        <View style={styles.nameGateWrap}>
          <View style={styles.nameGateCard}>
            {isRoomLeader ? (
              <>
                <Text style={styles.nameGateLabel}>CHOOSE MATCH MODE</Text>
                <Pressable style={[styles.nameGateBtn, { marginBottom: 10 }]} onPress={() => handlePickTimingMode('indoor')}>
                  <Text style={styles.nameGateBtnText}>🏠 INSIDE PARTY (45s rounds)</Text>
                </Pressable>
                <Pressable style={styles.nameGateBtn} onPress={() => handlePickTimingMode('outdoor')}>
                  <Text style={styles.nameGateBtnText}>🌳 OUTDOOR CHASE (60s rounds)</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.nameGateLabel}>WAITING FOR HOST TO CHOOSE MODE…</Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <ConnectionStatus roomCode={roomCode || 'SCANNING'} phase={connectionPhase} />

      {errorMessage ? (
        <View style={styles.errBanner}>
          <Text style={styles.errBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

      {stage === 'MAP' && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.fill}>
          <MapView
            roomCode={roomCode}
            playerId={myPlayerId}
            mySlot={mySlot}
            myPos={myPosition}
            geofence={geofence}
            gpsError={gpsError}
            onEnterAR={handleSelectVeggieTarget}
            onExit={handleReturnToRadar}
          />
          <View style={styles.sidebarWidget} pointerEvents="none">
            <Scoreboard players={playersMap} mySlot={mySlot || 'SLOT_01'} leaderboard={leaderboard} />
          </View>
        </Animated.View>
      )}

      {stage === 'ARENA' && (
        <Animated.View entering={ZoomIn} exiting={ZoomOut} style={styles.fill}>
          <View style={styles.arenaWrapper}>
            <View style={styles.arenaHeader}>
              <Text style={styles.headerTxt}>
                ARENA MATRIX IDENT: <Text style={{ color: '#00d2d3' }}>{roomCode}</Text>
                {'   |   '}
                PILOT INTERFACE SLOT: <Text style={{ color: myColor }}>{myDisplayName?.toUpperCase()}</Text>
              </Text>
            </View>

            <View style={styles.arenaGrid}>
              <GameCanvas
                roomCode={roomCode}
                playerId={myPlayerId}
                mySlot={mySlot}
                targetVegId={activeVegId}
                initialTimingMode={pendingTimingMode}
                selfPosition={selfPosition}
                deviceHeading={deviceHeading}
                players={playersBySlot}
                veggies={veggiesById}
                matchPhase={matchPhase}
                isNative={isNative}
                onExit={handleReturnToRadar}
              />
            </View>
          </View>
        </Animated.View>
      )}

      {matchPhase === MATCH_PHASE.COUNTDOWN && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.countdownShield}>
          <Animated.Text key={countdownTick} entering={ZoomIn} exiting={ZoomOut} style={styles.tickLabel}>
            {countdownTick}
          </Animated.Text>
        </Animated.View>
      )}

      {showGoBurst && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.goPanelWrap} pointerEvents="none">
          <Animated.View entering={ZoomIn} style={styles.emeraldWave} />
          <Animated.Text entering={ZoomIn} exiting={ZoomOut} style={styles.goText}>
            GO!
          </Animated.Text>
        </Animated.View>
      )}

      {matchPhase === MATCH_PHASE.ENDED && victoryData && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.victoryShield}>
          <Animated.View
            entering={ZoomIn}
            style={[
              styles.victoryCard,
              {
                borderColor: victoryData.winnerColor || '#00d2d3',
                shadowColor: victoryData.winnerColor || '#00d2d3',
              },
            ]}
          >
            <Text style={styles.crownEmoji}>👑</Text>
            <Text style={styles.roundCompleteTxt}>ROUND MATRIX COMPLETED</Text>
            <Text style={[styles.winnerNameText, { color: victoryData.winnerColor || '#00d2d3' }]}>
              {(victoryData.winnerName || 'EXPLORER_1').toUpperCase()}
            </Text>

            {Array.isArray(victoryData.results) && (
              <View style={styles.leaderboardScrollContainer}>
                {victoryData.results.map((r, idx) => (
                  <View key={`${r?.name || 'PILOT'}-${idx}`} style={styles.lobbyRow}>
                    <Text style={[styles.lobbyRowText, idx === 0 && styles.lobbyRowTextTop]}>
                      {idx + 1}. {(r?.name || 'PILOT').toUpperCase()}
                    </Text>
                    <Text style={styles.lobbyRowScore}>{r?.score ?? 0} pts</Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable style={styles.replayBtn} onPress={handleInstantReplay}>
              <Text style={styles.replayBtnText}>INSTANT REPLAY</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#020306' },
  fill: { flex: 1 },
  nameGateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nameGateCard: { width: '90%', maxWidth: 320, alignItems: 'center' },
  nameGateLabel: { color: '#8a8a93', fontFamily: 'monospace', fontSize: 12, letterSpacing: 2, marginBottom: 12, textAlign: 'center' },
  nameGateBtn: { width: '100%', backgroundColor: '#06d6a0', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  nameGateBtnText: { color: '#04140f', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
  errBanner: {
    position: 'absolute', top: 80, alignSelf: 'center', zIndex: 1100, backgroundColor: '#ff4d4d',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6,
  },
  errBannerText: { color: '#fff', fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
  arenaWrapper: { flex: 1, backgroundColor: '#05070a' },
  arenaHeader: { padding: 16, paddingTop: 12, backgroundColor: 'rgba(10,15,25,0.6)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerTxt: { fontSize: 12, color: '#8a8a93', fontFamily: 'monospace', fontWeight: 'bold' },
  arenaGrid: { flex: 1 },
  sidebarWidget: { position: 'absolute', top: 80, right: 15, width: 220 },
  countdownShield: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000,
    backgroundColor: 'rgba(4,4,8,0.85)', alignItems: 'center', justifyContent: 'center',
  },
  tickLabel: { fontSize: 120, fontWeight: '900', color: '#ffc83b' },
  goPanelWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2005,
    alignItems: 'center', justifyContent: 'center',
  },
  emeraldWave: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(6,214,160,0.35)' },
  goText: { fontSize: 96, fontWeight: '900', color: '#06d6a0' },
  victoryShield: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2200,
    backgroundColor: 'rgba(4,4,8,0.92)', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  victoryCard: {
    width: '100%', maxWidth: 380, borderRadius: 20, backgroundColor: '#141419',
    paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center',
    borderWidth: 1, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 12,
  },
  crownEmoji: { fontSize: 56, marginBottom: 8 },
  roundCompleteTxt: { fontSize: 13, letterSpacing: 2, color: '#8a8a93', marginBottom: 4 },
  winnerNameText: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  leaderboardScrollContainer: {
    width: '100%', gap: 8, marginBottom: 24, backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8,
  },
  lobbyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  lobbyRowText: { fontSize: 13, fontFamily: 'monospace', color: '#b6b6c0' },
  lobbyRowTextTop: { color: '#fff', fontWeight: '700' },
  lobbyRowScore: { fontSize: 13, fontFamily: 'monospace', color: '#b6b6c0' },
  replayBtn: { width: '100%', backgroundColor: '#06d6a0', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  replayBtnText: { color: '#04140f', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
});
