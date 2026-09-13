import 'dotenv/config';
import pool from '../src/db/pool.js';
import { collectEvidence } from '../src/lib/signals.js';
import { scoreLeads } from '../src/lib/score.js';

const BATCH = 8;             // leads per OpenAI call
const BATCH_CONCURRENCY = 2; // how many batches in flight at once

async function run() {
  const args = process.argv.slice(2);
  const rescore = args.includes('--rescore'); // re-score ALL leads, not just pending
  const limit = parseInt(args.find((a) => /^\d+$/.test(a)) || '0', 10);
  const limitClause = limit > 0 ? `LIMIT ${limit}` : '';
  const whereClause = rescore ? 'TRUE' : `scoring_status = 'pending'`;

  const { rows: leads } = await pool.query(
    `SELECT id, business_name, website, city FROM leads
     WHERE ${whereClause} ORDER BY id ${limitClause}`
  );

  if (leads.length === 0) {
    console.log('Nothing to score. ✅');
    await pool.end();
    return;
  }

  const batches = [];
  for (let i = 0; i < leads.length; i += BATCH) batches.push(leads.slice(i, i + BATCH));

  console.log(`\n🤖 Evidence-based scoring: ${leads.length} lead(s) in ${batches.length} batch(es)${rescore ? ' [rescore]' : ''}...\n`);

  let scored = 0;
  let failedBatches = 0;

  let bi = 0;
  async function worker() {
    while (bi < batches.length) {
      const myIndex = bi++;
      const batch = batches[myIndex];
      try {
        const evidence = await Promise.all(batch.map((lead) => collectEvidence(lead)));
        const results = await scoreLeads(evidence);
        let batchSaved = 0;
        for (const r of results) {
          const upd = await pool.query(
            `UPDATE leads SET fit_score = $1, fit_category = $2, fit_reason = $3,
                              scoring_status = 'done', scored_at = now() WHERE id = $4`,
            [r.fit_score, r.fit_category, r.fit_reason, r.id]
          );
          batchSaved += upd.rowCount;
        }
        scored += batchSaved;
        const fetched = evidence.filter((e) => e.fetched).length;
        console.log(`   batch ${myIndex + 1}/${batches.length}: ${batchSaved}/${batch.length} saved (${fetched} sites read)`);
      } catch (err) {
        failedBatches++;
        console.log(`   batch ${myIndex + 1}/${batches.length}: ❌ ${err.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: BATCH_CONCURRENCY }, worker));

  const { rows: dist } = await pool.query(
    `SELECT fit_category, count(*)::int AS n, round(avg(fit_score))::int AS avg
     FROM leads WHERE scoring_status = 'done'
     GROUP BY fit_category ORDER BY avg DESC`
  );
  const { rows: hi } = await pool.query(`SELECT count(*)::int AS n FROM leads WHERE fit_score >= 80`);
  const { rows: hiEmail } = await pool.query(`SELECT count(*)::int AS n FROM leads WHERE fit_score >= 80 AND email IS NOT NULL`);
  const { rows: mid } = await pool.query(`SELECT count(*)::int AS n FROM leads WHERE fit_score >= 45 AND fit_score < 80`);
  const { rows: pend } = await pool.query(`SELECT count(*)::int AS n FROM leads WHERE scoring_status = 'pending'`);

  console.log(`\n──────── SCORING SUMMARY ────────`);
  console.log(`Saved this run            : ${scored}`);
  console.log(`Failed batches            : ${failedBatches}`);
  console.log(`High-end (score >= 80)    : ${hi[0].n}   (with email: ${hiEmail[0].n})`);
  console.log(`Mid (45-79)               : ${mid[0].n}`);
  console.log(`Still pending             : ${pend[0].n}`);
  console.log(`\nBy category (count / avg score):`);
  for (const r of dist) {
    console.log(`   ${String(r.n).padStart(4)}  ${r.fit_category.padEnd(22)} avg ${r.avg}`);
  }

  await pool.end();
}

run().catch(async (err) => {
  console.error('Fatal:', err.message);
  await pool.end();
  process.exit(1);
});