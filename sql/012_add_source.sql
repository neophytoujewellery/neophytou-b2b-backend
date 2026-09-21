-- Phase 9 — inbound trade-partner applications.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source     TEXT DEFAULT 'discovery';  -- discovery / inbound_application
ALTER TABLE leads ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_source ON leads (source);