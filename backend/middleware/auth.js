const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Verify access token ───────────────────────────────────────────────────
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash -refreshTokens');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ─── Require admin role ────────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// ─── Require admin or recruiter ───────────────────────────────────────────
const requireRecruiter = (req, res, next) => {
  if (!req.user || !['admin', 'recruiter'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Recruiter access required' });
  }
  next();
};

module.exports = { requireAuth, requireAdmin, requireRecruiter };
