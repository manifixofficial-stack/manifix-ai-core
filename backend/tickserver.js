// backend/tickserver.js
//
// Companion to src/lib/tickClient.js. This server owns ONLY the match
// clock: countdown beats, round start/end, and late-join sync state.
// It intentionally does NOT touch characters, captures, tackles, scores,
// or vegetable positions — per gameClient.js, all of that lives in
// Supabase (RPCs + Realtime). Duplicating it here would put the two
// sources of truth back in conflict, which is the exact problem this
// split architecture is trying to avoid.
//
// Verified against supabase/schema.sql:
//   - game_rooms.all_slots_filled (BOOLEAN) is flipped TRUE by the
//     claim_character() RPC once 4 distinct player rows have a non-null
//     slot_id. This server polls that single column instead of counting
//     player_scores rows itself — cheaper (indexed PK lookup) and it's
//     the schema's own designated hook ("Hook indicator for
//     backend/tickserver.js clock").
//   - Round-end results are read from player_scores (name, slot_id,
//     score) ordered by score desc, since schema.sql has no separate
//     results/winner table.
//
// Known issue NOT fixed here, flagged separately in chat: gameClient.js's
// claimCharacter() and captureVeggie() calls are missing required RPC
// params (p_id/p_lat/p_lng and p_player_lat/p_player_lng respectively).
// Those calls will fail at the PostgREST layer as currently written,
// which means all_slots_filled will never actually flip to TRUE until
// that's fixed client-side.

const http = require('http');
const { WebSocketServer } = require('ws');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

if (!supabase) {
  console.log('⚠️ Supabase credentials missing. Room-ready polling will fail — countdowns will never fire.');
}

// --- Tunables -----------------------------------------------------------
const READY_POLL_MS = 1000;        // how often we check Supabase for 4 filled slots
const COUNTDOWN_TICK_MS = 1000;    // 1 second per 3-2-1 beat
const ROUND_DURATION_MS = 5 * 60 * 1000; // 5-minute round, matches old server.js

// --- In-memory room/session state ---------------------------------------
// This is ONLY clock/connection state — never gameplay state. Safe to
// lose on restart; Supabase remains the source of truth for everything
// that matters (scores, positions, captures).
//
// rooms: Map<roomCode, {
//   sockets: Set<ws>,
//   phase: 'waiting' | 'counting' | 'active' | 'ended',
//   readyPollTimer, countdownTimer, roundTimer,
//   countdownTick,
// }>
const rooms = new Map();

function getOrCreateRoom(roomCode) {
  let room = rooms.get(roomCode);
  if (!room) {
    room = {
      sockets: new Set(),
      phase: 'waiting',
      readyPollTimer: null,
      countdownTimer: null,
      roundTimer: null,
      countdownTick: null,
    };
    rooms.set(roomCode, room);
  }
  return room;
}

function broadcast(roomCode, payload) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const msg = JSON.stringify(payload);
  room.sockets.forEach((ws) => {
    if (ws.readyState === ws.OPEN) ws.send(msg);
  });
}

function sendTo(ws, payload) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
}

// --- Room-ready polling ---------------------------------------------------
// Uses game_rooms.all_slots_filled directly — the schema's own hook for
// this exact purpose — instead of counting player_scores rows.
async function checkRoomReady(roomCode) {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('game_rooms')
    .select('all_slots_filled')
    .eq('room_code', roomCode)
    .single();

  if (error) {
    console.error(`[tickserver] ready-check failed for ${roomCode}:`, error.message);
    return false;
  }
  return data?.all_slots_filled === true;
}

function startReadyPolling(roomCode) {
  const room = getOrCreateRoom(roomCode);
  if (room.readyPollTimer || room.phase !== 'waiting') return;

  room.readyPollTimer = setInterval(async () => {
    const ready = await checkRoomReady(roomCode);
    if (!ready) return;

    clearInterval(room.readyPollTimer);
    room.readyPollTimer = null;
    startCountdown(roomCode);
  }, READY_POLL_MS);
}

