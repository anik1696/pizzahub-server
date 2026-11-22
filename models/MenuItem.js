const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  vendorId: { type: String, required: true, ref: 'user' },
  itemName: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Classic Pizzas', 'Vegetarian Pizzas', 'Meat Lovers', 'Specialty / Gourmet Pizzas', 'Sides & Appetizers', 'Beverages & Desserts'],
  },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  images: [{ type: String }],
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'rejected', 'inactive'],
  },
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
