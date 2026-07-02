// src/lib/tickClient.js — The Master Countdown Clock Synchronization Client

/**
 * Establishes a raw WebSocket sync connection with the master tick timing clock server
 * @param {string} roomCode - The active uppercase lobby room identity code
 * @param {Object} callbacks - Interactive lifecycle trigger routing hooks
 * @param {Function} callbacks.onStatusChange - Updates connection text telemetry states
 * @param {Function} callbacks.onTick - Triggers the 3-2-1 countdown screen numbers
 * @param {Function} callbacks.onGo - Fires the main match active asset loops
 * @param {Function} callbacks.onRoundEnd - Handles victory scoreboard standing layout calculations
 */
export function connectTickServer(roomCode, callbacks) {
  const { onStatusChange, onTick, onGo, onRoundEnd } = callbacks;

  // Derives target address dynamically. Falls back to your local port 5000 proxy router if undefined
  const TICK_SERVER_URL = import.meta.env.VITE_TICK_SERVER_URL || 'ws://127.0.0.1:5000';
  
  let ws;
  let heartbeatInterval;
  
  try {
    if (onStatusChange) onStatusChange('connecting');
    ws = new WebSocket(`${TICK_SERVER_URL}?room=${roomCode.toUpperCase()}`);
  } catch (err) {
    console.error('[TickClient] WebSocket instantiation error:', err);
    if (onStatusChange) onStatusChange('disconnected');
    return { disconnect: () => {} };
  }

  ws.onopen = () => {
    if (onStatusChange) onStatusChange('connected');
    
    // Authenticate and join the server room channel layout matrix instantly
    ws.send(JSON.stringify({
      type: 'join',
      roomCode: roomCode.toUpperCase()
    }));

    // Start a 20-second connection verification heartbeat ping thread
    heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 20000);
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      
      switch (msg.type) {
        case 'tick':
          // Fires the countdown numbers (3, 2, 1) directly down to App.jsx state
          if (onTick) onTick(msg.tick);
          break;
        case 'go':
          // Triggers the "SATELLITE GO! 🚀" overlay blast window
          if (onGo) onGo();
          break;
        case 'round-end':
          // Pulls final score collections layout to calculate the victor champion row
          if (onRoundEnd) onRoundEnd(msg.results);
          break;
        case 'pong':
          // Heartbeat loop verified cleanly
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('[TickClient] Message parsing failed:', err);
    }
  };

  ws.onerror = (err) => {
    console.error('[TickClient] Network link error:', err);
    if (onStatusChange) onStatusChange('reconnecting');
  };

  ws.onclose = () => {
    if (onStatusChange) onStatusChange('disconnected');
    clearInterval(heartbeatInterval);
  };

  // Provide cleanup disconnect interface method to App.jsx useEffect unmount strings
  return {
    disconnect: () => {
      clearInterval(heartbeatInterval);
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    }
  };
}
