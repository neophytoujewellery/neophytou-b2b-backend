-- Phase 4 — Email Validation
-- Add validation fields to the leads table (idempotent).

ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_valid        TEXT;    -- valid / risky / invalid / unknown
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_is_role      BOOLEAN; -- true for info@ / contact@ style addresses
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_check_method TEXT;    -- syntax / mx / hunter
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_checked_at   TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_email_valid ON leads (email_valid);