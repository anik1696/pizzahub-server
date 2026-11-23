const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const { verifyToken, verifyRole, verifyAdmin, verifyVendor } = require('../middleware/auth');
const { MongoClient } = require('mongodb');

let usersCollection;
const getUsersCollection = async () => {
  if (usersCollection) return usersCollection;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  usersCollection = client.db('pizzahub').collection('user');
  return usersCollection;
};

// GET all approved & active items (public)
router.get('/', async (req, res) => {
  try {
    const { search, category, location, sort, page = 1, limit = 12 } = req.query;
    const query = { status: 'approved' };

    if (search) {
      query.itemName = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await MenuItem.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MenuItem.countDocuments(query);

    res.json({
      items,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET featured items for homepage
router.get('/featured', async (req, res) => {
  try {
    // First try to get items from premium vendors, then fill with regular
    const items = await MenuItem.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(6);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET vendor's own items
router.get('/vendor/my-items', verifyToken, verifyVendor, async (req, res) => {
  try {
    const items = await MenuItem.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ADMIN: Get all items
router.get('/admin/all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { search, status, category } = req.query;
    const query = {};

    if (search) {
      query.itemName = { $regex: search, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }

    const items = await MenuItem.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET single item by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(item);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST create item (vendor only)
router.post('/', verifyToken, verifyVendor, async (req, res) => {
  try {
    const { itemName, category, description, price, location, images } = req.body;

    // Validate required fields
    if (!itemName || !category || !description || !price || !location) {
      return res.status(400).json({ message: 'Item name, category, description, price, and location are required' });
    }

    // Free plan: max 3 active/pending menu items
    const col = await getUsersCollection();
    const vendor = await col.findOne({ $or: [{ _id: req.user.id }, { email: req.user.email }] });
    const isPremium = vendor?.subscriptionPlan === 'premium';
    if (!isPremium) {
      const activeCount = await MenuItem.countDocuments({
        vendorId: req.user.id,
        status: { $in: ['approved', 'pending'] },
      });
      if (activeCount >= 3) {
        return res.status(403).json({
          message: 'Free plan allows a maximum of 3 menu items. Upgrade to Premium for unlimited items.',
          code: 'PLAN_LIMIT',
        });
      }
    }

    const imagesList = images || (req.body.image ? [req.body.image] : []);
    const menuItem = new MenuItem({
      vendorId: req.user.id,
      itemName,
      category,
      description,
      price,
      location,
      image: imagesList[0] || '',
      images: imagesList,
      status: 'pending',
    });

    await menuItem.save();
    res.status(201).json({ message: 'Menu item created successfully. Pending admin approval.', item: menuItem });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT update item (vendor only, own items)
router.put('/:id', verifyToken, verifyVendor, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    if (item.vendorId !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own menu items' });
    }

    const { itemName, category, description, price, location, images } = req.body;

    if (itemName) item.itemName = itemName;
    if (category) item.category = category;
    if (description) item.description = description;
    if (price) item.price = price;
    if (location) item.location = location;
    if (images) item.images = images;

    await item.save();
    res.json({ message: 'Menu item updated successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE item (vendor only, own items)
router.delete('/:id', verifyToken, verifyVendor, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    if (item.vendorId !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own menu items' });
    }

    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH toggle availability (vendor only)
router.patch('/:id/toggle', verifyToken, verifyVendor, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    if (item.vendorId !== req.user.id) {
      return res.status(403).json({ message: 'You can only manage your own menu items' });
    }

    item.status = item.status === 'approved' ? 'inactive' : 'approved';
    await item.save();
    res.json({ message: `Item ${item.status === 'approved' ? 'activated' : 'deactivated'} successfully`, item });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ADMIN: Update item status (approve/reject)
router.patch('/admin/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ message: `Item ${status} successfully`, item });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ADMIN: Delete item
router.delete('/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
