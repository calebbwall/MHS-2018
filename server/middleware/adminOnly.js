const { authApproved } = require('./auth');

/**
 * Extends authApproved — also requires is_admin = true.
 */
async function adminOnly(req, res, next) {
  await authApproved(req, res, () => {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

module.exports = adminOnly;
