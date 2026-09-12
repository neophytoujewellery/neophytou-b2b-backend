import 'dotenv/config';
import pool from '../src/db/pool.js';
import { enrichWebsite } from '../src/lib/enrich.js';

const CONCURRENCY = 5; // gentle parallelism — polite to sites, still fast

async function run() {
  const limit = parseInt(process.argv[2] || '0', 10); // 0 = all pending
  const limitClause = limit > 0 ? `LIMIT ${limit}` : '';

  const { rows: leads } = await pool.query(
    `SELECT id, business_name, website FROM leads
     WHERE website IS NOT NULL AND enrichment_status = 'pending'
     ORDER BY id ${limitClause}`
  );

  if (leads.length === 0) {
    console.log('No pending leads with a website to enrich. ✅');
    await pool.end();
    return;
  }

  console.log(`\n🌐 Enriching ${leads.length} website(s) (concurrency ${CONCURRENCY})...\n`);

  let processed = 0;
  let withEmail = 0;
  let withIg = 0;
  let failed = 0;

  let idx = 0;
  async function worker() {
    while (idx < leads.length) {
      const lead = leads[idx++];
      const n = idx;
      try {
        const { email, instagram, status } = await enrichWebsite(lead.website);
        await pool.query(
          `UPDATE leads SET email = $1, instagram = $2, enrichment_status = $3, enriched_at = now() WHERE id = $4`,
          [email, instagram, status, lead.id]
        );
        processed++;
        if (email) withEmail++;
        if (instagram) withIg++;
        if (status !== 'done') failed++;
        console.log(`   [${n}/${leads.length}] ${(lead.business_name || lead.website).slice(0, 40)} → ${email || '—'} ${instagram ? '📷' : ''}`);
      } catch (err) {
        failed++;
        await pool.query(`UPDATE leads SET enrichment_status = 'failed', enriched_at = now() WHERE id = $1`, [lead.id]);
        console.log(`   [${n}/${leads.length}] ${lead.business_name} → ERROR ${err.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const { rows: emailCount } = await pool.query(`SELECT count(*)::int AS n FROM leads WHERE email IS NOT NULL`);
  const { rows: enrichedCount } = await pool.query(`SELECT count(*)::int AS n FROM leads WHERE enrichment_status <> 'pending'`);
  const { rows: pendingCount } = await pool.query(`SELECT count(*)::int AS n FROM leads WHERE website IS NOT NULL AND enrichment_status = 'pending'`);

  console.log(`\n──────── ENRICHMENT SUMMARY ────────`);
  console.log(`Processed this run       : ${processed}`);
  console.log(`   found email           : ${withEmail}`);
  console.log(`   found instagram       : ${withIg}`);
  console.log(`   fetch failed/no data  : ${failed}`);
  console.log(`Leads with email (DB)    : ${emailCount[0].n}`);
  console.log(`Enriched so far (DB)     : ${enrichedCount[0].n}`);
  console.log(`Still pending (has site) : ${pendingCount[0].n}`);

  await pool.end();
}

run().catch(async (err) => {
  console.error('Fatal:', err.message);
  await pool.end();
  process.exit(1);
});