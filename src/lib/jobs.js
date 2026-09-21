import pool from '../db/pool.js';

export async function createJob(type, params) {
  const { rows } = await pool.query(
    `INSERT INTO jobs (type, params, status) VALUES ($1, $2, 'queued') RETURNING id`,
    [type, params || {}]
  );
  return rows[0].id;
}

export async function setStatus(id, status, exitCode = null) {
  await pool.query(
    `UPDATE jobs SET status = $2, exit_code = $3,
       finished_at = CASE WHEN $2 IN ('done','failed') THEN now() ELSE finished_at END
     WHERE id = $1`,
    [id, status, exitCode]
  );
}

export async function appendLog(id, chunk) {
  await pool.query(`UPDATE jobs SET log = log || $2 WHERE id = $1`, [id, chunk]);
}

export async function getJob(id) {
  const { rows } = await pool.query(
    `SELECT id, type, status, exit_code, created_at, finished_at, log FROM jobs WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function listJobs(limit = 20) {
  const { rows } = await pool.query(
    `SELECT id, type, status, exit_code, created_at, finished_at FROM jobs ORDER BY id DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

/** Returns the id of any queued/running job, or null. Used to enforce one-at-a-time. */
export async function runningJobId() {
  const { rows } = await pool.query(`SELECT id FROM jobs WHERE status IN ('queued','running') ORDER BY id DESC LIMIT 1`);
  return rows[0]?.id ?? null;
}