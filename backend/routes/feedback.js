// ====================================================================
// 💬 routes/feedback.js - ENDPOINT FOR SECURITY BUG LOGS & CRITIQUE
// ====================================================================
const express = require('express');
const router = express.Router();

// Import authoritative models
const Feedback = require('../models/Feedback');

router.post('/submit', async (req, res) => {
  const { player_id, username, category, message, device_os } = req.body;

  try {
    // Enforce payload length validation rules
    if (!message || message.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'TRANSMISSION ABORTED: MESSAGE STRING IS TOO CONCISE' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ success: false, message: 'TRANSMISSION ABORTED: DATA SIZE EXCEEDS BUFFER BOUNDS' });
    }

    // 1. Commit new critique packet straight to your MongoDB Atlas cloud cluster vault
    const feedbackEntry = new Feedback({
      player_id: player_id || 'usr_anonymous_8656',
      username: username ? username.toUpperCase() : 'ANONYMOUS_SQUAD',
      category: category || 'SUGGESTION',
      message: message.trim(),
      device_os: device_os || 'ANDROID'
    });

    await feedbackEntry.save();
    return res.status(200).json({ success: true, message: 'CRITIQUE GRANTED: RECORD SECURED IN ATLAS VAULT' });

  } catch (err) {
    console.error('❌ FEEDBACK LOGGING FAILURE:', err.message);
    return res.status(500).json({ success: false, error: 'DATABASE STORAGE EXECUTOR UNREACHABLE' });
  }
});

module.exports = router;
