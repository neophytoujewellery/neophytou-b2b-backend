import 'dotenv/config';
import pool from '../src/db/pool.js';
import { getSetting } from '../src/lib/settings.js';
import { generateDraft } from '../src/lib/draft.js';

const CONCURRENCY = 3;

async function run() {
  const base = await getSetting('outreach_base');

  // Optional limit: how many drafts to write this run (0 / missing = all).
  const limit = parseInt(process.argv.find((a) => /^\d+$/.test(a)) || '0', 10);
  const limitClause = limit > 0 ? `LIMIT ${limit}` : '';

  // Draft for selected + valid-email leads that aren't already approved (don't overwrite approvals).
  const { rows: leads } = await pool.query(
    `SELECT id, business_name, city, website, country FROM leads
     WHERE send_selected = true AND email_valid = 'valid'
       AND (draft_status IS NULL OR draft_status <> 'approved')
     ORDER BY fit_score DESC ${limitClause}`
  );

  if (leads.length === 0) {
    console.log('No selected leads need drafts (none selected, or all already approved).');
    await pool.end();
    return;
  }

  console.log(`\n✍️  Generating ${leads.length} draft(s) from your base message...\n`);

  let done = 0;
  let failed = 0;
  let idx = 0;

  async function worker() {
    while (idx < leads.length) {
      const lead = leads[idx++];
      try {
        const { subject, body } = await generateDraft(lead, base);
        await pool.query(
          `UPDATE leads SET draft_subject = $1, draft_body = $2, draft_status = 'generated', draft_at = now() WHERE id = $3`,
          [subject, body, lead.id]
        );
        done++;
        console.log(`   ✅ ${lead.business_name}`);
      } catch (err) {
        failed++;
        console.log(`   ❌ ${lead.business_name}: ${err.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\n──────── DRAFT SUMMARY ────────`);
  console.log(`Generated : ${done}`);
  console.log(`Failed    : ${failed}`);
  console.log(`Next: review & approve them in the dashboard, then send.`);

  await pool.end();
}

run().catch(async (err) => {
  console.error('Fatal:', err.message);
  await pool.end();
  process.exit(1);
});