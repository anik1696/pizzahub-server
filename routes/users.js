const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { getAuth } = require('../config/auth');
const { MongoClient } = require('mongodb');

let usersCollection;

const getUsersCollection = async () => {
  if (usersCollection) return usersCollection;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  usersCollection = db.collection('user');
  return usersCollection;
};

// GET admin stats
router.get('/admin/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const collection = await getUsersCollection();
    const MenuItem = require('../models/MenuItem');
    const Transaction = require('../models/Transaction');

    const totalUsers = await collection.countDocuments({});
    const totalVendors = await collection.countDocuments({ role: 'vendor' });
    const totalCustomers = await collection.countDocuments({ role: 'customer' });
    const totalMenuItems = await MenuItem.countDocuments({});
    const pendingMenuItems = await MenuItem.countDocuments({ status: 'pending' });
    const totalTransactions = await Transaction.countDocuments({});

    res.json({ totalUsers, totalVendors, totalCustomers, totalMenuItems, pendingMenuItems, totalTransactions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH update profile (authenticated user)
router.patch('/profile/update', verifyToken, async (req, res) => {
  try {
    const { name, image, businessName } = req.body;
    const collection = await getUsersCollection();

    const updateData = {};
    if (name) updateData.name = name;
    if (image !== undefined) updateData.image = image;
    if (businessName !== undefined) updateData.businessName = businessName;

    // Prevent role and subscription changes through profile update
    // Don't allow: role, subscriptionPlan, subscriptionExpiresAt, isBlocked

    await collection.updateOne(
      { $or: [{ _id: req.user.id }, { id: req.user.id }, { email: req.user.email }] },
      { $set: updateData }
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET all users (admin only)
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { search, role } = req.query;
    const collection = await getUsersCollection();

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const users = await collection.find(query).toArray();
    // Remove sensitive fields
    const sanitized = users.map((u) => ({
      id: u._id || u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      role: u.role,
      isBlocked: u.isBlocked || false,
      businessName: u.businessName,
      subscriptionPlan: u.subscriptionPlan || 'free',
      createdAt: u.createdAt,
    }));

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET user by ID
router.get('/:id', async (req, res) => {
  try {
    const collection = await getUsersCollection();
    // Try _id as string first (Better Auth stores string IDs)
    let user = await collection.findOne({ _id: req.params.id });
    // Also try 'id' field as fallback
    if (!user) {
      user = await collection.findOne({ id: req.params.id });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      isBlocked: user.isBlocked || false,
      businessName: user.businessName,
      subscriptionPlan: user.subscriptionPlan || 'free',
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH block/unblock user (admin only)
router.patch('/:id/block', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { isBlocked } = req.body;
    const collection = await getUsersCollection();

    const user = await collection.findOne({ _id: req.params.id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Admin cannot block themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    await collection.updateOne(
      { _id: req.params.id },
      { $set: { isBlocked: isBlocked } }
    );

    res.json({ message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
