-- Follow-up campaign tracking.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS followups_sent   INT DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_followup_at TIMESTAMPTZ;