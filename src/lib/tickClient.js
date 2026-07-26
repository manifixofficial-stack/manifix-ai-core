// src/lib/tickClient.js
//
// Thin adapter over gameClient.js's existing socket for tick/go/round-end
// events. No changes needed in this pass — already correct, no web-only
// or Vite-only code paths (unlike gameClient.js's now-fixed import.meta
// line).
//
// WHY THIS REPLACES AN EARLIER VERSION:
// A previous version opened a SECOND, independent socket.io connection
// to the same game server and re-emitted its own 'join-room' on it. That
// caused two real problems:
//   1. It assigned window.socket = socket — clobbering the socket
//      gameClient.js's connectSocket() had already assigned there.
//   2. It called socket.emit('join-room', ...) on this second connection,
//      joining the same room twice under two different socket.ids —
//      inflating player counts and leaving a duplicate "ghost" entry.
//
// Fixed by not opening a second connection at all: this reuses the
// socket gameClient.js already opened and already joined the room on
// (via getSocket()), and subscribes to tick/go/round-end through
// gameClient.js's existing subscribeToRoom() wiring.

import { getSocket, subscribeToRoom } from './gameClient';

/**
 * @param {string} roomCode
 * @param {{lat: number, lng: number} | null} position - unused now; kept
 *   for call-site compatibility with App.js. GPS is sent exactly once,
 *   as part of gameClient.js's joinRoom() call, and continuously via
 *   App.js's geolocation watcher emitting 'update-location' on the same
 *   socket — a second join-room emit here is unnecessary.
 * @param {object} callbacks - onStatusChange, onTick, onGo, onRoundEnd,
 *   onCountdownCancelled (forwarded through to App.js's match-flow state)
 */
export function connectTickServer(roomCode, position, callbacks = {}) {
  const { onStatusChange, onTick, onGo, onRoundEnd, onCountdownCancelled } = callbacks;

  const socket = getSocket();
  if (!socket) {
    console.error(
      '[tickClient] No active gameClient socket found — connectTickServer() must be called after joinRoom()/initLocalSocketBridge().'
    );
    if (onStatusChange) onStatusChange('error');
    return { disconnect: () => {} };
  }

  if (onStatusChange) onStatusChange(socket.connected ? 'connected' : 'connecting');

  const handleConnect = () => onStatusChange && onStatusChange('connected');
  const handleDisconnect = () => onStatusChange && onStatusChange('disconnected');
  const handleConnectError = (err) => {
    console.error('[tickClient] connect_error', err?.message || err);
    if (onStatusChange) onStatusChange('error');
  };
  const handleReconnectAttempt = () => onStatusChange && onStatusChange('connecting');

  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);
  socket.on('connect_error', handleConnectError);
  socket.on('reconnect_attempt', handleReconnectAttempt);

  // server.js's round-end payload is { name, score, slot_id, color } — no
  // slotId key, and slot_id can in principle be absent if a player record
  // is malformed. Normalize both keys here since App.js's victory-overlay
  // code expects both slot_id and slotId present, with SLOT_01 as a safe
  // fallback matching the current 6-slot schema.
  const wrappedOnRoundEnd = onRoundEnd
    ? (results) => {
        const safeResults = Array.isArray(results) ? results : [];
        const normalized = safeResults.map((p) => ({
          name: p.name || 'PILOT',
          score: p.score ?? 0,
          slot_id: p.slot_id || 'SLOT_01',
          slotId: p.slot_id || 'SLOT_01',
        }));
        onRoundEnd(normalized);
      }
    : undefined;

  const unsubscribe = subscribeToRoom(roomCode, {
    onTick: onTick ? (data) => onTick(data.tick) : undefined,
    onGo,
    onRoundEnd: wrappedOnRoundEnd,
    onCountdownCancelled,
  });

  return {
    disconnect: () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      unsubscribe();
    },
  };
}