-- =====================================================
-- AI-Assisted Session Management Platform
-- Full Production Database Schema
-- Author: Mohit Mudgal (B.Tech Major Project)
-- Database: PostgreSQL + pgvector
-- =====================================================

BEGIN;

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- USERS & ACCESS CONTROL
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- =====================================================
-- EVENTS
-- =====================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT,
  timezone TEXT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  CONSTRAINT valid_event_dates CHECK (end_date >= start_date)
);

ALTER TABLE events
ADD COLUMN cfp_open BOOLEAN DEFAULT FALSE,
ADD COLUMN cfp_start TIMESTAMP,
ADD COLUMN cfp_end TIMESTAMP;

-- =====================================================
-- TRACKS & ROOMS
-- =====================================================

CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  UNIQUE (event_id, name)
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INT CHECK (capacity > 0),
  UNIQUE (event_id, name)
);

-- =====================================================
-- SPEAKERS
-- =====================================================

CREATE TABLE speaker_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  organization TEXT,
  experience_level TEXT CHECK (experience_level IN ('Beginner','Intermediate','Advanced')),
  profile_photo_url TEXT
);

-- =====================================================
-- SESSIONS (AI-ENABLED)
-- =====================================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id),
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  level TEXT CHECK (level IN ('Beginner','Intermediate','Advanced')),
  status TEXT CHECK (status IN (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'ACCEPTED',
    'REJECTED',
    'SCHEDULED'
  )),
  embedding VECTOR(384), -- changes from 1536 to 384
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- =====================================================
-- MULTI-SPEAKER SUPPORT
-- =====================================================

CREATE TABLE session_speakers (
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  speaker_id UUID REFERENCES speaker_profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, speaker_id)
);

-- =====================================================
-- REVIEWS (HUMAN + AI)
-- =====================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  score INT CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  ai_analysis JSONB,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- SCHEDULING
-- =====================================================

CREATE TABLE time_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  CONSTRAINT valid_slot CHECK (end_time > start_time)
);

CREATE TABLE scheduled_sessions (
  session_id UUID PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  time_slot_id UUID REFERENCES time_slots(id)
);

-- =====================================================
-- AUDIT LOGGING
-- =====================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_sessions_event ON sessions(event_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_reviews_session ON reviews(session_id);
CREATE INDEX idx_tracks_event ON tracks(event_id);
CREATE INDEX idx_schedule_room_time ON scheduled_sessions(room_id, time_slot_id);

-- Vector index for semantic search
CREATE INDEX idx_sessions_embedding
ON sessions USING ivfflat (embedding vector_cosine_ops);

-- =====================================================
-- SOFT DELETE VIEWS
-- =====================================================

CREATE VIEW active_users AS
SELECT * FROM users WHERE deleted_at IS NULL;

CREATE VIEW active_events AS
SELECT * FROM events WHERE deleted_at IS NULL;

CREATE VIEW active_sessions AS
SELECT * FROM sessions WHERE deleted_at IS NULL;

-- =====================================================
-- AUDIT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs(
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data
  )
  VALUES (
    current_setting('app.current_user', true)::UUID,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ATTACH AUDIT TRIGGERS
-- =====================================================

CREATE TRIGGER audit_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_events
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_sessions
AFTER INSERT OR UPDATE OR DELETE ON sessions
FOR EACH ROW EXECUTE FUNCTION log_audit();

-- =====================================================
-- BUSINESS RULE TRIGGERS
-- =====================================================

-- Prevent scheduling of non-accepted sessions
CREATE OR REPLACE FUNCTION prevent_invalid_schedule()
RETURNS TRIGGER AS $$
DECLARE
  session_status TEXT;
BEGIN
  SELECT status INTO session_status
  FROM sessions
  WHERE id = NEW.session_id;

  IF session_status IS NULL THEN
    RAISE EXCEPTION 'Session does not exist';
  END IF;

  IF session_status != 'ACCEPTED' THEN
    RAISE EXCEPTION 'Only ACCEPTED sessions can be scheduled';
  END IF;

  -- Auto-mark session as scheduled
  UPDATE sessions
  SET status = 'SCHEDULED'
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_session_status
BEFORE INSERT ON scheduled_sessions
FOR EACH ROW EXECUTE FUNCTION prevent_invalid_schedule();

-- =====================================================
-- UPDATE TIMESTAMP FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ATTACH UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_events_timestamp
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sessions_timestamp
BEFORE UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- DEFAULT ROLES
-- =====================================================

INSERT INTO roles (name) VALUES
  ('ADMIN'),
  ('ORGANIZER'),
  ('REVIEWER'),
  ('SPEAKER')
ON CONFLICT DO NOTHING;

COMMIT;