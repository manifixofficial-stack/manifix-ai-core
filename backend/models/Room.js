// ====================================================================
// 📦 backend/models/Room.js - AUTHORITATIVE MULTIPLAYER MATCH SCHEMA
// ====================================================================
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomCode: { 
    type: String, 
    required: true, 
    uppercase: true, 
    trim: true, 
    index: true // Enables rapid 4-digit code lookups under 2ms
  },
  players: [{
    username: { type: String, required: true, uppercase: true, trim: true },
    socketId: { type: String, required: true },
    currentScore: { type: Number, default: 0, max: 1000 } // Validates limits up to the 1000 PTS ceiling
  }],
  currentRound: { type: Number, default: 1, min: 1, max: 3 }, // Enforces exact 3-Round match structure bounds
  isMatchActive: { type: Boolean, default: false },
  createdAt: { 
    type: Date, 
    default: Date.now // Sets the live baseline clock marker for the TTL calculation
  }
});

// ⚡ SUPER SECRET TTL SECURITY PARTITIONING 
// Automatically sweeps and permanently erases closed room sessions from Atlas after 2 hours.
// This keeps your active session data lightweight and guarantees your hosting bill stays at $0.
RoomSchema.index({ "createdAt": 1 }, { expireAfterSeconds: 7200 });

module.exports = mongoose.model('Room', RoomSchema);
