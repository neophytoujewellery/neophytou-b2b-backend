// Phase 3/7 — fetch a retailer's homepage and detect high-end vs negative
// jewellery signals, using per-country keyword sets from the country registry.

import { signalsFor, countryKey } from '../data/countries.js';

const FETCH_TIMEOUT_MS = 10000;
const UA = 'Mozilla/5.0 (compatible; NeophytouBot/1.0; +https://www.neophytoujewellery.com)';

export function domainOf(website) {
  if (!website) return '';
  try {
    const u = /^https?:\/\//i.test(website) ? website : 'https://' + website;
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return String(website);
  }
}

function normaliseUrl(website) {
  try {
    let u = String(website).trim();
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    return new URL(u).href;
  } catch {
    return null;
  }
}

function altUrls(href) {
  const set = new Set([href]);
  try {
    const u = new URL(href);
    const swapped = new URL(href);
    swapped.protocol = u.protocol === 'https:' ? 'http:' : 'https:';
    set.add(swapped.href);
  } catch {
    /* ignore */
  }
  return [...set].slice(0, 2);
}

async function fetchOne(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
    });
    const ctype = res.headers.get('content-type') || '';
    if (!res.ok || !ctype.includes('text/html')) return null;
    const html = await res.text();
    return html
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(website) {
  const primary = normaliseUrl(website);
  if (!primary) return null;
  for (const url of altUrls(primary)) {
    const txt = await fetchOne(url);
    if (txt) return txt;
  }
  return null;
}

/**
 * Build the evidence bundle for one lead (fetches the homepage if it has a website).
 * Country is taken from the lead's `country` field (defaults to Greece).
 * @returns {Promise<{id,name,domain,city,signals_positive,signals_negative,snippet,fetched,name_is_jewellery}>}
 */
export async function collectEvidence(lead) {
  const { positive, negative, jewelleryName } = signalsFor(countryKey(lead.country));

  const name = lead.business_name || '';
  const item = {
    id: lead.id,
    name,
    domain: domainOf(lead.website),
    city: lead.city || '',
    signals_positive: [],
    signals_negative: [],
    snippet: '',
    fetched: false,
    name_is_jewellery: jewelleryName.test(name),
  };

  if (!lead.website) return item;

  const text = await fetchText(lead.website);
  if (!text) return item;

  const low = text.toLowerCase();
  item.signals_positive = positive.filter((k) => low.includes(k));
  item.signals_negative = negative.filter((k) => low.includes(k));
  item.snippet = text.replace(/\s+/g, ' ').trim().slice(0, 700);
  item.fetched = true;
  return item;
}