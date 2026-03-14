const router = require('express').Router();
const db = require('../config/db');
const { auth, authApproved } = require('../middleware/auth');

// GET /api/users/roster/unclaimed — public, for registration step 2
router.get('/roster/unclaimed', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, full_name FROM class_roster WHERE is_claimed = FALSE ORDER BY full_name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
});

// GET /api/users — class directory (approved users only)
// Query params: ?search=&city=&state=&career=
router.get('/', authApproved, async (req, res) => {
  const { search, city, state, career } = req.query;
  const params = [];
  const conditions = ['u.is_approved = TRUE'];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(u.full_name ILIKE $${params.length} OR u.nickname ILIKE $${params.length})`);
  }
  if (city) {
    params.push(`%${city}%`);
    conditions.push(`u.city ILIKE $${params.length}`);
  }
  if (state) {
    params.push(state);
    conditions.push(`u.state = $${params.length}`);
  }
  if (career) {
    params.push(`%${career}%`);
    conditions.push(`u.career ILIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await db.query(
      `SELECT id, full_name, nickname, city, state, career, company, profile_photo
       FROM users u
       ${where}
       ORDER BY full_name`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id — single profile
router.get('/:id', authApproved, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, full_name, nickname, graduation_year, email, phone,
              city, state, career, company, bio, profile_photo, social_links, created_at
       FROM users
       WHERE id = $1 AND is_approved = TRUE`,
      [req.params.id]
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

// PUT /api/users/:id — edit own profile only
router.put('/:id', auth, async (req, res) => {
  // Users can only edit their own profile
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'You can only edit your own profile' });
  }

  const {
    nickname, phone, city, state, career, company,
    bio, profile_photo, social_links
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE users SET
        nickname = $1, phone = $2, city = $3, state = $4,
        career = $5, company = $6, bio = $7,
        profile_photo = $8, social_links = $9,
        updated_at = NOW()
       WHERE id = $10
       RETURNING id, full_name, nickname, email, graduation_year, phone, city, state,
                 career, company, bio, profile_photo, social_links, is_approved, is_admin`,
      [nickname, phone, city, state, career, company, bio,
       profile_photo, social_links ? JSON.stringify(social_links) : '{}', req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
