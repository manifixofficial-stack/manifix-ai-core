// ====================================================================
// 🛸 GameContext.jsx - AAA INTER-COMPONENT GAME STATE ENGINE
// ====================================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { socket, connectGameSession } from './gameClient';

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
    connectGameSession({ username: authData.player.username, deviceUUID: authData.deviceUUID });
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
