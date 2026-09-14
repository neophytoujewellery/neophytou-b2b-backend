import pool from '../db/pool.js';

const norm = (e) => String(e || '').trim().toLowerCase();

/**
 * Is this email permanently blocked? (No email = treated as blocked.)
 */
export async function isSuppressed(email) {
  const e = norm(email);
  if (!e) return true;
  const { rows } = await pool.query('SELECT 1 FROM suppression WHERE email = $1 LIMIT 1', [e]);
  return rows.length > 0;
}

/**
 * Permanently block an email. Idempotent. Also flags any matching lead as do_not_contact.
 * @returns {Promise<boolean>} true if newly added, false if it was already suppressed.
 */
export async function suppress(email, reason, source = null) {
  const e = norm(email);
  if (!e) return false;

  const res = await pool.query(
    `INSERT INTO suppression (email, reason, source) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING`,
    [e, reason, source]
  );

  // Keep the lead record consistent so it also shows as blocked in the Sheet.
  await pool.query(
    `UPDATE leads SET do_not_contact = true,
                      unsubscribed = CASE WHEN $2 = 'unsubscribe' THEN true ELSE unsubscribed END,
                      bounced      = CASE WHEN $2 = 'bounce'      THEN true ELSE bounced      END
     WHERE lower(email) = $1`,
    [e, reason]
  );

  return res.rowCount > 0;
}

/**
 * Load all suppressed emails into a Set for fast bulk checks before a send batch.
 */
export async function loadSuppressedSet() {
  const { rows } = await pool.query('SELECT email FROM suppression');
  return new Set(rows.map((r) => r.email));
}