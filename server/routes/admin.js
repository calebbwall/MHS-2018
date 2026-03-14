const router = require('express').Router();
const db = require('../config/db');
const adminOnly = require('../middleware/adminOnly');
const { sendApprovalEmail, sendAnnouncementEmail } = require('../utils/mailer');

// GET /api/admin/users — all users including unapproved
router.get('/users', adminOnly, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, full_name, nickname, email, phone, city, state, career, company,
              is_approved, is_admin, created_at
       FROM users
       ORDER BY is_approved ASC, created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/export — CSV download of all approved users
router.get('/users/export', adminOnly, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT full_name, nickname, email, phone, city, state, career, company,
              graduation_year, created_at
       FROM users
       WHERE is_approved = TRUE
       ORDER BY full_name`
    );

    const header = 'Full Name,Nickname,Email,Phone,City,State,Career,Company,Graduation Year,Joined\n';
    const rows = result.rows.map(u =>
      [
        u.full_name, u.nickname || '', u.email, u.phone || '',
        u.city || '', u.state || '', u.career || '', u.company || '',
        u.graduation_year, new Date(u.created_at).toLocaleDateString()
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="mhs2018-classmates.csv"');
    res.send(header + rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export' });
  }
});

// PATCH /api/admin/users/:id/approve
router.patch('/users/:id/approve', adminOnly, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE users SET is_approved = TRUE, updated_at = NOW()
       WHERE id = $1
       RETURNING id, full_name, email, is_approved`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];

    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_id, notes)
       VALUES ($1, 'approved_user', $2, $3)`,
      [req.user.id, user.id, user.full_name]
    );

    sendApprovalEmail(user); // non-blocking

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// PATCH /api/admin/users/:id/reject
router.patch('/users/:id/reject', adminOnly, async (req, res) => {
  try {
    // Fetch user info for logging before deletion
    const userResult = await db.query(
      'SELECT id, full_name, email, roster_id FROM users WHERE id = $1',
      [req.params.id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    // Unclaim the roster entry so someone else can register
    if (user.roster_id) {
      await db.query('UPDATE class_roster SET is_claimed = FALSE WHERE id = $1', [user.roster_id]);
    }

    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);

    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_id, notes)
       VALUES ($1, 'rejected_user', $2, $3)`,
      [req.user.id, user.id, user.full_name]
    );

    res.json({ message: 'User rejected and removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// PUT /api/admin/users/:id — edit any user's profile
router.put('/users/:id', adminOnly, async (req, res) => {
  const {
    full_name, nickname, phone, city, state,
    career, company, bio, profile_photo, social_links, is_admin
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE users SET
         full_name     = COALESCE($1, full_name),
         nickname      = COALESCE($2, nickname),
         phone         = COALESCE($3, phone),
         city          = COALESCE($4, city),
         state         = COALESCE($5, state),
         career        = COALESCE($6, career),
         company       = COALESCE($7, company),
         bio           = COALESCE($8, bio),
         profile_photo = COALESCE($9, profile_photo),
         social_links  = COALESCE($10, social_links),
         is_admin      = COALESCE($11, is_admin),
         updated_at    = NOW()
       WHERE id = $12
       RETURNING id, full_name, email, is_approved, is_admin`,
      [full_name, nickname, phone, city, state, career, company,
       bio, profile_photo, social_links ? JSON.stringify(social_links) : null,
       is_admin, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_id) VALUES ($1, 'edited_user', $2)`,
      [req.user.id, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// POST /api/admin/announcements — send class-wide email
router.post('/announcements', adminOnly, async (req, res) => {
  const { subject, body } = req.body;
  if (!subject || !body) {
    return res.status(400).json({ error: 'Subject and body are required' });
  }

  try {
    const result = await db.query(
      'SELECT email FROM users WHERE is_approved = TRUE'
    );
    const emails = result.rows.map(r => r.email);

    await sendAnnouncementEmail(emails, subject, body);

    await db.query(
      `INSERT INTO admin_logs (admin_id, action, notes) VALUES ($1, 'sent_announcement', $2)`,
      [req.user.id, subject]
    );

    res.json({ message: `Announcement sent to ${emails.length} classmates` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send announcement' });
  }
});

// GET /api/admin/logs — paginated admin action log
router.get('/logs', adminOnly, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  try {
    const result = await db.query(
      `SELECT l.*, u.full_name AS admin_name
       FROM admin_logs l
       LEFT JOIN users u ON u.id = l.admin_id
       ORDER BY l.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// GET /api/admin/stats — dashboard overview numbers
router.get('/stats', adminOnly, async (req, res) => {
  try {
    const [total, pending, events] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users WHERE is_approved = TRUE'),
      db.query('SELECT COUNT(*) FROM users WHERE is_approved = FALSE'),
      db.query('SELECT COUNT(*) FROM events WHERE event_date > NOW()'),
    ]);
    res.json({
      total_approved: parseInt(total.rows[0].count),
      pending_approval: parseInt(pending.rows[0].count),
      upcoming_events: parseInt(events.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
