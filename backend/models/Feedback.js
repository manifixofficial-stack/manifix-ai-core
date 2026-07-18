// models/Feedback.js
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  rating:        { type: Number, min: 0, max: 5, default: 0 },
  love_feature:  { type: String, default: '' },
  frustration:   { type: String, default: '' },
  recommend:     { type: String, enum: ['', 'yes', 'maybe', 'no'], default: '' },
  message:       { type: String, default: '', maxlength: 1000 },
  feature_votes: { type: [String], default: [] },
  submitted_at:  { type: Date, default: Date.now },
  // Optional: attach the logged-in player if you want to trace feedback
  // back to an account without exposing that in the UI.
  player_id:     { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
