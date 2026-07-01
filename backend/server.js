const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Allow Vercel frontend connections securely
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Fixed: Default homepage landing path route to clean up "Cannot GET /" message
app.get('/', (req, res) => {
  res.status(200).send('<h1>🚀 ManifiX AI Multi-Device Game Server Node is Active!</h1><p>The socket connection pipelines are operational. Ready for circle play.</p>');
});

// This tells Cron-Job.org that your server is alive and prevents it from sleeping!
app.get('/ping', (req, res) => {
  res.status(200).send('ManifiX AI Game Engine is Awake!');
});

// Connect to Supabase Engine using credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

if (!supabase) console.log("⚠️ Supabase credentials missing. High-scores won't be saved.");

// Game Variables
const PORT = process.env.PORT || 5000;
const BASE_SPEED = 0.005; // 0-1 speed per tick
const TICK_RATE = 45; // Smooth ~22Hz frame updates
const OVERHEAT_LOCK_MS = 3000; // Fixed 3-second input lock, independent of heat decay
const ROUND_DURATION_MS = 60000; // 60-Second Round Concluded Lock

const GLITCH_CYCLE_MS = 45000;
const GLITCH_DURATION_MS = 6000;

const VEG_WALL_MIN = 0.04;
const VEG_WALL_MAX = 0.96;
const VEG_FLEE_SPEED = 0.008;

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

function spawnVegetable() {
  const typeChance = Math.random();
  let type = "carrot";
  if (typeChance > 0.94) type = "golden";
  else if (typeChance > 0.70) type = "tomato";
  else if (typeChance > 0.40) type = "broccoli";

  return {
    id: `veg-${Math.random().toString(36).substring(2, 9)}`,
    x: Math.random() * 0.88 + 0.06,
    y: Math.random() * 0.88 + 0.06,
    vx: 0,
    vy: 0,
    type: type
  };
}

function makeRoom() {
  return {
    players: {},
    vegetables: Array.from({ length: 5 }, spawnVegetable),
    takenCharacters: { BLUE: false, PURPLE: false, PINK: false, ORANGE: false },
    roundActive: true,
    roundStartTime: Date.now(),
    roundEnded: false
  };
}

