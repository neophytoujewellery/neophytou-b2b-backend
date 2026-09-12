-- Phase 1 — Lead Discovery schema
-- Primary source of truth = Neon PostgreSQL (EU region).

-- Discovered jewellery retailers.
CREATE TABLE IF NOT EXISTS leads (
  id            BIGSERIAL PRIMARY KEY,
  place_id      TEXT UNIQUE NOT NULL,          -- Google Place ID (safe to store long-term; our dedupe key)
  business_name TEXT,
  address       TEXT,
  phone         TEXT,
  website       TEXT,
  country       TEXT NOT NULL DEFAULT 'Greece',
  city          TEXT,
  search_term   TEXT,                          -- which query first found this lead
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_city    ON leads (city);
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads (country);

-- Log of every (city, term) search we run — lets us avoid redundant paid calls
-- and keep an eye on how many API requests we've used.
CREATE TABLE IF NOT EXISTS search_runs (
  id          BIGSERIAL PRIMARY KEY,
  country     TEXT NOT NULL,
  city        TEXT NOT NULL,
  search_term TEXT NOT NULL,
  requests    INT NOT NULL DEFAULT 0,          -- Places API requests billed in this run
  results     INT NOT NULL DEFAULT 0,          -- places returned
  inserted    INT NOT NULL DEFAULT 0,          -- new rows added after dedupe
  ran_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_runs_lookup ON search_runs (country, city, search_term, ran_at);