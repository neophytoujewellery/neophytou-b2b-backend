-- Step 2 (admin controls) — background jobs run from the dashboard.
CREATE TABLE IF NOT EXISTS jobs (
  id          BIGSERIAL PRIMARY KEY,
  type        TEXT NOT NULL,                      -- discover / enrich / score / validate / sync / send
  status      TEXT NOT NULL DEFAULT 'queued',     -- queued / running / done / failed
  params      JSONB,
  log         TEXT NOT NULL DEFAULT '',
  exit_code   INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_jobs_id_desc ON jobs (id DESC);