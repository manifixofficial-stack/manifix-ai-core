// veggieGoLobby.js
// ManifiX Veggie Go — Phase 1: Real-time lobby, room codes, and track claiming.
//
// USAGE (in your existing Railway backend, e.g. server.js):
//
//   const http = require('http');
//   const { Server } = require('socket.io');
//   const initVeggieGoLobby = require('./veggieGoLobby');
//
//   const httpServer = http.createServer(app); // your existing Express app
//   const io = new Server(httpServer, {
//     cors: { origin: 'https://manifixai.com', methods: ['GET', 'POST'] },
//   });
//
//   initVeggieGoLobby(io);
//
//   httpServer.listen(process.env.PORT || 3001);
//
// Requires: npm install socket.io

const TICK_RATE_HZ = 22;
const TICK_INTERVAL_MS = Math.round(1000 / TICK_RATE_HZ);
const TRACKS = ['blue', 'purple', 'pink', 'orange'];
const ROOM_IDLE_CLEANUP_MS = 2 * 60 * 60 * 1000; // 2 hours

module.exports = function initVeggieGoLobby(io) {
  const veggieNsp = io.of('/veggiego');

  // roomCode -> room state
  const rooms = new Map();

  function createRoom(code) {
    const room = {
      code,
      tracks: {
        blue: null,
        purple: null,
        pink: null,
        orange: null,
      },
      pendingClaims: [], // queued claims processed once per tick, in order received
      createdAt: Date.now(),
    };
    rooms.set(code, room);
    return room;
  }

  function getOrCreateRoom(code) {
    return rooms.has(code) ? rooms.get(code) : createRoom(code);
  }

  function roomStatePayload(room) {
    return {
      code: room.code,
      tracks: room.tracks,
    };
  }

  // Processes one tick's worth of pending claims for a room.
  // First valid claim per free track wins; already-locked tracks are skipped.
  function processTick(room) {
    if (room.pendingClaims.length === 0) return false;

    let changed = false;
    for (const claim of room.pendingClaims) {
      const { socketId, track } = claim;
      if (!TRACKS.includes(track)) continue;
      if (room.tracks[track] === null) {
        room.tracks[track] = socketId;
        changed = true;
      }
    }
    room.pendingClaims = [];
    return changed;
  }

  // Global 22Hz tick loop across all active rooms.
  const tickInterval = setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      const changed = processTick(room);
      if (changed) {
        veggieNsp.to(code).emit('room-state', roomStatePayload(room));
      }

      const allEmpty = TRACKS.every((t) => room.tracks[t] === null);
      const idleMs = now - room.createdAt;
      if (allEmpty && idleMs > ROOM_IDLE_CLEANUP_MS) {
        rooms.delete(code);
      }
    }
  }, TICK_INTERVAL_MS);

  veggieNsp.on('connection', (socket) => {
    let joinedRoomCode = null;

    socket.on('join-room', (payload) => {
      const code = payload && typeof payload.code === 'string' ? payload.code.trim() : '';
      if (!code) {
        socket.emit('join-error', { message: 'Invalid room code' });
        return;
      }
      joinedRoomCode = code;
      socket.join(code);
      const room = getOrCreateRoom(code);
      socket.emit('room-state', roomStatePayload(room));
    });

    socket.on('claim-track', (payload) => {
      const track = payload && payload.track;
      if (!joinedRoomCode) {
        socket.emit('join-error', { message: 'Join a room before claiming a track' });
        return;
      }
      if (!TRACKS.includes(track)) return;

      const room = getOrCreateRoom(joinedRoomCode);
      const alreadyHolds = TRACKS.some((t) => room.tracks[t] === socket.id);
      if (alreadyHolds) return;

      room.pendingClaims.push({ socketId: socket.id, track: track });
    });

    socket.on('leave-track', () => {
      releaseSocketTracks(socket, joinedRoomCode);
    });

    socket.on('disconnect', () => {
      releaseSocketTracks(socket, joinedRoomCode);
    });
  });

  function releaseSocketTracks(socket, roomCode) {
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    let changed = false;
    for (const t of TRACKS) {
      if (room.tracks[t] === socket.id) {
        room.tracks[t] = null;
        changed = true;
      }
    }
    if (changed) {
      veggieNsp.to(roomCode).emit('room-state', roomStatePayload(room));
    }
  }

  // Exposed for graceful shutdown / testing.
  veggieNsp.stopTickLoop = () => clearInterval(tickInterval);

  return veggieNsp;
};
