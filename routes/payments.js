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
  usersCollection = client.db('pizzahub').collection('user');
  return usersCollection;
};

// POST create Stripe Checkout Session (vendor subscription only)
router.post('/create-checkout-session', verifyToken, verifyVendor, async (req, res) => {
  try {
    const vendorId = req.user.id;
    const vendorEmail = req.user.email;

    // Check if vendor is already premium
    const col = await getUsersCollection();
    const vendor = await col.findOne({
      $or: [{ _id: vendorId }, { email: vendorEmail }]
    });
    if (vendor && vendor.subscriptionPlan === 'premium') {
      return res.status(400).json({ message: 'You are already on the Premium plan' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'PizzaHub Premium Subscription',
              description: 'Unlimited menu items, Premium badge, and featured placement on homepage',
              images: [],
            },
            unit_amount: 999, // $9.99 — affordable test price
          },
          quantity: 1,
        },
      ],
      metadata: {
        vendorId: vendorId,
        vendorEmail: vendorEmail || '',
        plan: 'premium',
      },
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
    });

    // Save pending transaction immediately
    await Transaction.create({
      vendorId: vendorId,
      plan: 'premium',
      amount: 9.99,
      currency: 'usd',
      stripeSessionId: session.id,
      status: 'pending',
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Checkout session error:', error.message);
    res.status(500).json({ message: 'Error creating checkout session', error: error.message });
  }
});

// POST Stripe Webhook — activates Premium ONLY after verified payment
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const vendorId = session.metadata?.vendorId;
    const vendorEmail = session.metadata?.vendorEmail;

    try {
      // 1. Mark transaction as completed
      await Transaction.findOneAndUpdate(
        { stripeSessionId: session.id },
        { $set: { status: 'completed', stripeSubscriptionId: session.payment_intent || session.id } }
      );

      // 2. Activate premium — try by _id first, then by email
      const col = await getUsersCollection();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const query = vendorEmail
        ? { $or: [{ _id: vendorId }, { email: vendorEmail }] }
        : { _id: vendorId };

      await col.updateOne(query, {
        $set: {
          subscriptionPlan: 'premium',
          subscriptionExpiresAt: expiresAt.toISOString(),
        },
      });

      console.log(`✅ Premium activated for vendor: ${vendorEmail || vendorId}`);
    } catch (error) {
      console.error('Error processing payment webhook:', error);
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    await Transaction.findOneAndUpdate(
      { stripeSessionId: session.id },
      { $set: { status: 'failed' } }
    );
  }

  res.json({ received: true });
});

// GET all transactions (admin only)
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

// GET verify session after redirect (for success page)
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
