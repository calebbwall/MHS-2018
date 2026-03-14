const router = require('express').Router();
const db = require('../config/db');
const { authApproved } = require('../middleware/auth');

// GET /api/rsvps/mine — all RSVPs for the current user
router.get('/mine', authApproved, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT event_id, status FROM rsvps WHERE user_id = $1',
      [req.user.id]
    );
    // Return as a map { event_id: status } for easy lookup on the frontend
    const map = {};
    result.rows.forEach(r => { map[r.event_id] = r.status; });
    res.json(map);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch RSVPs' });
  }
});

// POST /api/rsvps/:eventId — upsert RSVP
router.post('/:eventId', authApproved, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['going', 'maybe', 'not_attending'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status must be going, maybe, or not_attending' });
  }

  try {
    // Confirm event exists
    const eventCheck = await db.query('SELECT id FROM events WHERE id = $1', [req.params.eventId]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const result = await db.query(
      `INSERT INTO rsvps (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id)
       DO UPDATE SET status = $3, updated_at = NOW()
       RETURNING *`,
      [req.params.eventId, req.user.id, status]
    );

    // Return updated counts for the event
    const counts = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'going')        AS going_count,
         COUNT(*) FILTER (WHERE status = 'maybe')        AS maybe_count,
         COUNT(*) FILTER (WHERE status = 'not_attending') AS not_attending_count
       FROM rsvps WHERE event_id = $1`,
      [req.params.eventId]
    );

    res.json({ rsvp: result.rows[0], counts: counts.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update RSVP' });
  }
});

module.exports = router;
