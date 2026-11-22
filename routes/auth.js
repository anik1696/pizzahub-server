const express = require('express');
const router = express.Router();
const { getAuth } = require('../config/auth');
const jwt = require('jsonwebtoken');
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

// POST generate JWT token (called after Better Auth login)
router.post('/jwt/generate', async (req, res) => {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const collection = await getUsersCollection();
    const user = await collection.findOne({ _id: session.user.id });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role || 'customer',
        isBlocked: user.isBlocked || false,
        subscriptionPlan: user.subscriptionPlan || 'free',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role || 'customer',
        isBlocked: user.isBlocked || false,
        businessName: user.businessName,
        subscriptionPlan: user.subscriptionPlan || 'free',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Better Auth catch-all handler
router.all('/*splat', async (req, res) => {
  try {
    const auth = await getAuth();
    // Convert Express request to a web-standard Request
    const url = new URL(req.originalUrl, `${req.protocol}://${req.get('host')}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }

    const requestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      requestInit.body = JSON.stringify(req.body);
    }

    const request = new Request(url.toString(), requestInit);
    const response = await auth.handler(request);

    // Forward response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Forward status and body
    const body = await response.text();
    res.status(response.status).send(body);
  } catch (error) {
    console.error('Auth handler error:', error);
    res.status(500).json({ message: 'Auth error', error: error.message });
  }
});

module.exports = router;