setInterval(() => {
  Object.keys(rooms).forEach(roomCode => {
    const room = rooms[roomCode];
    const now = Date.now();

    if (room.roundActive) {
      const elapsed = now - room.roundStartTime;
      if (elapsed >= ROUND_DURATION_MS) {
        room.roundActive = false;
        room.roundEnded = true;

        Object.values(room.players).forEach(p => { p.vector = { x: 0, y: 0 }; });

        Object.values(room.players).forEach(p => {
          saveScoreToSupabase(p.name, p.character, p.score);
        });

        const ranked = Object.values(room.players)
          .map(p => ({ name: p.name, character: p.character, score: p.score }))
          .sort((a, b) => b.score - a.score);

        io.to(roomCode).emit('round-end', { results: ranked });
      }
    }

    if (!room.roundActive) {
      io.to(roomCode).emit('game-state', {
        players: room.players,
        vegetables: [],
        cockroachHack: false,
        roundActive: false,
        roundTimeRemaining: 0
      });
      return;
    }

    Object.keys(room.players).forEach(id => {
      const p = room.players[id];
      const isMoving = p.vector.x !== 0 || p.vector.y !== 0;

      if (p.overheated) {
        if (now >= p.overheatUntil) {
          p.overheated = false;
          p.heat = 0;
        }
      } else if (isMoving) {
        p.heat = Math.min(100, p.heat + 1.2);
        if (p.heat >= 100) {
          p.overheated = true;
          p.overheatUntil = now + OVERHEAT_LOCK_MS;
        }
      } else {
        p.heat = Math.max(0, p.heat - 0.8);
      }

      if (isMoving && !p.overheated) {
        const dynamicSpeed = CHARACTERS[p.character].speedMultiplier;
        p.x = Math.max(0.02, Math.min(0.98, p.x + (p.vector.x * BASE_SPEED * dynamicSpeed)));
        p.y = Math.max(0.02, Math.min(0.98, p.y + (p.vector.y * BASE_SPEED * dynamicSpeed)));
      }
    });

    room.vegetables.forEach(veg => {
      let fleeX = 0;
      let fleeY = 0;
      let frightened = false;

      Object.values(room.players).forEach(p => {
        const dist = Math.hypot(p.x - veg.x, p.y - veg.y);
        if (dist < 0.18 && dist > 0.04) {
          const angle = Math.atan2(veg.y - p.y, veg.x - p.x);
          fleeX += Math.cos(angle);
          fleeY += Math.sin(angle);
          frightened = true;
        }
      });

      if (frightened) {
        veg.vx = fleeX * VEG_FLEE_SPEED;
        veg.vy = fleeY * VEG_FLEE_SPEED;
      } else {
        veg.vx *= 0.9;
        veg.vy *= 0.9;
      }

      let nextX = veg.x + veg.vx;
      let nextY = veg.y + veg.vy;

      if (nextX <= VEG_WALL_MIN || nextX >= VEG_WALL_MAX) {
        veg.vx *= -1;
        nextX = Math.max(VEG_WALL_MIN, Math.min(VEG_WALL_MAX, nextX));
      }
      if (nextY <= VEG_WALL_MIN || nextY >= VEG_WALL_MAX) {
        veg.vy *= -1;
        nextY = Math.max(VEG_WALL_MIN, Math.min(VEG_WALL_MAX, nextY));
      }

      veg.x = nextX;
      veg.y = nextY;
    });

    const caughtVegIndexes = new Set();
    room.vegetables.forEach((veg, idx) => {
      if (caughtVegIndexes.has(idx)) return;

      for (const id of Object.keys(room.players)) {
        const p = room.players[id];
        const dist = Math.hypot(p.x - veg.x, p.y - veg.y);

        if (dist < 0.045) {
          const pts = VEGGIE_POINTS[veg.type] ?? 1;
          p.score += pts;

          io.to(roomCode).emit('veggieCaught', {
            playerId: id,
            playerName: p.name,
            playerColor: p.character,
            veggieType: veg.type,
            points: pts,
            newScore: p.score,
            x: veg.x,
            y: veg.y
          });

          if (veg.type === "golden") {
            io.to(roomCode).emit('high-score-flash', { playerId: id });
            saveScoreToSupabase(p.name, p.character, p.score);
          }

          caughtVegIndexes.add(idx);
          break;
        }
      }
    });

    if (caughtVegIndexes.size > 0) {
      room.vegetables = room.vegetables.filter((_, idx) => !caughtVegIndexes.has(idx));
      for (let i = 0; i < caughtVegIndexes.size; i++) {
        room.vegetables.push(spawnVegetable());
      }
    }

    const playerIds = Object.keys(room.players);
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        let p1 = room.players[playerIds[i]];
        let p2 = room.players[playerIds[j]];
        const p1Id = playerIds[i];
        const p2Id = playerIds[j];

        if (Math.hypot(p1.x - p2.x, p1.y - p2.y) < 0.05) {
          const p1Speed = Math.hypot(p1.vector.x, p1.vector.y);
          const p2Speed = Math.hypot(p2.vector.x, p2.vector.y);
          const impactX = (p1.x + p2.x) / 2;
          const impactY = (p1.y + p2.y) / 2;

          if (p1Speed < p2Speed && p1.score > 0) {
            p1.score = Math.max(0, p1.score - 2);
            p2.score += 2;
            io.to(roomCode).emit('point-steal', {
              attackerId: p2Id, victimId: p1Id, x: impactX, y: impactY
            });
          } else if (p2Speed < p1Speed && p2.score > 0) {
            p2.score = Math.max(0, p2.score - 2);
            p1.score += 2;
            io.to(roomCode).emit('point-steal', {
              attackerId: p1Id, victimId: p2Id, x: impactX, y: impactY
            });
          }
        }
      }
    }

    io.to(roomCode).emit('game-state', {
      players: room.players,
      vegetables: room.vegetables,
      cockroachHack: cockroachHackActive,
      roundActive: true,
      roundTimeRemaining: Math.max(0, ROUND_DURATION_MS - (now - room.roundStartTime))
    });
  });
}, TICK_RATE);

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

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('join-room', (data) => {
    const roomCode = data.room;
    if (!roomCode) return socket.emit('room-error', { message: "Invalid Room Code Input" });

    if (!rooms[roomCode]) {
      rooms[roomCode] = makeRoom();
    }

    if (Object.keys(rooms[roomCode].players).length >= 4) {
      return socket.emit('room-error', { message: "This room session circle is full!" });
    }

    currentRoom = roomCode;
    socket.join(roomCode);
    socket.emit('room-joined', { room: roomCode });
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
      x: 0.5, y: 0.5,
      character: data.character,
      name: data.name || `User-${socket.id.substring(0, 3)}`,
      score: 0, heat: 0, overheated: false, overheatUntil: 0,
      color: CHARACTER_COLORS[data.character],
      vector: { x: 0, y: 0 }
    };

    socket.emit('game-joined', { success: true, character: data.character });
    io.to(currentRoom).emit('characters-update', { taken: room.takenCharacters });
  });

  socket.on('move', (vector) => {
    if (currentRoom && rooms[currentRoom] && rooms[currentRoom].players[socket.id]) {
      rooms[currentRoom].players[socket.id].vector = {
        x: Math.max(-1, Math.min(1, vector.x || 0)),
        y: Math.max(-1, Math.min(1, vector.y || 0))
      };
    }
  });

  socket.on('restart-round', () => {
    if (currentRoom && rooms[currentRoom]) {
      const room = rooms[currentRoom];
      Object.values(room.players).forEach(p => {
        p.score = 0;
        p.heat = 0;
        p.overheated = false;
        p.overheatUntil = 0;
        p.vector = { x: 0, y: 0 };
      });
      room.vegetables = Array.from({ length: 5 }, spawnVegetable);
      room.roundActive = true;
      room.roundEnded = false;
      room.roundStartTime = Date.now();
      io.to(currentRoom).emit('round-restarted');
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
      if (Object.keys(room.players).length === 0) delete rooms[currentRoom];
    }
  });
});

server.listen(PORT, () => console.log(`🚀 ManifiX AI Game Engine Active on Port: ${PORT}`));
