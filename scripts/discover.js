import 'dotenv/config';
import pool from '../src/db/pool.js';
import { discoverCity } from '../src/lib/discovery.js';

async function run() {
  const city = process.argv[2];
  if (!city) {
    console.error('Usage: node scripts/discover.js "<City>"');
    console.error('Example: node scripts/discover.js "Ioannina"');
    process.exit(1);
  }

  const force = process.env.FORCE === '1';
  console.log('');
  const t = await discoverCity(city, { force, log: true });

  const { rows: sample } = await pool.query(
    `SELECT business_name, phone, website FROM leads WHERE city = $1 ORDER BY id DESC LIMIT 10`,
    [city]
  );
  const { rows: cityCount } = await pool.query(`SELECT count(*)::int AS n FROM leads WHERE city = $1`, [city]);
  const { rows: totalCount } = await pool.query(`SELECT count(*)::int AS n FROM leads`);

  console.log(`\n──────── SUMMARY (${city}) ────────`);
  console.log(`API requests used this run : ${t.requests}`);
  console.log(`Results returned           : ${t.results}`);
  console.log(`New leads inserted         : ${t.inserted}`);
  console.log(`Total leads for ${city}    : ${cityCount[0].n}`);
  console.log(`Total leads in database    : ${totalCount[0].n}`);

  console.log(`\nSample (latest 10 in ${city}):`);
  for (const r of sample) {
    console.log(`   • ${r.business_name || '(no name)'}`);
    console.log(`       phone: ${r.phone || '—'}   web: ${r.website || '—'}`);
  }

  await pool.end();
}

run().catch(async (err) => {
  console.error('Fatal:', err.message);
  await pool.end();
  process.exit(1);
});