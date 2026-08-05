/**
 * server.js
 * Authoritative Backend Matchmaking & Real-Time Sync Cluster Server.
 *
 * THIS REVISION — reassembled from two pasted fragments and fixed two
 * bugs that would have prevented the server from starting at all:
 *
 *   1. CRASH FIXED (fatal): `const ROUND_POINT_VALUES=;` was a bare
 *      assignment with nothing on the right-hand side — a hard
 *      SyntaxError that would stop Node from even loading this file,
 *      meaning nothing in this server could have been running as-is.
 *      Replaced with a real array, `[100, 250, 500]`, sized to
 *      TOTAL_ROUNDS = 3 (startStage/endStage index it as
 *      ROUND_POINT_VALUES[roundNumber - 1]). FLAGGED, NOT CONFIRMED:
 *      these three numbers are a placeholder guess at reasonable
 *      escalating per-round point values — I have no source for what
 *      the real intended values were, since the original was empty.
 *      Confirm/replace before relying on real scoring.
 *
 *   2. CRASH FIXED (fatal): the closing `server.listen()` callback had
 *      `console.log(🚀 [Manifix Server Core Node] Online on cluster
 *      port: ${PORT});` — a template literal missing its backticks,
 *      which is a SyntaxError (the emoji/bracket text would be parsed
 *      as an illegal expression). Added the missing backticks.
 *
 * FLAGGED, NOT SILENTLY RECONCILED — two real design mismatches against
 * the client's src/config/gameConfig.js (shared earlier in this
 * conversation) that I did NOT change, because resolving them is a
 * game-design/balance decision, not a bug fix:
 *
 *   A. SPAWN MODEL MISMATCH: this server runs one veggie at a time
 *      across exactly 3 timed rounds (`stageVeggie`, TOTAL_ROUNDS = 3,
 *      ROUND_POINT_VALUES per round) within a tiny ROOM_RADIUS_METERS
 *      = 6 origin radius. The CLIENT's gameConfig.js instead describes
 *      a continuous multi-spawn system — MAX_CONCURRENT_VEGGIES = 6,
 *      SPAWN_RADIUS_METERS = 80, SPAWN_CHECK_INTERVAL_MS,
 *      VEGGIE_LIFETIME_MS, rarity-tier weighted spawning via
 *      RARITY_TIERS/pickRarityTier(). Those two designs are not the
 *      same game loop. Only one of them can be what actually ships —
 *      worth confirming which is authoritative before building more on
 *      either assumption.
 *
 *   B. RARITY ODDS MISMATCH: this server's rollVeggieType() hands out
 *      species at fixed odds (golden 3%, banana 7%, tomato 11%, grapes
 *      18%, strawberry 25%, broccoli 36%) that directly contradict the
 *      client's documented RARITY_TIERS design intent (COMMON
 *      tomato+grapes should be a combined 45%, UNCOMMON banana 30%,
 *      RARE strawberry+broccoli a combined 20%, ULTRA_RARE golden 5%).
 *      As currently written, this server spawns the two species the
 *      client explicitly designed as "rare" (broccoli + strawberry,
 *      61% combined here) MORE often than everything else combined —
 *      the opposite of the client's own documented intent. Left
 *      unchanged because I don't know which side is supposed to move —
 *      either this function should be rewritten to call the client's
 *      pickRarityTier()-equivalent odds, or the client's documented
 *      design intent is stale and this server's odds are the real
 *      target. Needs a decision, not a guess.
 *
 * ALSO NOTED: the tick-loop header comment below originally said
 * "30HZ", but TICK_MS is 1000 (1 update/sec), and VEG_FLEE_SPEED_MPS is
 * applied directly as a per-tick distance (meters moved per tick),
 * which is only physically correct at 1 tick/sec. I corrected the
 * label to match the actual rate rather than changing TICK_MS —
 * changing the interval to a real 30Hz without also dividing the flee
 * distance by 30 per tick would make veggies flee roughly 30x too fast.
 *
 * NOT INCLUDED: ./models/Leaderboard, ./models/Wallet, ./models/Player
 * are require()'d but weren't part of what was shared — assumed to
 * already exist elsewhere in the project, unchanged.
 *
 * Sitting at the profitable cross-section of Health-Tech, FinTech, and
 * Entertainment. Complete with multi-device reconnect states,
 * compass-heading validation, and anticheat guards.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const crypto = require('crypto');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

// Production Database Pipeline Models
const Leaderboard = require('./models/Leaderboard');
const Wallet = require('./models/Wallet');
const Player = require('./models/Player');

const app = express();
const server = http.createServer(app);

// ========================================== //
// ⚙️ AUTHORITATIVE GAME CONFIG CONSTANTS      //
// ========================================== //
const PORT = process.env.PORT || 5000;
const TICK_MS = 1000;
const COUNTDOWN_TICK_MS = 1000;
const TOTAL_ROUNDS = 3;

// FLAGGED PLACEHOLDER — see file header note #1. Original source had no
// values here at all (`= ;`), which is a hard SyntaxError. These three
// numbers are a guess, sized to TOTAL_ROUNDS = 3. Confirm real values.
const ROUND_POINT_VALUES = [100, 250, 500];

const STAGE_DURATION_INDOOR_MS = 45 * 1000;
const STAGE_DURATION_OUTDOOR_MS = 60 * 1000;

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
const EARTH_RADIUS_M = 6371000;

const CHARACTER_COLORS = {
  SLOT_01: '#3a86ff', SLOT_02: '#2ecc71', SLOT_03: '#ff006e',
  SLOT_04: '#8338ec', SLOT_05: '#e74c3c', SLOT_06: '#f1c40f',
};

// Global in-memory data states
let rooms = {};
const roomCreateLog = new Map();

// --- CORS & HTTP Pipeline Filters ---
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

app.use(cors({ origin: corsOptionsDelegate, methods: ['GET', 'POST'] }));
app.use(express.json());

const io = new Server(server, {
  cors: { origin: corsOptionsDelegate, methods: ['GET', 'POST'] },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// ========================================== //
// 💾 SPATIAL GEOMETRY MATHEMATICAL ENGINES   //
// ========================================== //
function toRad(deg) { return (deg * Math.PI) / 180; }
function toDeg(rad) { return (rad * 180) / Math.PI; }
function isFiniteNumber(n) { return typeof n === 'number' && Number.isFinite(n); }

function distanceMeters(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

function bearingDegrees(lat1, lng1, lat2, lng2) {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function destinationPoint(lat, lng, bearingDeg, distM) {
  const angDist = distM / EARTH_RADIUS_M;
  const bearingRad = toRad(bearingDeg);
  const lat1 = toRad(lat);
  const lng1 = toRad(lng);
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angDist) + Math.cos(lat1) * Math.sin(angDist) * Math.cos(bearingRad));
  const lng2 = lng1 + Math.atan2(Math.sin(bearingRad) * Math.sin(angDist) * Math.cos(lat1), Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2));
  return { lat: toDeg(lat2), lng: ((toDeg(lng2) + 540) % 360) - 180 };
}

function angleDiffDeg(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function getStageDurationMs(room) {
  return room.timingMode === 'indoor' ? STAGE_DURATION_INDOOR_MS : STAGE_DURATION_OUTDOOR_MS;
}

// FLAGGED — see file header note B. These odds do not match the
// client's RARITY_TIERS design intent (COMMON tomato+grapes ~45%,
// UNCOMMON banana 30%, RARE strawberry+broccoli ~20%, ULTRA_RARE golden
// 5%). Left unchanged pending a decision on which side is authoritative.
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
  const candidate = destinationPoint(centerLat, centerLng, Math.random() * 360, ROOM_RADIUS_METERS * 0.8 * Math.sqrt(Math.random()));
  const type = rollVeggieType();
  return {
    id: `veg-r${round}-${Math.random().toString(36).substring(2, 9)}`,
    lat: candidate.lat, lng: candidate.lng,
    latitude: candidate.lat, longitude: candidate.lng,
    bearing: Math.random() * 360,
    type, veggie_type: type, round, pointValue,
    fleeing: false, fleeBearingDeg: null,
  };
}

// --- Sanitization Layers ---
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

// ========================================== //
// 💾 MONGODB DATABASE SYSTEMS CONNECTIONS   //
// ========================================== //
const mongoURI = process.env.MONGODB_URI;
let mongoReady = false;

if (!mongoURI) {
  console.log('⚠️ MONGODB_URI missing. Persistent database links suspended.');
} else {
  mongoose.connect(mongoURI)
    .then(() => { mongoReady = true; console.log('📦 Connected to MongoDB Atlas Cloud!'); })
    .catch((err) => console.error('❌ MongoDB Atlas connection failure error:', err));
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || null;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

async function getOrCreateWallet(deviceUUID, playerId = null) {
  let wallet = await Wallet.findOne({ deviceUUID });
  if (!wallet && playerId) {
    wallet = await Wallet.findOne({ player_id: playerId });
    if (wallet) { wallet.deviceUUID = deviceUUID; await wallet.save(); }
  }
  if (!wallet) { wallet = await new Wallet({ deviceUUID, player_id: playerId }).save(); }
  return wallet;
}

async function upsertLeaderboardEntry(p) {
  if (!mongoReady) return;
  try {
    const query = p.deviceUUID ? { deviceUUID: p.deviceUUID } : { username: p.name, deviceUUID: { $exists: false } };
    const existing = await Leaderboard.findOne(query);
    if (!existing) {
      await new Leaderboard({
        username: p.name, deviceUUID: p.deviceUUID || undefined,
        characterUsed: p.character, highestMatchScore: p.score, lifetimeMatchesPlayed: 1, lastUpdated: new Date(),
      }).save();
      return;
    }
    existing.username = p.name;
    existing.characterUsed = p.character;
    existing.lifetimeMatchesPlayed += 1;
    existing.lastUpdated = new Date();
    if (p.score > existing.highestMatchScore) { existing.highestMatchScore = p.score; }
    await existing.save();
  } catch (err) {
    console.error('[Mongo] leaderboard upsert failed', err);
  }
}

// --- REST Endpoint Routing ---
app.get('/api/leaderboard', async (req, res) => {
  if (!mongoReady) return res.status(200).json([]);
  try {
    const topScores = await Leaderboard.find().sort({ highestMatchScore: -1 }).limit(10);
    res.status(200).json(topScores);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve high scores' });
  }
});

app.get('/api/wallet/:deviceUUID', async (req, res) => {
  if (!mongoReady) return res.status(200).json({ free_tickets: 3, premium_passes: 0 });
  try {
    const wallet = await getOrCreateWallet(req.params.deviceUUID);
    res.status(200).json(wallet.balances);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  const { credentialToken, deviceUUID, deviceOS } = req.body || {};
  if (!credentialToken || !deviceUUID) return res.status(400).json({ success: false, message: 'Missing parameters' });
  if (!googleClient || !mongoReady) return res.status(503).json({ success: false, message: 'Databases down.' });
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credentialToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
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
    res.status(401).json({ success: false, message: 'Invalid Google token' });
  }
});

// ========================================== //
// 🦾 CORE gameplay Match state machine Loop    //
// ========================================== //

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

function beginMatch(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  room.matchActive = true;
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
      slotId: p.character,
      color: CHARACTER_COLORS[p.character] || '#3a86ff',
    }))
    .sort((a, b) => b.score - a.score);
  io.to(roomCode).emit('round-end', ranked);
  Object.values(room.disconnectTimers).forEach((t) => clearTimeout(t));
  room.disconnectTimers = {};
  if (room.postMatchCleanupTimer) clearTimeout(room.postMatchCleanupTimer);
  room.postMatchCleanupTimer = setTimeout(() => {
    if (rooms[roomCode] === room) delete rooms[roomCode];
  }, ROOM_POST_MATCH_CLEANUP_MS);
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
      SLOT_01: false, SLOT_02: false, SLOT_03: false,
      SLOT_04: false, SLOT_05: false, SLOT_06: false,
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
    if (room.leaderId) io.to(room.leaderId).emit('promoted-to-leader', { timingMode: room.timingMode });
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
    if (room.leaderId) io.to(room.leaderId).emit('promoted-to-leader', { timingMode: room.timingMode });
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
    io.to(roomCode).emit('player-disconnected', { playerId: socket.id, name: player.name, graceMs: RECONNECT_GRACE_MS });
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

// ========================================== //
// 📡 REAL-TIME MULTIPLAYER SOCKET PLUMBING  //
// ========================================== //

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
      if (!canCreateRoom(socket.id)) return socket.emit('room-error', { message: 'Too many rooms created too quickly.' });
      const lat = isFiniteNumber(data && data.lat) ? data.lat : 0;
      const lng = isFiniteNumber(data && data.lng) ? data.lng : 0;
      rooms[roomCode] = makeRoom(lat, lng);
      rooms[roomCode].leaderId = socket.id;
    }

    const room = rooms[roomCode];
    if (room.matchActive) return socket.emit('room-error', { message: 'Match already in progress.' });
    if (Object.keys(room.players).length >= MAX_PLAYERS_PER_ROOM) return socket.emit('room-error', { message: 'Room is full! (max 6)' });

    const openSlot = Object.keys(room.takenCharacters).find((s) => !room.takenCharacters[s]);
    if (!openSlot) return socket.emit('room-error', { message: 'This room session circle is full! (max 6 players)' });

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
      geofence: { lat: room.originLat, lng: room.originLng, radiusMeters: ROOM_RADIUS_METERS },
    });
    maybeAutoStart(roomCode);
  });

  socket.on('set-timing-mode', (data) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];
    if (room.leaderId !== socket.id || room.matchStarted) {
      return socket.emit('room-error', { message: 'Mode modification rejected.' });
    }
    const mode = data && data.mode === 'indoor' ? 'indoor' : 'outdoor';
    room.timingMode = mode;
    room.modeChosen = true;
    io.to(currentRoom).emit('timing-mode-updated', { mode });
    maybeAutoStart(currentRoom);
  });

  socket.on('request-rematch', () => {
    if (!currentRoom || !rooms[currentRoom]) return socket.emit('room-error', { message: 'Room no longer exists.' });
    const room = rooms[currentRoom];
    if (!room.matchEnded) return;
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
    if (Object.keys(room.players).length >= MIN_PLAYERS_TO_START) startCountdown(currentRoom);
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

    if (!currentRoom || !rooms[currentRoom]) return emitCaptureResult(socket, { vegId, success: false, label: 'NO ROOM' });
    const room = rooms[currentRoom];
    const p = room.players[socket.id];
    if (!p) return emitCaptureResult(socket, { vegId, success: false, label: 'NOT JOINED' });

    if (!room.matchActive || room.matchEnded || room.stageResolved || !room.stageVeggie || room.stageVeggie.id !== vegId) {
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
      if (!isFiniteNumber(p.heading)) return emitCaptureResult(socket, { vegId, success: false, label: 'NO COMPASS' });
      const diff = angleDiffDeg(p.heading, veg.bearing);
      if (diff > HEADING_TOLERANCE_DEG) return emitCaptureResult(socket, { vegId, success: false, label: 'NOT AIMED' });
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

// ========================================== //
// ⏱️ AUTHORITATIVE CLOCK LOOP THREAD (1Hz)    //
// ========================================== //
// See file header — label corrected from "30HZ" to match the actual
// TICK_MS = 1000 rate; the flee-distance math only works at 1 tick/sec.
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

    // Flee Physics Vectors Calculations
    const activePlayers = Object.values(room.players).filter((p) => now - p.lastLocationAt < LOCATION_STALE_MS);

    if (room.stageVeggie && !room.stageResolved) {
      const veg = room.stageVeggie;
      let nearestPlayer = null;
      let nearestDist = Infinity;

      activePlayers.forEach((p) => {
        if (getPlayerMode(p, now) !== 'gps') return;
        const d = distanceMeters(p.lat, p.lng, veg.lat, veg.lng);
        if (d < nearestDist) {
          nearestDist = d;
          nearestPlayer = p;
        }
      });

      if (nearestPlayer && nearestDist < VEG_PANIC_RADIUS_M) {
        const speedMod = room.glitchActive ? VEG_FLEE_SPEED_MPS * 2.5 : VEG_FLEE_SPEED_MPS;
        const brg = bearingDegrees(nearestPlayer.lat, nearestPlayer.lng, veg.lat, veg.lng);
        const next = destinationPoint(veg.lat, veg.lng, brg, speedMod);
        veg.lat = next.lat;
        veg.lng = next.lng;
        veg.latitude = next.lat;
        veg.longitude = next.lng;
        veg.fleeing = true;
        veg.fleeBearingDeg = brg;
      } else {
        veg.fleeing = false;
        veg.fleeBearingDeg = null;
      }
    }

    // Broadcast synchronized matrix logs down the transport highway
    io.to(roomCode).emit('veggies-update', room.stageVeggie && !room.stageResolved ? [room.stageVeggie] : []);
    io.to(roomCode).emit(
      'players-update',
      Object.values(room.players).map((p) => ({
        id: p.id,
        name: p.name,
        slot_id: p.character,
        slotId: p.character,
        latitude: p.lat,
        longitude: p.lng,
        mode: getPlayerMode(p, now),
        score: p.score,
        disconnected: !!p.disconnected,
      }))
    );
  });
}, TICK_MS);

server.listen(PORT, () => {
  console.log(`🚀 [Manifix Server Core Node] Online on cluster port: ${PORT}`);
});
