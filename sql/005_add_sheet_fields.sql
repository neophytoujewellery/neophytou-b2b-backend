-- Phase 5 — Google Sheets sync
-- Staff-editable + campaign-tracking columns (idempotent).
-- Staff-owned (edited in the Sheet, pulled to DB): do_not_contact, send_selected, lead_stage, notes.
-- System-owned (filled by later phases / Brevo webhooks): the rest.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_status TEXT DEFAULT 'not_contacted';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS emails_sent     INT DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivered       BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS opened          BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS clicked         BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS replied         BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unsubscribed    BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bounced         BOOLEAN DEFAULT false;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS do_not_contact  BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS send_selected   BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_stage      TEXT DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes           TEXT;