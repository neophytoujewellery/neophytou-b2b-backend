// Phase 2 — visit a retailer's website and pull public business contact info.
// Free / self-hosted (native fetch), light footprint: homepage + up to 3 extra pages.
// v2: HTML-entity decode, [at]/[dot] de-obfuscation, script/style stripping, more page types.

const FETCH_TIMEOUT_MS = 12000;
const UA = 'Mozilla/5.0 (compatible; NeophytouBot/1.0; +https://www.neophytoujewellery.com)';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Strings that indicate a junk / non-business / infrastructure email we should ignore.
const EMAIL_BLOCKLIST = [
  'example.com', 'example.org', 'domain.com', 'yourdomain', 'email.com', 'test.com',
  'sentry.io', 'sentry', 'wixpress.com', 'wix.com', 'schema.org', 'godaddy', 'w3.org',
  'gstatic', 'googleapis', 'jsdelivr', 'cloudflare', 'fontawesome',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.css', '.js',
];

// Link keywords for extra pages worth checking (lower pri = checked first).
const LINK_KEYWORDS = [
  { kw: 'contact', pri: 0 },
  { kw: 'epikoin', pri: 0 },
  { kw: 'επικοιν', pri: 0 },
  { kw: 'about', pri: 1 },
  { kw: 'σχετικ', pri: 1 },
  { kw: 'impressum', pri: 1 },
  { kw: 'imprint', pri: 1 },
  { kw: 'terms', pri: 2 },
  { kw: 'όρο', pri: 2 },
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

function safeChar(code) {
  try { return String.fromCharCode(code); } catch { return ''; }
}

// Turn &#64; / &#x40; / &commat; etc. into real characters (a common email obfuscation).
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeChar(parseInt(d, 10)))
    .replace(/&commat;/gi, '@')
    .replace(/&period;/gi, '.')
    .replace(/&amp;/gi, '&');
}

// Turn "info [at] domain [dot] gr" / "info (at) domain (dot) gr" / "info @ domain . gr" into a real address.
function deobfuscate(s) {
  return s
    .replace(/\s*[[({<]\s*at\s*[\])}>]\s*/gi, '@')
    .replace(/\s*[[({<]\s*dot\s*[\])}>]\s*/gi, '.')
    .replace(/\s+@\s+/g, '@');
}

// Collect up to 3 extra pages (contact/about/imprint/terms), best first.
function findExtraLinks(html, baseUrl) {
  const scored = new Map(); // absolute href -> priority
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const low = m[1].toLowerCase();
    for (const { kw, pri } of LINK_KEYWORDS) {
      if (low.includes(kw)) {
        try {
          const abs = new URL(m[1], baseUrl).href;
          if (!scored.has(abs) || scored.get(abs) > pri) scored.set(abs, pri);
        } catch { /* ignore */ }
        break;
      }
    }
  }
  return [...scored.entries()].sort((a, b) => a[1] - b[1]).map(([href]) => href).slice(0, 3);
}

function extractEmails(html, siteDomain) {
  const found = new Set();
  const decoded = decodeEntities(html);

  // mailto: links are the most reliable
  const mailtoRe = /mailto:([^"'?>\s]+)/gi;
  let m;
  while ((m = mailtoRe.exec(decoded)) !== null) {
    try { found.add(decodeURIComponent(m[1]).toLowerCase()); } catch { found.add(m[1].toLowerCase()); }
  }

  // strip scripts/styles (they hold DSNs, asset URLs, etc.), then de-obfuscate text
  let text = decoded.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  text = text.replace(/<[^>]+>/g, ' ');
  text = deobfuscate(text);
  for (const e of text.match(EMAIL_RE) || []) found.add(e.toLowerCase());

  const clean = [...found].filter((e) => e.length <= 100 && !EMAIL_BLOCKLIST.some((b) => e.includes(b)));
  if (clean.length === 0) return null;

  // Prefer an email on the site's own domain, then generic inboxes like info@/contact@.
  const onDomain = siteDomain ? clean.filter((e) => e.endsWith('@' + siteDomain)) : [];
  const pool = onDomain.length ? onDomain : clean;
  const rank = (e) => (/^(info|contact|sales|hello|shop|eshop|orders|mail)@/.test(e) ? 0 : 1);
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

  if (!email || !instagram) {
    for (const link of findExtraLinks(homeHtml, urlObj.href)) {
      const html = await fetchPage(link);
      if (!html) continue;
      if (!email) email = extractEmails(html, siteDomain);
      if (!instagram) instagram = extractInstagram(html);
      if (email && instagram) break;
      await sleep(200);
    }
  }

  return { email, instagram, status: 'done' };
}