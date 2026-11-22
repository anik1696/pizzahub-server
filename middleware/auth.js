const jwt = require('jsonwebtoken');
const { getAuth } = require('../config/auth');

// Middleware to verify Better Auth session and also support JWT
const verifyToken = async (req, res, next) => {
  try {
    // First try Better Auth session
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });

    if (session && session.user) {
      req.user = session.user;
      // Check if user is blocked
      if (req.user.isBlocked) {
        return res.status(403).json({ message: 'Your account has been blocked' });
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

    if (req.user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked' });
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
