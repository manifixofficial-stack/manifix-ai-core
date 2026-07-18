const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  player_id: { type: String, required: true, unique: true, index: true },
  balances: {
    free_tickets: { type: Number, default: 3, min: 0 }, // 🎁 3 Welcome Ticket Shards granted automatically
    premium_passes: { type: Number, default: 0, min: 0 }
  },
  transaction_history: [{
    invoice_id: { type: String, required: true }, // Razorpay Payment Ref Token
    amount_paid: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['created', 'settled', 'failed'], default: 'created' },
    timestamp: { type: Date, default: Date.now }
  }],
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Wallet', WalletSchema);
