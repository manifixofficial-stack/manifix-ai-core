// ====================================================================
// 🛸 routes/auth.js - GOOGLE OAUTH SECURITY HANDSHAKE AND REGISTRATION
// ====================================================================
const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');

// Import authoritative models
const Player = require('../models/Player');
const Wallet = require('../models/Wallet');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  const { credentialToken, deviceUUID, deviceOS } = req.body;

  try {
    if (!credentialToken || !deviceUUID) {
      return res.status(400).json({ success: false, message: 'MISSING REQUIRED CREDENTIAL PARAMETERS' });
    }

    // 1. Authenticate the user profile token against Google's global verification keys
    const ticket = await googleClient.verifyIdToken({
      idToken: credentialToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const googleEmail = payload.email;
    const googleProfileName = payload.name;
    const googleUniqueId = payload.sub;

    // 2. Query your MongoDB Atlas cloud database cluster to see if the user exists
    let player = await Player.findOne({ email: googleEmail });
    let wallet;

    if (!player) {
      // 🚀 AUTOMATED SIGN-UP OPERATION
      player = new Player({
        player_id: `usr_yeshaswini_${Math.floor(1000 + Math.random() * 9000)}`,
        username: googleProfileName.replace(/\s+/g, '_').toUpperCase(),
        email: googleEmail,
        googleId: googleUniqueId,
        device_os: deviceOS || 'ANDROID',
        deviceUUID: deviceUUID
      });
      await player.save();

      // Allocate structural wallet ledger and credit 3 Free Welcome Ticket Shards
      wallet = new Wallet({
        player_id: player.player_id,
        balances: { free_tickets: 3, premium_passes: 0 }
      });
      await wallet.save();
    } else {
      // 🔓 STANDARD LOGIN ROUTING
      wallet = await Wallet.findOne({ player_id: player.player_id });
      
      // Update hardware persistent identifier anchors dynamically
      player.deviceUUID = deviceUUID;
      await player.save();
    }

    // 3. Transmit fully synchronized profile data packets back to the client app HUD
    return res.status(200).json({
      success: true,
      message: 'AUTHENTICATION MATRIX SYNCHRONIZED',
      player: {
        player_id: player.player_id,
        username: player.username,
        email: player.email
      },
      wallet: {
        free_tickets: wallet.balances.free_tickets,
        premium_passes: wallet.balances.premium_passes
      }
    });

  } catch (err) {
    console.error('❌ AUTH COMPILATION CRASH:', err.message);
    return res.status(500).json({ success: false, message: 'GOOGLE NETWORK REJECTION TIMEOUT' });
  }
});

module.exports = router;
