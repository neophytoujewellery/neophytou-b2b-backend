import 'dotenv/config';
import pool from '../src/db/pool.js';
import { suppress, isSuppressed } from '../src/lib/suppression.js';

async function run() {
  const email = process.argv[2];
  const reason = process.argv[3] || 'manual';

  if (!email) {
    console.error('Usage: node scripts/suppress.js <email> [reason]');
    console.error('Example: node scripts/suppress.js someone@example.com manual');
    process.exit(1);
  }

  const added = await suppress(email, reason, 'manual-cli');
  const blocked = await isSuppressed(email);

  console.log(added ? `✅ Suppressed ${email} (${reason}).` : `ℹ️  ${email} was already suppressed.`);
  console.log(`   isSuppressed("${email}") → ${blocked}`);

  await pool.end();
}

run().catch(async (err) => {
  console.error('Fatal:', err.message);
  await pool.end();
  process.exit(1);
});