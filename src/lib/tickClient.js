// src/lib/tickClient.js
//
// Thin client for backend/tickserver.js. This is the ONLY file that talks
// to the tick server — everything else (scores, captures, claims, veggies)
// still goes through src/lib/gameClient.js / Supabase. Keeping these two
// clients separate mirrors the server split: gameClient.js = state,
// tickClient.js = clock.
//
// Usage (see App.jsx):
//   const tick = connectTickServer(roomCode, {
//     onTick: (n) => setCountdownTick(n),
//     onGo: () => setMatchPhase('ACTIVE'),
//     onRoundEnd: (results) => setVictoryData(...),
//   });
//   // later, on unmount:
//   tick.disconnect();
//
// Set VITE_TICKSERVER_URL in .env.local / Vercel to the deployed Render
// URL for backend/tickserver.js, e.g. wss://manifix-tickserver.onrender.com
// Falls back to localhost for local dev against `node backend/tickserver.js`.
const TICKSERVER_URL = import.meta.env.VITE_TICKSERVER_URL || 'ws://localhost:5000';

const RECONNECT_DELAY_MS = 1000;
const RECONNECT_DELAY_MAX_MS = 8000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function connectTickServer(roomCode, { onTick, onGo, onRoundEnd, onStatusChange } = {}) {
  let ws = null;
  let closedByCaller = false;
  let reconnectAttempts = 0;
  let reconnectTimer = null;

  function scheduleReconnect() {
    if (closedByCaller || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      onStatusChange?.('disconnected');
      return;
    }
    reconnectAttempts += 1;
    const delay = Math.min(RECONNECT_DELAY_MS * reconnectAttempts, RECONNECT_DELAY_MAX_MS);
    reconnectTimer = setTimeout(open, delay);
  }

  function handleMessage(event) {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return; // ignore malformed frames
    }

    switch (msg.type) {
      case 'tick':
        onTick?.(msg.tick);
        break;
      case 'go':
        onGo?.();
        break;
      case 'round-end':
        onRoundEnd?.(msg.results || []);
        break;
      case 'sync':
        // A late-join catch-up hint (server is mid-countdown or mid-round).
        // We don't have the exact remaining tick/time here — the next real
        // 'tick'/'go' broadcast will correct it. This just lets the UI show
        // "reconnecting to round in progress" instead of a stale idle state.
        onStatusChange?.(msg.state === 'active' ? 'joined-active' : 'joined-counting');
        break;
      default:
        break;
    }
  }

  function open() {
    onStatusChange?.('connecting');
    ws = new WebSocket(TICKSERVER_URL);

    ws.onopen = () => {
      reconnectAttempts = 0;
      onStatusChange?.('connected');
      ws.send(JSON.stringify({ type: 'join', roomCode }));
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      if (!closedByCaller) {
        onStatusChange?.('reconnecting');
        scheduleReconnect();
      }
    };

    ws.onerror = () => {
      // onclose fires right after in the browser WebSocket spec — let that
      // path own the reconnect logic instead of duplicating it here.
      onStatusChange?.('error');
    };
  }

  open();

  return {
    disconnect() {
      closedByCaller = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    },
  };
}
