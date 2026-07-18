// ====================================================================
// 📡 useNetworkShield.js - MOBILE AR CELLULAR SIGNAL DROPOUT BRIDGE
// ====================================================================
import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { socket } from '../lib/gameClient';

export function useNetworkShield(roomCode, username) {
  const [isOnline, setIsOnline] = useState(true);
  const [networkLog, setNetworkLog] = useState('G-NET // CELLULAR SYNC OK');

  useEffect(() => {
    // Initialize native platform hardware connection listeners via Capacitor [INDEX]
    const networkListener = Network.addListener('networkStatusChange', async (status) => {
      setIsOnline(status.connected);

      if (!status.connected) {
        setNetworkLog('🚨 SIGNAL DROPOUT DETECTED! FREEZING PLAYSPACE VIEWPORT...');
        console.warn('📶 [NETWORK DROP]: Connection link dropped.');
      } else {
        setNetworkLog('🔮 SIGNAL RECOVERY DETECTED. RE-ESTABLISHING PORT 5000 TUNNEL...');
        
        // Execute background silent re-handshake to prevent room lobby ejection [INDEX]
        if (roomCode && username && !socket.connected) {
          socket.connect();
          socket.emit('joinRoom', { 
            username: username.toUpperCase(), 
            roomCode: roomCode.toUpperCase() 
          });
          setNetworkLog('✅ CELLULAR SYNC RE-ESTABLISHED. MATCH PROGRESSION RESTORED.');
        }
      }
    });

    // Run baseline hardware telemetry verification on component mount [INDEX]
    Network.getStatus().then((status) => setIsOnline(status.connected));

    return () => {
      networkListener.then(l => l.remove());
    };
  }, [roomCode, username]);

  return { isOnline, networkLog };
}
