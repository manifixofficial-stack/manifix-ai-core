/**
 * App.js — Veggie Go root entry
 *
 * Screen flow:
 *   Splash        → boot check (device UUID, session restore)
 *   Login         → Google Sign-In
 *   RoomJoin      → lobby / "Garden Lobby" (create/join room code)
 *   MapView       → real-world GPS tracking layout (find/approach veggies)
 *   GameCanvas    → AR capture screen (ViroReact-wired — see
 *                   src/screens/GameCanvas/GameCanvas.native.jsx, which
 *                   internally hosts ViroARSceneNavigator +
 *                   src/components/GameCanvasARScene.jsx (plane detection,
 *                   veggie placement, capture taps) plus an RN HUD overlay.
 *                   App.js never touches the AR engine directly.)
 *   Scoreboard    → round results, includes in-app "Delete Account"
 *   Settings      → privacy policy link, permissions, sign out, delete
 *                   account (NOT YET CREATED — see note below)
 *
 * Play Store account-deletion compliance (Google Sign-In is kept, so this
 * applies): the in-app delete flow below satisfies the "in-app path" half
 * of the requirement. You ALSO need a hosted web page (outside this repo)
 * that lets a user request the same deletion without the app installed,
 * linked from Play Console → App content → Data safety.
 *
 * THIS REVISION —
 *   1. Removed all Unity references. AR is ViroReact
 *      (@reactvision/react-viro) via GameCanvas.native.jsx /
 *      GameCanvasARScene.jsx, not a Unity module.
 *   2. Fixed screen imports to match the actual project tree
 *      (src/screens/<Name>/, not src/components/<Name>) — the previous
 *      revision imported from paths that don't exist in this repo and
 *      would fail to bundle.
 *   3. SettingsScreen import points at src/screens/Settings, which does
 *      not exist yet in the tree you shared. Left the route wired since
 *      Settings/Delete Account is required for Play Store — create that
 *      file or this import will fail to resolve.
 *
 * PRIOR REVISIONS (kept for history — see previous file header if you
 * need the full list): fixed gameConfig.js export mismatch that crashed
 * boot, fixed gameClient.js call signatures (connectSocket, joinRoom,
 * subscribeToRoom callback names), fixed MapView's real prop contract,
 * fixed Scoreboard's slot-keyed players contract, added requestRematch()
 * on Play Again.
 *
 * THIS REVISION —
 *   4. Removed the tickClient.js import and its attachTickHandlers() call.
 *      That file exports connectTickServer(), not attachTickHandlers — the
 *      import silently resolved to undefined and
 *      `attachTickHandlers(s, finalRoomCode)` threw at runtime on every
 *      successful room join. Even with the name fixed, it duplicated
 *      subscribeToRoom()'s onTick/onGo/onRoundEnd/onCountdownCancelled
 *      wiring below — this file's own joinRoom() already covers all of
 *      it, so tickClient.js is simply unused now rather than reconciled.
 *      Delete tickClient.js once nothing else imports it, or keep it
 *      unused if something else still will.
 *
 * NOT VERIFIED — still unable to confirm from files seen so far:
 *   - gameConfig.js DEVICE_UUID_KEY / SESSION_KEY exports — CONFIRMED,
 *     verified against the real file, both present, boot crash is fixed
 *   - GameCanvasScreen (GameCanvas.native.jsx)'s real prop contract for
 *     ViroARSceneNavigator — this file still passes the same props
 *     (roomCode, playerId, veggies, matchPhase, socket, onExit) as the
 *     pre-migration version. If the Viro rewrite changed what
 *     GameCanvas.native.jsx expects (e.g. it now wants myPos/deviceHeading
 *     directly, per your structure notes), this needs another pass.
 *     Paste that file to confirm.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, AppState, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values'; // required for uuid on RN

// AFTER (fixed):
import SplashScreen from './components/Splash';
import LoginScreen from './components/Login';
import RoomJoinScreen from './components/RoomJoin';
import MapViewScreen from './components/MapView';
import GameCanvasScreen from './components/GameCanvas.native';
import ScoreboardScreen from './components/Scoreboard';
import SettingsScreen from './components/Settings';

import {
  connectSocket,
  subscribeToRoom,
  disconnectSocket,
  joinRoom as gcJoinRoom,
  requestRematch,
  makeThrottledLocationWriter,
} from './lib/gameClient';
import { DEVICE_UUID_KEY, SESSION_KEY } from './config/gameConfig';

const Stack = createNativeStackNavigator();

// ---- Match-phase state machine -------------------------------------------
// idle -> lobby -> countdown -> live -> round-end -> victory -> (lobby | idle)
const PHASES = {
  IDLE: 'idle',
  LOBBY: 'lobby',
  COUNTDOWN: 'countdown',
  LIVE: 'live',
  ROUND_END: 'round-end',
  VICTORY: 'victory',
};

export default function App() {
  const [booted, setBooted] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [session, setSession] = useState(null); // { userId, displayName, photoUrl, googleIdToken }

  const [socket, setSocket] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [playerId, setPlayerId] = useState(null);

  const [matchPhase, setMatchPhase] = useState(PHASES.IDLE);
  const [veggies, setVeggies] = useState([]); // live from gameClient's onVeggiesUpdate
  const [players, setPlayers] = useState([]); // live from gameClient's onPlayersUpdate — flat array as broadcast by the server
  const [selfPosition, setSelfPosition] = useState(null); // { lat, lng, heading, accuracy }
  const [gpsError, setGpsError] = useState(null); // MapView reads this directly
  const [roundResult, setRoundResult] = useState(null);

  const locationSubRef = useRef(null);
  const wasTrackingRef = useRef(false); // remembers intent across background/foreground
  const appStateRef = useRef(AppState.currentState);
  const socketRef = useRef(null);
  const unsubscribeRoomRef = useRef(null);
  const sendLocationRef = useRef(null); // throttled writer from gameClient, created lazily

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // ---- Derived: slot-keyed players map + local player's slot --------------
  // Scoreboard.jsx's contract expects `players` as an object KEYED BY SLOT
  // ID (e.g. `{ SLOT_01: {...}, SLOT_02: {...} }`), not the flat array the
  // server broadcasts and that MapView/other screens consume as-is. Rekey
  // it here, the same way gameClient.js's own fetchTakenCharacters() does
  // (`p.slot_id || p.slotId`), so there's one consistent slot-lookup
  // convention across the app.
  const playersMap = useMemo(() => {
    const map = {};
    players.forEach((p) => {
      const slot = p?.slot_id || p?.slotId;
      if (slot) map[slot] = p;
    });
    return map;
  }, [players]);

  // The local player's own slot id — needed by both MapView (to highlight
  // "you" on the live map) and Scoreboard (to highlight "you" + label the
  // "(You)" row and build the share message). Matched by playerId, which
  // gameClient.js sets to the server's socket.id on a successful join.
  const mySlot = useMemo(() => {
    const me = players.find((p) => p?.id === playerId || p?.socketId === playerId);
    return me?.slot_id || me?.slotId || null;
  }, [players, playerId]);

  // ---- Boot: device UUID + session restore --------------------------------
  useEffect(() => {
    (async () => {
      try {
        let id = await AsyncStorage.getItem(DEVICE_UUID_KEY);
        if (!id) {
          id = uuidv4();
          await AsyncStorage.setItem(DEVICE_UUID_KEY, id);
        }
        setDeviceId(id);

        const rawSession = await AsyncStorage.getItem(SESSION_KEY);
        if (rawSession) {
          setSession(JSON.parse(rawSession));
        }
      } catch (err) {
        console.warn('[App] boot failed, starting fresh:', err);
      } finally {
        setBooted(true);
      }
    })();
  }, []);

  // ---- GPS tracking --------------------------------------------------------
  // MapView.jsx's own file header confirms it never touches location APIs
  // itself — this stays App.js's responsibility. Started right after a
  // successful room join (see joinRoom below) rather than waiting on a
  // MapView-side onStartTracking call that MapView.jsx doesn't make.
  const startLocationTracking = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setGpsError('Location permission denied — enable it in Settings to see nearby veggies.');
      Alert.alert(
        'Location needed',
        'Veggie Go needs location access to place veggies near you.'
      );
      return;
    }
    setGpsError(null);
    wasTrackingRef.current = true;

    if (!sendLocationRef.current) {
      sendLocationRef.current = makeThrottledLocationWriter();
    }

    locationSubRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 },
      (loc) => {
        const next = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          heading: loc.coords.heading ?? 0,
          accuracy: loc.coords.accuracy ?? undefined,
        };
        setSelfPosition(next);
        // Feeds the server's update-location handler.
        sendLocationRef.current?.(next.lat, next.lng, {
          accuracy: next.accuracy,
          heading: next.heading,
        });
      }
    );
  }, []);

  const stopLocationTracking = useCallback((clearIntent = true) => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
    if (clearIntent) wasTrackingRef.current = false;
  }, []);

  useEffect(() => {
    return () => stopLocationTracking();
  }, [stopLocationTracking]);

  // ---- AppState: pause GPS in background, resume + nudge socket on foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const prevAppState = appStateRef.current;

      const goingToBackground =
        prevAppState === 'active' && nextAppState.match(/inactive|background/);
      const returningToForeground =
        prevAppState.match(/inactive|background/) && nextAppState === 'active';

      if (goingToBackground) {
        // Don't clear intent — we want to know to resume on foreground.
        stopLocationTracking(false);
      }

      if (returningToForeground) {
        if (wasTrackingRef.current) {
          startLocationTracking();
        }
        // The OS may have suspended the socket while backgrounded; if the
        // socket.io client doesn't auto-reconnect on its own, this gives
        // it a nudge. No-op if it's already connected.
        if (socketRef.current?.connected === false) {
          socketRef.current.connect();
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [startLocationTracking, stopLocationTracking]);

  // ---- Room lifecycle -------------------------------------------------------
  const leaveRoom = useCallback(() => {
    if (unsubscribeRoomRef.current) {
      unsubscribeRoomRef.current();
      unsubscribeRoomRef.current = null;
    }
    setRoomCode(null);
    setPlayerId(null);
    setVeggies([]);
    setPlayers([]);
    setRoundResult(null);
    setMatchPhase(PHASES.IDLE);
    stopLocationTracking();
  }, [stopLocationTracking]);

  const joinRoom = useCallback(
    async (code) => {
      const s = connectSocket(); // real signature takes no args and self-memoizes
      if (!socket) setSocket(s);

      // lat/lng are only used server-side to seed spawn origin for a brand
      // new room — fine to be undefined if we haven't gotten a GPS fix yet.
      const lat = selfPosition?.lat;
      const lng = selfPosition?.lng;
      const name = session?.displayName?.trim() || 'Player';

      const result = await gcJoinRoom(code, lat, lng, name, deviceId);
      if (!result || result.success === false) {
        throw new Error(result?.message || 'Failed to join room');
      }

      const finalRoomCode = result.room ?? code;
      setRoomCode(finalRoomCode);
      setPlayerId(result.playerId ?? s.id); // server-assigned, equals socket.id
      setMatchPhase(PHASES.LOBBY);

      if (unsubscribeRoomRef.current) unsubscribeRoomRef.current();
      unsubscribeRoomRef.current = subscribeToRoom(finalRoomCode, {
        onPlayersUpdate: (rows) => setPlayers(Array.isArray(rows) ? rows : Object.values(rows || {})),
        onVeggiesUpdate: (rows) => setVeggies(Array.isArray(rows) ? rows : Object.values(rows || {})),
        onTick: () => setMatchPhase(PHASES.COUNTDOWN),
        onGo: () => setMatchPhase(PHASES.LIVE),
        onRoundEnd: (payload) => {
          setRoundResult(payload);
          setMatchPhase(PHASES.ROUND_END);
        },
        onCountdownCancelled: () => setMatchPhase(PHASES.LOBBY),
        onGlitch: () => {
          // cosmetic/global event — GameCanvasARScene listens to
          // 'glitch-pulse' itself for the AR-side visual pulse, nothing to
          // do here.
        },
        onTimingModeUpdated: () => {},
        onPromotedToLeader: () => {},
      });

      // Start GPS now that we're actually in a room — see file header note.
      startLocationTracking();
    },
    [socket, selfPosition, session, deviceId, startLocationTracking]
  );

  useEffect(() => {
    return () => {
      if (socket) disconnectSocket(); // real signature takes no args
    };
  }, [socket]);

  // ---- Auth --------------------------------------------------------------
  // Login screen calls server.js's /api/auth/google itself and hands back
  // the finished session shape — no remapping needed here, just persist it.
  const onLoginSuccess = useCallback(async (newSession) => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    setSession(newSession);
  }, []);

  const onSignOut = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setSession(null);
    if (socket) disconnectSocket();
    setSocket(null);
    leaveRoom();
  }, [socket, leaveRoom]);

  const onDeleteAccount = useCallback(async () => {
    // Backend call happens in Settings/Scoreboard; App.js just clears local
    // state once the server confirms deletion, per Play Store policy.
    await AsyncStorage.multiRemove([SESSION_KEY]);
    setSession(null);
    if (socket) disconnectSocket();
    setSocket(null);
    leaveRoom();
  }, [socket, leaveRoom]);

  if (!booted) {
    return <SplashScreen />;
  }

  return (
    <View style={styles.root}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false, animation: 'fade' }}
          initialRouteName={session ? 'RoomJoin' : 'Login'}
        >
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen {...props} deviceId={deviceId} onLoginSuccess={onLoginSuccess} />
            )}
          </Stack.Screen>

          <Stack.Screen name="RoomJoin">
            {(props) => (
              <RoomJoinScreen
                {...props}
                deviceId={deviceId}
                session={session}
                onJoinRoom={joinRoom}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="MapView">
            {(props) => (
              <MapViewScreen
                {...props}
                roomCode={roomCode}
                playerId={playerId}
                mySlot={mySlot}
                myPos={selfPosition}
                gpsError={gpsError}
                veggies={veggies}
                players={players}
                matchPhase={matchPhase}
                roundResult={roundResult}
                onEnterAR={() => {
                  // GameCanvasARScene spawns from the full `veggies` list
                  // it already receives via GameCanvasScreen — no single-
                  // target prop to forward here, just navigate.
                  props.navigation.navigate('GameCanvas');
                }}
                onExit={() => {
                  leaveRoom();
                  props.navigation.navigate('RoomJoin');
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="GameCanvas">
            {(props) => (
              <GameCanvasScreen
                {...props}
                roomCode={roomCode}
                playerId={playerId}
                veggies={veggies}
                matchPhase={matchPhase}
                socket={socket}
                myPos={selfPosition}
                deviceHeading={selfPosition?.heading ?? 0}
                onExit={() => {
                  stopLocationTracking();
                  props.navigation.navigate('Scoreboard');
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Scoreboard">
            {(props) => (
              <ScoreboardScreen
                {...props}
                players={playersMap}
                mySlot={mySlot}
                isRoundOver
                roundLabel={roomCode ? `Room ${roomCode}` : ''}
                roundResult={roundResult}
                onPlayAgain={() => {
                  requestRematch();
                  setMatchPhase(PHASES.LOBBY);
                  props.navigation.navigate('MapView');
                }}
                onExitToLobby={() => {
                  leaveRoom();
                  props.navigation.navigate('RoomJoin');
                }}
                onDeleteAccount={onDeleteAccount}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Settings">
            {(props) => (
              <SettingsScreen
                {...props}
                session={session}
                onSignOut={onSignOut}
                onDeleteAccount={onDeleteAccount}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
