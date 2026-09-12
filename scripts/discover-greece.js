import 'dotenv/config';
import pool from '../src/db/pool.js';
import { discoverCity } from '../src/lib/discovery.js';
import { GREECE_CITIES } from '../src/data/greece-cities.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const force = process.env.FORCE === '1';
  const only = process.argv[2]; // optional: run just one city, e.g. node scripts/discover-greece.js "Athens"
  const cities = only ? [only] : GREECE_CITIES;

  console.log(`\n🇬🇷 Full Greece discovery — ${cities.length} cit${cities.length === 1 ? 'y' : 'ies'}${force ? ' (FORCE)' : ''}\n`);

  const grand = { requests: 0, results: 0, inserted: 0 };
  let i = 0;
  for (const city of cities) {
    i++;
    process.stdout.write(`[${i}/${cities.length}] `);
    const t = await discoverCity(city, { force, log: true });
    grand.requests += t.requests;
    grand.results += t.results;
    grand.inserted += t.inserted;
    await sleep(800); // gentle pacing between cities
  }

  const { rows: totalCount } = await pool.query(`SELECT count(*)::int AS n FROM leads`);
  const { rows: withWeb } = await pool.query(`SELECT count(*)::int AS n FROM leads WHERE website IS NOT NULL`);
  const { rows: withPhone } = await pool.query(`SELECT count(*)::int AS n FROM leads WHERE phone IS NOT NULL`);
  const { rows: byCity } = await pool.query(
    `SELECT city, count(*)::int AS n FROM leads GROUP BY city ORDER BY n DESC`
  );

  console.log(`\n════════ GREECE BATCH COMPLETE ════════`);
  console.log(`API requests used this run : ${grand.requests}   (Enterprise free cap ≈ 1,000/month)`);
  console.log(`New leads inserted         : ${grand.inserted}`);
  console.log(`Total leads in database    : ${totalCount[0].n}`);
  console.log(`   with website            : ${withWeb[0].n}`);
  console.log(`   with phone              : ${withPhone[0].n}`);

  console.log(`\nLeads by city:`);
  for (const r of byCity) {
    console.log(`   ${String(r.n).padStart(4)}  ${r.city}`);
  }

  if (grand.requests > 900) {
    console.log(`\n⚠️  Used ${grand.requests} requests this month — close to the 1,000 free cap. Further runs may start billing.`);
  }

  await pool.end();
}

run().catch(async (err) => {
  console.error('Fatal:', err.message);
  await pool.end();
  process.exit(1);
});