// src/App.native.jsx
//
// REACT NATIVE PORT of App.jsx (was: web build using framer-motion,
// navigator.geolocation, localStorage, window.socket, DOM elements).
//
// Mirrors App.jsx's state machine and all four of Revision 4's fixes
// (mode-gate race fix, pre-match ARENA-entry guard, dead-ref cleanup,
// account-deletion entry point) 1:1 — the state machine itself is
// platform-agnostic. Only the platform-touching pieces below are swapped.
//
// ============================================================================
// Library swaps made for RN (mirrors GameCanvas.native.jsx's swap table)
// ============================================================================
//   navigator.geolocation         -> expo-location (Location.*)
//   localStorage                  -> @react-native-async-storage/async-storage
//                                    NOTE: AsyncStorage is ASYNC, unlike
//                                    localStorage. The web version could
//                                    synchronously seed deviceUUIDRef.current
//                                    on first render; this version can't, so
//                                    there's a new `bootPhase` gate below that
//                                    renders a spinner until the stored (or
//                                    freshly generated) deviceUUID resolves.
//                                    This is a real, unavoidable behavioral
//                                    difference from the web file, not an
//                                    oversight.
//   window.socket                 -> getSocket() from gameClient.js (already
//                                    exported there for exactly this reason —
//                                    see gameClient.js's header on the RN
//                                    `window` crash fix). GameCanvas.native.jsx
//                                    also takes socket as an explicit prop,
//                                    so getSocket() is passed straight through.
//   window.location.search        -> Linking.getInitialURL(), parsed for a
//                                    `?room=` query param via a small manual
//                                    regex parser rather than URL/
//                                    URLSearchParams, since neither is
//                                    guaranteed present in RN's JS engine
//                                    (Hermes) across all supported versions.
//                                    Also listens for Linking's 'url' event,
//                                    for a deep link opened while already
//                                    running (RN equivalent of clicking a
//                                    shared room link).
//   window.history.replaceState   -> DROPPED. No RN equivalent — there's no
//                                    address bar. Sharing a room code is
//                                    RoomJoin.native's / MapView.native's
//                                    concern (RN's Share API), not this
//                                    file's.
//   window.addEventListener       -> AppState 'change' listener, for the
//     ('focus', ...)                 motion-permission-readiness recheck.
//   deviceorientation(absolute)   -> expo-sensors Magnetometer, raw x/y
//                                    atan2 heading (no tilt compensation —
//                                    same fidelity tradeoff the web version
//                                    made with its own webkitCompassHeading/
//                                    alpha fallback chain). Sign/offset may
//                                    need on-device calibration; flagged
//                                    inline below rather than assumed correct.
//   <audio> + .play()             -> expo-av Audio.Sound, loaded once on
//                                    mount and replayed on 'go'.
//   framer-motion (motion/
//     AnimatePresence)             -> RN Animated for the few overlays that
//                                    benefit from it (countdown tick, GO
//                                    burst, victory card — mirrors the
//                                    Animated usage GameCanvas.native.jsx
//                                    already established for its own
//                                    popups). The mode-gate, settings menu,
//                                    and delete-confirm screens are plain
//                                    conditional Views — they didn't carry
//                                    meaningful motion on web either beyond
//                                    a fade.
//   DOM elements (div/button)     -> View / Text / TouchableOpacity /
//                                    ActivityIndicator, StyleSheet.
//
// Assumed to exist as .native.jsx siblings (resolved automatically by
// Metro's platform-extension resolution under the same import paths used
// here — same pattern as CaptureThrow.native.jsx / VeggieModel.native.jsx
// in GameCanvas.native.jsx): GoogleLogin, RoomJoin, MapView, Scoreboard,
// ConnectionStatus. None of those are ported in this file — out of scope
// here, same as CaptureThrow's RN port was called out as out-of-scope in
// GameCanvas.native.jsx.
//
// Unchanged from the web version, because it's genuinely cross-platform
// logic: joinRoom/subscribeToRoom's payload shapes, the mode-gate race
// fix (advance only via 'onTimingModeUpdated', never locally), the
// pre-match ARENA-entry guard (matchPhase must be COUNTDOWN/ACTIVE before
// entering GameCanvas), connectTickServer() itself (per tickClient.js's
// own header, it never touches `window` and needs no RN changes).

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Linking,
  AppState,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { Audio } from 'expo-av';

