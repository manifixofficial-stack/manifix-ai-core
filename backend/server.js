// server.js
//
// Real-Time Express & Socket.io Hybrid GPS/Indoor Game Server Core.
//
// ==========================================================================
// THIS REVISION: Added fleeing/fleeBearingDeg to stageVeggie for AR flee viz
// ==========================================================================
//   - Client-side AR (GameCanvasARScene.jsx / VeggieModel.jsx) had no way
//     to visually represent the flee mechanic below — veggies moved in
//     real lat/lng but the AR scene never reflected it, so fleeing was
//     invisible in AR even though it was fully real on the server.
//   - Added two fields to stageVeggie, set every tick alongside the
//     existing lat/lng update: `fleeing` (bool) and `fleeBearingDeg`
//     (the bearing it's currently running along, or null when not
//     fleeing). These ride along on the existing veggies-update emit —
//     no new socket event, no schema change to Wallet/Player/Leaderboard.
//   - This is purely additive/display data. veg.lat/veg.lng remain the
//     single source of truth for capture validity and panic-radius
//     logic — fleeing/fleeBearingDeg don't feed back into any gameplay
//     decision here, they only give the AR client a relative direction
//     to visualize, which it compresses into a small capped AR-space
//     offset client-side (real GPS-scale movement isn't trustworthy to
//     render 1:1 in AR — see GameCanvasARScene.jsx's revision note).
//
// ==========================================================================
// PRIOR REVISION: Fixed wallet duplicate-key crash (E11000 on player_id)
// ==========================================================================
//   - getOrCreateWallet(deviceUUID, playerId) only looked up wallets by
//     deviceUUID. If a wallet already existed for this player_id under a
//     DIFFERENT/stale deviceUUID (re-testing sign-in, switching devices,
//     deviceUUID regenerated), the deviceUUID lookup missed it and the
//     function tried to .save() a brand-new wallet with a player_id that
//     already exists — which the unique index on player_id (player_id_1)
//     rejected with:
//       E11000 duplicate key error collection: manifix.wallets index:
//       player_id_1 dup key: { player_id: "..." }
//   - Fix: when no wallet is found by deviceUUID and a playerId was
//     passed, also look up by player_id. If found, re-link it to the
//     current deviceUUID and reuse it (preserving the player's existing
//     balance) instead of creating a duplicate. Only create a new wallet
//     doc if neither lookup finds one.
//
// ==========================================================================
// PRIOR REVISION: Fixed wallet creation crash during Google Sign-In
// ==========================================================================
//   - /api/auth/google was calling getOrCreateWallet(deviceUUID) without a
//     player_id, but the Wallet schema requires player_id. This threw
//     "Wallet validation failed: player_id: Path `player_id` is required"
//     on every successful Google Sign-In, which the outer catch block then
//     mislabeled as "Invalid Google token" — the token verification itself
//     was never the problem. getOrCreateWallet now accepts an optional
//     playerId param and passes it through when creating a new wallet.
//     GET /api/wallet/:deviceUUID (the other caller) still works — it just
//     won't have a player_id on brand-new wallets created through that
//     route alone, which is fine unless the Wallet schema makes player_id
//     strictly required with no default; revisit if that route ever
//     errors the same way.
//
// ==========================================================================
// PRIOR REVISION: Ticket/wallet gate REMOVED from join-room and beginMatch
// ==========================================================================
//   - Launch decision: ship free (no billing wall) for initial Play Store
//     launch, add real monetization via Google Play Billing Library in a
//     later release once the core game is confirmed fun/stable. Direct
//     Razorpay-style in-app purchase of virtual tickets isn't Play Store
//     policy-compliant anyway — this removal also sidesteps that problem
//     for now rather than leaving a half-working gate in place.
//   - getOrCreateWallet/spendTicket/totalTickets and the Wallet model
//     itself are left in place, unused during join/match-start, in case
//     billing is added back later — GET /api/wallet/:deviceUUID also still
//     works if you want to keep showing a ticket count in the UI.
//
// ==========================================================================
// PRIOR REVISION: Diagnostic logging added to join-room, set-timing-mode,
// and maybeAutoStart
// ==========================================================================
//
// ==========================================================================
// PRIOR REVISION: Google Sign-In verification route added
// ==========================================================================
//   (see full history in previous revisions of this file)
//
// ==========================================================================
// MATCH STRUCTURE: WINNER-TAKE-ROUND (100/300/600, 3 rounds)
// ==========================================================================
//   - 2 to 6 players per room (MIN_PLAYERS_TO_START = 1, so solo works too).
//   - Exactly 3 rounds. Each round spawns exactly ONE veggie. First valid
//     capture wins the WHOLE round's point value — no partial credit.
//   - Round point values: 100 / 300 / 600 = 1000 total.
//   - Timeout with no capture = nobody scores that round, points lost.
//   - Glitch pulse is VISUAL ONLY — does not affect point values.

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const crypto = require('crypto');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const Leaderboard = require('./models/Leaderboard');
const Wallet = require('./models/Wallet');
const Player = require('./models/Player');

