const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Transaction = require('../models/Transaction');
const { verifyToken, verifyVendor } = require('../middleware/auth');
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

// POST create checkout session (vendor only)
router.post('/create-checkout-session', verifyToken, verifyVendor, async (req, res) => {
  try {
    // Prevent creating session for another vendor
    const vendorId = req.user.id;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'PizzaHub Premium Subscription',
              description: 'Unlimited menu items, premium badge, and featured placement',
            },
            unit_amount: 2999, // $29.99
          },
          quantity: 1,
        },
      ],
      metadata: {
        vendorId: vendorId,
        plan: 'premium',
      },
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
    });

    // Create pending transaction
    await Transaction.create({
      vendorId: vendorId,
      plan: 'premium',
      amount: 29.99,
      currency: 'usd',
      stripeSessionId: session.id,
      status: 'pending',
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating checkout session', error: error.message });
  }
});

// POST webhook (called by Stripe)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const vendorId = session.metadata.vendorId;

    try {
      // Update transaction status
      await Transaction.findOneAndUpdate(
        { stripeSessionId: session.id },
        { status: 'completed' }
      );

      // Update vendor subscription
      const collection = await getUsersCollection();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year subscription

      await collection.updateOne(
        { _id: vendorId },
        {
          $set: {
            subscriptionPlan: 'premium',
            subscriptionExpiresAt: expiresAt.toISOString(),
          },
        }
      );

      console.log(`Premium subscription activated for vendor: ${vendorId}`);
    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;

    await Transaction.findOneAndUpdate(
      { stripeSessionId: session.id },
      { status: 'failed' }
    );
  }

  res.json({ received: true });
});

// GET transactions (admin)
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const transactions = await Transaction.find({}).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET verify payment success
router.get('/verify-session/:sessionId', verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ stripeSessionId: req.params.sessionId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
