-- Phase 6c — Send tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_email_at         TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_brevo_message_id TEXT;