-- MHS Class of 2018 Alumni Hub — Database Schema
-- Run: psql -d mhs2018 -f database/schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------
-- Class Roster
-- Source of truth for name selection during signup.
-- is_claimed flips to TRUE when a user links their account.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS class_roster (
  id         SERIAL PRIMARY KEY,
  full_name  VARCHAR(150) NOT NULL,
  is_claimed BOOLEAN NOT NULL DEFAULT FALSE
);

-- -------------------------------------------------------
-- Users
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roster_id        INTEGER REFERENCES class_roster(id) ON DELETE SET NULL,
  full_name        VARCHAR(150) NOT NULL,
  nickname         VARCHAR(100),
  email            VARCHAR(255) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  graduation_year  SMALLINT NOT NULL DEFAULT 2018,
  phone            VARCHAR(30),
  city             VARCHAR(100),
  state            VARCHAR(100),
  career           VARCHAR(150),
  company          VARCHAR(150),
  bio              TEXT,
  profile_photo    VARCHAR(500),           -- URL string; empty = show initials avatar
  social_links     JSONB DEFAULT '{}',     -- { instagram, linkedin, facebook, twitter, website }
  is_approved      BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- Direct Messages
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- Events (Reunion Hub)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id           SERIAL PRIMARY KEY,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  event_date   TIMESTAMPTZ NOT NULL,
  location     VARCHAR(255),
  map_link     VARCHAR(500),
  ticket_link  VARCHAR(500),
  event_image  VARCHAR(500),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- RSVPs
-- One row per user per event; updated on change (upsert).
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS rsvps (
  id         SERIAL PRIMARY KEY,
  event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     VARCHAR(20) NOT NULL CHECK (status IN ('going', 'maybe', 'not_attending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

-- -------------------------------------------------------
-- Admin Action Log
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_logs (
  id         SERIAL PRIMARY KEY,
  admin_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(100) NOT NULL,   -- e.g. 'approved_user', 'created_event'
  target_id  VARCHAR(255),            -- UUID or integer of affected row
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- Indexes
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_messages_receiver     ON messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event           ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user            ON rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_users_approved        ON users(is_approved);
