const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get('/', (req, res) => {
  res.status(200).send('<h1>🚀 ManifiX AI Multi-Device GPS Game Server Node is Active!</h1><p>Real-world location pipelines are operational.</p>');
});

app.get('/ping', (req, res) => {
  res.status(200).send('ManifiX AI Game Engine is Awake!');
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

if (!supabase) console.log("⚠️ Supabase credentials missing. High-scores won't be saved.");

// ==========================================
// GAME CONSTANTS — GPS / outdoor mode
// ==========================================
const PORT = process.env.PORT || 5000;
const TICK_MS = 1000; // 1Hz — real-world movement doesn't need 45Hz like the old joystick did
const ROUND_DURATION_MS = 5 * 60 * 1000; // 5-minute outdoor round
const COUNTDOWN_TICK_MS = 1000; // 1 second per 3-2-1 beat

const GLITCH_CYCLE_MS = 45000;
const GLITCH_DURATION_MS = 6000;

const ROOM_RADIUS_METERS = 300;   // geofence: vegetables stay within this of the room's origin point
const VEG_PANIC_RADIUS_M = 40;    // player must be this close before a vegetable starts fleeing
const VEG_FLEE_SPEED_MPS = 1.4;   // roughly walking pace
const CATCH_RADIUS_METERS = 20;   // must be this close AND tap capture to catch
const STEAL_RADIUS_METERS = 8;    // player-vs-player point steal range
const VEGETABLE_COUNT = 5;
const LOCATION_STALE_MS = 15000;  // ignore GPS pings older than this for steal/catch calcs

let rooms = {};
let cockroachHackActive = false;
let glitchCycleStart = Date.now();

setInterval(() => {
  const elapsed = (Date.now() - glitchCycleStart) % GLITCH_CYCLE_MS;
  cockroachHackActive = elapsed < GLITCH_DURATION_MS;
}, 250);

const CHARACTERS = {
  BLUE: { speedMultiplier: 1.0 },
  PURPLE: { speedMultiplier: 1.2 },
  PINK: { speedMultiplier: 1.1 },
  ORANGE: { speedMultiplier: 0.8 }
};

const CHARACTER_COLORS = {
  BLUE: "#3a86ff",
  PURPLE: "#8338ec",
  PINK: "#ff006e",
  ORANGE: "#fb5607"
};

const VEGGIE_POINTS = { golden: 10, tomato: 3, broccoli: 1, carrot: 1 };

// ==========================================
// GEO MATH HELPERS
// ==========================================
const EARTH_RADIUS_M = 6371000;

function toRad(deg) { return (deg * Math.PI) / 180; }
function toDeg(rad) { return (rad * 180) / Math.PI; }

// Distance in meters between two lat/lng points (haversine)
function distanceMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

// Compass bearing in degrees from point 1 to point 2
function bearingDegrees(lat1, lng1, lat2, lng2) {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Given a start point, bearing, and distance (meters), return the destination lat/lng
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

// Random point within radiusM of a center point (uniform over the disk area)
function randomPointInRadius(centerLat, centerLng, radiusM) {
  const r = radiusM * Math.sqrt(Math.random());
  const bearing = Math.random() * 360;
  return destinationPoint(centerLat, centerLng, bearing, r);
}

function spawnVegetable(centerLat, centerLng) {
  const typeChance = Math.random();
  let type = "carrot";
  if (typeChance > 0.94) type = "golden";
  else if (typeChance > 0.70) type = "tomato";
  else if (typeChance > 0.40) type = "broccoli";

  const pos = randomPointInRadius(centerLat, centerLng, ROOM_RADIUS_METERS * 0.8);
  return {
    id: `veg-${Math.random().toString(36).substring(2, 9)}`,
    lat: pos.lat,
    lng: pos.lng,
    type
  };
}

function makeRoom(originLat, originLng) {
  return {
    originLat,
    originLng,
    players: {},
    vegetables: Array.from({ length: VEGETABLE_COUNT }, () => spawnVegetable(originLat, originLng)),
    takenCharacters: { BLUE: false, PURPLE: false, PINK: false, ORANGE: false },
    // Round no longer starts the instant the room is created — it starts only
    // after the 3-2-1 countdown finishes (see startCountdown), so vegetables
    // don't drift and the clock doesn't tick down while players are still
    // picking their colors in Stage 2.
    roundActive: false,
    roundStartTime: null,
    roundEnded: false,
    countdownTimer: null
  };
}

// Fires the 3-2-1-GO sequence for a room once all 4 slots are claimed.
// Emits 'match-countdown' each beat, then 'match-go' and finally flips
// roundActive on so the tick loop starts moving vegetables / running the clock.
function startCountdown(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.countdownTimer) return; // already counting down

  let tick = 3;
  io.to(roomCode).emit('match-countdown', { tick });

  room.countdownTimer = setInterval(() => {
    tick -= 1;
    if (tick > 0) {
      io.to(roomCode).emit('match-countdown', { tick });
      return;
    }

    clearInterval(room.countdownTimer);
    room.countdownTimer = null;

    room.roundActive = true;
    room.roundEnded = false;
    room.roundStartTime = Date.now();
    io.to(roomCode).emit('match-go');
  }, COUNTDOWN_TICK_MS);
}

// ==========================================
// CENTRAL GAME STATE ENGINE TICK LOOP (1Hz)
// ==========================================
setInterval(() => {
  Object.keys(rooms).forEach(roomCode => {
    const room = rooms[roomCode];
    const now = Date.now();

    // 0. Round lifecycle
    if (room.roundActive) {
      const elapsed = now - room.roundStartTime;
      if (elapsed >= ROUND_DURATION_MS) {
        room.roundActive = false;
        room.roundEnded = true;

        Object.values(room.players).forEach(p => {
          saveScoreToSupabase(p.name, p.character, p.score);
        });

        const ranked = Object.values(room.players)
          .map(p => ({ name: p.name, character: p.character, score: p.score, color: p.color }))
          .sort((a, b) => b.score - a.score);

        const winner = ranked[0] || null;

        io.to(roomCode).emit('match-ended', {
          winnerName: winner ? winner.name : null,
          winnerColor: winner ? winner.color : null,
          results: ranked
        });
      }
    }

    // Before the countdown/round has ever started, or between rounds, just
    // keep clients in sync with player/character state — no vegetable or
    // steal simulation runs yet.
    if (!room.roundActive) {
      io.to(roomCode).emit('game-state', {
        players: room.players,
        vegetables: room.roundStartTime ? [] : room.vegetables,
        cockroachHack: false,
        roundActive: false,
        roundTimeRemaining: 0,
        geofence: { lat: room.originLat, lng: room.originLng, radiusMeters: ROOM_RADIUS_METERS }
      });
      return;
    }

    const activePlayers = Object.values(room.players).filter(
      p => p.lastLocationAt && (now - p.lastLocationAt) < LOCATION_STALE_MS
    );

    // 1. Vegetable flee / geofence AI, now measured in real meters
    room.vegetables.forEach(veg => {
      let nearestPlayer = null;
      let nearestDist = Infinity;

      activePlayers.forEach(p => {
        const d = distanceMeters(p.lat, p.lng, veg.lat, veg.lng);
        if (d < nearestDist) {
          nearestDist = d;
          nearestPlayer = p;
        }
      });

      if (nearestPlayer && nearestDist < VEG_PANIC_RADIUS_M) {
        // Flee directly away from the nearest player
        const towardVeg = bearingDegrees(nearestPlayer.lat, nearestPlayer.lng, veg.lat, veg.lng);
        const stepDist = VEG_FLEE_SPEED_MPS * (TICK_MS / 1000);
        const next = destinationPoint(veg.lat, veg.lng, towardVeg, stepDist);
        veg.lat = next.lat;
        veg.lng = next.lng;
      }

      // Geofence bounce: if it strayed past the room radius, pull it back toward origin
      const distFromOrigin = distanceMeters(room.originLat, room.originLng, veg.lat, veg.lng);
      if (distFromOrigin > ROOM_RADIUS_METERS) {
        const towardCenter = bearingDegrees(veg.lat, veg.lng, room.originLat, room.originLng);
        const pullBack = destinationPoint(veg.lat, veg.lng, towardCenter, VEG_FLEE_SPEED_MPS * (TICK_MS / 1000) * 1.5);
        veg.lat = pullBack.lat;
        veg.lng = pullBack.lng;
      }
    });

    // 2. Player-vs-player point steal (real GPS proximity + real recent walking speed)
    const playerIds = Object.keys(room.players).filter(id => {
      const p = room.players[id];
      return p.lastLocationAt && (now - p.lastLocationAt) < LOCATION_STALE_MS;
    });

    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        const p1Id = playerIds[i];
        const p2Id = playerIds[j];
        const p1 = room.players[p1Id];
        const p2 = room.players[p2Id];

        const dist = distanceMeters(p1.lat, p1.lng, p2.lat, p2.lng);
        if (dist < STEAL_RADIUS_METERS) {
          const p1Speed = p1.speedMps || 0;
          const p2Speed = p2.speedMps || 0;

          if (p1Speed > p2Speed && p2.score > 0) {
            p2.score = Math.max(0, p2.score - 2);
            p1.score += 2;
            io.to(roomCode).emit('point-steal', { attackerId: p1Id, victimId: p2Id, lat: p2.lat, lng: p2.lng });
          } else if (p2Speed > p1Speed && p1.score > 0) {
            p1.score = Math.max(0, p1.score - 2);
            p2.score += 2;
            io.to(roomCode).emit('point-steal', { attackerId: p2Id, victimId: p1Id, lat: p1.lat, lng: p1.lng });
          }
        }
      }
    }

    io.to(roomCode).emit('game-state', {
      players: room.players,
      vegetables: room.vegetables,
      cockroachHack: cockroachHackActive,
      roundActive: true,
      roundTimeRemaining: Math.max(0, ROUND_DURATION_MS - (now - room.roundStartTime)),
      geofence: { lat: room.originLat, lng: room.originLng, radiusMeters: ROOM_RADIUS_METERS }
    });
  });
}, TICK_MS);

