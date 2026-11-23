const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: String, default: 'anonymous' },
  userName: { type: String, default: 'Customer' },
  userImage: { type: String, default: '' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, required: true },
  verifiedPurchase: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const menuItemSchema = new mongoose.Schema({
  vendorId: { type: String, required: true, ref: 'user' },
  itemName: {
    type: String,
    required: true,
    default: function () {
      return this.name;
    },
  },
  name: { type: String },
  category: {
    type: String,
    required: true,
    enum: ['Classic Pizzas', 'Vegetarian Pizzas', 'Meat Lovers', 'Specialty / Gourmet Pizzas', 'Sides & Appetizers', 'Beverages & Desserts'],
  },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  image: { type: String },
  images: [{ type: String }],
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'rejected', 'inactive'],
  },
  ratings: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
