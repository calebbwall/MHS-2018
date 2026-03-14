const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Verifies JWT from Authorization header and attaches req.user.
 * Usage: router.get('/protected', auth, handler)
 */
async function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch fresh user data so is_approved / is_admin changes take effect immediately
    const result = await db.query(
      'SELECT id, full_name, email, is_approved, is_admin FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Extends auth — also requires the user to be approved.
 */
async function authApproved(req, res, next) {
  await auth(req, res, async () => {
    if (!req.user.is_approved) {
      return res.status(403).json({ error: 'Account pending approval' });
    }
    next();
  });
}

module.exports = { auth, authApproved };
