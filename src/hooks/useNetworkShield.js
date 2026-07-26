// ====================================================================
// useNetworkShield.js - mobile signal dropout / reconnect handling
// ====================================================================
import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { getSocket, joinRoom } from '../lib/gameClient';

export function useNetworkShield(roomCode, username) {
  const [isOnline, setIsOnline] = useState(true);
  const [networkLog, setNetworkLog] = useState('Connected');

  useEffect(() => {
    const networkListener = Network.addListener('networkStatusChange', async (status) => {
      setIsOnline(status.connected);

      if (!status.connected) {
        setNetworkLog('Connection lost. Waiting to reconnect…');
        console.warn('[useNetworkShield] connection dropped');
      } else {
        setNetworkLog('Reconnecting…');

        const socket = getSocket();
        // NOTE: previously emitted a raw 'joinRoom' event with
        // { username, roomCode } — server.js has no 'joinRoom' listener
        // (it listens for 'join-room' with a { room, lat, lng, name }
        // payload), so that reconnect attempt was a silent no-op. Reusing
        // gameClient.js's joinRoom() here instead, since it already emits
        // the correct event/shape and resolves on 'room-joined' or
        // 'room-error'.
        if (roomCode && username && (!socket || !socket.connected)) {
          try {
            const result = await joinRoom(roomCode, null, null, username.toUpperCase());
            if (result && result.success === false) {
              setNetworkLog(`Reconnect failed: ${result.message || 'unknown error'}`);
            } else {
              setNetworkLog('Reconnected');
            }
          } catch (err) {
            setNetworkLog('Reconnect failed. Retrying on next signal change.');
            console.error('[useNetworkShield] reconnect failed', err.message);
          }
        }
      }
    });

    Network.getStatus().then((status) => setIsOnline(status.connected));

    return () => {
      networkListener.then((l) => l.remove());
    };
  }, [roomCode, username]);

  return { isOnline, networkLog };
}
