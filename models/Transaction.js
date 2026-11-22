const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  vendorId: { type: String, required: true },
  plan: { type: String, required: true, default: 'premium' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  stripeSessionId: { type: String, required: true },
  stripeSubscriptionId: { type: String, default: null },
  status: { type: String, default: 'pending', enum: ['pending', 'completed', 'failed'] },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
