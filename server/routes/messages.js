const router = require('express').Router();
const db = require('../config/db');
const { authApproved } = require('../middleware/auth');
const { sendNewMessageNotification } = require('../utils/mailer');

// GET /api/messages/unread-count — badge in navbar
router.get('/unread-count', authApproved, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// GET /api/messages/inbox — list of conversations with latest message + unread count
router.get('/inbox', authApproved, async (req, res) => {
  try {
    // Get all people this user has messaged with, plus the latest message and unread count
    const result = await db.query(
      `SELECT
         partner.id,
         partner.full_name,
         partner.profile_photo,
         latest.body        AS last_message,
         latest.created_at  AS last_message_time,
         unread.unread_count
       FROM (
         SELECT DISTINCT
           CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS partner_id
         FROM messages
         WHERE sender_id = $1 OR receiver_id = $1
       ) AS convos
       JOIN users partner ON partner.id = convos.partner_id
       JOIN LATERAL (
         SELECT body, created_at FROM messages
         WHERE (sender_id = $1 AND receiver_id = convos.partner_id)
            OR (sender_id = convos.partner_id AND receiver_id = $1)
         ORDER BY created_at DESC LIMIT 1
       ) AS latest ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS unread_count FROM messages
         WHERE sender_id = convos.partner_id AND receiver_id = $1 AND is_read = FALSE
       ) AS unread ON true
       ORDER BY latest.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

// GET /api/messages/conversation/:userId — full thread, marks as read
router.get('/conversation/:userId', authApproved, async (req, res) => {
  const { userId } = req.params;
  try {
    // Fetch messages
    const result = await db.query(
      `SELECT m.id, m.sender_id, m.receiver_id, m.body, m.is_read, m.created_at,
              u.full_name AS sender_name, u.profile_photo AS sender_photo
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC`,
      [req.user.id, userId]
    );

    // Mark received messages as read
    await db.query(
      `UPDATE messages SET is_read = TRUE
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [userId, req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// POST /api/messages/send — send a message
router.post('/send', authApproved, async (req, res) => {
  const { receiver_id, body } = req.body;
  if (!receiver_id || !body || !body.trim()) {
    return res.status(400).json({ error: 'receiver_id and body are required' });
  }
  if (receiver_id === req.user.id) {
    return res.status(400).json({ error: 'Cannot send message to yourself' });
  }

  try {
    // Check receiver exists and is approved
    const receiverResult = await db.query(
      'SELECT id, email, full_name FROM users WHERE id = $1 AND is_approved = TRUE',
      [receiver_id]
    );
    if (receiverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    const receiver = receiverResult.rows[0];

    const result = await db.query(
      `INSERT INTO messages (sender_id, receiver_id, body)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, receiver_id, body.trim()]
    );

    // Send email notification (non-blocking)
    sendNewMessageNotification(req.user.full_name, receiver.email, req.user.id);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
