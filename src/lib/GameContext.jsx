// ====================================================================
// 🛸 GameContext.jsx - AAA INTER-COMPONENT GAME STATE ENGINE
// ====================================================================
//
// BUILD FIX: this file previously imported `{ socket, connectGameSession }`
// from './gameClient' — neither export exists there. gameClient.js keeps
// its socket instance private (module-level `let socket`) and exposes it
// only via `getSocket()`; there is no `connectGameSession` export at all,
// only `connectSocket()`, which takes no arguments and has nothing to do
// with username/deviceUUID.
//
// HONEST CAVEAT: `connectGameSession({ username, deviceUUID })` looks like
// it was written for the GoogleLogin.jsx / MongoDB-backend auth flow
// (loginUserPayload's authData shape matches GoogleLogin's onLoginSuccess
// payload almost exactly), not for the Supabase/socket.io room-code flow
// gameClient.js actually implements. Nothing in App.jsx currently renders
// <GameProvider> or uses useGameScope(), so this fix only makes the file
// COMPILE — it does not make loginUserPayload's socket session real. If
// this context is meant to back the actual app, `connectSocket()` +
// `joinRoom()` need to be called with real room/player data, not a
// username/deviceUUID pair gameClient.js has no handler for.
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSocket, connectSocket } from './gameClient';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [wallet, setWallet] = useState({ free_tickets: 3, premium_passes: 0 });
  const [room, setRoom] = useState(null);
  const [capturedItems, setCapturedItems] = useState([]); // Syncs with CollectionBook.jsx
  const [activeTarget, setActiveTarget] = useState(null); // Feeds data directly to CaptureThrow.jsx

  // Establish live global listeners the moment a player logs in
  useEffect(() => {
    if (!player) return;

    const socket = getSocket();
    if (!socket) return;

    socket.on('roomStatus', (packet) => {
      if (packet.success) setRoom(packet.room);
    });

    socket.on('walletSynced', (updatedBalances) => {
      setWallet(updatedBalances);
    });

    return () => {
      socket.off('roomStatus');
      socket.off('walletSynced');
    };
  }, [player]);

  const loginUserPayload = (authData) => {
    setPlayer(authData.player);
    setWallet(authData.wallet);
    setCapturedItems(authData.collection || []);
    // FIX: connectGameSession(...) doesn't exist in gameClient.js. Swapped
    // in connectSocket() (the real exported connector) so this at least
    // opens the socket connection — see the file-header caveat above,
    // this does NOT send authData.player.username/deviceUUID anywhere,
    // since gameClient.js has no server event that accepts them.
    connectSocket();
  };

  return (
    <GameContext.Provider value={{
      player, setPlayer,
      wallet, setWallet,
      room, setRoom,
      capturedItems, setCapturedItems,
      activeTarget, setActiveTarget,
      loginUserPayload
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGameScope = () => useContext(GameContext);
