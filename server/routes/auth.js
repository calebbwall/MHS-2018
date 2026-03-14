const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const { sendPendingApprovalEmail } = require('../utils/mailer');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, roster_id } = req.body;

  if (!email || !password || !roster_id) {
    return res.status(400).json({ error: 'Email, password, and roster name are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Check roster entry exists and is unclaimed
    const rosterResult = await db.query(
      'SELECT * FROM class_roster WHERE id = $1',
      [roster_id]
    );
    if (rosterResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid roster selection' });
    }
    const rosterEntry = rosterResult.rows[0];
    if (rosterEntry.is_claimed) {
      return res.status(400).json({ error: 'This name has already been claimed' });
    }

    // Check email uniqueness
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    // Insert user
    const insertResult = await db.query(
      `INSERT INTO users (roster_id, full_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, is_approved, is_admin`,
      [roster_id, rosterEntry.full_name, email.toLowerCase(), password_hash]
    );
    const user = insertResult.rows[0];

    // Mark roster entry as claimed
    await db.query('UPDATE class_roster SET is_claimed = TRUE WHERE id = $1', [roster_id]);

    // Send pending-approval email (non-blocking)
    sendPendingApprovalEmail(user);

    res.status(201).json({ message: 'Account created. Awaiting admin approval.', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user without password_hash
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me — rehydrate session from stored token
router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, roster_id, full_name, nickname, email, graduation_year,
              phone, city, state, career, company, bio, profile_photo,
              social_links, is_approved, is_admin, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
