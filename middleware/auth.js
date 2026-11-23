const jwt = require('jsonwebtoken');
const { getAuth } = require('../config/auth');
const { MongoClient, ObjectId } = require('mongodb');

let _usersCol;
const getUsersCol = async () => {
  if (_usersCol) return _usersCol;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  _usersCol = client.db().collection('user');
  return _usersCol;
};

const isUserBlocked = async (email) => {
  try {
    const col = await getUsersCol();
    const u = await col.findOne({ email }, { projection: { isBlocked: 1 } });
    return u?.isBlocked === true;
  } catch { return false; }
};

// Middleware to verify Better Auth session and also support JWT
const verifyToken = async (req, res, next) => {
  try {
    // First try Better Auth session
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });

    if (session && session.user) {
      req.user = session.user;
      // Live DB check — Better Auth session object does NOT include custom fields
      const blocked = await isUserBlocked(session.user.email);
      if (blocked) {
        return res.status(403).json({ message: 'Your account has been blocked by an administrator.' });
      }
      return next();
    }

    // Fallback to JWT token
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Live DB check for JWT path too
    const blocked = await isUserBlocked(decoded.email);
    if (blocked) {
      return res.status(403).json({ message: 'Your account has been blocked by an administrator.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Role verification middleware
const verifyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

const verifyAdmin = verifyRole('admin');
const verifyVendor = verifyRole('vendor');
const verifyCustomer = verifyRole('customer');

module.exports = { verifyToken, verifyRole, verifyAdmin, verifyVendor, verifyCustomer };
