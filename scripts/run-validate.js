import 'dotenv/config';
import pool from '../src/db/pool.js';
import env from '../src/config/env.js';
import { validateEmail } from '../src/lib/validate.js';
import { hunterVerify } from '../src/lib/hunter.js';

const CONCURRENCY = 8;

async function freePass() {
  const { rows } = await pool.query(
    `SELECT id, email FROM leads
     WHERE email IS NOT NULL AND email_valid IS NULL ORDER BY id`
  );
  if (rows.length === 0) {
    console.log('Free pass: nothing new to validate.');
    return;
  }

  console.log(`\n🔍 Free MX validation: ${rows.length} email(s)...`);
  const counts = { valid: 0, invalid: 0, unknown: 0, role: 0 };

  let idx = 0;
  async function worker() {
    while (idx < rows.length) {
      const lead = rows[idx++];
      const r = await validateEmail(lead.email);
      await pool.query(
        `UPDATE leads SET email_valid = $1, email_is_role = $2, email_check_method = $3, email_checked_at = now()
         WHERE id = $4`,
        [r.status, r.role, r.method, lead.id]
      );
      counts[r.status] = (counts[r.status] || 0) + 1;
      if (r.role) counts.role++;
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`   valid ${counts.valid} | invalid ${counts.invalid} | unknown ${counts.unknown}  (role addresses: ${counts.role})`);
}

async function hunterPass(limit) {
  if (!env.HUNTER_API_KEY) {
    console.log('\nHunter pass skipped — HUNTER_API_KEY not set in .env. (Free results are saved.)');
    return;
  }

  const { rows } = await pool.query(
    `SELECT id, email FROM leads
     WHERE email IS NOT NULL AND email_valid = 'unknown' ORDER BY id LIMIT $1`,
    [limit]
  );
  if (rows.length === 0) {
    console.log('\nHunter pass: no "unknown" emails to deep-verify.');
    return;
  }

  console.log(`\n🕵️  Hunter deep-verify: up to ${rows.length} unknown email(s) (limit ${limit})...`);
  let ok = 0;
  for (const lead of rows) {
    try {
      const r = await hunterVerify(lead.email);
      await pool.query(
        `UPDATE leads SET email_valid = $1, email_check_method = $2, email_checked_at = now() WHERE id = $3`,
        [r.status, r.method, lead.id]
      );
      ok++;
    } catch (err) {
      // Likely quota exhausted or key issue — stop to avoid wasting calls.
      console.log(`   ${lead.email}: ❌ ${err.message} (stopping Hunter pass)`);
      break;
    }
  }
  console.log(`   Hunter verified: ${ok}`);
}

async function run() {
  const args = process.argv.slice(2);
  const doHunter = args.includes('--hunter');
  const hunterLimit = parseInt(args.find((a) => /^\d+$/.test(a)) || '25', 10);

  await freePass();
  if (doHunter) await hunterPass(hunterLimit);

  const { rows: dist } = await pool.query(
    `SELECT email_valid, count(*)::int AS n FROM leads WHERE email IS NOT NULL
     GROUP BY email_valid ORDER BY n DESC`
  );
  const { rows: sendable } = await pool.query(
    `SELECT count(*)::int AS n FROM leads WHERE email_valid = 'valid' AND fit_score >= 45`
  );
  const { rows: hiSend } = await pool.query(
    `SELECT count(*)::int AS n FROM leads WHERE email_valid = 'valid' AND fit_category = 'fine_diamond'`
  );

  console.log(`\n──────── VALIDATION SUMMARY ────────`);
  for (const r of dist) console.log(`   ${String(r.n).padStart(4)}  ${r.email_valid || '(unchecked)'}`);
  console.log(`\nValid email + fit>=45 (sendable pool) : ${sendable[0].n}`);
  console.log(`Valid email + fine_diamond (tier 1)   : ${hiSend[0].n}`);

  await pool.end();
}

run().catch(async (err) => {
  console.error('Fatal:', err.message);
  await pool.end();
  process.exit(1);
});