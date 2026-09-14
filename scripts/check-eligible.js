import 'dotenv/config';
import pool from '../src/db/pool.js';
import { loadSuppressedSet } from '../src/lib/suppression.js';
import { checkEligible } from '../src/lib/eligibility.js';

async function run() {
  const suppressedSet = await loadSuppressedSet();

  const { rows } = await pool.query(
    `SELECT id, email, email_valid, do_not_contact, campaign_status, emails_sent, fit_score, fit_category
     FROM leads WHERE fit_score >= 45 ORDER BY fit_score DESC`
  );

  const counts = { eligible: 0, invalid_email: 0, do_not_contact: 0, suppressed: 0, already_sent: 0 };
  let eligibleFine = 0;

  for (const lead of rows) {
    const { eligible, reason } = await checkEligible(lead, { suppressedSet });
    if (eligible) {
      counts.eligible++;
      if (lead.fit_category === 'fine_diamond') eligibleFine++;
    } else {
      counts[reason] = (counts[reason] || 0) + 1;
    }
  }

  console.log(`\n──────── ELIGIBILITY REPORT (qualified leads, fit >= 45) ────────`);
  console.log(`Total qualified checked : ${rows.length}`);
  console.log(`✅ ELIGIBLE to send     : ${counts.eligible}   (fine_diamond: ${eligibleFine})`);
  console.log(`\nNot eligible, by reason:`);
  console.log(`   invalid_email  : ${counts.invalid_email}`);
  console.log(`   do_not_contact : ${counts.do_not_contact}`);
  console.log(`   suppressed     : ${counts.suppressed}`);
  console.log(`   already_sent   : ${counts.already_sent}`);

  await pool.end();
}

run().catch(async (err) => {
  console.error('Fatal:', err.message);
  await pool.end();
  process.exit(1);
});