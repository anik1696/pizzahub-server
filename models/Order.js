const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  vendorId: { type: String, required: true },
  customerId: { type: String, required: true },
  deliveryDate: { type: Date, required: true },
  deliveryAddress: { type: String, required: true },
  message: { type: String, default: '' },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
