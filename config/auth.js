const { betterAuth } = require('better-auth');
const { mongodbAdapter } = require('better-auth/adapters/mongodb');
const { MongoClient } = require('mongodb');

let auth;

const getAuth = async () => {
  if (auth) return auth;

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  // Auth is proxied through Next.js (port 3000) → so baseURL = client URL
  // This ensures cookies are set on localhost:3000 and state matches
  const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';

  auth = betterAuth({
    database: mongodbAdapter(db),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: clientURL,           // <-- port 3000 (proxied)
    trustedOrigins: [clientURL, process.env.BETTER_AUTH_URL || 'http://localhost:5000'],
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    },
    user: {
      additionalFields: {
        role: { type: 'string', defaultValue: 'customer', input: true },
        isBlocked: { type: 'boolean', defaultValue: false },
        businessName: { type: 'string', defaultValue: '', input: true },
        subscriptionPlan: { type: 'string', defaultValue: 'free' },
        subscriptionExpiresAt: { type: 'string', defaultValue: null },
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 7,
      },
    },
  });

  return auth;
};

module.exports = { getAuth };
