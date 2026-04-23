-- 002_app_data.sql — Per-user per-app key-value store
-- Replaces Drive sync. Each app writes its localStorage keys here.
-- UNIQUE(user_id, app_name, key) allows safe upserts.

CREATE TABLE IF NOT EXISTS app_data (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_name   VARCHAR(64) NOT NULL,
  key        VARCHAR(128) NOT NULL,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app_name, key)
);
CREATE INDEX IF NOT EXISTS idx_app_data_user_app ON app_data(user_id, app_name);
