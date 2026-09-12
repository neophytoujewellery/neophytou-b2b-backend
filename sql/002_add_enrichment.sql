-- Phase 2 — Website Visit & Contact Enrichment
-- Add contact-enrichment fields to the existing leads table (idempotent).

ALTER TABLE leads ADD COLUMN IF NOT EXISTS email             TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_name      TEXT;   -- personal data: handled carefully (GDPR), left for manual/later use
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram         TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enriched_at       TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_enrichment ON leads (enrichment_status);