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

// State Structures
let rooms = {};
let cockroachHackActive = false; // Cyber Matrix Data Corruption Flag

// System Data Corruption Event Loop: Toggles on/off for 6 seconds every 45 seconds
setInterval(() => {
  cockroachHackActive = !cockroachHackActive;
}, 45000);

// 🛠️ FIXED ALIGNMENT SCHEMA: Character dictionaries renamed to match color-based IDs
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

function spawnVegetable() {
  const typeChance = Math.random();
  let type = "carrot";
  if (typeChance > 0.94) type = "golden"; // ManifiX Booster
  else if (typeChance > 0.70) type = "tomato";
  else if (typeChance > 0.40) type = "broccoli";

  return {
    id: `veg-${Math.random().toString(36).substring(2, 9)}`,
    x: Math.random() * 0.88 + 0.06, // Avoid extreme wall edges
    y: Math.random() * 0.88 + 0.06,
    type: type
  };
}

// ==========================================
// CENTRAL GAME STATE ENGINE TICK LOOP
// ==========================================
setInterval(() => {
  Object.keys(rooms).forEach(roomCode => {
    const room = rooms[roomCode];

    // 1. Process Movements, Overheat, and Decays
    Object.keys(room.players).forEach(id => {
      const p = room.players[id];
      const isMoving = p.vector.x !== 0 || p.vector.y !== 0;

      // Handle Device Heat Engine Calculations
      if (isMoving && !p.overheated) {
        p.heat = Math.min(100, p.heat + 1.2);
        if (p.heat >= 100) p.overheated = true;
      } else {
        p.heat = Math.max(0, p.heat - 0.8);
        if (p.overheated && p.heat <= 25) p.overheated = false; // Cool down lock release
      }

      // Handle Coordinate Position Progression Shifts
      if (isMoving) {
        const dynamicSpeed = p.overheated ? 0.3 : CHARACTERS[p.character].speedMultiplier;
        p.x = Math.max(0.02, Math.min(0.98, p.x + (p.vector.x * BASE_SPEED * dynamicSpeed)));
        p.y = Math.max(0.02, Math.min(0.98, p.y + (p.vector.y * BASE_SPEED * dynamicSpeed)));
      }
    });

    // 2. Process Fleeing Runaway Target Vegetables
    room.vegetables.forEach(veg => {
      Object.values(room.players).forEach(p => {
        let dist = Math.hypot(p.x - veg.x, p.y - veg.y);
        if (dist < 0.18 && dist > 0.04) { // Close enough to frighten the vegetable target
          let angle = Math.atan2(veg.y - p.y, veg.x - p.x);
          veg.x = Math.max(0.04, Math.min(0.96, veg.x + Math.cos(angle) * 0.008));
          veg.y = Math.max(0.04, Math.min(0.96, veg.y + Math.sin(angle) * 0.008));
        }
      });
    });

    // 3. Process Competitive Item Catch Collisions
    const caughtVegIndexes = new Set();
    room.vegetables.forEach((veg, idx) => {
      if (caughtVegIndexes.has(idx)) return; 

      for (const id of Object.keys(room.players)) {
        const p = room.players[id];
        const dist = Math.hypot(p.x - veg.x, p.y - veg.y);

        if (dist < 0.045) { // Item Successfully Caught!
          const pts = veg.type === "golden" ? 10 : veg.type === "tomato" ? 3 : 1;
          p.score += pts;

          if (veg.type === "golden") {
            io.to(roomCode).emit('high-score-flash', { playerId: id });
            saveScoreToSupabase(p.name, p.character, p.score);
          }

          caughtVegIndexes.add(idx);
          break; // First player to touch claims it
        }
      }
    });

    if (caughtVegIndexes.size > 0) {
      room.vegetables = room.vegetables.filter((_, idx) => !caughtVegIndexes.has(idx));
      for (let i = 0; i < caughtVegIndexes.size; i++) {
        room.vegetables.push(spawnVegetable());
      }
    }

    // 4. Process Player-on-Player Collision Steal Mechanics
    const playerIds = Object.keys(room.players);
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        let p1 = room.players[playerIds[i]];
        let p2 = room.players[playerIds[j]];

        if (Math.hypot(p1.x - p2.x, p1.y - p2.y) < 0.05) {
          const p1Speed = Math.hypot(p1.vector.x, p1.vector.y);
          const p2Speed = Math.hypot(p2.vector.x, p2.vector.y);

          if (p1Speed < p2Speed && p1.score > 0) {
            p1.score = Math.max(0, p1.score - 2);
            p2.score += 2;
          } else if (p2Speed < p1Speed && p2.score > 0) {
            p2.score = Math.max(0, p2.score - 2);
            p1.score += 2;
          }
        }
      }
    }

    // Always broadcast clean unified payload state to all active phones in the room
    io.to(roomCode).emit('game-state', { 
      players: room.players, 
      vegetables: room.vegetables,
      cockroachHack: cockroachHackActive 
    });
  });
}, TICK_RATE);

