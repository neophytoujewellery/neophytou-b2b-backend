import env from '../config/env.js';

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';

// Only the fields we actually need. Google bills each request at the HIGHEST
// SKU tier among the requested fields, so keeping this mask tight is the single
// biggest lever on cost. (phone + website put us in the Enterprise tier, which
// still has ~1,000 free requests/month — plenty for one country batch.)
// NOTE: request filters like includedType do NOT change the price — only fields do.
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'nextPageToken',
].join(',');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Run a Text Search (New) query, following pagination up to `maxPages` pages
 * (Google returns max 20 results/page, 3 pages = 60 results per query).
 *
 * @param {string} query
 * @param {object} opts
 * @param {string}  [opts.languageCode='el']
 * @param {string}  [opts.regionCode='GR']
 * @param {number}  [opts.maxPages=3]
 * @param {string}  [opts.includedType]         e.g. 'jewelry_store' to restrict by place type
 * @param {boolean} [opts.strictTypeFiltering]  true = only return exact includedType matches
 * @returns {Promise<{places: Array, requests: number}>} requests = billable API calls made.
 */
export async function textSearch(
  query,
  { languageCode = 'el', regionCode = 'GR', maxPages = 3, includedType = null, strictTypeFiltering = false } = {}
) {
  const all = [];
  let pageToken = null;
  let requests = 0;

  for (let page = 0; page < maxPages; page++) {
    const body = { textQuery: query, languageCode, regionCode };
    if (includedType) body.includedType = includedType;
    if (strictTypeFiltering) body.strictTypeFiltering = true;
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
    });
    requests++;

    const data = await res.json();
    if (!res.ok) {
      const msg = data.error?.message || JSON.stringify(data);
      throw new Error(`Places API ${res.status}: ${msg}`);
    }

    for (const p of data.places || []) {
      all.push({
        placeId: p.id,
        name: p.displayName?.text || null,
        address: p.formattedAddress || null,
        phone: p.nationalPhoneNumber || null,
        website: p.websiteUri || null,
      });
    }

    pageToken = data.nextPageToken || null;
    if (!pageToken) break;
    await sleep(2000); // give the next page token a moment to become valid
  }

  return { places: all, requests };
}