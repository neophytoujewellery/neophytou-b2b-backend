import { resolveMx } from 'node:dns/promises';

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

// Common disposable/temporary email domains — never worth emailing.
const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'temp-mail.org', 'yopmail.com', 'trashmail.com', 'getnada.com',
  'sharklasers.com', 'maildrop.cc', 'dispostable.com', 'fakeinbox.com',
]);

// Role/generic mailboxes — valid and often exactly who we want (info@), but flagged.
const ROLE = new Set([
  'info', 'contact', 'sales', 'hello', 'admin', 'office', 'support',
  'mail', 'shop', 'eshop', 'orders', 'noreply', 'no-reply', 'marketing',
]);

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('dns timeout')), ms)),
  ]);
}

/**
 * Free validation: syntax + MX record + disposable + role.
 * @returns {Promise<{status:'valid'|'invalid'|'unknown', method:string, role:boolean, reason:string}>}
 */
export async function validateEmail(email) {
  const e = String(email || '').trim().toLowerCase();

  if (!EMAIL_RE.test(e)) {
    return { status: 'invalid', method: 'syntax', role: false, reason: 'bad syntax' };
  }

  const [local, domain] = e.split('@');
  const role = ROLE.has(local);

  if (DISPOSABLE.has(domain)) {
    return { status: 'invalid', method: 'mx', role, reason: 'disposable domain' };
  }

  try {
    const mx = await withTimeout(resolveMx(domain), 6000);
    if (mx && mx.length > 0) {
      return { status: 'valid', method: 'mx', role, reason: 'mx ok' };
    }
    return { status: 'invalid', method: 'mx', role, reason: 'no mx records' };
  } catch (err) {
    // Domain truly has no mail/DNS → invalid; transient/timeout → unknown (Hunter candidate)
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return { status: 'invalid', method: 'mx', role, reason: 'no mx/domain' };
    }
    return { status: 'unknown', method: 'mx', role, reason: 'dns error/timeout' };
  }
}