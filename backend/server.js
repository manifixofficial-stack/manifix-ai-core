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
// THIS REVISION: Throw-quality now actually affects capture success
// ==========================================================================
//   - PROBLEM: the client (CaptureThrow.jsx) sends the full throw-quality
//     object — { tier: 'PERFECT'|'GOOD'|'GLANCING', direct, ringScaleAtRelease,
//     curveball, vacuumPower } — but this handler was doing
//     `data.quality === 'perfect'`, comparing an object to a string. That's
//     always false, so every throw silently resolved as 'good' regardless
//     of actual tier. A GLANCING throw and a PERFECT throw succeeded at
//     identical rates once GPS/heading passed.
//   - FIX: parseThrowQuality() reads the real tier + direct flag off the
//     object (with safe string/bare fallback so this never crashes on an
//     unexpected shape). Indirect (near-miss) throws are rejected outright,
//     regardless of tier. Direct throws then get a tier-based success roll:
//     PERFECT is guaranteed, GOOD succeeds 85% of the time, GLANCING 55%.
//     A failed roll is a 'BREAKOUT' — the veggie stays live and the round
//     stays open for other players, it does NOT end the round the way a
//     genuine capture does.
//   - round-win's `quality` field now reports the real tier instead of a
//     hardcoded 'good'.
//
// ==========================================================================
// PRIOR REVISION: Catch radius / GPS-accuracy gate alignment
// ==========================================================================
//   - PROBLEM: CATCH_RADIUS_METERS (15) was tighter than
//     GPS_MODE_ACCURACY_THRESHOLD_M (25) — a phone the server itself
//     classified as "accurate enough for GPS mode" (accuracy up to 25m)
//     could easily have real-world error greater than the 15m catch
//     radius. Result: a player standing directly on top of the veggie
//     could get a legitimate GPS fix 20m off and be told 'TOO FAR' with
//     no way to know or fix it — not a skill failure, a tuning bug.
//   - FIX: both numbers are now equal (20m). CATCH_RADIUS_METERS raised
//     15 -> 20, GPS_MODE_ACCURACY_THRESHOLD_M lowered 25 -> 20. A phone
//     good enough to be treated as GPS-capable is now, by construction,
//     good enough to satisfy the catch radius. This also now matches the
//     client's CATCH_TRIGGER_DISTANCE_METERS (see gameConfig.js), which
//     was the other half of this mismatch — the client's "in range"
//     reticle previously disagreed with what the server would actually
//     accept.
//   - No other gameplay logic changed in this revision.
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
//   - `GET /health` for uptime monitors.
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
//   { mode }.

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

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'HEALTHY_CCU_ONLINE', mongoReady, razorpayReady, activeRooms: Object.keys(rooms).length });
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

// Real gameplay "are you close enough to catch it" distance. Kept equal to
// GPS_MODE_ACCURACY_THRESHOLD_M below and to the client's
// CATCH_TRIGGER_DISTANCE_METERS (gameConfig.js) — all three used to
// disagree (15 / 25 / 25), which meant a phone the server itself judged
// "accurate enough for GPS mode" could still fail a catch it should have
// passed. Raised 15 -> 20 so the catch radius has headroom over realistic
// outdoor GPS error instead of being tighter than the accuracy gate that
// feeds it.
const CATCH_RADIUS_METERS = 20;
const LOCATION_STALE_MS = 15000;

// A player's location update is treated as GPS-mode-capable only if their
// reported accuracy is at or under this. Lowered 25 -> 20 to match
// CATCH_RADIUS_METERS above — see revision note at the top of this file.
const GPS_MODE_ACCURACY_THRESHOLD_M = 20;
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

// --- Throw-quality success tuning (this revision) ---
// PERFECT-tier throws are guaranteed once GPS/heading already passed;
// GOOD and GLANCING can still whiff. Keys are the tier strings sent by
// CaptureThrow.jsx (PERFECT / GOOD / GLANCING).
const CAPTURE_SUCCESS_CHANCE_BY_TIER = {
  PERFECT: 1,
  GOOD: 0.85,
  GLANCING: 0.55,
};
const VALID_THROW_TIERS = Object.keys(CAPTURE_SUCCESS_CHANCE_BY_TIER);

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

// --- Throw-quality parsing (this revision) ---
// CaptureThrow.jsx sends the full throw object as `quality`:
// { tier: 'PERFECT'|'GOOD'|'GLANCING', direct, ringScaleAtRelease,
//   curveball, vacuumPower }. This used to be compared directly against
// the string 'perfect', which is always false for an object — every
// throw silently resolved as 'good'. This parses the real shape, with
// safe fallbacks for a bare string or a missing/malformed payload so a
// weird client never crashes the handler.
function parseThrowQuality(rawQuality) {
  if (rawQuality && typeof rawQuality === 'object') {
    const tier = typeof rawQuality.tier === 'string' ? rawQuality.tier.toUpperCase() : null;
    return {
      tier: VALID_THROW_TIERS.includes(tier) ? tier : 'GOOD',
      direct: rawQuality.direct === true,
    };
  }
  if (typeof rawQuality === 'string') {
    const tier = rawQuality.toUpperCase();
    return { tier: VALID_THROW_TIERS.includes(tier) ? tier : 'GOOD', direct: true };
  }
  return { tier: 'GOOD', direct: true };
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
// no deviceUUID never blocks the match from starting.
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
  delete rooms[roomCode];
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

    if (room.matchActive || room.matchEnded) {
      return socket.emit('room-error', { message: 'Match already in progress — only players from this match can rejoin.' });
    }

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
    const { tier, direct } = parseThrowQuality(data && data.quality);

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

    // Indirect (near-miss) throws never land, regardless of tier — a
    // fast-timed indirect throw is still a miss, it just didn't hit the
    // target. This is a MISS, not a round-ending failure: the veggie
    // stays live and other players can keep trying.
    if (!direct) {
      return emitCaptureResult(socket, { vegId, success: false, label: 'NEAR MISS', tier });
    }

    // Tier-based success roll — this is the actual fix. PERFECT is
    // guaranteed once range/aim already passed; GOOD and GLANCING can
    // still whiff. A failed roll is a breakout: the round stays open.
    const successChance = CAPTURE_SUCCESS_CHANCE_BY_TIER[tier];
    if (Math.random() >= successChance) {
      return emitCaptureResult(socket, { vegId, success: false, label: 'BREAKOUT', tier });
    }

    const pointValue = ROUND_POINT_VALUES[room.stage - 1];
    endStage(currentRoom, room, p, { quality: tier.toLowerCase() });

    emitCaptureResult(socket, {
      vegId,
      success: true,
      label: tier === 'PERFECT' ? 'PERFECT' : 'CAUGHT',
      points: pointValue,
      newScore: p.score,
    });

    io.to(currentRoom).emit('veggieCaught', {
      vegId,
      playerId: socket.id,
      newScore: p.score,
      points: pointValue,
      species: veg.type,
      quality: tier.toLowerCase(),
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
  console.log(`🚀 [Manifix Server Core Node] Online — 3-round winner-take-round mode (100/300/600), hybrid indoor/outdoor timing, mode-gated auto-start, auto-slot join, mobile CORS + REST CORS fix, personal-best leaderboard, reconnect grace window, ticket-gated billing, tier-based capture success, listening on port: ${PORT}`);
});