// --- Countdown / round lifecycle -----------------------------------------
function startCountdown(roomCode) {
  const room = getOrCreateRoom(roomCode);
  if (room.phase !== 'waiting') return;

  room.phase = 'counting';
  room.countdownTick = 3;
  broadcast(roomCode, { type: 'tick', tick: room.countdownTick });

  room.countdownTimer = setInterval(() => {
    room.countdownTick -= 1;

    if (room.countdownTick > 0) {
      broadcast(roomCode, { type: 'tick', tick: room.countdownTick });
      return;
    }

    clearInterval(room.countdownTimer);
    room.countdownTimer = null;
    room.countdownTick = null;
    room.phase = 'active';

    broadcast(roomCode, { type: 'go' });
    startRoundTimer(roomCode);
  }, COUNTDOWN_TICK_MS);
}

function startRoundTimer(roomCode) {
  const room = getOrCreateRoom(roomCode);
  room.roundTimer = setTimeout(() => {
    endRound(roomCode);
  }, ROUND_DURATION_MS);
}

async function endRound(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.phase = 'ended';

  const results = await fetchResults(roomCode);
  broadcast(roomCode, { type: 'round-end', results });

  // Reset to 'waiting' so a rematch (fresh claim_character round) can
  // re-trigger ready polling. If you want an explicit "play again" signal
  // instead of auto-reset, gate this behind a client message.
  room.phase = 'waiting';
  startReadyPolling(roomCode);
}

async function fetchResults(roomCode) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('player_scores')
    .select('name, slot_id, score')
    .eq('room_code', roomCode)
    .order('score', { ascending: false });

  if (error) {
    console.error(`[tickserver] results fetch failed for ${roomCode}:`, error.message);
    return [];
  }
  return data || [];
}

// --- Late-join sync --------------------------------------------------------
function sendSync(ws, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) {
    sendTo(ws, { type: 'sync', state: 'idle' });
    return;
  }
  if (room.phase === 'active') {
    sendTo(ws, { type: 'sync', state: 'active' });
  } else if (room.phase === 'counting') {
    sendTo(ws, { type: 'sync', state: 'counting' });
  } else {
    sendTo(ws, { type: 'sync', state: 'idle' });
  }
}

// --- WebSocket wiring -------------------------------------------------------
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ManifiX AI Tick Server Active');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let joinedRoom = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return; // ignore malformed frames, matches tickClient.js's own leniency
    }

    if (msg.type === 'join' && typeof msg.roomCode === 'string') {
      const roomCode = msg.roomCode.trim().toUpperCase();
      if (!roomCode) return;

      joinedRoom = roomCode;
      const room = getOrCreateRoom(roomCode);
      room.sockets.add(ws);

      sendSync(ws, roomCode);
      startReadyPolling(roomCode);
    }
  });

  ws.on('close', () => {
    if (!joinedRoom) return;
    const room = rooms.get(joinedRoom);
    if (!room) return;

    room.sockets.delete(ws);

    // Tear down timers and drop the room from memory once everyone's gone,
    // so a stale room doesn't keep polling Supabase forever.
    if (room.sockets.size === 0) {
      if (room.readyPollTimer) clearInterval(room.readyPollTimer);
      if (room.countdownTimer) clearInterval(room.countdownTimer);
      if (room.roundTimer) clearTimeout(room.roundTimer);
      rooms.delete(joinedRoom);
    }
  });
});

server.listen(PORT, () => console.log(`🚀 ManifiX AI Tick Server active on port ${PORT}`));

// --- Graceful shutdown -------------------------------------------------------
function shutdown(signal) {
  console.log(`\n${signal} received — shutting down tick server...`);
  rooms.forEach((room) => {
    if (room.readyPollTimer) clearInterval(room.readyPollTimer);
    if (room.countdownTimer) clearInterval(room.countdownTimer);
    if (room.roundTimer) clearTimeout(room.roundTimer);
  });
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
