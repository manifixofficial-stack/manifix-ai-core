/**
 * server.js
 * Authoritative Backend Matchmaking & Real-Time Sync Cluster Server.
 *
 * REWRITE — replaced the old 3-round/single-veggie system with
 * CONTINUOUS MULTI-SPAWN (Pokémon-GO style): up to
 * MAX_CONCURRENT_VEGGIES live at once, rarity-weighted drops, no
 * fixed round/countdown structure. Player joins a room and veggies
 * just keep spawning/despawning around them.
 *
 * Rarity odds corrected to match the original documented design
 * intent (client gameConfig.js): COMMON (tomato+grapes) ~45%,
 * UNCOMMON (banana) 30%, RARE (strawberry+broccoli) ~20%,
 * ULTRA_RARE (golden) 5%. The old server had these inverted.
 *
 * TESTING VALUES — SPAWN_RADIUS_METERS / CATCH_RADIUS_METERS /
 * VEG_PANIC_RADIUS_M are set LOW right now so you can test indoors
 * without walking far. Search "REVERT FOR PRODUCTION" before launch.
 *
 * NOT INCLUDED: ./models/Leaderboard, ./models/Wallet, ./models/Player
 * assumed to already exist elsewhere in the project, unchanged.
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

// --- Continuous multi-spawn config ---
const MAX_CONCURRENT_VEGGIES = 6;

// REVERT FOR PRODUCTION — was 80. Set low so you can test indoors.
const SPAWN_RADIUS_METERS = 10;

const SPAWN_CHECK_INTERVAL_MS = 3000;   // try to top up spawns every 3s
const VEGGIE_LIFETIME_MS = 90 * 1000;   // despawn if uncaught after 90s

const GLITCH_CYCLE_MS = 45000;
const GLITCH_DURATION_MS = 6000;
const ROOM_RADIUS_METERS = 6;
const VEG_PANIC_RADIUS_M = 40;
const VEG_FLEE_SPEED_MPS = 1.4;

// REVERT FOR PRODUCTION — was 20. Set low so you can catch from a desk.
const CATCH_RADIUS_METERS = 3;

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

// --- Rarity tiers (corrected odds + point values) ---
// Cumulative thresholds checked top-down against Math.random().
const RARITY_TIERS = [
  { tier: 'ULTRA_RARE', types: ['golden'], chance: 0.05, pointValue: 500 },
  { tier: 'RARE', types: ['strawberry', 'broccoli'], chance: 0.20, pointValue: 250 },
  { tier: 'UNCOMMON', types: ['banana'], chance: 0.30, pointValue: 150 },
  { tier: 'COMMON', types: ['tomato', 'grapes'], chance: 0.45, pointValue: 75 },
];

function pickRarityTier() {
  const roll = Math.random();
  let cumulative = 0;
  for (const tierDef of RARITY_TIERS) {
    cumulative += tierDef.chance;
    if (roll <= cumulative) {
      const type = tierDef.types[Math.floor(Math.random() * tierDef.types.length)];
      return { type, tier: tierDef.tier, pointValue: tierDef.pointValue };
    }
  }
  // Fallback (floating point edge case) — most common tier
  const fallback = RARITY_TIERS[RARITY_TIERS.length - 1];
  return { type: fallback.types[0], tier: fallback.tier, pointValue: fallback.pointValue };
}

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

function spawnVeggie(room) {
  const { type, tier, pointValue } = pickRarityTier();
  const candidate = destinationPoint(
    room.originLat, room.originLng,
    Math.random() * 360,
    SPAWN_RADIUS_METERS * Math.sqrt(Math.random())
  );
  const id = `veg-${Math.random().toString(36).substring(2, 9)}`;
  room.veggies[id] = {
    id,
    lat: candidate.lat, lng: candidate.lng,
    latitude: candidate.lat, longitude: candidate.lng,
    bearing: Math.random() * 360,
    type, veggie_type: type,
    tier, pointValue,
    spawnedAt: Date.now(),
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
// 🦾 CORE gameplay state (continuous spawn)  //
// ========================================== //

function makeRoom(originLat, originLng) {
  return {
    originLat,
    originLng,
    players: {},
    leaderId: null,
    takenCharacters: {
      SLOT_01: false, SLOT_02: false, SLOT_03: false,
      SLOT_04: false, SLOT_05: false, SLOT_06: false,
    },
    disconnectTimers: {},
    active: false,             // becomes true once first player joins
    veggies: {},                // id -> veggie, replaces stageVeggie
    lastSpawnCheckAt: 0,
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
  }
  if (room.leaderId === socket.id) {
    const remaining = Object.keys(room.players);
    room.leaderId = remaining.length > 0 ? remaining[0] : null;
    if (room.leaderId) io.to(room.leaderId).emit('promoted-to-leader', {});
  }
  socket.leave(roomCode);
  if (Object.keys(room.players).length === 0) {
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
    if (room.leaderId) io.to(room.leaderId).emit('promoted-to-leader', {});
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
  if (player.deviceUUID) {
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
          reconnected: true,
          score: playerObj.score,
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
    room.active = true;
    socket.join(roomCode);
    socket.emit('room-joined', {
      room: roomCode,
      slotId: openSlot,
      geofence: { lat: room.originLat, lng: room.originLng, radiusMeters: ROOM_RADIUS_METERS },
      isLeader: room.leaderId === socket.id,
    });
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

    const veg = room.veggies[vegId];
    if (!veg) return emitCaptureResult(socket, { vegId, success: false, label: 'GONE' });

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

    delete room.veggies[vegId];
    const pointValue = veg.pointValue;
    p.score += pointValue;
    upsertLeaderboardEntry(p);

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
      tier: veg.tier,
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
setInterval(() => {
  const now = Date.now();

  Object.keys(rooms).forEach((roomCode) => {
    const room = rooms[roomCode];
    if (!room.active) return;

    const glitchElapsed = (now - room.glitchCycleStart) % GLITCH_CYCLE_MS;
    const previousGlitchState = room.glitchActive;
    room.glitchActive = glitchElapsed < GLITCH_DURATION_MS;
    if (room.glitchActive !== previousGlitchState) {
      io.to(roomCode).emit('glitch-pulse', { active: room.glitchActive, duration: GLITCH_DURATION_MS });
    }

    // Expire veggies past their lifetime
    Object.keys(room.veggies).forEach((vegId) => {
      const veg = room.veggies[vegId];
      if (now - veg.spawnedAt > VEGGIE_LIFETIME_MS) {
        delete room.veggies[vegId];
      }
    });

    // Top up spawns to MAX_CONCURRENT_VEGGIES, throttled by SPAWN_CHECK_INTERVAL_MS
    if (now - room.lastSpawnCheckAt >= SPAWN_CHECK_INTERVAL_MS) {
      room.lastSpawnCheckAt = now;
      const currentCount = Object.keys(room.veggies).length;
      for (let i = currentCount; i < MAX_CONCURRENT_VEGGIES; i++) {
        spawnVeggie(room);
      }
    }

    if (!rooms[roomCode]) return;

    const activePlayers = Object.values(room.players).filter((p) => now - p.lastLocationAt < LOCATION_STALE_MS);

    // Flee physics — each veggie flees its nearest active GPS player
    Object.values(room.veggies).forEach((veg) => {
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
    });

    // Broadcast synchronized state
    io.to(roomCode).emit('veggies-update', Object.values(room.veggies));
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
