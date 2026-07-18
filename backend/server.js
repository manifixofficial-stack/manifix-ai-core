// server.js
//
// Real-Time Express & Socket.io Hybrid GPS/Indoor Game Server Core.
// MERGED VERSION — full game engine + routes/ + models/ wiring.
//
// ==========================================================================
// ⚠️ IMPORTANT — READ BEFORE DEPLOYING
// ==========================================================================
// This file was merged WITHOUT seeing the actual contents of:
//   - models/Player.js
//   - models/Feedback.js
//   - routes/auth.js
//   - routes/billing.js
//   - routes/feedback.js
//
// Assumptions made (marked inline with "// ASSUMPTION:"):
//   1. routes/auth.js, routes/billing.js, routes/feedback.js each do
//      `module.exports = router;` (a standard Express Router) and are
//      mountable directly with app.use('/api/...', require('./routes/x')).
//   2. models/Player.js and models/Feedback.js are NOT used by the
//      Socket.io game loop below — the game loop keeps players as plain
//      in-memory objects inside `rooms[roomCode].players` (this is how
//      the original game-engine file worked; Player.js is likely only
//      used by routes/auth.js for persistent accounts, which is untouched
//      here since I don't have that file).
//   3. routes/billing.js may ALREADY implement wallet balance +
//      Razorpay payment verification. To avoid duplicating/conflicting
//      logic, the REST payment endpoints from the old inline version
//      are LEFT OUT of this file — mount them from routes/billing.js
//      instead. The Socket.io ticket-SPEND logic (spendTicket, used when
//      a match actually starts) is KEPT here because it's tightly coupled
//      to the live match loop, not a REST call.
//
// You MUST verify routes/billing.js exposes what the game needs:
//   - GET  /api/billing/wallet/:deviceUUID   (or similar) for HUD balance
//   - POST /api/billing/verify-payment       (or similar) for Razorpay
// If it doesn't, tell me and I'll add the missing inline routes back.
//
// ==========================================================================
// GAME LOGIC BELOW IS UNCHANGED FROM YOUR WORKING GAME-ENGINE VERSION:
// ==========================================================================
//   - 2 to 6 players/room, exactly 3 rounds, winner-take-round scoring
//     (100/300/600 = 1000 total).
//   - Reconnect grace window (RECONNECT_GRACE_MS) keeps a mid-match
//     disconnect's slot + score alive so they can rejoin.
//   - Ticket gating on join (checked, not spent) + spend on match start.
//   - Room-wide indoor/outdoor timing mode set by the lobby leader.
//   - GPS + indoor (compass) dual capture modes, anti-cheat speed clamp.
// ==========================================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const crypto = require('crypto');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Razorpay = require('razorpay');
require('dotenv').config();

// ==========================================
// 📦 MODELS
// ==========================================
const Leaderboard = require('./models/Leaderboard');
const Wallet = require('./models/Wallet');
const Room = require('./models/Room'); // ASSUMPTION: not used by live game loop (in-memory rooms below); kept imported in case routes/auth or routes/billing reference persisted room records.
const Player = require('./models/Player'); // ASSUMPTION: used by routes/auth.js for persistent player accounts, not by the live match loop.
const Feedback = require('./models/Feedback'); // ASSUMPTION: used by routes/feedback.js.

// ==========================================
// 🧭 ROUTES
// ==========================================
const authRoutes = require('./routes/auth');
const billingRoutes = require('./routes/billing');
const feedbackRoutes = require('./routes/feedback');

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

// ==========================================
// 🧭 MOUNT ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/feedback', feedbackRoutes);

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
// 💳 RAZORPAY — used only for the in-match ticket spend check below.
// REST payment verification now lives in routes/billing.js.
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

// ==========================================
// 🏆 LEADERBOARD REST ROUTES (game-specific, kept inline —
// not duplicated in routes/ since they read live match data shape)
// ==========================================
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

// 🎟️ Wallet balance — kept here ONLY as a fallback in case routes/billing.js
// does not already expose an equivalent endpoint. If it does, delete this
// block and use that instead to avoid two sources of truth.
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
// ASSUMPTION: routes/billing.js applies its own rate limiting internally.
// billingLimiter above is kept in scope in case routes/billing.js imports
// and reuses it — otherwise it's unused and safe to remove.

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

// Spends one ticket per player (deviceUUID-based) before the first round
// spawns. Best-effort — a Mongo hiccup or a legacy client with no
// deviceUUID never blocks the match from starting.
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

  // join-room — async (wallet check), handles reconnect-into-active-match,
  // auto-assigns a slot for genuinely new joiners.
  socket.on('join-room', async (data) => {
    const roomCode = sanitizeRoomCode(data && data.room);
    if (!roomCode) return socket.emit('room-error', { message: 'Invalid Room Code Input' });

    const deviceUUID = sanitizeDeviceUUID(data && data.deviceUUID);

    if (currentRoom && currentRoom !== roomCode) {
      handleDisconnect(socket, currentRoom);
      currentRoom = null;
    }

    // ---- RECONNECT PATH ----
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
  console.log(`🚀 [Manifix Server Core Node] Online — routes mounted (auth/billing/feedback), 3-round winner-take-round mode (100/300/600), hybrid indoor/outdoor timing, mode-gated auto-start, auto-slot join, mobile CORS + REST CORS fix, personal-best leaderboard, reconnect grace window, ticket-gated billing, listening on port: ${PORT}`);
});
