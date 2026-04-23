-- 001_initial.sql — Sam server baseline schema
-- Users: anyone who logs in via Google.
-- Sessions: active JWT tracking (for revocation + activity).
-- Sam memory: her long-term persistent memory per user.
-- ================================================================

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  google_id     VARCHAR(255) UNIQUE,
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(128) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  last_seen   TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS sam_memory (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category    VARCHAR(64),
  tags        TEXT[],
  content     TEXT NOT NULL,
  source      VARCHAR(32) DEFAULT 'chat',
  confidence  NUMERIC(3,2) DEFAULT 1.00,
  layer       VARCHAR(16) DEFAULT 'short-term',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  promoted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sam_memory_user ON sam_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_sam_memory_layer ON sam_memory(layer);
