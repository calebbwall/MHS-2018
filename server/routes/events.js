const router = require('express').Router();
const db = require('../config/db');
const { authApproved } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// GET /api/events — list all events with RSVP counts
router.get('/', authApproved, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         e.*,
         COUNT(r.id) FILTER (WHERE r.status = 'going')        AS going_count,
         COUNT(r.id) FILTER (WHERE r.status = 'maybe')        AS maybe_count,
         COUNT(r.id) FILTER (WHERE r.status = 'not_attending') AS not_attending_count,
         my_rsvp.status AS my_rsvp_status
       FROM events e
       LEFT JOIN rsvps r ON r.event_id = e.id
       LEFT JOIN rsvps my_rsvp ON my_rsvp.event_id = e.id AND my_rsvp.user_id = $1
       GROUP BY e.id, my_rsvp.status
       ORDER BY e.event_date ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id — single event with RSVP counts and attendee list
router.get('/:id', authApproved, async (req, res) => {
  try {
    const eventResult = await db.query(
      `SELECT
         e.*,
         COUNT(r.id) FILTER (WHERE r.status = 'going')        AS going_count,
         COUNT(r.id) FILTER (WHERE r.status = 'maybe')        AS maybe_count,
         COUNT(r.id) FILTER (WHERE r.status = 'not_attending') AS not_attending_count,
         my_rsvp.status AS my_rsvp_status
       FROM events e
       LEFT JOIN rsvps r ON r.event_id = e.id
       LEFT JOIN rsvps my_rsvp ON my_rsvp.event_id = e.id AND my_rsvp.user_id = $2
       WHERE e.id = $1
       GROUP BY e.id, my_rsvp.status`,
      [req.params.id, req.user.id]
    );
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Fetch attendee list grouped by status
    const attendeesResult = await db.query(
      `SELECT u.id, u.full_name, u.profile_photo, r.status
       FROM rsvps r
       JOIN users u ON u.id = r.user_id
       WHERE r.event_id = $1
       ORDER BY u.full_name`,
      [req.params.id]
    );

    res.json({
      event: eventResult.rows[0],
      attendees: attendeesResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST /api/events — create event (admin only)
router.post('/', adminOnly, async (req, res) => {
  const { title, description, event_date, location, map_link, ticket_link, event_image } = req.body;
  if (!title || !event_date) {
    return res.status(400).json({ error: 'Title and event date are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO events (created_by, title, description, event_date, location, map_link, ticket_link, event_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, title, description, event_date, location, map_link, ticket_link, event_image]
    );

    // Log admin action
    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_id, notes)
       VALUES ($1, 'created_event', $2, $3)`,
      [req.user.id, result.rows[0].id.toString(), title]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /api/events/:id — edit event (admin only)
router.put('/:id', adminOnly, async (req, res) => {
  const { title, description, event_date, location, map_link, ticket_link, event_image } = req.body;

  try {
    const result = await db.query(
      `UPDATE events SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         event_date = COALESCE($3, event_date),
         location = COALESCE($4, location),
         map_link = COALESCE($5, map_link),
         ticket_link = COALESCE($6, ticket_link),
         event_image = COALESCE($7, event_image),
         updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [title, description, event_date, location, map_link, ticket_link, event_image, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_id) VALUES ($1, 'updated_event', $2)`,
      [req.user.id, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/events/:id — delete event (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM events WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await db.query(
      `INSERT INTO admin_logs (admin_id, action, target_id) VALUES ($1, 'deleted_event', $2)`,
      [req.user.id, req.params.id]
    );

    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
