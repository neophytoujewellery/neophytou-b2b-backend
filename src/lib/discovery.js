import pool from '../db/pool.js';
import { textSearch } from './places.js';

const COUNTRY = 'Greece';
const REGION_CODE = 'GR';
const LANGUAGE_CODE = 'el';

// SECONDARY pass — local-language keyword terms, NO type filter.
// Catches real jewellers that Google may have miscategorised.
export const SEARCH_TERMS = [
  'κοσμηματοπωλείο', // jewellery shop
  'κοσμήματα',       // jewellery
  'χρυσοχοείο',      // goldsmith / jeweller
];

// Label stored in leads.search_term / search_runs for the PRIMARY (type-filtered) pass.
const TYPE_LABEL = 'jewelry_store [type]';

// Don't re-run the same (city, label) within this many days — avoids redundant paid calls.
const SKIP_IF_RUN_WITHIN_DAYS = 7;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function alreadyRun(city, label, force) {
  if (force) return false;
  const { rows } = await pool.query(
    `SELECT 1 FROM search_runs
     WHERE country = $1 AND city = $2 AND search_term = $3
       AND ran_at > now() - make_interval(days => $4)
     LIMIT 1`,
    [COUNTRY, city, label, SKIP_IF_RUN_WITHIN_DAYS]
  );
  return rows.length > 0;
}

async function insertLeads(places, city, label) {
  let inserted = 0;
  for (const p of places) {
    if (!p.placeId) continue;
    const res = await pool.query(
      `INSERT INTO leads (place_id, business_name, address, phone, website, country, city, search_term)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (place_id) DO NOTHING`,
      [p.placeId, p.name, p.address, p.phone, p.website, COUNTRY, city, label]
    );
    inserted += res.rowCount;
  }
  return inserted;
}

/**
 * Discover jewellery retailers in one city using a two-pass strategy:
 *   1) PRIMARY  — type-filtered (jewelry_store, strict) to cut noise
 *   2) SECONDARY — local-language keyword terms (no filter) to catch miscategorised shops
 * Both passes de-duplicate/merge into the same `leads` table via ON CONFLICT.
 *
 * @returns {Promise<{requests:number, results:number, inserted:number}>}
 */
export async function discoverCity(city, { force = false, log = true } = {}) {
  const passes = [
    // PRIMARY (type-filtered, strict)
    {
      label: TYPE_LABEL,
      query: `κοσμήματα ${city} ${COUNTRY}`,
      opts: {
        languageCode: LANGUAGE_CODE,
        regionCode: REGION_CODE,
        includedType: 'jewelry_store',
        strictTypeFiltering: true,
      },
    },
    // SECONDARY (keyword, no filter)
    ...SEARCH_TERMS.map((term) => ({
      label: term,
      query: `${term} ${city} ${COUNTRY}`,
      opts: { languageCode: LANGUAGE_CODE, regionCode: REGION_CODE },
    })),
  ];

  const totals = { requests: 0, results: 0, inserted: 0 };
  if (log) console.log(`🔎 ${city}, ${COUNTRY}`);

  for (const pass of passes) {
    if (await alreadyRun(city, pass.label, force)) {
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

    const inserted = await insertLeads(places, city, pass.label);
    await pool.query(
      `INSERT INTO search_runs (country, city, search_term, requests, results, inserted)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [COUNTRY, city, pass.label, requests, places.length, inserted]
    );

    totals.requests += requests;
    totals.results += places.length;
    totals.inserted += inserted;
    if (log) console.log(`   • ${pass.label}: ${places.length} found, ${inserted} new (${requests} req)`);
    await sleep(400);
  }

  return totals;
}