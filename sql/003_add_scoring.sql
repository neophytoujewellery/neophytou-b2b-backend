-- Phase 3 — AI Fit Score
-- Add scoring fields to the leads table (idempotent).

ALTER TABLE leads ADD COLUMN IF NOT EXISTS fit_score      INT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fit_category   TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fit_reason     TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scoring_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scored_at      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_scoring ON leads (scoring_status);
CREATE INDEX IF NOT EXISTS idx_leads_fit     ON leads (fit_score);