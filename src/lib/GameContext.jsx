// ====================================================================
// 🛸 GameContext.jsx - Inter-component game state, wired to the real
// gameClient.js socket API
// ====================================================================
//
// REVISION HISTORY:
//
// BUILD FIX (previous revision): swapped the nonexistent
// `{ socket, connectGameSession }` import for the real
// `{ getSocket, connectSocket }` exports. That made the file compile,
// but did nothing else — the context still never joined a room and
// listened for two socket events server.js never emits.
//
// THIS REVISION — actually wired to gameClient.js:
//
//   1. loginUserPayload() now calls joinRoom(roomCode, lat, lng, name,
//      deviceUUID) instead of just connectSocket(). A socket with no
//      room join is useless here — every real gameplay event
//      gameClient.js documents (players-update, veggies-update, tick,
//      go, round-end, timing-mode-updated, promoted-to-leader) is
//      scoped to a joined room. Callers now pass roomCode/lat/lng
//      through (see updated signature below) instead of an
//      authData shape borrowed from an unrelated Mongo/auth flow.
//
//   2. Removed the 'roomStatus' and 'walletSynced' listeners. Neither
//      event appears anywhere in gameClient.js's documented
//      "server -> all clients" list (players-update, veggies-update,
//      tick, go, glitch-pulse, match-countdown-cancelled, round-end,
//      timing-mode-updated, promoted-to-leader), nor in its
//      request/response pairs (room-joined/room-error,
//      capture-result). They were dead listeners that would never
//      fire — removed rather than left as silent no-ops.
//
//   3. Replaced them with subscribeToRoom(), which is the real,
//      documented way to receive room state in this codebase (see
//      GameCanvas.jsx and tickClient.js, both of which already use
//      it this way). `room` is now populated from the real
//      'room-joined' response and kept in sync via subscribeToRoom's
//      onRoomUpdate; `players` is new state fed by onPlayersUpdate,
//      since that's the actual server-pushed source of player/score
//      data — nothing in gameClient.js has ever broadcast a
//      wallet balance, so `wallet` is left as caller-supplied local
//      state only (see note on wallet below) instead of pretending a
//      sync channel exists.
//
//   4. Removed the stale "// Syncs with CollectionBook.jsx" comment
//      and the capturedItems state it described. GameCanvas.jsx's own
//      revision notes confirm CollectionBook was removed entirely
//      (import, recordCatch call, collectionOpen state, button, and
//      render all gone) — there is nothing left in this codebase for
//      a "collection" to sync with.
//
//   5. Removed activeTarget / setActiveTarget. The comment claiming it
//      "feeds data directly to CaptureThrow.jsx" was never true:
//      CaptureThrow's `targets` prop comes from GameCanvas's own
//      locally-computed `captureTargets` (derived from targetNodes /
//      liveVeggieSnapshot), and nothing in GameCanvas.jsx reads from
//      GameContext at all. Keeping a same-named-but-unused piece of
//      state around invites someone to wire a second, competing
//      source of truth for capture targets later. If a cross-
//      component target handoff is genuinely needed, it should be
//      designed against GameCanvas's actual data flow, not bolted on
//      here speculatively.
//
// HONEST CAVEAT (carried forward): nothing in App.jsx currently
// renders <GameProvider> or calls useGameScope(). This file is wired
// correctly against gameClient.js now, but it's still unused —
// integrating it means passing real roomCode/lat/lng/deviceUUID into
// loginUserPayload() from wherever login/room-join actually happens
// in the app, the same way App.jsx itself calls joinRoom() directly
// today. This context does not yet replace that call site; it's an
// alternative surface for the same data, not a currently-active one.
//
// WALLET NOTE: gameClient.js's file header documents that
// wallet/ticket data is deviceUUID-keyed server-side
// (getOrCreateWallet(deviceUUID)), but no exported function or
// broadcast event currently returns it to the client — join-room's
// response shape isn't documented beyond { room, playerId } here.
// `wallet` is therefore left as local state, seeded to a default and
// only ever changed by an explicit setWallet() call from outside this
// file (e.g. after a future dedicated wallet-fetch call is added to
// gameClient.js). It is NOT kept in sync with the server today —
// don't treat it as authoritative.

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { connectSocket, joinRoom, subscribeToRoom, getCurrentRoomCode } from './gameClient';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [veggies, setVeggies] = useState({});
  const [matchPhase, setMatchPhase] = useState(null); // 'waiting' | 'go' | 'round-end', set by callbacks below
  const [roundResults, setRoundResults] = useState(null);
  const [timingMode, setTimingMode] = useState(null);
  const [isLeader, setIsLeader] = useState(false);

  // Local-only — see WALLET NOTE above. Not synced from any server
  // event; callers that need real balances must fetch/update it
  // themselves until gameClient.js exposes a real wallet channel.
  const [wallet, setWallet] = useState({ free_tickets: 3, premium_passes: 0 });

  const unsubscribeRef = useRef(null);

  // Tear down any live room subscription on unmount so listeners don't
  // leak across mounts/remounts of the provider.
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  /**
   * Connects the socket, joins a real room via gameClient.js's joinRoom(),
   * and wires up live updates via subscribeToRoom() — the same
   * event set GameCanvas.jsx and tickClient.js already consume.
   *
   * Replaces the old loginUserPayload(authData) shape, which matched
   * an unrelated Mongo/auth login flow gameClient.js has no handler
   * for. This context only knows how to do the thing gameClient.js
   * actually supports: join a GPS room by code.
   *
   * @param {string} roomCode
   * @param {number} lat
   * @param {number} lng
   * @param {string} name        player's call sign
   * @param {string} [deviceUUID] persisted device UUID; enables
   *   server-side reconnect grace + wallet/leaderboard keying (see
   *   gameClient.js's joinRoom header note). Passing undefined is
   *   safe but degrades those features server-side.
   */
  const loginAndJoinRoom = useCallback(async (roomCode, lat, lng, name, deviceUUID) => {
    connectSocket();

    const result = await joinRoom(roomCode, lat, lng, name, deviceUUID);

    if (!result || result.success === false) {
      // joinRoom() resolves (doesn't throw) with { success: false, ... }
      // on a 'room-error' response — surface that as-is so callers can
      // branch on result.message the same way gameClient.js's other
      // callers do.
      return result;
    }

    setPlayer({ name, deviceUUID, playerId: result.playerId });
    setRoom(result);

    // Tear down any previous subscription before wiring a new one, in
    // case loginAndJoinRoom is called again for a different room.
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = subscribeToRoom(result.room, {
      onRoomUpdate: (updatedRoom) => setRoom(updatedRoom),
      onPlayersUpdate: (updatedPlayers) => setPlayers(updatedPlayers || []),
      onVeggiesUpdate: (updatedVeggies) => setVeggies(updatedVeggies || {}),
      onGo: () => setMatchPhase('go'),
      onRoundEnd: (results) => {
        setMatchPhase('round-end');
        setRoundResults(results);
      },
      onCountdownCancelled: () => setMatchPhase('waiting'),
      onTimingModeUpdated: (mode) => setTimingMode(mode),
      onPromotedToLeader: () => setIsLeader(true),
    });

    return result;
  }, []);

  const value = {
    player,
    room,
    players,
    veggies,
    matchPhase,
    roundResults,
    timingMode,
    isLeader,
    wallet,
    setWallet, // local-only setter — see WALLET NOTE
    loginAndJoinRoom,
    getCurrentRoomCode,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGameScope = () => useContext(GameContext);