async function saveScoreToSupabase(name, character, finalScore) {
  if (!supabase) return;
  try {
    await supabase.from('leaderboards').insert([
      { username: name, character_used: character, score: finalScore }
    ]);
  } catch (err) {
    console.error("Error connecting records up to Supabase:", err);
  }
}

// ==========================================
// SOCKET CONTROLLER INTERFACE ROUTERS
// ==========================================
io.on('connection', (socket) => {
  let currentRoom = null;

  // Room creation now requires the creator's real starting location, so the
  // geofence and vegetable spawns are centered somewhere real (their backyard,
  // a park, a campus — wherever they actually are).
  socket.on('join-room', (data) => {
    const roomCode = data.room;
    if (!roomCode) return socket.emit('room-error', { message: "Invalid Room Code Input" });

    if (!rooms[roomCode]) {
      const originLat = typeof data.lat === 'number' ? data.lat : null;
      const originLng = typeof data.lng === 'number' ? data.lng : null;
      if (originLat === null || originLng === null) {
        return socket.emit('room-error', { message: "Location permission is required to start a new outdoor room" });
      }
      rooms[roomCode] = makeRoom(originLat, originLng);
    }

    if (Object.keys(rooms[roomCode].players).length >= 4) {
      return socket.emit('room-error', { message: "This room session circle is full!" });
    }

    currentRoom = roomCode;
    socket.join(roomCode);
    socket.emit('room-joined', {
      room: roomCode,
      geofence: { lat: rooms[roomCode].originLat, lng: rooms[roomCode].originLng, radiusMeters: ROOM_RADIUS_METERS }
    });
  });

  socket.on('request-characters', () => {
    if (currentRoom && rooms[currentRoom]) {
      socket.emit('characters-update', { taken: rooms[currentRoom].takenCharacters });
    }
  });

  socket.on('join-game', (data) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];

    if (!CHARACTERS[data.character]) {
      return socket.emit('character-error', { message: "Not a valid character color assignment" });
    }
    if (room.takenCharacters[data.character]) {
      return socket.emit('character-error', { message: "Role taken by a friend!" });
    }

    const existing = room.players[socket.id];
    if (existing) {
      room.takenCharacters[existing.character] = false;
    }

    room.takenCharacters[data.character] = true;
    room.players[socket.id] = {
      lat: room.originLat,
      lng: room.originLng,
      character: data.character,
      name: data.name || `User-${socket.id.substring(0, 3)}`,
      score: 0,
      color: CHARACTER_COLORS[data.character],
      lastLocationAt: null,
      speedMps: 0
    };

    socket.emit('game-joined', { success: true, character: data.character });
    io.to(currentRoom).emit('characters-update', { taken: room.takenCharacters });

    // All 4 slots claimed -> kick off the 3-2-1-GO sequence the client
    // (App.jsx) is already listening for via 'match-countdown' / 'match-go'.
    const allFilled = Object.values(room.takenCharacters).every(Boolean);
    if (allFilled) {
      startCountdown(currentRoom);
    }
  });

  // Client sends real GPS updates from navigator.geolocation.watchPosition.
  // Server computes real walking speed from consecutive pings for the steal mechanic.
  socket.on('location-update', (data) => {
    if (!currentRoom || !rooms[currentRoom] || !rooms[currentRoom].players[socket.id]) return;
    const lat = typeof data.lat === 'number' ? data.lat : null;
    const lng = typeof data.lng === 'number' ? data.lng : null;
    if (lat === null || lng === null) return;

    const p = rooms[currentRoom].players[socket.id];
    const now = Date.now();

    if (p.lastLocationAt) {
      const dtSeconds = (now - p.lastLocationAt) / 1000;
      if (dtSeconds > 0.2) {
        const dist = distanceMeters(p.lat, p.lng, lat, lng);
        p.speedMps = dist / dtSeconds;
      }
    }

    p.lat = lat;
    p.lng = lng;
    p.lastLocationAt = now;
  });

  // Catching now requires BOTH real proximity AND a manual capture-button tap —
  // no more automatic overlap catching like the old virtual-room version.
  socket.on('capture-attempt', (data) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];
    if (!room.roundActive) return;
    const p = room.players[socket.id];
    if (!p || !p.lastLocationAt) return;

    const vegId = data && data.vegId;
    const vegIndex = room.vegetables.findIndex(v => v.id === vegId);
    if (vegIndex === -1) return;

    const veg = room.vegetables[vegIndex];
    const dist = distanceMeters(p.lat, p.lng, veg.lat, veg.lng);
    if (dist > CATCH_RADIUS_METERS) {
      socket.emit('capture-failed', { vegId, distanceMeters: Math.round(dist), requiredMeters: CATCH_RADIUS_METERS });
      return;
    }

    const pts = VEGGIE_POINTS[veg.type] ?? 1;
    p.score += pts;

    io.to(currentRoom).emit('veggieCaught', {
      playerId: socket.id,
      playerName: p.name,
      playerColor: p.character,
      veggieType: veg.type,
      points: pts,
      newScore: p.score,
      lat: veg.lat,
      lng: veg.lng
    });

    if (veg.type === "golden") {
      io.to(currentRoom).emit('high-score-flash', { playerId: socket.id });
      saveScoreToSupabase(p.name, p.character, p.score);
    }

    room.vegetables.splice(vegIndex, 1);
    room.vegetables.push(spawnVegetable(room.originLat, room.originLng));
  });

  // Renamed from 'restart-round' to 'request-replay' to match the event
  // App.jsx's handleInstantReplay() actually emits after the victory shield.
  socket.on('request-replay', () => {
    if (currentRoom && rooms[currentRoom]) {
      const room = rooms[currentRoom];
      Object.values(room.players).forEach(p => {
        p.score = 0;
        p.speedMps = 0;
      });
      room.vegetables = Array.from({ length: VEGETABLE_COUNT }, () => spawnVegetable(room.originLat, room.originLng));
      room.roundEnded = false;
      room.roundActive = false;
      room.roundStartTime = null;
      // Re-run the 3-2-1-GO sequence instead of jumping straight back into play.
      startCountdown(currentRoom);
    }
  });

  socket.on('disconnect', () => {
    if (currentRoom && rooms[currentRoom]) {
      const room = rooms[currentRoom];
      if (room.players[socket.id]) {
        const char = room.players[socket.id].character;
        room.takenCharacters[char] = false;
        delete room.players[socket.id];
        io.to(currentRoom).emit('characters-update', { taken: room.takenCharacters });
      }
      if (Object.keys(room.players).length === 0) {
        if (room.countdownTimer) clearInterval(room.countdownTimer);
        delete rooms[currentRoom];
      }
    }
  });
});

server.listen(PORT, () => console.log(`🚀 ManifiX AI GPS Game Engine Active on Port: ${PORT}`));
