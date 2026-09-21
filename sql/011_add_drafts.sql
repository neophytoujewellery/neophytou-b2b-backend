-- Step 2d — AI drafts + editable outreach base message.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS draft_subject TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS draft_body    TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS draft_status  TEXT DEFAULT 'none';  -- none / generated / approved
ALTER TABLE leads ADD COLUMN IF NOT EXISTS draft_at      TIMESTAMPTZ;

-- Simple key/value settings (e.g. the outreach base message the admin edits).
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);