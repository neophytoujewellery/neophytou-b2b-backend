-- Phase 6a — Global Suppression List
-- Once an email lands here it can NEVER be emailed again (unsubscribe/bounce/complaint/manual).

CREATE TABLE IF NOT EXISTS suppression (
  id         BIGSERIAL PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,   -- stored lowercased
  reason     TEXT NOT NULL,          -- unsubscribe / bounce / complaint / manual
  source     TEXT,                   -- brevo_webhook / manual-cli / sheet
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);