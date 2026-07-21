// models/Player.js
//
// New model for this revision — durable Google-identity accounts, separate
// from Wallet (which is keyed on deviceUUID and stays as the ticket/balance
// store). A Player survives a deviceUUID change (app reinstall, new phone);
// Wallet does not. googleId is the real identity anchor here.

const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true, index: true },
  email: { type: String },
  name: { type: String },
  deviceUUID: { type: String, index: true },
  deviceOS: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Player', PlayerSchema);
