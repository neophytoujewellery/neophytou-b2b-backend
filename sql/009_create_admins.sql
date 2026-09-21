-- Step 1 (admin auth) — admin accounts with hashed passwords.
CREATE TABLE IF NOT EXISTS admins (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,   -- stored lowercased
  password_hash TEXT NOT NULL,          -- bcrypt hash (never a plain password)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);