import ConnectionStatus from './components/ConnectionStatus';
import RoomJoin from './components/RoomJoin';
import GoogleLogin from './components/GoogleLogin';
import MapView from './components/MapView';
import GameCanvas from './components/GameCanvas.native';
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

const DEVICE_UUID_STORAGE_KEY = 'veggiego_device_uuid_v1';
const TIMING_MODE_CONFIRM_TIMEOUT_MS = 6000;

// Duplicated from gameClient.js's private SERVER_URL rather than
// imported, since that constant isn't exported. Keep these in sync
// manually, or export SERVER_URL from gameClient.js to remove the drift
// risk entirely.
const ACCOUNT_API_BASE = 'https://manifix-ai-core.onrender.com';

const monoFont = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

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

function randomUUIDFallback() {
  return `duid-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Manual regex parse instead of `new URL(url).searchParams.get('room')` —
// URL/URLSearchParams aren't guaranteed present across RN/Hermes versions.
// Expects deep links shaped like veggiego://join?room=ABCD or
// https://veggiego.app/join?room=ABCD.
function parseRoomCodeFromUrl(url) {
  if (!url) return '';
  const match = url.match(/[?&]room=([^&]+)/i);
  return match ? decodeURIComponent(match[1]).trim().toUpperCase() : '';
}

// Stable per-install identity, independent of socket.id. See gameClient.js's
// header for what server.js keys off this. AsyncStorage is async, so this
// is awaited from an effect rather than seeded synchronously into a ref
// the way the web version's getOrCreateDeviceUUID() could.
async function getOrCreateDeviceUUID() {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_UUID_STORAGE_KEY);
    if (existing) return existing;

    const fresh = randomUUIDFallback();
    await AsyncStorage.setItem(DEVICE_UUID_STORAGE_KEY, fresh);
    return fresh;
  } catch (err) {
    // AsyncStorage can throw in rare locked-down configurations. Fall back
    // to an in-memory-only UUID rather than crashing the join flow —
    // reconnect support degrades (won't survive an app restart) but the
    // match itself still works normally.
    console.warn('[App.native] AsyncStorage unavailable, deviceUUID will not persist across restarts:', err?.message);
    return randomUUIDFallback();
  }
}

export default function App() {
  // --- Boot gate: resolves deviceUUID from AsyncStorage before anything
  // else can render. See header note on why this differs from the web
  // version's synchronous ref seed. ---
  const [bootPhase, setBootPhase] = useState('loading'); // 'loading' | 'ready'
  const [deviceUUID, setDeviceUUID] = useState(null);

  // --- Room Join Gate ---
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [initialRoomCode, setInitialRoomCode] = useState('');

  // --- Auth gate (Google Sign-In) — must resolve before RoomJoin -------
  const [authInfo, setAuthInfo] = useState(null); // { player, wallet } | null

  // --- Mode Gate ---
  const [isRoomLeader, setIsRoomLeader] = useState(false);
  const [timingModeChosen, setTimingModeChosen] = useState(false);
  const [pendingTimingMode, setPendingTimingMode] = useState('outdoor');
  const [timingModeSending, setTimingModeSending] = useState(false);
  const [timingModeError, setTimingModeError] = useState('');
  const timingModeConfirmTimeoutRef = useRef(null);

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
  const [matchNotStartedNotice, setMatchNotStartedNotice] = useState(false);

  const [gpsError, setGpsError] = useState('');

  // --- Server-authoritative geofence (radar circle) ---
  const [geofence, setGeofence] = useState(null);

  // --- Reconnect UX ---
  const [isReconnecting, setIsReconnecting] = useState(false);

  // --- Dynamic Match State Parameters ---
  const [matchPhase, setMatchPhase] = useState(null);
  const [countdownTick, setCountdownTick] = useState(3);
  const [showGoBurst, setShowGoBurst] = useState(false);
  const [victoryData, setVictoryData] = useState(null);
  const [tickStatus, setTickStatus] = useState('idle');

  // --- Account deletion (settings menu, MAP stage only) ---
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAccountStatus, setDeleteAccountStatus] = useState('idle');
  const [deleteAccountError, setDeleteAccountError] = useState('');

  // --- Core References ---
  const goSoundRef = useRef(null);
  const tickConnectionRef = useRef(null);
  const gpsSubscriptionRef = useRef(null);
  const magnetometerSubRef = useRef(null);
  const lastSentPositionRef = useRef(null);
  const lastSentAtRef = useRef(0);
  const myPositionRef = useRef(null);
  const deviceHeadingRef = useRef(0);

  // Animated values for the few overlays that carry motion (mirrors
  // framer-motion's role on web — see header).
  const countdownAnim = useRef(new Animated.Value(0)).current;
  const goBurstAnim = useRef(new Animated.Value(0)).current;
  const victoryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    myPositionRef.current = myPosition;
  }, [myPosition]);

  useEffect(() => {
    deviceHeadingRef.current = deviceHeading;
  }, [deviceHeading]);

  useEffect(() => {
    return () => clearTimeout(timingModeConfirmTimeoutRef.current);
  }, []);

  // ---- Boot: resolve deviceUUID + initial deep-link room code ----------
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const uuid = await getOrCreateDeviceUUID();
      const initialUrl = await Linking.getInitialURL().catch(() => null);
      if (!isMounted) return;
      setDeviceUUID(uuid);
      setInitialRoomCode(parseRoomCodeFromUrl(initialUrl));
      setBootPhase('ready');
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Deep link opened while the app is already running (RN equivalent of
  // clicking a shared room link mid-session). Only matters pre-join.
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (hasJoinedRoom) return;
      const code = parseRoomCodeFromUrl(url);
      if (code) setInitialRoomCode(code);
    });
    return () => sub.remove();
  }, [hasJoinedRoom]);

  // ---- Load the 'go' sound cue once on mount ----------------------------
  useEffect(() => {
    let sound;
    (async () => {
      try {
        // Adjust this path to wherever go.mp3 actually lives in the RN
        // project's asset tree — this mirrors public/sounds/go.mp3 on web.
        const { sound: loaded } = await Audio.Sound.createAsync(require('../assets/sounds/go.mp3'));
        sound = loaded;
        goSoundRef.current = loaded;
      } catch (err) {
        console.warn('[App.native] failed to load go sound:', err?.message);
      }
    })();
    return () => {
      sound?.unloadAsync();
    };
  }, []);

  // ---- Google Sign-In success handler ----------------------------------
  const handleLoginSuccess = ({ player, wallet }) => {
    setAuthInfo({ player, wallet });
  };

  // ---- Room join, triggered by RoomJoin's onJoin({ room, name }) -------
  const handleJoinRoom = async ({ room, name }) => {
    setErrorMessage('');
    setTickStatus('connecting');
    setMyName(name);

    const targetRoom = room.trim().toUpperCase();
    setRoomCode(targetRoom);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMessage('Location permission is required to join this arena.');
      setGpsError('Location permission denied — enable it in device settings.');
      setTickStatus('failed');
      return;
    }

    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude, accuracy } = pos.coords;

      const joined = await joinRoom(targetRoom, latitude, longitude, name, deviceUUID);

      if (joined && joined.success === false) {
        if (joined.code === 'INSUFFICIENT_TICKETS') {
          setErrorMessage(joined.message || 'You need at least one ticket to join a match.');
        } else {
          setErrorMessage(joined.message || 'Could not join that arena. Try a different code.');
        }
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
      setIsReconnecting(false);

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

      if (joined?.reconnected) {
        setTimingModeChosen(true);
      }

      setTickStatus('joined');
    } catch (err) {
      console.error('[App.native] join failed', err);
      setErrorMessage('Could not reach the game server. Check your connection and try again.');
      setTickStatus('failed');
    }
  };

  // ---- Silent rejoin attempt on socket reconnect -----------------------
  const attemptSilentRejoin = async () => {
    if (!roomCode || !myPositionRef.current) return;
    setIsReconnecting(true);
    try {
      const joined = await joinRoom(
        roomCode,
        myPositionRef.current.lat,
        myPositionRef.current.lng,
        myName,
        deviceUUID
      );
      if (joined && joined.success === false) {
        setErrorMessage(joined.message || 'Could not reconnect to the match.');
        setIsReconnecting(false);
        return;
      }
      if (joined?.playerId) setMyPlayerId(joined.playerId);
      setIsReconnecting(false);
    } catch (err) {
      console.error('[App.native] silent rejoin failed', err);
      // Leave isReconnecting true — the socket's own 'reconnect' event
      // (wired below) will trigger another attempt.
    }
  };

  // --- Multi-User Room Real-time Subscription Pipeline ---
  useEffect(() => {
    if (!roomCode) return undefined;

    const unsubscribe = subscribeToRoom(roomCode, {
      onPlayersUpdate: (rows) => setPlayers(Array.isArray(rows) ? rows : []),
      onVeggiesUpdate: (rows) => setVeggies(veggiesPayloadToArray(rows)),

      // Mode-gate race fix, unchanged from web: this is the ONLY place
      // that flips timingModeChosen, for leader or not.
      onTimingModeUpdated: (data) => {
        clearTimeout(timingModeConfirmTimeoutRef.current);
        setPendingTimingMode(data?.mode || 'outdoor');
        setTimingModeChosen(true);
        setTimingModeSending(false);
        setTimingModeError('');
      },
      onPromotedToLeader: (data) => {
        setIsRoomLeader(true);
        setPendingTimingMode(data?.timingMode || 'outdoor');
        setTimingModeChosen(false);
        setTimingModeSending(false);
        setTimingModeError('');
      },
    });

    return unsubscribe;
  }, [roomCode]);

  // ---- Continuous GPS Watcher Loop (expo-location) ----------------------
  useEffect(() => {
    if (!myPlayerId) return undefined;

    let cancelled = false;

    (async () => {
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 },
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

          const sock = getSocket();
          if (sock && sock.connected) {
            sock.emit('update-location', {
              lat: latitude,
              lng: longitude,
              accuracy: typeof accuracy === 'number' ? accuracy : undefined,
              heading: deviceHeadingRef.current,
            });
          }
        }
      );
      if (cancelled) {
        sub.remove();
      } else {
        gpsSubscriptionRef.current = sub;
      }
    })().catch((err) => {
      console.error('[App.native] geolocation watch error', err);
      setGpsError('GPS signal unavailable. Move outdoors or check location services.');
    });

    return () => {
      cancelled = true;
      gpsSubscriptionRef.current?.remove?.();
      gpsSubscriptionRef.current = null;
    };
  }, [myPlayerId]);

  // ---- Socket-level disconnect/reconnect awareness ----------------------
  // Same reasoning as web: socket.io auto-reconnects the transport, but
  // that alone doesn't restore this player's seat in server.js's room
  // state — that needs a fresh 'join-room' emit with the same deviceUUID.
  useEffect(() => {
    if (!myPlayerId) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;

    const handleDisconnect = () => setIsReconnecting(true);
    const handleReconnect = () => attemptSilentRejoin();

    socket.on('disconnect', handleDisconnect);
    socket.on('connect', handleReconnect);
    return () => {
      socket.off('disconnect', handleDisconnect);
      socket.off('connect', handleReconnect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPlayerId, roomCode]);

  // ---- Magnetometer-based heading (RN equivalent of deviceorientation) --
  // Raw x/y atan2 — no tilt compensation. Sign/offset conventions vary by
  // device; verify against a known bearing on real hardware before
  // shipping and adjust the formula below if it reads backwards or
  // rotated. This is a real gap flagged deliberately, not an oversight.
  useEffect(() => {
    let mounted = true;
    Magnetometer.isAvailableAsync().then((available) => {
      if (!available || !mounted) return;
      Magnetometer.setUpdateInterval(150);
      magnetometerSubRef.current = Magnetometer.addListener(({ x, y }) => {
        let heading = Math.atan2(y, x) * (180 / Math.PI);
        heading = (heading + 360) % 360;
        setDeviceHeading(heading);
      });
    });
    return () => {
      mounted = false;
      magnetometerSubRef.current?.remove?.();
      magnetometerSubRef.current = null;
    };
  }, []);

  // ---- Socket.io Tick Game Server Coordination Loop (unchanged logic) --
  useEffect(() => {
    if (!roomCode || !myPlayerId) return undefined;

    tickConnectionRef.current = connectTickServer(roomCode, myPositionRef.current, {
      onStatusChange: setTickStatus,

      onTick: (n) => {
        setStage('ARENA');
        setMatchPhase(MATCH_PHASE.COUNTDOWN);
        setCountdownTick(n);
        setMatchNotStartedNotice(false);
        countdownAnim.setValue(0);
        Animated.timing(countdownAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      },

      onGo: () => {
        setStage('ARENA');
        setMatchPhase(MATCH_PHASE.ACTIVE);
        setShowGoBurst(true);
        goSoundRef.current?.replayAsync().catch(() => {});
        goBurstAnim.setValue(0);
        Animated.timing(goBurstAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start(() => {
          setTimeout(() => setShowGoBurst(false), 300);
        });
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
        victoryAnim.setValue(0);
        Animated.timing(victoryAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
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

  // Pre-match ARENA-entry guard, unchanged logic from web.
  const handleSelectVeggieTarget = (vegId) => {
    if (matchPhase !== MATCH_PHASE.COUNTDOWN && matchPhase !== MATCH_PHASE.ACTIVE) {
      setMatchNotStartedNotice(true);
      setTimeout(() => setMatchNotStartedNotice(false), 2500);
      return;
    }
    setActiveVegId(vegId);
    setStage('ARENA');
  };

  const handleReturnToRadar = () => {
    setActiveVegId(null);
    setStage('MAP');
  };

  // NOTE: web's handleInstantReplay() does window.location.reload(), which
  // has no RN equivalent (no page to reload). This resets the same state a
  // fresh reload would have cleared instead, dropping back to the MAP
  // stage rather than fully restarting the app. If a harder reset is ever
  // needed, that's a native-module concern (e.g. expo-updates' reloadAsync),
  // out of scope here.
  const handleInstantReplay = () => {
    setVictoryData(null);
    setMatchPhase(null);
    setStage('MAP');
    setActiveVegId(null);
  };

  const handlePickTimingMode = (mode) => {
    setTimingModeSending(true);
    setTimingModeError('');
    getSocket()?.emit('set-timing-mode', { mode });

    clearTimeout(timingModeConfirmTimeoutRef.current);
    timingModeConfirmTimeoutRef.current = setTimeout(() => {
      setTimingModeSending(false);
      setTimingModeError('Could not confirm match mode — check your connection and try again.');
    }, TIMING_MODE_CONFIRM_TIMEOUT_MS);
  };

  // ---- Account deletion (Play Store / App Store requirement) -----------
  const handleDeleteAccount = async () => {
    setDeleteAccountStatus('pending');
    setDeleteAccountError('');
    try {
      const res = await fetch(`${ACCOUNT_API_BASE}/api/account/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceUUID }),
      });
      if (!res.ok) {
        throw new Error(`Server responded ${res.status}`);
      }

      try {
        await AsyncStorage.removeItem(DEVICE_UUID_STORAGE_KEY);
      } catch {
        // Safe to ignore — deviceUUID is only read from storage at boot.
      }

      tickConnectionRef.current?.disconnect();
      getSocket()?.disconnect();

      setAuthInfo(null);
      setHasJoinedRoom(false);
      setRoomCode('');
      setMyPlayerId(null);
      setMySlot(null);
      setPlayers([]);
      setVeggies([]);
      setStage('MAP');
      setTimingModeChosen(false);
      setShowDeleteConfirm(false);
      setShowSettingsMenu(false);
      setDeleteAccountStatus('idle');
      // NOTE: deviceUUID state itself is intentionally left as-is here,
      // matching the web version's same latent behavior — its
      // deviceUUIDRef isn't reset on deletion either, only localStorage
      // is cleared. A genuinely fresh UUID won't be generated until the
      // app is fully restarted on either platform. Not fixed here to keep
      // this port a faithful match rather than silently changing
      // unrelated behavior.
    } catch (err) {
      console.error('[App.native] account deletion failed', err);
      setDeleteAccountStatus('error');
      setDeleteAccountError('Could not delete your account right now. Please try again.');
    }
  };

  // ---- DATA RE-SHAPING FOR RENDERING, WITH NULL-GUARDS (unchanged) ------

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

  const connectionPhase = isReconnecting ? 'reconnecting' : toConnectionPhase(tickStatus);

  // ---- BOOT GATE ----
  if (bootPhase !== 'ready') {
    return (
      <View style={styles.bootWrap}>
        <ActivityIndicator size="large" color="#06d6a0" />
      </View>
    );
  }

  // ---- AUTH GATE (Google Sign-In) ----
  if (!authInfo) {
    return <GoogleLogin onLoginSuccess={handleLoginSuccess} deviceUUID={deviceUUID} />;
  }

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
                <TouchableOpacity
                  style={[styles.nameGateBtn, { marginBottom: 10, opacity: timingModeSending ? 0.6 : 1 }]}
                  onPress={() => handlePickTimingMode('indoor')}
                  disabled={timingModeSending}
                >
                  <Text style={styles.nameGateBtnText}>🏠 INSIDE PARTY (45s rounds)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nameGateBtn, { opacity: timingModeSending ? 0.6 : 1 }]}
                  onPress={() => handlePickTimingMode('outdoor')}
                  disabled={timingModeSending}
                >
                  <Text style={styles.nameGateBtnText}>🌳 OUTDOOR CHASE (60s rounds)</Text>
                </TouchableOpacity>
                {timingModeSending && <Text style={styles.nameGateSubLabel}>CONFIRMING WITH ARENA…</Text>}
                {!!timingModeError && <Text style={styles.nameGateErrorLabel}>{timingModeError}</Text>}
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

      {stage === 'MAP' && (
        <TouchableOpacity
          style={styles.settingsGearBtn}
          onPress={() => setShowSettingsMenu((prev) => !prev)}
          accessibilityLabel="Settings"
        >
          <Text style={{ fontSize: 16 }}>⚙️</Text>
        </TouchableOpacity>
      )}

      {showSettingsMenu && stage === 'MAP' && (
        <View style={styles.settingsMenu}>
          <TouchableOpacity
            style={styles.settingsMenuItem}
            onPress={() => {
              setShowSettingsMenu(false);
              setShowDeleteConfirm(true);
            }}
          >
            <Text style={styles.settingsMenuItemText}>🗑️ Delete Account &amp; Data</Text>
          </TouchableOpacity>
        </View>
      )}

      {showDeleteConfirm && (
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteCard}>
            <Text style={styles.deleteTitle}>Delete your account?</Text>
            <Text style={styles.deleteBody}>
              This permanently removes your Veggie GO account, wallet, and match history. This can't be undone.
            </Text>
            {deleteAccountStatus === 'error' && <Text style={styles.nameGateErrorLabel}>{deleteAccountError}</Text>}
            <View style={styles.deleteActionsRow}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setDeleteAccountStatus('idle');
                  setDeleteAccountError('');
                }}
                disabled={deleteAccountStatus === 'pending'}
              >
                <Text style={styles.deleteCancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmBtn, { opacity: deleteAccountStatus === 'pending' ? 0.6 : 1 }]}
                onPress={handleDeleteAccount}
                disabled={deleteAccountStatus === 'pending'}
              >
                <Text style={styles.deleteConfirmBtnText}>
                  {deleteAccountStatus === 'pending' ? 'DELETING…' : 'DELETE PERMANENTLY'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {isReconnecting && (
        <View style={styles.reconnectBanner}>
          <Text style={styles.bannerText}>RECONNECTING…</Text>
        </View>
      )}

      {!!errorMessage && (
        <View style={styles.errBanner}>
          <Text style={styles.bannerTextWhite}>{errorMessage}</Text>
        </View>
      )}
      {matchNotStartedNotice && (
        <View style={styles.reconnectBanner}>
          <Text style={styles.bannerText}>MATCH HASN'T STARTED YET — HANG TIGHT</Text>
        </View>
      )}

      {stage === 'MAP' && (
        <View style={{ flex: 1 }}>
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
        </View>
      )}

      {stage === 'ARENA' && (
        <View style={styles.arenaWrapper}>
          <View style={styles.arenaHeader}>
            <Text style={styles.headerTxt}>
              ARENA MATRIX IDENT: <Text style={{ color: '#00d2d3' }}>{roomCode}</Text> {'  |  '}
              PILOT INTERFACE SLOT: <Text style={{ color: myColor }}>{(myDisplayName || '').toUpperCase()}</Text>
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
              socket={getSocket()}
              onExit={handleReturnToRadar}
            />
          </View>
        </View>
      )}

      {matchPhase === MATCH_PHASE.COUNTDOWN && (
        <Animated.View style={[styles.countdownShield, { opacity: countdownAnim }]}>
          <Animated.Text
            style={[
              styles.tickLabel,
              {
                transform: [
                  {
                    scale: countdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
                  },
                ],
              },
            ]}
          >
            {countdownTick}
          </Animated.Text>
        </Animated.View>
      )}

      {showGoBurst && (
        <Animated.View style={[styles.goPanelWrap, { opacity: goBurstAnim }]} pointerEvents="none">
          <Animated.Text
            style={[
              styles.goText,
              { transform: [{ scale: goBurstAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.4] }) }] },
            ]}
          >
            GO!
          </Animated.Text>
        </Animated.View>
      )}

      {matchPhase === MATCH_PHASE.ENDED && victoryData && (
        <Animated.View style={[styles.victoryShield, { opacity: victoryAnim }]}>
          <Animated.View
            style={[
              styles.victoryCard,
              {
                borderColor: victoryData.winnerColor || '#00d2d3',
                transform: [
                  { translateY: victoryAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                  { scale: victoryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
                ],
              },
            ]}
          >
            <Text style={{ fontSize: 56, marginBottom: 8, textAlign: 'center' }}>👑</Text>
            <Text style={styles.roundCompleteTxt}>ROUND MATRIX COMPLETED</Text>
            <Text style={[styles.winnerName, { color: victoryData.winnerColor || '#00d2d3' }]}>
              {(victoryData.winnerName || 'EXPLORER_1').toUpperCase()}
            </Text>

            {Array.isArray(victoryData.results) && (
              <View style={styles.leaderboardScrollContainer}>
                {victoryData.results.map((r, idx) => (
                  <View key={`${r?.name || 'PILOT'}-${idx}`} style={styles.lobbyRow}>
                    <Text style={[styles.lobbyRowText, idx === 0 && styles.lobbyRowTextWinner]}>
                      {idx + 1}. {(r?.name || 'PILOT').toUpperCase()}
                    </Text>
                    <Text style={[styles.lobbyRowScore, idx === 0 && styles.lobbyRowTextWinner]}>{r?.score ?? 0} pts</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity onPress={handleInstantReplay} style={styles.replayBtn}>
              <Text style={styles.replayBtnText}>INSTANT REPLAY</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bootWrap: { flex: 1, backgroundColor: '#020306', alignItems: 'center', justifyContent: 'center' },
  appContainer: { flex: 1, backgroundColor: '#020306' },

  nameGateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  nameGateCard: { width: '100%', maxWidth: 320, alignItems: 'center' },
  nameGateLabel: { color: '#8a8a93', fontFamily: monoFont, fontSize: 12, letterSpacing: 2, marginBottom: 12, textAlign: 'center' },
  nameGateSubLabel: { color: '#ffbe1a', fontFamily: monoFont, fontSize: 11, letterSpacing: 1, marginTop: 10, textAlign: 'center' },
  nameGateErrorLabel: { color: '#ff6b5e', fontFamily: monoFont, fontSize: 11, marginTop: 10, textAlign: 'center' },
  nameGateBtn: { width: '100%', backgroundColor: '#06d6a0', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  nameGateBtnText: { color: '#04140f', fontWeight: '700', fontSize: 14, letterSpacing: 1 },

  errBanner: { position: 'absolute', top: 80, alignSelf: 'center', zIndex: 1100, backgroundColor: '#ff4d4d', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6 },
  reconnectBanner: { position: 'absolute', top: 40, alignSelf: 'center', zIndex: 1100, backgroundColor: '#ffbe1a', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6 },
  bannerText: { color: '#04140f', fontFamily: monoFont, fontSize: 11, fontWeight: '700' },
  bannerTextWhite: { color: '#fff', fontFamily: monoFont, fontSize: 11, fontWeight: '700' },

  arenaWrapper: { flex: 1, backgroundColor: '#05070a' },
  arenaHeader: { padding: 12, backgroundColor: 'rgba(10,15,25,0.6)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerTxt: { fontSize: 12, color: '#8a8a93', fontFamily: monoFont, fontWeight: '700' },
  arenaGrid: { flex: 1 },
  sidebarWidget: { position: 'absolute', top: 80, right: 15, width: 220, zIndex: 40 },

  countdownShield: { ...StyleSheet.absoluteFillObject, zIndex: 2000, backgroundColor: 'rgba(4,4,8,0.75)', alignItems: 'center', justifyContent: 'center' },
  tickLabel: { fontSize: 120, fontWeight: '900', color: '#ffc83b' },
  goPanelWrap: { ...StyleSheet.absoluteFillObject, zIndex: 2005, alignItems: 'center', justifyContent: 'center' },
  goText: { fontSize: 96, fontWeight: '900', color: '#06d6a0' },

  victoryShield: { ...StyleSheet.absoluteFillObject, zIndex: 2200, backgroundColor: 'rgba(4,4,8,0.88)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  victoryCard: { width: '100%', maxWidth: 380, borderRadius: 20, borderWidth: 1, backgroundColor: '#141418', padding: 28, alignItems: 'center' },
  roundCompleteTxt: { fontFamily: monoFont, fontSize: 13, letterSpacing: 2, color: '#8a8a93', marginBottom: 4 },
  winnerName: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  leaderboardScrollContainer: { width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8, marginBottom: 24 },
  lobbyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  lobbyRowText: { fontFamily: monoFont, fontSize: 13, color: '#b6b6c0' },
  lobbyRowScore: { fontFamily: monoFont, fontSize: 13, color: '#b6b6c0' },
  lobbyRowTextWinner: { color: '#fff', fontWeight: '700' },
  replayBtn: { width: '100%', backgroundColor: '#06d6a0', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  replayBtnText: { color: '#04140f', fontWeight: '700', fontSize: 14, letterSpacing: 1 },

  settingsGearBtn: { position: 'absolute', top: 14, right: 14, zIndex: 50, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(10,15,25,0.75)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  settingsMenu: { position: 'absolute', top: 58, right: 14, zIndex: 50, backgroundColor: 'rgba(10,15,25,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 10, minWidth: 200, overflow: 'hidden' },
  settingsMenuItem: { padding: 14 },
  settingsMenuItemText: { color: '#ff8f85', fontFamily: monoFont, fontSize: 12 },

  deleteOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 3000, backgroundColor: 'rgba(4,4,8,0.85)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  deleteCard: { width: '100%', maxWidth: 360, backgroundColor: '#181820', borderWidth: 1, borderColor: 'rgba(255,80,60,0.4)', borderRadius: 16, padding: 24 },
  deleteTitle: { fontWeight: '700', fontSize: 15, color: '#fff', marginBottom: 10, textAlign: 'center' },
  deleteBody: { fontFamily: monoFont, fontSize: 12, lineHeight: 18, color: '#b6b6c0', marginBottom: 16, textAlign: 'center' },
  deleteActionsRow: { flexDirection: 'row', gap: 10 },
  deleteCancelBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  deleteCancelBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  deleteConfirmBtn: { flex: 1, backgroundColor: '#ff4d4d', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  deleteConfirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
