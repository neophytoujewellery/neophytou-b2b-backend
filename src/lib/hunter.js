import env from '../config/env.js';

const ENDPOINT = 'https://api.hunter.io/v2/email-verifier';

// Map Hunter's result to our status vocabulary.
const MAP = {
  deliverable: 'valid',
  undeliverable: 'invalid',
  risky: 'risky',
  unknown: 'unknown',
};

/**
 * Deep-verify one email via Hunter (mailbox existence, catch-all, etc.).
 * Requires HUNTER_API_KEY in .env.
 * @returns {Promise<{status:string, method:'hunter', reason:string}>}
 */
export async function hunterVerify(email) {
  if (!env.HUNTER_API_KEY) throw new Error('HUNTER_API_KEY not set');

  const url = `${ENDPOINT}?email=${encodeURIComponent(email)}&api_key=${env.HUNTER_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    const msg = data.errors?.[0]?.details || JSON.stringify(data);
    throw new Error(`Hunter ${res.status}: ${msg}`);
  }

  const result = data.data?.result || 'unknown'; // deliverable | undeliverable | risky | unknown
  return { status: MAP[result] || 'unknown', method: 'hunter', reason: `hunter:${result}` };
}