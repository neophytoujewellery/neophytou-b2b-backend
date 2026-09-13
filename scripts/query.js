import 'dotenv/config';
import pool from '../src/db/pool.js';

// Usage:
//   node scripts/query.js "SELECT ... "        ← any SQL you type
//   node scripts/query.js                       ← default: top leads by fit_score
async function run() {
  const sql =
    process.argv[2] ||
    `SELECT business_name, fit_score, fit_category, fit_reason
     FROM leads
     WHERE scoring_status = 'done'
     ORDER BY fit_score DESC
     LIMIT 40`;

  try {
    const { rows } = await pool.query(sql);
    if (rows.length === 0) {
      console.log('(no rows)');
    } else {
      console.table(rows);
      console.log(`\n${rows.length} row(s).`);
    }
  } catch (err) {
    console.error('Query error:', err.message);
  } finally {
    await pool.end();
  }
}

run();