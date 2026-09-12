// Phase 2 — visit a retailer's website and pull public business contact info.
// Free / self-hosted (native fetch), light footprint: homepage + up to 2 contact pages.

const FETCH_TIMEOUT_MS = 12000;
const UA = 'Mozilla/5.0 (compatible; NeophytouBot/1.0; +https://www.neophytoujewellery.com)';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Strings that indicate a junk / non-business email we should ignore.
const EMAIL_BLOCKLIST = [
  'example.com', 'example.org', 'domain.com', 'yourdomain', 'email.com', 'test.com',
  'sentry.io', 'wixpress.com', 'schema.org', 'godaddy', 'w3.org',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(url) {
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
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function normaliseUrl(website) {
  try {
    let u = String(website).trim();
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    return new URL(u);
  } catch {
    return null;
  }
}

// Find likely "contact" pages (English + Greek) from homepage links.
function findContactLinks(html, baseUrl) {
  const links = new Set();
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const low = m[1].toLowerCase();
    if (low.includes('contact') || low.includes('epikoin') || low.includes('%cf') || low.includes('επικοιν')) {
      try { links.add(new URL(m[1], baseUrl).href); } catch { /* ignore */ }
    }
  }
  return [...links].slice(0, 2);
}

function extractEmails(html, siteDomain) {
  const found = new Set();

  // mailto: links are the most reliable
  const mailtoRe = /mailto:([^"'?>\s]+)/gi;
  let m;
  while ((m = mailtoRe.exec(html)) !== null) {
    try { found.add(decodeURIComponent(m[1]).toLowerCase()); } catch { found.add(m[1].toLowerCase()); }
  }

  // plain-text emails in the page body
  const text = html.replace(/<[^>]+>/g, ' ');
  for (const e of text.match(EMAIL_RE) || []) found.add(e.toLowerCase());

  const clean = [...found].filter((e) => e.length <= 100 && !EMAIL_BLOCKLIST.some((b) => e.includes(b)));
  if (clean.length === 0) return null;

  // Prefer an email on the site's own domain (real business email),
  // then generic inboxes like info@ / contact@.
  const onDomain = siteDomain ? clean.filter((e) => e.endsWith('@' + siteDomain)) : [];
  const pool = onDomain.length ? onDomain : clean;
  const rank = (e) => (/^(info|contact|sales|hello|shop|eshop|orders)@/.test(e) ? 0 : 1);
  pool.sort((a, b) => rank(a) - rank(b));
  return pool[0];
}

function extractInstagram(html) {
  const m = html.match(/https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)/i);
  if (!m) return null;
  const handle = m[1].toLowerCase();
  if (['p', 'reel', 'reels', 'explore', 'accounts', 'about', 'developer'].includes(handle)) return null;
  return `https://instagram.com/${m[1]}`;
}

/**
 * Enrich one website.
 * @returns {Promise<{email: string|null, instagram: string|null, status: string}>}
 *   status: 'done' | 'failed' | 'bad_url'
 */
export async function enrichWebsite(website) {
  const urlObj = normaliseUrl(website);
  if (!urlObj) return { email: null, instagram: null, status: 'bad_url' };

  const siteDomain = urlObj.hostname.replace(/^www\./, '');
  const homeHtml = await fetchPage(urlObj.href);
  if (!homeHtml) return { email: null, instagram: null, status: 'failed' };

  let email = extractEmails(homeHtml, siteDomain);
  let instagram = extractInstagram(homeHtml);

  if (!email) {
    for (const link of findContactLinks(homeHtml, urlObj.href)) {
      const html = await fetchPage(link);
      if (!html) continue;
      email = extractEmails(html, siteDomain);
      if (!instagram) instagram = extractInstagram(html);
      if (email) break;
      await sleep(200);
    }
  }

  return { email, instagram, status: 'done' };
}