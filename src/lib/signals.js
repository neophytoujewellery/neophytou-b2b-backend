// Phase 3 (evidence-based) — fetch a retailer's homepage and detect high-end vs
// negative jewellery signals in English AND Greek, to feed OpenAI real evidence.

const FETCH_TIMEOUT_MS = 10000;
const UA = 'Mozilla/5.0 (compatible; NeophytouBot/1.0; +https://www.neophytoujewellery.com)';

// Positive = points toward high-end fine/diamond jewellery (Neophytou's target).
const POSITIVE = [
  // English
  '18k', '18kt', '18 kt', '18 karat', '750', 'diamond', 'lab-grown', 'lab grown', 'labgrown',
  'brilliant', 'tennis bracelet', 'tennis necklace', 'engagement', 'bridal', 'solitaire',
  'carat', 'luxury', 'white gold', 'yellow gold', 'rose gold', 'fine jewel',
  // Greek
  'διαμ', 'μπριγιαν', 'μπριγιάν', 'λευκόχρυσ', 'λευκοχρυσ', 'αρραβ', 'νυφικ',
  'μονόπετρ', 'μονοπετρ', 'καρατ', 'καράτ', 'πολύτιμ', 'πολυτιμ', 'χρυσ',
];

// Negative = points away (costume / steel / silver-only / plated / pawn).
const NEGATIVE = [
  // English
  'stainless', 'steel', 'costume', 'fashion jewel', 'fashion accessor', 'plated',
  'gold plated', 'silver plated', 'sterling silver', '925 silver', 'pawn', 'cash for gold',
  // Greek
  'ατσαλι', 'ατσάλι', 'ασημ', 'ασήμ', 'επιχρυσ', 'ενεχυρ', 'ενεχυροδαν',
];

// Name clearly indicates a jewellery business (EN + GR + a few EU languages for later).
const JEWELLERY_NAME = /jewel|joyer|gioieller|bijou|schmuck|κοσμημ|κοσμήμ|κόσμημ|χρυσοχ/i;

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

// Build up to 2 candidate URLs: original + scheme-swapped (recovers http-only sites).
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
 * @returns {Promise<{id, name, domain, city, signals_positive, signals_negative, snippet, fetched, name_is_jewellery}>}
 */
export async function collectEvidence(lead) {
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
    name_is_jewellery: JEWELLERY_NAME.test(name),
  };

  if (!lead.website) return item;

  const text = await fetchText(lead.website);
  if (!text) return item;

  const low = text.toLowerCase();
  item.signals_positive = POSITIVE.filter((k) => low.includes(k));
  item.signals_negative = NEGATIVE.filter((k) => low.includes(k));
  item.snippet = text.replace(/\s+/g, ' ').trim().slice(0, 700);
  item.fetched = true;
  return item;
}