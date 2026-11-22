const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { verifyToken, verifyCustomer, verifyVendor } = require('../middleware/auth');

// GET order stats for customer dashboard
router.get('/customer/stats', verifyToken, verifyCustomer, async (req, res) => {
  try {
    const total = await Order.countDocuments({ customerId: req.user.id });
    const pending = await Order.countDocuments({ customerId: req.user.id, status: 'pending' });
    const accepted = await Order.countDocuments({ customerId: req.user.id, status: 'accepted' });
    const rejected = await Order.countDocuments({ customerId: req.user.id, status: 'rejected' });
    const cancelled = await Order.countDocuments({ customerId: req.user.id, status: 'cancelled' });

    res.json({ total, pending, accepted, rejected, cancelled });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET order stats for vendor dashboard
router.get('/vendor/stats', verifyToken, verifyVendor, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({ vendorId: req.user.id });
    const pendingOrders = await Order.countDocuments({ vendorId: req.user.id, status: 'pending' });
    const acceptedOrders = await Order.countDocuments({ vendorId: req.user.id, status: 'accepted' });
    const rejectedOrders = await Order.countDocuments({ vendorId: req.user.id, status: 'rejected' });

    res.json({ totalOrders, pendingOrders, acceptedOrders, rejectedOrders });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST create order (customer only)
router.post('/', verifyToken, verifyCustomer, async (req, res) => {
  try {
    const { itemId, deliveryDate, deliveryAddress, message } = req.body;

    if (!itemId || !deliveryDate || !deliveryAddress) {
      return res.status(400).json({ message: 'Item, delivery date, and delivery address are required' });
    }

    const item = await MenuItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    if (item.status !== 'approved') {
      return res.status(400).json({ message: 'This item is not available for ordering' });
    }

    // Prevent ordering own items
    if (item.vendorId === req.user.id) {
      return res.status(400).json({ message: 'You cannot order your own items' });
    }

    // Prevent duplicate active orders for same item and delivery date
    const existingOrder = await Order.findOne({
      customerId: req.user.id,
      itemId,
      deliveryDate: new Date(deliveryDate),
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingOrder) {
      return res.status(400).json({ message: 'You already have an active order for this item on this delivery date' });
    }

    const order = new Order({
      itemId,
      vendorId: item.vendorId,
      customerId: req.user.id,
      deliveryDate: new Date(deliveryDate),
      deliveryAddress,
      message: message || '',
    });

    await order.save();
    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET customer's orders
router.get('/my-orders', verifyToken, verifyCustomer, async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.id })
      .populate('itemId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET vendor's customer orders
router.get('/vendor-orders', verifyToken, verifyVendor, async (req, res) => {
  try {
    const orders = await Order.find({ vendorId: req.user.id })
      .populate('itemId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH cancel order (customer only, own pending orders)
router.patch('/:id/cancel', verifyToken, verifyCustomer, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.customerId !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own orders' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }

    order.status = 'cancelled';
    await order.save();
    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH accept/reject order (vendor only)
router.patch('/:id/status', verifyToken, verifyVendor, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use accepted or rejected.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.vendorId !== req.user.id) {
      return res.status(403).json({ message: 'You can only manage orders for your own items' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be accepted or rejected' });
    }

    order.status = status;
    await order.save();
    res.json({ message: `Order ${status} successfully`, order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
