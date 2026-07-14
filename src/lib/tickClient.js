// src/lib/tickClient.js
//
// Thin adapter over gameClient.js's existing socket for tick/go/round-end
// events.
//
// WHY THIS REPLACES THE PREVIOUS VERSION:
// The previous version opened a SECOND, independent socket.io connection
// to the same game server and re-emitted its own 'join-room' on it. That
// caused two real problems:
//   1. It assigned window.socket = socket — clobbering the socket
//      gameClient.js's connectSocket() had already assigned there.
//      GameCanvas.jsx's CaptureThrow listens for 'capture-result' on
//      window.socket specifically, and App.jsx's GPS watcher emits
//      'update-location' on window.socket directly — whichever socket won
//      the race to set window.socket last silently became "the" socket
//      for capture results and location updates, regardless of which one
//      the server actually replies to.
//   2. It called socket.emit('join-room', ...) on this second connection,
//      joining the same room twice under two different socket.ids. Since
//      server.js keys players and room-fullness checks by socket.id, this
//      inflated player counts and left a duplicate, uncharacterized
//      "ghost" entry in the room for every real player.
//
// Fixed by not opening a second connection at all: this now reuses the
// socket gameClient.js already opened and already joined the room on
// (via getSocket()), and subscribes to tick/go/round-end through
// gameClient.js's existing subscribeToRoom() wiring.
//
// NOTE ON A REJECTED "REPLACEMENT" VERSION:
// A different tickClient.js was proposed, swapping getSocket() for
// initLocalSocketBridge() and listening for 'tick_update' /
// 'match_start_go' / 'match_round_end'. Neither change is correct:
// - getSocket() IS a real export of gameClient.js (returns the existing
//   socket without side effects). initLocalSocketBridge() is a
//   deprecated compatibility shim that calls connectSocket() internally
//   — using it here would risk opening a second connection again, i.e.
//   reintroducing the exact bug described above.
// - server.js emits 'tick', 'go', and 'round-end' (see its io.to(roomCode)
//   .emit(...) calls) — not 'tick_update'/'match_start_go'/
//   'match_round_end'. Those listeners would never fire.
// Verified directly against gameClient.js's exports before rejecting.

import { getSocket, subscribeToRoom } from './gameClient';

/**
 * @param {string} roomCode
 * @param {{lat: number, lng: number} | null} position - unused now; kept
 *   for call-site compatibility with App.jsx. GPS is sent exactly once,
 *   as part of gameClient.js's joinRoom() call, and continuously via
 *   App.jsx's geolocation watcher emitting 'update-location' on the same
 *   socket — a second join-room emit with a second fix is unnecessary.
 * @param {object} callbacks - onStatusChange, onTick, onGo, onRoundEnd
 */
export function connectTickServer(roomCode, position, callbacks = {}) {
  const { onStatusChange, onTick, onGo, onRoundEnd } = callbacks;

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
  // is malformed. Normalize both keys here since App.jsx and the old
  // victory-overlay code expect both slot_id and slotId present, with
  // SLOT_01 as a safe fallback matching the current 6-slot schema.
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