// Async function to push records into your Supabase Postgres schema rows
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

  // Client Stage 1 Join Room request
  socket.on('join-room', (data) => {
    const roomCode = data.room;
    if (!roomCode) return socket.emit('room-error', { message: "Invalid Room Code Input" });

    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        players: {},
        vegetables: Array.from({ length: 5 }, spawnVegetable),
        // 🛠️ FIXED LOBBY KEYS: Slots updated to color schemas
        takenCharacters: { BLUE: false, PURPLE: false, PINK: false, ORANGE: false }
      };
    }

    if (Object.keys(rooms[roomCode].players).length >= 4) {
      return socket.emit('room-error', { message: "This room session circle is full!" });
    }

    currentRoom = roomCode;
    socket.join(roomCode);
    socket.emit('room-joined', { room: roomCode });
  });

  // Client Stage 2 Character Grid mount request
  socket.on('request-characters', () => {
    if (currentRoom && rooms[currentRoom]) {
      socket.emit('characters-update', { taken: rooms[currentRoom].takenCharacters });
    }
  });

  // Character selection lock toggle
  socket.on('join-game', (data) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];

    // 🛠️ FIXED VALIDATION: Whitelist verifies color string key values instead of text names
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

    // Register active user structural parameters
    room.takenCharacters[data.character] = true;
    room.players[socket.id] = {
      x: 0.5, y: 0.5,
      character: data.character,
      name: data.name || `User-${socket.id.substring(0, 3)}`,
      score: 0, heat: 0, overheated: false,
      color: CHARACTER_COLORS[data.character],
      vector: { x: 0, y: 0 }
    };

    // Confirm success cleanly to client
    socket.emit('game-joined', { success: true, character: data.character });
    io.to(currentRoom).emit('characters-update', { taken: room.takenCharacters });
  });

  // Live real-time direction vector processing stream updates
  socket.on('move', (vector) => {
    if (currentRoom && rooms[currentRoom] && rooms[currentRoom].players[socket.id]) {
      rooms[currentRoom].players[socket.id].vector = {
        x: Math.max(-1, Math.min(1, vector.x || 0)),
        y: Math.max(-1, Math.min(1, vector.y || 0))
      };
    }
  });

  // Safe disconnection clearing loops
  socket.on('disconnect', () => {
    if (currentRoom && rooms[currentRoom]) {
      const room = rooms[currentRoom];
      if (room.players[socket.id]) {
        const char = room.players[socket.id].character;
        room.takenCharacters[char] = false; // Release character lock
        delete room.players[socket.id];

        io.to(currentRoom).emit('characters-update', { taken: room.takenCharacters });
      }
      if (Object.keys(room.players).length === 0) delete rooms[currentRoom];
    }
  });
});

server.listen(PORT, () => console.log(`🚀 ManifiX AI Game Engine Active on Port: ${PORT}`));
