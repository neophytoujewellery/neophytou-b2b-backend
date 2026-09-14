import 'dotenv/config';
import pool from '../src/db/pool.js';
import { discoverCity } from '../src/lib/discovery.js';
import { COUNTRIES } from '../src/data/countries.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const force = process.env.FORCE === '1';
  const countryKey = (process.argv[2] || 'greece').toLowerCase();
  const onlyCity = process.argv[3]; // optional: one city

  const c = COUNTRIES[countryKey];
  if (!c) {
    console.error(`Unknown country "${countryKey}". Available: ${Object.keys(COUNTRIES).join(', ')}`);
    process.exit(1);
  }

  const cities = onlyCity ? [onlyCity] : c.cities;
  console.log(`\n🌍 ${c.name} discovery — ${cities.length} cit${cities.length === 1 ? 'y' : 'ies'}${force ? ' (FORCE)' : ''}\n`);

  const grand = { requests: 0, results: 0, inserted: 0 };
  let i = 0;
  for (const city of cities) {
    i++;
    process.stdout.write(`[${i}/${cities.length}] `);
    const t = await discoverCity(city, { force, log: true, country: countryKey });
    grand.requests += t.requests;
    grand.results += t.results;
    grand.inserted += t.inserted;
    await sleep(800);
  }

  const { rows: total } = await pool.query(`SELECT count(*)::int AS n FROM leads WHERE country = $1`, [c.name]);
  const { rows: withWeb } = await pool.query(`SELECT count(*)::int AS n FROM leads WHERE country = $1 AND website IS NOT NULL`, [c.name]);

  console.log(`\n════════ ${c.name.toUpperCase()} BATCH COMPLETE ════════`);
  console.log(`API requests used this run : ${grand.requests}`);
  console.log(`New leads inserted         : ${grand.inserted}`);
  console.log(`Total leads for ${c.name}  : ${total[0].n}  (with website: ${withWeb[0].n})`);
  if (grand.requests > 900) {
    console.log(`\n⚠️  Used ${grand.requests} requests this month — close to the 1,000 free cap.`);
  }

  await pool.end();
}

run().catch(async (err) => {
  console.error('Fatal:', err.message);
  await pool.end();
  process.exit(1);
});