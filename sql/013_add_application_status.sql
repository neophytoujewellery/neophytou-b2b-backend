-- Phase 9 (applications) — status for inbound trade-partner applications.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS application_status TEXT;  -- pending / approved / rejected (inbound only)