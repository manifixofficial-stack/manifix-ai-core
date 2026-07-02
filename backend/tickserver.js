// backend/tickserver.js
//
// The ONLY job of this process: be a synchronized clock for a room's
// countdown and round timer. It does not touch veggie_spawns, does not
// resolve captures, does not enforce the character-slot unique constraint —
// all of that stays in Supabase (schema.sql + gameClient.js), where the
// atomicity guarantees actually matter.
//
// Flow:
//   1. Server-side Supabase client watches player_scores via postgres_changes.
//   2. When a room hits 4 filled slots, this process broadcasts
//      { type:'tick', tick:3 } -> 2 -> 1 -> { type:'go' } over WebSocket to
//      every phone connected to that room.
//   3. ROUND_DURATION_MS later, it fetches the room's final scores from
//      Supabase and broadcasts { type:'round-end', results:[...] }.
//
// Deploy this as its own small Render service (same as the old
// backend/server.js), separate from the frontend. It needs:
//   npm install ws @supabase/supabase-js
//
// Env vars (Render dashboard):
//   SUPABASE_URL              — same as VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY — service role key, NOT the anon key.
//                                This process reads player_scores across
//                                all rooms to detect the "4 filled" trigger;
//                                use service role so it isn't subject to the
//                                same RLS policies a phone's anon key is.
//                                Get it from Supabase dashboard > Project
//                                Settings > API > service_role. NEVER ship
//                                this key to the frontend.
//   PORT                      — Render sets this automatically.
//   ROUND_DURATION_MS         — optional, defaults to 3 minutes.

const http = require('http');
const { WebSocketServer } = require('ws');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 5000;
const ROUND_DURATION_MS = Number(process.env.ROUND_DURATION_MS) || 3 * 60 * 1000;
const COUNTDOWN_STEP_MS = 1000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '[tickserver] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. ' +
    'Set both in Render before starting this process.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { params: { eventsPerSecond: 5 } },
});

// ---------------------------------------------------------------------------
// Per-room connection + state tracking.
//
// roomSockets: roomCode -> Set<WebSocket>   (who to broadcast to)
// roomState:   roomCode -> 'idle' | 'counting' | 'active' | 'ended'
//              (guards against re-triggering the countdown on every extra
//              postgres_changes event once 4 slots are already filled, and
//              against double-starting if two events land close together)
// ---------------------------------------------------------------------------
const roomSockets = new Map();
const roomState = new Map();

function getRoomSet(roomCode) {
  if (!roomSockets.has(roomCode)) roomSockets.set(roomCode, new Set());
  return roomSockets.get(roomCode);
}

function broadcast(roomCode, message) {
  const sockets = roomSockets.get(roomCode);
  if (!sockets || sockets.size === 0) return;
  const payload = JSON.stringify(message);
  for (const ws of sockets) {
    if (ws.readyState === ws.OPEN) ws.send(payload);
  }
}

// ---------------------------------------------------------------------------
// The clock sequence itself — this is the entire "game logic" this file
// contains. No scoring, no spawning, no capture resolution.
// ---------------------------------------------------------------------------
async function runRoundSequence(roomCode) {
  if (roomState.get(roomCode) !== 'idle') return; // already running or done
  roomState.set(roomCode, 'counting');

  let tick = 3;
  broadcast(roomCode, { type: 'tick', tick });

  await new Promise((resolve) => {
    const interval = setInterval(() => {
      tick -= 1;
      if (tick <= 0) {
        clearInterval(interval);
        resolve();
        return;
      }
      broadcast(roomCode, { type: 'tick', tick });
    }, COUNTDOWN_STEP_MS);
  });

  roomState.set(roomCode, 'active');
  broadcast(roomCode, { type: 'go' });

  setTimeout(() => endRound(roomCode), ROUND_DURATION_MS);
}

async function endRound(roomCode) {
  if (roomState.get(roomCode) !== 'active') return;
  roomState.set(roomCode, 'ended');

  const { data: players, error } = await supabase
    .from('player_scores')
    .select('slot_id, name, score')
    .eq('room_code', roomCode)
    .order('score', { ascending: false });

  if (error) {
    console.error(`[tickserver] failed to fetch final scores for ${roomCode}`, error);
    broadcast(roomCode, { type: 'round-end', results: [] });
    return;
  }

  broadcast(roomCode, { type: 'round-end', results: players || [] });

  // Reset so a future "Instant Replay" (a fresh 4-slot fill in the same
  // room) can re-trigger the sequence. If you build a real replay RPC
  // later, call this reset from there instead of relying on room reuse.
  roomState.set(roomCode, 'idle');
}

// ---------------------------------------------------------------------------
// Watch every room for the "4 slots filled" trigger. One subscription,
// filtered client-side by room_code since we don't know which rooms exist
// in advance — postgres_changes doesn't support a dynamic per-room filter
// without one subscription per room, which doesn't scale as cleanly as
// this single global listener + in-process grouping.
// ---------------------------------------------------------------------------
supabase
  .channel('tickserver-player-watch')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'player_scores' },
    async (payload) => {
      const roomCode = payload.new?.room_code || payload.old?.room_code;
      if (!roomCode) return;
      if (!roomState.has(roomCode)) roomState.set(roomCode, 'idle');
      if (roomState.get(roomCode) !== 'idle') return; // already counting/active/ended

      const { data, error } = await supabase
        .from('player_scores')
        .select('slot_id')
        .eq('room_code', roomCode);

      if (error) {
        console.error(`[tickserver] failed to check fill count for ${roomCode}`, error);
        return;
      }

      const filledCount = new Set((data || []).map((r) => r.slot_id)).size;
      if (filledCount >= 4) {
        console.log(`[tickserver] room ${roomCode} filled — starting countdown`);
        runRoundSequence(roomCode);
      }
    }
  )
  .subscribe((status) => {
    console.log('[tickserver] Supabase watch channel status:', status);
  });

// ---------------------------------------------------------------------------
// WebSocket server. Clients connect and immediately send
// { type: 'join', roomCode } to attach to a room's broadcast group —
// mirrors the old socket.io "join-room" step but this connection ONLY ever
// carries clock events, nothing else.
// ---------------------------------------------------------------------------
const httpServer = http.createServer((req, res) => {
  // Simple health check for Render.
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  let joinedRoom = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return; // ignore malformed frames
    }

    if (msg.type === 'join' && typeof msg.roomCode === 'string') {
      const roomCode = msg.roomCode.toUpperCase();
      joinedRoom = roomCode;
      getRoomSet(roomCode).add(ws);
      if (!roomState.has(roomCode)) roomState.set(roomCode, 'idle');

      // Late joiners (a phone reconnecting mid-countdown) get caught up
      // immediately rather than waiting for the next tick.
      const state = roomState.get(roomCode);
      if (state === 'counting' || state === 'active') {
        ws.send(JSON.stringify({ type: 'sync', state }));
      }
    }
  });

  ws.on('close', () => {
    if (joinedRoom) {
      const set = roomSockets.get(joinedRoom);
      set?.delete(ws);
      if (set && set.size === 0) roomSockets.delete(joinedRoom);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[tickserver] listening on :${PORT}`);
});
