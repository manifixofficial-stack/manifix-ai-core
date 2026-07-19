// ====================================================================
// GameContext.jsx - inter-component game state
// ====================================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSocket, connectSocket } from './gameClient';

const GameContext = createContext(null);

// Matches App.jsx's exported GAME_STATE constants exactly. Defined here
// too (not imported from App.jsx) to avoid a circular import between
// App.jsx and this file — keep these strings in sync with App.jsx's
// GAME_STATE object if either ever changes.
const INITIAL_GAME_STATE = 'AUTH_SCREEN';

export function GameProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [wallet, setWallet] = useState({ free_tickets: 3, premium_passes: 0 });
  const [room, setRoom] = useState(null);
  const [capturedItems, setCapturedItems] = useState([]); // Syncs with CollectionBook.jsx
  const [activeTarget, setActiveTarget] = useState(null); // Feeds data directly to CaptureThrow.jsx

  // NEW: App.jsx's screen-routing switchboard reads gameState/setGameState
  // and finalScore/setFinalScore off this context — they were never
  // defined here before, so gameState was always undefined and NONE of
  // App.jsx's screens (including the GoogleLogin AUTH screen) ever
  // matched and rendered. Starts on the auth screen so login shows on
  // first load; loginUserPayload below advances it to LOBBY once
  // sign-in succeeds.
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  const [finalScore, setFinalScore] = useState(0);

  // Establish live global listeners the moment a player logs in.
  // NOTE: server.js never emits 'roomStatus' or 'walletSynced' — those
  // events don't exist anywhere in the current backend. Room state comes
  // back via 'room-joined' (see joinRoom() in gameClient.js); wallet
  // balances are only ever returned over REST (POST /api/auth/google,
  // GET /api/wallet/:deviceUUID, POST /api/billing/verify-payment), not
  // pushed over the socket. Wired to 'room-joined' below so this at least
  // does something real — wallet still needs a REST refetch elsewhere
  // (e.g. after a purchase) rather than a socket listener.
  useEffect(() => {
    if (!player) return;
    const socket = getSocket();
    if (!socket) return;

    function handleRoomJoined(packet) {
      if (packet && packet.room) setRoom(packet);
    }

    socket.on('room-joined', handleRoomJoined);

    return () => {
      socket.off('room-joined', handleRoomJoined);
    };
  }, [player]);

  const loginUserPayload = (authData) => {
    setPlayer(authData.player);
    setWallet(authData.wallet);
    setCapturedItems(authData.collection || []);
    connectSocket();
    // NEW: advance past the auth screen once login succeeds. Without
    // this, gameState would stay stuck on 'AUTH_SCREEN' forever even
    // after a successful Google sign-in, since nothing else in the app
    // was ever setting it to move to the lobby.
    setGameState('LOBBY_SCREEN');
  };

  return (
    <GameContext.Provider value={{
      player, setPlayer,
      wallet, setWallet,
      room, setRoom,
      capturedItems, setCapturedItems,
      activeTarget, setActiveTarget,
      gameState, setGameState,
      finalScore, setFinalScore,
      loginUserPayload
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGameScope = () => useContext(GameContext);
