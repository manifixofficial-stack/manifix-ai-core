// server.js
//
// Real-Time Express & Socket.io Hybrid GPS/Indoor Game Server Core.
//
// ==========================================================================
// MATCH STRUCTURE: WINNER-TAKE-ROUND (100/300/600, 3 rounds)
// ==========================================================================
//   - 2 to 6 players per room.
//   - Exactly 3 rounds. Each round spawns exactly ONE veggie. First valid
//     capture wins the WHOLE round's point value — no partial credit.
//   - Round point values: 100 / 300 / 600 = 1000 total.
//   - Timeout with no capture = nobody scores that round, points lost.
//   - Glitch pulse is VISUAL ONLY — does not affect point values.
//
// ==========================================================================
// THIS REVISION: 'request-rematch' now actually works
// ==========================================================================
//   - PROBLEM: App.jsx's PrizeCamera "rematch" button has always emitted
//     'request-rematch', but this file never had a handler for it — the
//     event went into the void and nothing happened. Made worse by the
//     fact that advanceMatch() used to `delete rooms[roomCode]` the
//     INSTANT a match ended, so even if a handler existed, there'd be no
//     room left by the time anyone pressed the button.
//   - FIX, part 1: advanceMatch() no longer deletes the room immediately
//     on match end. It marks `matchEnded = true` and schedules a
//     ROOM_POST_MATCH_CLEANUP_MS-later cleanup instead, so the room (and
//     everyone's slot/character/deviceUUID) stays addressable for a
//     rematch request in the meantime. If nobody rematches within that
//     window, the room is deleted exactly as before.
//   - FIX, part 2: new 'request-rematch' handler. Any player still in a
//     matchEnded room can trigger it. Resets everyone's score to 0, resets
//     round/stage state back to pre-match, cancels the pending cleanup
//     timer, and — if enough players are still present — immediately
//     kicks off the existing startCountdown() flow (the same 'tick'/'go'
//     events already drive App.jsx's matchPhase state on every client, so
//     no new client-side event needed to make the victory screen clear
//     itself and the arena restart).
//   - Ticket spend: rematch does NOT re-spend a ticket per player here —
//     beginMatch() (called at the end of the new countdown) already
//     spends one ticket per player exactly as it does for a normal match
//     start, so a rematch costs a ticket the same way starting fresh
//     would. This is intentional, not an oversight.
//
// ==========================================================================
// PRIOR REVISION: /health route removed
// ==========================================================================
//   - The GET /health uptime-check route (status + mongoReady/razorpayReady/
//     activeRooms snapshot) has been removed at the user's request.
//   - NOTE this does not fix Render free-tier cold-start / sleep behavior —
//     it only removes the diagnostic endpoint. If the server is on a
//     free/sleeping tier, the actual fix is either upgrading the plan or
//     pointing an external uptime pinger (e.g. UptimeRobot) at some other
//     route (like GET /ping, which still exists) every 10-14 minutes so
//     the process never sleeps.
//
// ==========================================================================
// PRIOR REVISION: Reconnect handling + ticket wallet wired to billing
// ==========================================================================
//   - PROBLEM: any socket drop during an active match (extremely common on
//     mobile — the whole point of this game) permanently removed the player:
//     their slot opened back up and their score was gone, with no way back
//     in even if they reconnected 2 seconds later.
//   - FIX: a player who disconnects mid-match is marked `disconnected: true`
//     and kept in `room.players` (slot NOT freed) for RECONNECT_GRACE_MS.
//     If the same deviceUUID calls `join-room` on the same room code before
//     that timer fires, they're restored under their new socket.id with
//     their existing score/character intact ('room-joined' includes
//     `reconnected: true`). If the grace window expires, they're removed
//     for good via finalizePlayerRemoval — same end state as before.
//   - New events: `player-disconnected` (grace window started) and
//     `player-reconnected` (restored) — both broadcast to the room so
//     clients can show a "reconnecting…" indicator instead of just seeing
//     someone vanish and reappear as a stranger.
//   - A brand new (non-reconnecting) join is now rejected once
//     `room.matchActive` is true — previously nothing stopped an unrelated
//     new player from being slotted into an in-progress match.
//   - TICKET GATING: join-room now checks a Mongo-backed Wallet (keyed by
//     deviceUUID) and rejects the join with `INSUFFICIENT_TICKETS` if the
//     device has 0 free_tickets + premium_passes. The ticket itself is only
//     SPENT when the match actually starts (beginMatch), not at join —
//     backing out of the lobby before kickoff costs nothing.
//   - New REST routes for the mobile app: `GET /api/wallet/:deviceUUID`
//     (balance for the HUD) and `POST /api/billing/verify-payment`
//     (called by BillingGate.jsx after Razorpay checkout — fetches the
//     payment from Razorpay's own API before crediting, and is idempotent
//     against the same razorpay_payment_id being submitted twice).
//   - Ticket/wallet logic fails OPEN on a Mongo hiccup (logs and lets the
//     player through) rather than blocking gameplay on a transient DB issue.
//     If Mongo isn't configured at all (`mongoReady === false`), ticket
//     gating is skipped entirely — same behavior as before this revision.
//
// ==========================================================================
// PRIOR REVISION: PASS 1 — room-wide timing mode (indoor 45s / outdoor 60s)
// PRIOR REVISION: PASS 2 — lobby leader sets timing mode
// ==========================================================================
//   - room.timingMode: 'indoor' | 'outdoor', defaults to 'outdoor'.
//   - getStageDurationMs(room) resolves the right duration per room.
//   - room.leaderId: socket.id of whoever created the room. Reassigned to
//     another player in the room if the leader disconnects before the
//     match starts.
//   - 'room-joined' now also reports { isLeader, timingMode } to the
//     joining client.
//   - 'set-timing-mode' — leader-only, pre-match-only. Broadcasts
//     'timing-mode-updated' to the whole room on success.
//
// ==========================================================================
// PRIOR REVISION: FIX — match no longer auto-starts on player count alone.
// ==========================================================================
//   - room.modeChosen (defaults false) gates auto-start alongside player
//     count; the actual trigger lives in the 'set-timing-mode' handler.
//
// ==========================================================================
// PRIOR REVISION: Mobile (Capacitor) CORS support + Top-5 leaderboard route
// ==========================================================================
//   - ALLOWED_ORIGIN_PATTERNS also accepts `capacitor://localhost` and bare
//     `http://localhost` (no port).
//   - `app.get('/api/leaderboard-top')` — limited to 5 results.
//
// ==========================================================================
// PRIOR REVISION: claim-character REMOVED, slot auto-assigned in join-room
// ==========================================================================
//
// ==========================================================================
// PRIOR REVISION: Persistent best-score leaderboard + REST CORS fix
// ==========================================================================
//   - Leaderboard upserts ONE record per player (deviceUUID, falling back
//     to username), tracking highestMatchScore + lifetimeMatchesPlayed.
//   - REST routes now share the SAME CORS allow-list as Socket.io.
//   - Per-action DB writes on every socket event intentionally NOT adopted;
//     Mongo is only touched once per match at match-end (plus, as of this
//     revision, once per match at match-START for ticket spend, and on
//     demand for wallet/billing REST calls).
//
// KEPT AS-IS FOR CLIENT COMPATIBILITY:
//   'tick' / 'go', 'round-end' (fires once at MATCH end), 'veggies-update',
//   'players-update', 'glitch-pulse', capture-attempt protocol
//   ({ id, vegId, success, label }), 6-slot character system,
//   'round-start' { round, pointValue, veggie }, 'round-win'
//   { round, winnerId, winnerName, pointValue, veggieType, quality,
//     totalScore }, 'round-timeout' { round }, 'timing-mode-updated'
//   { mode }, 'rematch-starting' { requestedBy } (NEW — informational only,
//   no client currently needs to handle it since the 'tick' that follows
//   already drives the UI transition, but it's there if you want an
//   earlier "rematch incoming…" indicator).

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const crypto = require('crypto');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Razorpay = require('razorpay');
require('dotenv').config();

