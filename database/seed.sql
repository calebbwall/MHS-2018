-- MHS Class of 2018 Alumni Hub — Seed Data
-- Run AFTER schema.sql:
--   psql -d mhs2018 -f database/seed.sql
--
-- To create the admin user, run:
--   node server/scripts/createAdmin.js
--
-- WARNING: Running this file again will skip duplicates (ON CONFLICT DO NOTHING).

-- -------------------------------------------------------
-- Class Roster — 25 classmates
-- -------------------------------------------------------
INSERT INTO class_roster (full_name) VALUES
  ('Aaliyah Mercer'),
  ('Brandon Kowalski'),
  ('Camille Tran'),
  ('Dante Okafor'),
  ('Elena Vasquez'),
  ('Forrest Lindqvist'),
  ('Grace Huang'),
  ('Hector Morales'),
  ('Imani Washington'),
  ('Jasper Chen'),
  ('Kira Patel'),
  ('Liam O''Brien'),
  ('Marisol Gutierrez'),
  ('Noah Abernathy'),
  ('Olivia Nakamura'),
  ('Preston Yates'),
  ('Quentin Brooks'),
  ('Rachel Figueroa'),
  ('Samuel Adeyemi'),
  ('Tiffany Callahan'),
  ('Ulysses Park'),
  ('Veronica Simmons'),
  ('Wesley Drummond'),
  ('Xochitl Reyes'),
  ('Yusuf Al-Rashid')
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------
-- Sample Event — 10-Year Reunion
-- Note: created_by is NULL because admin user is created separately.
-- After running createAdmin.js you can UPDATE this row with the admin's UUID.
-- -------------------------------------------------------
INSERT INTO events (title, description, event_date, location, map_link, ticket_link)
VALUES (
  '10-Year Reunion',
  'Join your fellow Magnolia High School Class of 2018 classmates for an unforgettable evening celebrating 10 years since graduation! Enjoy dinner, dancing, and reconnecting with old friends.',
  '2028-10-12 18:00:00-05:00',
  'Magnolia Event Center, 123 Main St, Magnolia, TX',
  'https://maps.google.com/?q=Magnolia+Event+Center',
  NULL
) ON CONFLICT DO NOTHING;
