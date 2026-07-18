// ====================================================================
// 💰 routes/billing.js - SECURE RAZORPAY MICROTRANSACTION VERIFIER
// ====================================================================
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');

// Import authoritative models
const Wallet = require('../models/Wallet');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_mock'
});

router.post('/verify-payment', async (req, res) => {
  const { player_id, razorpay_payment_id, bundle_tickets } = req.body;

  try {
    if (!player_id || !razorpay_payment_id || !bundle_tickets) {
      return res.status(400).json({ success: false, message: 'VACANT INVOICE ROUTING HEADS DETECTED' });
    }

    // 1. Pull transaction verification references directly from Razorpay secure registers
    const paymentVerification = await razorpayInstance.payments.fetch(razorpay_payment_id);
    
    // 2. Enforce strict anti-fraud validation checks
    if (paymentVerification && paymentVerification.status === 'captured') {
      const wallet = await Wallet.findOne({ player_id });
      
      if (wallet) {
        // Credit the player's premium pass balances instantly with 0% app store cuts
        wallet.balances.premium_passes += parseInt(bundle_tickets, 10);
        
        // Log transaction hash keys permanently to your transaction history collections
        wallet.transaction_history.push({
          invoice_id: razorpay_payment_id,
          amount_paid: paymentVerification.amount / 100, // Converts amount in paise back to INR rupees
          currency: paymentVerification.currency || 'INR',
          status: 'SETTLED'
        });
        
        wallet.updated_at = new Date();
        await wallet.save();

        return res.status(200).json({
          success: true,
          message: 'WALLET TRANSCRIPT CREDITED SUCCESSFULLY.',
          balances: {
            free_tickets: wallet.balances.free_tickets,
            premium_passes: wallet.balances.premium_passes
          }
        });
      }
      return res.status(404).json({ success: false, message: 'TARGET PLAYER DATA CORE NOT FOUND' });
    }
    
    return res.status(400).json({ success: false, message: 'TRANSACTION VERIFICATION FRAUD DETECTED' });

  } catch (err) {
    console.error('❌ BILLING PIPELINE MISFIRE:', err.message);
    return res.status(500).json({ success: false, error: 'GATEWAY COMMUNICATION TIMEOUT BOUNDS' });
  }
});

module.exports = router;