const Leaderboard = require('./models/Leaderboard');
const Wallet = require('./models/Wallet');

const app = express();
const server = http.createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'https://manifixai.com';

const ALLOWED_ORIGIN_PATTERNS = [
  new RegExp(`^${CLIENT_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
  new RegExp(`^https:\\/\\/www\\.${CLIENT_ORIGIN.replace(/^https:\/\//, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,
  /^http:\/\/localhost:(3000|5000)$/,
  // --- Mobile / Capacitor support ---
  /^capacitor:\/\/localhost$/,
  /^http:\/\/localhost$/,
];

function isAllowedOrigin(origin) {
  if (!origin) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

const corsOptionsDelegate = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  }
};

app.use(cors({
  origin: (origin, callback) => corsOptionsDelegate(origin, callback),
  methods: ['GET', 'POST'],
}));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: corsOptionsDelegate,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

app.get('/', (req, res) => {
  res.status(200).send('<h1>🚀 ManifiX AI Hybrid GPS/Indoor Game Server Node is Active!</h1><p>3-round winner-take-round mode operational.</p>');
});

app.get('/ping', (req, res) => {
  res.status(200).send('ManifiX AI Game Engine is Awake!');
});

// ==========================================
// 💾 MONGODB DATABASE INFRASTRUCTURE
// ==========================================
const mongoURI = process.env.MONGODB_URI;
let mongoReady = false;

if (!mongoURI) {
  console.log('⚠️ MONGODB_URI missing. High-scores and tickets won\'t be saved.');
} else {
  mongoose.connect(mongoURI)
    .then(() => {
      mongoReady = true;
      console.log('📦 Connected to MongoDB Atlas Cloud!');
    })
    .catch((err) => console.error('❌ MongoDB Atlas connection failure error:', err));
}

// ==========================================
// 💳 RAZORPAY — fails soft. A missing/bad key disables ONLY the billing
// route; it never takes down the game server itself.
// ==========================================
let razorpayReady = false;
let razorpayInstance = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  razorpayReady = true;
} else {
  console.log('⚠️ RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET missing. Billing endpoint disabled.');
}

async function getOrCreateWallet(deviceUUID) {
  let wallet = await Wallet.findOne({ deviceUUID });
  if (!wallet) {
    wallet = await new Wallet({ deviceUUID }).save();
  }
  return wallet;
}

function totalTickets(wallet) {
  return wallet.balances.free_tickets + wallet.balances.premium_passes;
}

async function spendTicket(deviceUUID) {
  const wallet = await getOrCreateWallet(deviceUUID);
  if (wallet.balances.free_tickets > 0) {
    wallet.balances.free_tickets -= 1;
  } else if (wallet.balances.premium_passes > 0) {
    wallet.balances.premium_passes -= 1;
  } else {
    return false;
  }
  wallet.updated_at = new Date();
  await wallet.save();
  return true;
}

app.get('/api/leaderboard', async (req, res) => {
  if (!mongoReady) return res.status(200).json([]);
  try {
    const topScores = await Leaderboard.find().sort({ highestMatchScore: -1 }).limit(10);
    res.status(200).json(topScores);
  } catch (err) {
    console.error('[Mongo] leaderboard fetch failed', err);
    res.status(500).json({ error: 'Failed to retrieve high scores' });
  }
});

app.get('/api/leaderboard-top', async (req, res) => {
  if (!mongoReady) return res.status(200).json([]);
  try {
    const topFive = await Leaderboard.find().sort({ highestMatchScore: -1 }).limit(5);
    res.status(200).json(topFive);
  } catch (err) {
    console.error('[Mongo] leaderboard-top fetch failed', err);
    res.status(500).json({ error: 'Failed to retrieve top 5 high scores' });
  }
});

// 🎟️ Wallet balance — the mobile app's ticket HUD polls/reads this.
app.get('/api/wallet/:deviceUUID', async (req, res) => {
  if (!mongoReady) return res.status(200).json({ free_tickets: 3, premium_passes: 0 });
  try {
    const wallet = await getOrCreateWallet(req.params.deviceUUID);
    res.status(200).json(wallet.balances);
  } catch (err) {
    console.error('[wallet] fetch failed', err.message);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

const billingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: 'TOO MANY REQUESTS — SLOW DOWN' },
});

// 💰 Called by BillingGate.jsx right after the Razorpay checkout modal's
// `handler` fires. Verifies the payment against Razorpay's own API (never
// trusts the client's say-so on amount/status) and is idempotent: replaying
// the same razorpay_payment_id never credits twice.
app.post('/api/billing/verify-payment', billingLimiter, async (req, res) => {
  if (!razorpayReady) {
    return res.status(503).json({ success: false, message: 'BILLING NOT CONFIGURED' });
  }
  const { deviceUUID, razorpay_payment_id, bundle_tickets } = req.body;
  if (!deviceUUID || !razorpay_payment_id || !bundle_tickets) {
    return res.status(400).json({ success: false, message: 'MISSING REQUIRED FIELDS' });
  }

  try {
    const wallet = await getOrCreateWallet(deviceUUID);

    const alreadySettled = wallet.transaction_history.some(
      (tx) => tx.invoice_id === razorpay_payment_id && tx.status === 'SETTLED'
    );
    if (alreadySettled) {
      return res.status(200).json({ success: true, message: 'PAYMENT ALREADY PROCESSED', wallet: wallet.balances });
    }

    const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);

    if (payment && payment.status === 'captured') {
      wallet.balances.premium_passes += parseInt(bundle_tickets, 10);
      wallet.transaction_history.push({
        invoice_id: razorpay_payment_id,
        amount_paid: payment.amount / 100,
        currency: payment.currency,
        status: 'SETTLED',
      });
      wallet.updated_at = new Date();
      await wallet.save();
      return res.status(200).json({ success: true, message: 'WALLET CREDITED', wallet: wallet.balances });
    }

    wallet.transaction_history.push({
      invoice_id: razorpay_payment_id,
      amount_paid: payment ? payment.amount / 100 : 0,
      currency: payment ? payment.currency : 'INR',
      status: 'FAILED',
    });
    await wallet.save();
    return res.status(400).json({ success: false, message: 'PAYMENT NOT CAPTURED' });
  } catch (err) {
    console.error('[verify-payment] error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
const TICK_MS = 1000;
const COUNTDOWN_TICK_MS = 1000;

const TOTAL_ROUNDS = 3;
const ROUND_POINT_VALUES = [100, 300, 600]; // sums to 1000

const STAGE_DURATION_INDOOR_MS = 45 * 1000;
const STAGE_DURATION_OUTDOOR_MS = 60 * 1000;

function getStageDurationMs(room) {
  return room.timingMode === 'indoor' ? STAGE_DURATION_INDOOR_MS : STAGE_DURATION_OUTDOOR_MS;
}

const INTER_ROUND_PAUSE_MS = 4 * 1000;

const GLITCH_CYCLE_MS = 45000;
const GLITCH_DURATION_MS = 6000;

const ROOM_RADIUS_METERS = 300;
const VEG_PANIC_RADIUS_M = 40;
const VEG_FLEE_SPEED_MPS = 1.4;
const CATCH_RADIUS_METERS = 15;
const LOCATION_STALE_MS = 15000;

const GPS_MODE_ACCURACY_THRESHOLD_M = 25;
const HEADING_TOLERANCE_DEG = 45;
const LOCATION_MAX_AGE_FOR_CAPTURE_MS = 20000;

const MAX_PLAUSIBLE_SPEED_MPS = 12;
const PLAYER_NAME_MAX_LEN = 20;
const ROOM_CODE_MAX_LEN = 12;
const ROOM_CREATE_LIMIT = 5;
const ROOM_CREATE_WINDOW_MS = 60000;
const DEVICE_UUID_MAX_LEN = 100;

const MIN_PLAYERS_TO_START = 2;
const MAX_PLAYERS_PER_ROOM = 6;

// How long a mid-match disconnect keeps a player's slot + score reserved
// before they're removed for good.
const RECONNECT_GRACE_MS = 45 * 1000;

// NEW: how long a room stays alive AFTER a match ends before it's torn
// down, giving players a window to hit "rematch" without needing to
// re-join with a fresh room code. If nobody rematches in time, the room
// is deleted exactly as it always was.
const ROOM_POST_MATCH_CLEANUP_MS = 5 * 60 * 1000;

let rooms = {};
const roomCreateLog = new Map();

const EARTH_RADIUS_M = 6371000;

function toRad(deg) { return (deg * Math.PI) / 180; }
function toDeg(rad) { return (rad * 180) / Math.PI; }

function distanceMeters(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

function bearingDegrees(lat1, lng1, lat2, lng2) {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function destinationPoint(lat, lng, bearingDeg, distM) {
  const angDist = distM / EARTH_RADIUS_M;
  const bearingRad = toRad(bearingDeg);
  const lat1 = toRad(lat);
  const lng1 = toRad(lng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angDist) +
    Math.cos(lat1) * Math.sin(angDist) * Math.cos(bearingRad)
  );
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearingRad) * Math.sin(angDist) * Math.cos(lat1),
    Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2)
  );

  return { lat: toDeg(lat2), lng: ((toDeg(lng2) + 540) % 360) - 180 };
}

function angleDiffDeg(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function rollVeggieType() {
  const typeChance = Math.random();
  if (typeChance > 0.97) return 'golden';
  if (typeChance > 0.90) return 'banana';
  if (typeChance > 0.79) return 'tomato';
  if (typeChance > 0.61) return 'grapes';
  if (typeChance > 0.36) return 'strawberry';
  return 'broccoli';
}

function spawnStageVeggie(centerLat, centerLng, round, pointValue) {
  const candidate = destinationPoint(
    centerLat,
    centerLng,
    Math.random() * 360,
    ROOM_RADIUS_METERS * 0.8 * Math.sqrt(Math.random())
  );

  const type = rollVeggieType();

  return {
    id: `veg-r${round}-${Math.random().toString(36).substring(2, 9)}`,
    lat: candidate.lat,
    lng: candidate.lng,
    latitude: candidate.lat,
    longitude: candidate.lng,
    bearing: Math.random() * 360,
    type,
    veggie_type: type,
    round,
    pointValue,
  };
}

const CHARACTER_COLORS = {
  SLOT_01: '#3a86ff',
  SLOT_02: '#2ecc71',
  SLOT_03: '#ff006e',
  SLOT_04: '#8338ec',
  SLOT_05: '#e74c3c',
  SLOT_06: '#f1c40f',
};

function sanitizeRoomCode(raw) {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, ROOM_CODE_MAX_LEN);
  return cleaned.length > 0 ? cleaned : null;
}

function sanitizePlayerName(raw, fallback) {
  if (typeof raw !== 'string' || raw.trim().length === 0) return fallback;
  return raw.trim().slice(0, PLAYER_NAME_MAX_LEN);
}

function sanitizeDeviceUUID(raw) {
  if (typeof raw !== 'string' || raw.trim().length === 0) return null;
  return raw.trim().slice(0, DEVICE_UUID_MAX_LEN);
}

function canCreateRoom(socketId) {
  const now = Date.now();
  const log = (roomCreateLog.get(socketId) || []).filter((ts) => now - ts < ROOM_CREATE_WINDOW_MS);
  log.push(now);
  roomCreateLog.set(socketId, log);
  return log.length <= ROOM_CREATE_LIMIT;
}

function makeRoom(originLat, originLng) {
  return {
    originLat,
    originLng,
    players: {},
    timingMode: 'outdoor',
    modeChosen: false,
    leaderId: null,
    takenCharacters: {
      SLOT_01: false,
      SLOT_02: false,
      SLOT_03: false,
      SLOT_04: false,
      SLOT_05: false,
      SLOT_06: false,
    },
    disconnectTimers: {},
    countdownTimer: null,
    matchStarted: false,
    matchActive: false,
    matchEnded: false,
    stage: 0,
    stageVeggie: null,
    stageStartTime: null,
    stageResolved: false,
    nextStageAt: null,
    glitchCycleStart: Date.now(),
    glitchActive: false,
    // NEW: handle for the post-match cleanup timer (see
    // ROOM_POST_MATCH_CLEANUP_MS). Cleared/replaced by request-rematch.
    postMatchCleanupTimer: null,
  };
}

function leaveCurrentRoom(socket, roomCode) {
  if (!roomCode || !rooms[roomCode]) return;
  const room = rooms[roomCode];
  const player = room.players[socket.id];
  if (player) {
    room.takenCharacters[player.character] = false;
    delete room.players[socket.id];
    if (room.disconnectTimers[player.deviceUUID]) {
      clearTimeout(room.disconnectTimers[player.deviceUUID]);
      delete room.disconnectTimers[player.deviceUUID];
    }
    if (room.countdownTimer) cancelCountdown(roomCode, 'player-left');
  }

  if (room.leaderId === socket.id) {
    const remaining = Object.keys(room.players);
    room.leaderId = remaining.length > 0 ? remaining[0] : null;
    if (room.leaderId) {
      io.to(room.leaderId).emit('promoted-to-leader', { timingMode: room.timingMode });
    }
  }

  socket.leave(roomCode);
  if (Object.keys(room.players).length === 0) {
    if (room.countdownTimer) clearInterval(room.countdownTimer);
    if (room.postMatchCleanupTimer) clearTimeout(room.postMatchCleanupTimer);
    Object.values(room.disconnectTimers).forEach((t) => clearTimeout(t));
    delete rooms[roomCode];
  }
}

// Removes a player for good once their reconnect grace window has expired.
function finalizePlayerRemoval(roomCode, playerKey) {
  const room = rooms[roomCode];
  if (!room) return;
  const player = room.players[playerKey];
  if (!player) return;

  room.takenCharacters[player.character] = false;
  delete room.players[playerKey];
  if (player.deviceUUID) delete room.disconnectTimers[player.deviceUUID];

  if (room.leaderId === playerKey) {
    const remaining = Object.keys(room.players);
    room.leaderId = remaining.length > 0 ? remaining[0] : null;
    if (room.leaderId) {
      io.to(room.leaderId).emit('promoted-to-leader', { timingMode: room.timingMode });
    }
  }

  if (Object.keys(room.players).length === 0) {
    if (room.postMatchCleanupTimer) clearTimeout(room.postMatchCleanupTimer);
    delete rooms[roomCode];
  } else {
    io.to(roomCode).emit('player-left', { playerId: playerKey, name: player.name });
  }
}

// Disconnect router: mid-match drops from a device we can identify get a
// grace window (see RECONNECT_GRACE_MS); everything else uses the original
// immediate-removal path.
function handleDisconnect(socket, roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  const player = room.players[socket.id];
  if (!player) return;

  if (room.matchActive && player.deviceUUID) {
    player.disconnected = true;
    socket.leave(roomCode);
    io.to(roomCode).emit('player-disconnected', {
      playerId: socket.id,
      name: player.name,
      graceMs: RECONNECT_GRACE_MS,
    });

    room.disconnectTimers[player.deviceUUID] = setTimeout(() => {
      finalizePlayerRemoval(roomCode, socket.id);
    }, RECONNECT_GRACE_MS);
    return;
  }

  leaveCurrentRoom(socket, roomCode);
}

function maybeAutoStart(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  const activePlayers = Object.keys(room.players).length;
  if (!room.matchStarted && room.modeChosen && activePlayers >= MIN_PLAYERS_TO_START) {
    startCountdown(roomCode);
  }
}

function startCountdown(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.countdownTimer || room.matchStarted) return;

  room.matchStarted = true;
  let tick = 3;
  io.to(roomCode).emit('tick', { tick });

  room.countdownTimer = setInterval(() => {
    tick -= 1;
    if (tick > 0) {
      io.to(roomCode).emit('tick', { tick });
      return;
    }

    clearInterval(room.countdownTimer);
    room.countdownTimer = null;

    io.to(roomCode).emit('go');
    beginMatch(roomCode);
  }, COUNTDOWN_TICK_MS);
}

function cancelCountdown(roomCode, reason) {
  const room = rooms[roomCode];
  if (!room || !room.countdownTimer) return;
  clearInterval(room.countdownTimer);
  room.countdownTimer = null;
  room.matchStarted = false;
  io.to(roomCode).emit('match-countdown-cancelled', { reason: reason || 'player-left' });
}

// Now async: spends one ticket per player (deviceUUID-based) before the
// first round spawns. Best-effort — a Mongo hiccup or a legacy client with
// no deviceUUID never blocks the match from starting. Also runs on a
// rematch's restarted countdown, exactly like a fresh match start.
async function beginMatch(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  room.matchActive = true;

  if (mongoReady) {
    await Promise.all(
      Object.values(room.players)
        .filter((p) => p.deviceUUID)
        .map((p) =>
          spendTicket(p.deviceUUID).catch((err) => {
            console.error('[beginMatch] ticket spend failed for', p.deviceUUID, err.message);
          })
        )
    );
  }

  if (!rooms[roomCode]) return; // room could've emptied out during the await
  startStage(roomCode, room, 1);
}

function startStage(roomCode, room, roundNumber) {
  room.stage = roundNumber;
  const pointValue = ROUND_POINT_VALUES[roundNumber - 1];
  const veg = spawnStageVeggie(room.originLat, room.originLng, roundNumber, pointValue);
  room.stageVeggie = veg;
  room.stageStartTime = Date.now();
  room.stageResolved = false;
  room.nextStageAt = null;

  io.to(roomCode).emit('round-start', { round: roundNumber, pointValue, veggie: veg });
}

function endStage(roomCode, room, winnerPlayer, extra = {}) {
  if (room.stageResolved) return;
  room.stageResolved = true;
  room.nextStageAt = Date.now() + INTER_ROUND_PAUSE_MS;

  const pointValue = ROUND_POINT_VALUES[room.stage - 1];

  if (winnerPlayer) {
    winnerPlayer.score += pointValue;
    io.to(roomCode).emit('round-win', {
      round: room.stage,
      winnerId: winnerPlayer.id,
      winnerName: winnerPlayer.name,
      pointValue,
      veggieType: room.stageVeggie ? room.stageVeggie.type : null,
      quality: extra.quality || 'good',
      totalScore: winnerPlayer.score,
    });
  } else {
    io.to(roomCode).emit('round-timeout', { round: room.stage });
  }

  room.stageVeggie = null;
}

// FIX: previously this function ended with `delete rooms[roomCode]`
// unconditionally, the instant the 3rd round resolved — which is exactly
// why 'request-rematch' could never work; the room was already gone by
// the time anyone saw the victory screen and tapped the button. Now the
// room is kept alive (marked matchEnded) and cleanup is deferred via a
// timer that 'request-rematch' can cancel.
function advanceMatch(roomCode, room) {
  if (room.stage < TOTAL_ROUNDS) {
    startStage(roomCode, room, room.stage + 1);
    return;
  }

  room.matchEnded = true;
  room.matchActive = false;

  Object.values(room.players).forEach((p) => {
    upsertLeaderboardEntry(p);
  });

  const ranked = Object.values(room.players)
    .map((p) => ({
      name: p.name,
      score: p.score,
      slot_id: p.character,
      color: CHARACTER_COLORS[p.character] || '#00d2d3',
    }))
    .sort((a, b) => b.score - a.score);

  io.to(roomCode).emit('round-end', ranked);
  Object.values(room.disconnectTimers).forEach((t) => clearTimeout(t));
  room.disconnectTimers = {};

  if (room.postMatchCleanupTimer) clearTimeout(room.postMatchCleanupTimer);
  room.postMatchCleanupTimer = setTimeout(() => {
    // Guard against a stale timer firing after the room object was
    // already replaced/deleted by some other path.
    if (rooms[roomCode] === room) {
      delete rooms[roomCode];
    }
  }, ROOM_POST_MATCH_CLEANUP_MS);
}

function getPlayerMode(p, now) {
  if (!p) return 'indoor';
  const age = now - (p.lastLocationAt || 0);
  if (age > LOCATION_MAX_AGE_FOR_CAPTURE_MS) return 'indoor';
  if (isFiniteNumber(p.accuracy) && p.accuracy <= GPS_MODE_ACCURACY_THRESHOLD_M) return 'gps';
  return 'indoor';
}

function makeResolutionId() {
  return crypto.randomUUID ? crypto.randomUUID() : `res-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emitCaptureResult(socket, { vegId, success, label, ...extra }) {
  socket.emit('capture-result', { id: makeResolutionId(), vegId, success, label, ...extra });
}

async function upsertLeaderboardEntry(p) {
  if (!mongoReady) return;
  try {
    const query = p.deviceUUID
      ? { deviceUUID: p.deviceUUID }
      : { username: p.name, deviceUUID: { $exists: false } };

    const existing = await Leaderboard.findOne(query);

    if (!existing) {
      await new Leaderboard({
        username: p.name,
        deviceUUID: p.deviceUUID || undefined,
        characterUsed: p.character,
        highestMatchScore: p.score,
        lifetimeMatchesPlayed: 1,
        lastUpdated: new Date(),
      }).save();
      return;
    }

    existing.username = p.name;
    existing.characterUsed = p.character;
    existing.lifetimeMatchesPlayed += 1;
    existing.lastUpdated = new Date();
    if (p.score > existing.highestMatchScore) {
      existing.highestMatchScore = p.score;
    }
    await existing.save();
  } catch (err) {
    console.error('[Mongo] leaderboard upsert failed', err);
  }
}

setInterval(() => {
  const now = Date.now();

  Object.keys(rooms).forEach((roomCode) => {
    const room = rooms[roomCode];

    const glitchElapsed = (now - room.glitchCycleStart) % GLITCH_CYCLE_MS;
    const previousGlitchState = room.glitchActive;
    room.glitchActive = glitchElapsed < GLITCH_DURATION_MS;
    if (room.glitchActive !== previousGlitchState) {
      io.to(roomCode).emit('glitch-pulse', { active: room.glitchActive, duration: GLITCH_DURATION_MS });
    }

    // NOTE: previously `if (room.matchEnded) return;` here also skipped
    // the players-update/veggies-update ticks below for a matchEnded
    // room. That's still fine/intended — a matchEnded room has no active
    // stage and doesn't need position ticks; it just now stays in
    // `rooms` for the cleanup window instead of vanishing immediately.
    if (room.matchEnded) return;

    if (room.matchActive && !room.stageResolved && room.stageStartTime) {
      if (now - room.stageStartTime >= getStageDurationMs(room)) {
        endStage(roomCode, room, null);
      }
    }

    if (room.stageResolved && room.nextStageAt && now >= room.nextStageAt) {
      advanceMatch(roomCode, room);
      return;
    }

    if (!rooms[roomCode]) return;

    const activePlayers = Object.values(room.players).filter((p) => now - p.lastLocationAt < LOCATION_STALE_MS);

    if (room.stageVeggie && !room.stageResolved) {
      const veg = room.stageVeggie;
      let nearestPlayer = null;
      let nearestDist = Infinity;

      activePlayers.forEach((p) => {
        if (getPlayerMode(p, now) !== 'gps') return;
        const d = distanceMeters(p.lat, p.lng, veg.lat, veg.lng);
        if (d < nearestDist) { nearestDist = d; nearestPlayer = p; }
      });

      if (nearestPlayer && nearestDist < VEG_PANIC_RADIUS_M) {
        const speedMod = room.glitchActive ? VEG_FLEE_SPEED_MPS * 2.5 : VEG_FLEE_SPEED_MPS;
        const brg = bearingDegrees(nearestPlayer.lat, nearestPlayer.lng, veg.lat, veg.lng);
        const next = destinationPoint(veg.lat, veg.lng, brg, speedMod);
        veg.lat = next.lat; veg.lng = next.lng; veg.latitude = next.lat; veg.longitude = next.lng;
      }
    }

    io.to(roomCode).emit('veggies-update', room.stageVeggie && !room.stageResolved ? [room.stageVeggie] : []);

    io.to(roomCode).emit('players-update', Object.values(room.players).map((p) => ({
      id: p.id,
      name: p.name,
      slot_id: p.character,
      slotId: p.character,
      latitude: p.lat,
      longitude: p.lng,
      mode: getPlayerMode(p, now),
      score: p.score,
      disconnected: !!p.disconnected,
    })));
  });
}, TICK_MS);

io.on('connection', (socket) => {
  let currentRoom = null;

  // join-room — now async (wallet check), handles reconnect-into-active-
  // match, and auto-assigns a slot for genuinely new joiners.
  socket.on('join-room', async (data) => {
    const roomCode = sanitizeRoomCode(data && data.room);
    if (!roomCode) return socket.emit('room-error', { message: 'Invalid Room Code Input' });

    const deviceUUID = sanitizeDeviceUUID(data && data.deviceUUID);

    if (currentRoom && currentRoom !== roomCode) {
      handleDisconnect(socket, currentRoom);
      currentRoom = null;
    }

    // ---- RECONNECT PATH ----
    // A deviceUUID that already has a `disconnected: true` player sitting
    // in this room gets restored under the new socket.id instead of being
    // treated as a fresh joiner.
    if (deviceUUID && rooms[roomCode]) {
      const room = rooms[roomCode];
      const reconnectEntry = Object.entries(room.players).find(
        ([, p]) => p.deviceUUID === deviceUUID && p.disconnected
      );
      if (reconnectEntry) {
        const [oldSocketId, playerObj] = reconnectEntry;
        delete room.players[oldSocketId];
        playerObj.id = socket.id;
        playerObj.disconnected = false;
        playerObj.lastLocationAt = Date.now();
        room.players[socket.id] = playerObj;

        if (room.disconnectTimers[deviceUUID]) {
          clearTimeout(room.disconnectTimers[deviceUUID]);
          delete room.disconnectTimers[deviceUUID];
        }

        currentRoom = roomCode;
        socket.join(roomCode);
        socket.emit('room-joined', {
          room: roomCode,
          slotId: playerObj.character,
          geofence: { lat: room.originLat, lng: room.originLng, radiusMeters: ROOM_RADIUS_METERS },
          isLeader: room.leaderId === socket.id,
          timingMode: room.timingMode,
          reconnected: true,
          score: playerObj.score,
          round: room.stage,
        });
        io.to(roomCode).emit('player-reconnected', { playerId: socket.id, name: playerObj.name });
        return;
      }
    }

    // ---- NORMAL JOIN PATH ----
    if (!rooms[roomCode]) {
      if (!canCreateRoom(socket.id)) {
        return socket.emit('room-error', { message: 'Too many rooms created too quickly.' });
      }
      const lat = isFiniteNumber(data && data.lat) ? data.lat : 0;
      const lng = isFiniteNumber(data && data.lng) ? data.lng : 0;
      rooms[roomCode] = makeRoom(lat, lng);
      rooms[roomCode].leaderId = socket.id;
    }

    const room = rooms[roomCode];

    if (room.matchActive) {
      return socket.emit('room-error', { message: 'Match already in progress — only players from this match can rejoin.' });
    }

    // NOTE: a matchEnded room (post-match, awaiting a possible rematch)
    // is intentionally NOT rejected here the way an active match is —
    // if room.matchEnded is true but a genuinely new player tries to
    // join, they fall through to the normal slot-assignment path below,
    // which is fine: they'll just be a fresh participant if/when
    // 'request-rematch' fires. (A player from the FINISHED match
    // rejoining just to spectate isn't specially handled — out of scope
    // for this fix.)

    if (Object.keys(room.players).length >= MAX_PLAYERS_PER_ROOM) {
      return socket.emit('room-error', { message: 'This room session circle is full! (max 6 players)' });
    }

    const openSlot = Object.keys(room.takenCharacters).find((s) => !room.takenCharacters[s]);
    if (!openSlot) {
      return socket.emit('room-error', { message: 'This room session circle is full! (max 6 players)' });
    }

    // 🎟️ Ticket gate — needs at least one ticket on hand to enter the
    // lobby. The ticket is SPENT at match start (beginMatch), not here.
    if (deviceUUID && mongoReady) {
      try {
        const wallet = await getOrCreateWallet(deviceUUID);
        if (totalTickets(wallet) <= 0) {
          return socket.emit('room-error', {
            code: 'INSUFFICIENT_TICKETS',
            message: 'You need at least one ticket to join a match. Visit the store to grab more.',
          });
        }
      } catch (err) {
        console.error('[join-room] wallet check failed', err.message);
        // Fail open — a transient DB issue shouldn't block play.
      }
    }

    room.takenCharacters[openSlot] = true;
    room.players[socket.id] = {
      id: socket.id,
      name: sanitizePlayerName(data && data.name, 'EXPLORER'),
      deviceUUID,
      character: openSlot,
      slotId: openSlot,
      score: 0,
      lat: room.originLat,
      lng: room.originLng,
      accuracy: null,
      heading: null,
      lastLocationAt: Date.now(),
      disconnected: false,
    };

    currentRoom = roomCode;
    socket.join(roomCode);
    socket.emit('room-joined', {
      room: roomCode,
      slotId: openSlot,
      geofence: {
        lat: room.originLat,
        lng: room.originLng,
        radiusMeters: ROOM_RADIUS_METERS,
      },
      isLeader: room.leaderId === socket.id,
      timingMode: room.timingMode,
    });

    maybeAutoStart(roomCode);
  });

  socket.on('set-timing-mode', (data) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];

    if (room.leaderId !== socket.id) {
      return socket.emit('room-error', { message: 'Only the room leader can set the match mode.' });
    }
    if (room.matchStarted) {
      return socket.emit('room-error', { message: 'Mode is locked — match already starting.' });
    }

    const mode = data && data.mode === 'indoor' ? 'indoor' : 'outdoor';
    room.timingMode = mode;
    room.modeChosen = true;
    io.to(currentRoom).emit('timing-mode-updated', { mode });

    maybeAutoStart(currentRoom);
  });

  // NEW: 'request-rematch' — was previously unhandled entirely (see file
  // header). Any player still connected to a matchEnded room can trigger
  // it. Resets scores + round state in place (same room code, same
  // slots/characters/names) and restarts the normal countdown flow, which
  // drives every client's UI back into the arena via the existing
  // 'tick'/'go' events — no new client-side listener required.
  socket.on('request-rematch', () => {
    if (!currentRoom || !rooms[currentRoom]) {
      return socket.emit('room-error', { message: 'This room no longer exists — start a new match instead.' });
    }
    const room = rooms[currentRoom];

    if (!room.matchEnded) {
      // Ignore stray/duplicate requests if the match somehow isn't
      // actually over (e.g. a delayed double-tap) — nothing to do.
      return;
    }

    if (room.postMatchCleanupTimer) {
      clearTimeout(room.postMatchCleanupTimer);
      room.postMatchCleanupTimer = null;
    }

    // Reset per-player match state. Slots, characters, names, and
    // deviceUUIDs are left untouched so everyone keeps their identity/color.
    Object.values(room.players).forEach((p) => {
      p.score = 0;
      p.disconnected = false;
    });

    room.stage = 0;
    room.stageVeggie = null;
    room.stageStartTime = null;
    room.stageResolved = false;
    room.nextStageAt = null;
    room.matchStarted = false;
    room.matchActive = false;
    room.matchEnded = false;

    io.to(currentRoom).emit('rematch-starting', { requestedBy: socket.id });

    const activePlayers = Object.keys(room.players).length;
    if (activePlayers >= MIN_PLAYERS_TO_START) {
      startCountdown(currentRoom);
    }
    // If only 1 player remains, the countdown simply won't start yet —
    // maybeAutoStart-style behavior: it'll kick off automatically once a
    // second player is present, same as the very first match did.
  });

  socket.on('update-location', (data) => {
    if (!currentRoom || !rooms[currentRoom] || !data) return;
    if (!isFiniteNumber(data.lat) || !isFiniteNumber(data.lng)) return;

    const room = rooms[currentRoom];
    const p = room.players[socket.id];
    if (!p) return;

    const elapsedSec = (Date.now() - p.lastLocationAt) / 1000;
    if (elapsedSec > 0 && distanceMeters(p.lat, p.lng, data.lat, data.lng) / elapsedSec > MAX_PLAUSIBLE_SPEED_MPS) return;

    p.lat = data.lat;
    p.lng = data.lng;
    p.accuracy = isFiniteNumber(data.accuracy) ? data.accuracy : p.accuracy;
    p.heading = isFiniteNumber(data.heading) ? ((data.heading % 360) + 360) % 360 : p.heading;
    p.lastLocationAt = Date.now();
  });

  socket.on('capture-attempt', (data) => {
    const vegId = data && data.vegId;
    const quality = data && data.quality === 'perfect' ? 'perfect' : 'good';

    if (!currentRoom || !rooms[currentRoom]) {
      return emitCaptureResult(socket, { vegId, success: false, label: 'NO ROOM' });
    }
    const room = rooms[currentRoom];
    const p = room.players[socket.id];
    if (!p) {
      return emitCaptureResult(socket, { vegId, success: false, label: 'NOT JOINED' });
    }
    if (!room.matchActive || room.matchEnded) {
      return emitCaptureResult(socket, { vegId, success: false, label: 'MATCH OVER' });
    }
    if (room.stageResolved || !room.stageVeggie) {
      return emitCaptureResult(socket, { vegId, success: false, label: 'ROUND OVER' });
    }
    if (room.stageVeggie.id !== vegId) {
      return emitCaptureResult(socket, { vegId, success: false, label: 'GONE' });
    }

    const veg = room.stageVeggie;
    const now = Date.now();
    const mode = getPlayerMode(p, now);

    if (mode === 'gps') {
      const dist = distanceMeters(p.lat, p.lng, veg.lat, veg.lng);
      if (dist > CATCH_RADIUS_METERS) {
        return emitCaptureResult(socket, { vegId, success: false, label: 'TOO FAR', distance: Math.round(dist) });
      }
    } else {
      if (!isFiniteNumber(p.heading)) {
        return emitCaptureResult(socket, { vegId, success: false, label: 'NO COMPASS' });
      }
      const diff = angleDiffDeg(p.heading, veg.bearing);
      if (diff > HEADING_TOLERANCE_DEG) {
        return emitCaptureResult(socket, { vegId, success: false, label: 'NOT AIMED' });
      }
    }

    const pointValue = ROUND_POINT_VALUES[room.stage - 1];
    endStage(currentRoom, room, p, { quality });

    emitCaptureResult(socket, {
      vegId,
      success: true,
      label: quality === 'perfect' ? 'PERFECT' : 'CAUGHT',
      points: pointValue,
      newScore: p.score,
    });

    io.to(currentRoom).emit('veggieCaught', {
      vegId,
      playerId: socket.id,
      newScore: p.score,
      points: pointValue,
      species: veg.type,
      quality,
    });
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      handleDisconnect(socket, currentRoom);
      roomCreateLog.delete(socket.id);
      currentRoom = null;
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 [Manifix Server Core Node] Online — 3-round winner-take-round mode (100/300/600), hybrid indoor/outdoor timing, mode-gated auto-start, auto-slot join, mobile CORS + REST CORS fix, personal-best leaderboard, reconnect grace window, ticket-gated billing, working rematch flow, listening on port: ${PORT}`);
});
