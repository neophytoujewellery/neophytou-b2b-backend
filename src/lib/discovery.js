import pool from '../db/pool.js';
import { textSearch } from './places.js';
import { COUNTRIES } from '../data/countries.js';

// Label stored for the PRIMARY (type-filtered) pass. Universal across countries.
const TYPE_LABEL = 'jewelry_store [type]';

// Don't re-run the same (city, label) within this many days — avoids redundant paid calls.
const SKIP_IF_RUN_WITHIN_DAYS = 7;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function alreadyRun(country, city, label, force) {
  if (force) return false;
  const { rows } = await pool.query(
    `SELECT 1 FROM search_runs
     WHERE country = $1 AND city = $2 AND search_term = $3
       AND ran_at > now() - make_interval(days => $4)
     LIMIT 1`,
    [country, city, label, SKIP_IF_RUN_WITHIN_DAYS]
  );
  return rows.length > 0;
}

async function insertLeads(places, country, city, label) {
  let inserted = 0;
  for (const p of places) {
    if (!p.placeId) continue;
    const res = await pool.query(
      `INSERT INTO leads (place_id, business_name, address, phone, website, country, city, search_term)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (place_id) DO NOTHING`,
      [p.placeId, p.name, p.address, p.phone, p.website, country, city, label]
    );
    inserted += res.rowCount;
  }
  return inserted;
}

/**
 * Discover jewellery retailers in one city using a two-pass strategy:
 *   1) PRIMARY  — type-filtered (jewelry_store, strict) to cut noise
 *   2) SECONDARY — local-language keyword terms (no filter) to catch miscategorised shops
 *
 * @param {string} city
 * @param {object} [opts]
 * @param {boolean} [opts.force]
 * @param {boolean} [opts.log=true]
 * @param {string}  [opts.country='greece']  registry key (greece, italy, ...)
 * @returns {Promise<{requests:number, results:number, inserted:number}>}
 */
export async function discoverCity(city, { force = false, log = true, country = 'greece' } = {}) {
  const c = COUNTRIES[country];
  if (!c) throw new Error(`Unknown country: ${country}`);

  const passes = [
    // PRIMARY (type-filtered, strict)
    {
      label: TYPE_LABEL,
      query: `${c.typeQuery} ${city} ${c.name}`,
      opts: {
        languageCode: c.languageCode,
        regionCode: c.regionCode,
        includedType: 'jewelry_store',
        strictTypeFiltering: true,
      },
    },
    // SECONDARY (keyword, no filter)
    ...c.searchTerms.map((term) => ({
      label: term,
      query: `${term} ${city} ${c.name}`,
      opts: { languageCode: c.languageCode, regionCode: c.regionCode },
    })),
  ];

  const totals = { requests: 0, results: 0, inserted: 0 };
  if (log) console.log(`🔎 ${city}, ${c.name}`);

  for (const pass of passes) {
    if (await alreadyRun(c.name, city, pass.label, force)) {
      if (log) console.log(`   ⏭️  ${pass.label} — already run within ${SKIP_IF_RUN_WITHIN_DAYS}d (FORCE=1 to re-run)`);
      continue;
    }

    let places = [];
    let requests = 0;
    try {
      ({ places, requests } = await textSearch(pass.query, pass.opts));
    } catch (err) {
      if (log) console.log(`   ❌ ${pass.label}: ${err.message}`);
      continue;
    }

    const inserted = await insertLeads(places, c.name, city, pass.label);
    await pool.query(
      `INSERT INTO search_runs (country, city, search_term, requests, results, inserted)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [c.name, city, pass.label, requests, places.length, inserted]
    );

    totals.requests += requests;
    totals.results += places.length;
    totals.inserted += inserted;
    if (log) console.log(`   • ${pass.label}: ${places.length} found, ${inserted} new (${requests} req)`);
    await sleep(400);
  }

  return totals;
}