const app = express();
const server = http.createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'https://manifixai.com';

const ALLOWED_ORIGIN_PATTERNS = [
  new RegExp(`^${CLIENT_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
  new RegExp(`^https:\\/\\/www\\.${CLIENT_ORIGIN.replace(/^https:\/\//, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,
  /^http:\/\/localhost:(3000|5000)$/,
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
  console.log('⚠️ MONGODB_URI missing. High-scores, tickets, and accounts won\'t be saved.');
} else {
  mongoose.connect(mongoURI)
    .then(() => {
      mongoReady = true;
      console.log('📦 Connected to MongoDB Atlas Cloud!');
    })
    .catch((err) => console.error('❌ MongoDB Atlas connection failure error:', err));
}

// ==========================================
// 🔐 GOOGLE SIGN-IN VERIFICATION
// ==========================================
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || null;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

if (!GOOGLE_CLIENT_ID) {
  console.log('⚠️ GOOGLE_CLIENT_ID missing. /api/auth/google will reject all requests until it is set.');
}

// getOrCreateWallet/totalTickets/spendTicket are kept for later use (e.g.
// GET /api/wallet/:deviceUUID still works), but are no longer called from
// join-room or beginMatch — see revision note at top of file.
//
// FIX (this revision): also look up by player_id, not just deviceUUID.
// Wallet has a unique index on player_id. If a wallet already exists for
// this player under a different/stale deviceUUID (re-testing sign-in,
// switching devices), the deviceUUID-only lookup would miss it and the
// .save() below would throw E11000 duplicate key on player_id. Now: if
// deviceUUID lookup misses and we have a playerId, check by player_id
// too, and if found, re-link it to the current deviceUUID and reuse it
// (preserving the existing balance) instead of creating a duplicate.
async function getOrCreateWallet(deviceUUID, playerId = null) {
  let wallet = await Wallet.findOne({ deviceUUID });

  if (!wallet && playerId) {
    wallet = await Wallet.findOne({ player_id: playerId });
    if (wallet) {
      wallet.deviceUUID = deviceUUID;
      await wallet.save();
    }
  }

  if (!wallet) {
    wallet = await new Wallet({ deviceUUID, player_id: playerId }).save();
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

app.post('/api/auth/google', async (req, res) => {
  const { credentialToken, deviceUUID, deviceOS } = req.body || {};

  if (!credentialToken || !deviceUUID) {
    return res.status(400).json({ success: false, message: 'Missing credentialToken or deviceUUID' });
  }

  if (!googleClient) {
    return res.status(503).json({ success: false, message: 'GOOGLE SIGN-IN NOT CONFIGURED' });
  }

  if (!mongoReady) {
    return res.status(503).json({ success: false, message: 'ACCOUNTS UNAVAILABLE — DATABASE NOT CONNECTED' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credentialToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.sub) {
      return res.status(401).json({ success: false, message: 'Invalid Google token payload' });
    }

    let player = await Player.findOne({ googleId: payload.sub });
    if (!player) {
      player = await new Player({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        deviceUUID,
        deviceOS,
      }).save();
    } else {
      player.deviceUUID = deviceUUID;
      player.deviceOS = deviceOS;
      player.lastLoginAt = new Date();
      await player.save();
    }

    const wallet = (await getOrCreateWallet(deviceUUID, player._id)).balances;

    res.status(200).json({
      success: true,
      player: { id: player._id, name: player.name, email: player.email },
      wallet,
    });
  } catch (err) {
    console.error('[auth/google] verification failed', err.message);
    res.status(401).json({ success: false, message: 'Invalid Google token' });
  }
});

const PORT = process.env.PORT || 5000;
const TICK_MS = 1000;
const COUNTDOWN_TICK_MS = 1000;

const TOTAL_ROUNDS = 3;
const ROUND_POINT_VALUES = [100, 300, 600];

const STAGE_DURATION_INDOOR_MS = 45 * 1000;
const STAGE_DURATION_OUTDOOR_MS = 60 * 1000;

function getStageDurationMs(room) {
  return room.timingMode === 'indoor' ? STAGE_DURATION_INDOOR_MS : STAGE_DURATION_OUTDOOR_MS;
}

const INTER_ROUND_PAUSE_MS = 4 * 1000;

const GLITCH_CYCLE_MS = 45000;
const GLITCH_DURATION_MS = 6000;

const ROOM_RADIUS_METERS = 6;
const VEG_PANIC_RADIUS_M = 40;
const VEG_FLEE_SPEED_MPS = 1.4;
const CATCH_RADIUS_METERS = 20;
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

const MIN_PLAYERS_TO_START = 1;
const MAX_PLAYERS_PER_ROOM = 6;

const RECONNECT_GRACE_MS = 45 * 1000;
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
    // fleeing/fleeBearingDeg: relative-movement signal for the AR client
    // (see revision note near VEG_PANIC_RADIUS_M below). false/null until
    // a player gets close enough to trigger the flee behavior.
    fleeing: false,
    fleeBearingDeg: null,
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
  console.log(`[maybeAutoStart] room=${roomCode} activePlayers=${activePlayers} modeChosen=${room.modeChosen} matchStarted=${room.matchStarted}`);
  if (!room.matchStarted && room.modeChosen && activePlayers >= MIN_PLAYERS_TO_START) {
    console.log(`[maybeAutoStart] STARTING COUNTDOWN for room=${roomCode}`);
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

async function beginMatch(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  room.matchActive = true;

  // Ticket spend removed — see revision note at top of file (free launch,
  // no billing wall for now).

  if (!rooms[roomCode]) return;
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
  room.disconnectTimers = {};

  if (room.postMatchCleanupTimer) clearTimeout(room.postMatchCleanupTimer);
  room.postMatchCleanupTimer = setTimeout(() => {
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

        // fleeing/fleeBearingDeg: this is a RELATIVE movement signal for
        // the AR client (bearing the veggie is currently running along),
        // separate from the raw lat/lng above. The client compresses this
        // into a small capped AR-space offset (a few meters, not real GPS
        // distance) since phone AR tracking drifts too much to trust at
        // GPS scale — see GameCanvasARScene.jsx / VeggieModel.jsx. The
        // gameplay-authoritative panic/capture logic stays exactly as
        // before, driven by veg.lat/veg.lng; this is additive, display-only.
        veg.fleeing = true;
        veg.fleeBearingDeg = brg;
      } else {
        veg.fleeing = false;
        veg.fleeBearingDeg = null;
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

  socket.on('join-room', async (data) => {
    const roomCode = sanitizeRoomCode(data && data.room);
    if (!roomCode) return socket.emit('room-error', { message: 'Invalid Room Code Input' });

    const deviceUUID = sanitizeDeviceUUID(data && data.deviceUUID);

    if (currentRoom && currentRoom !== roomCode) {
      handleDisconnect(socket, currentRoom);
      currentRoom = null;
    }

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

    if (Object.keys(room.players).length >= MAX_PLAYERS_PER_ROOM) {
      return socket.emit('room-error', { message: 'This room session circle is full! (max 6 players)' });
    }

    const openSlot = Object.keys(room.takenCharacters).find((s) => !room.takenCharacters[s]);
    if (!openSlot) {
      return socket.emit('room-error', { message: 'This room session circle is full! (max 6 players)' });
    }

    // Ticket/wallet gate removed — see revision note at top of file
    // (free launch, no billing wall for now).

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
    console.log(`[join-room] socket=${socket.id} joined room=${roomCode} isLeader=${room.leaderId === socket.id} matchStarted=${room.matchStarted} matchActive=${room.matchActive} matchEnded=${room.matchEnded}`);
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
    console.log(`[set-timing-mode] received from socket=${socket.id} data=`, data);
    if (!currentRoom || !rooms[currentRoom]) {
      console.log(`[set-timing-mode] REJECTED — no currentRoom or room missing. currentRoom=${currentRoom}`);
      return;
    }
    const room = rooms[currentRoom];

    if (room.leaderId !== socket.id) {
      console.log(`[set-timing-mode] REJECTED — not leader. leaderId=${room.leaderId} socket.id=${socket.id}`);
      return socket.emit('room-error', { message: 'Only the room leader can set the match mode.' });
    }
    if (room.matchStarted) {
      console.log(`[set-timing-mode] REJECTED — matchStarted already true for room=${currentRoom}`);
      return socket.emit('room-error', { message: 'Mode is locked — match already starting.' });
    }

    const mode = data && data.mode === 'indoor' ? 'indoor' : 'outdoor';
    room.timingMode = mode;
    room.modeChosen = true;
    console.log(`[set-timing-mode] ACCEPTED — room=${currentRoom} mode=${mode}`);
    io.to(currentRoom).emit('timing-mode-updated', { mode });

    maybeAutoStart(currentRoom);
  });

  socket.on('request-rematch', () => {
    if (!currentRoom || !rooms[currentRoom]) {
      return socket.emit('room-error', { message: 'This room no longer exists — start a new match instead.' });
    }
    const room = rooms[currentRoom];

    if (!room.matchEnded) {
      return;
    }

    if (room.postMatchCleanupTimer) {
      clearTimeout(room.postMatchCleanupTimer);
      room.postMatchCleanupTimer = null;
    }

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
  console.log(`🚀 [Manifix Server Core Node] Online — 3-round winner-take-round mode (100/300/600), hybrid indoor/outdoor timing, mode-gated auto-start, auto-slot join, mobile CORS + REST CORS fix, personal-best leaderboard, reconnect grace window, FREE LAUNCH (no ticket gate), working rematch flow, verified Google Sign-In, wallet duplicate-key fix, AR flee-bearing broadcast, diagnostic logging enabled, listening on port: ${PORT}`);
});
