const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  deviceUUID: { type: String, required: true }, // Verified smartphone unique hardware token
  lifetimeMatchesPlayed: { type: Number, default: 1 },
  highestMatchScore: { type: Number, required: true, max: 1000 }, // Strict validation cap
  lastUpdated: { type: Date, default: Date.now }
});

// Index parameters to allow investors to query millions of ranks under 5 milliseconds
LeaderboardSchema.index({ highestMatchScore: -1, lastUpdated: 1 });

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);
