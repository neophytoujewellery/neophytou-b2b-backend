import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import env from '../config/env.js';

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API = 'https://sheets.googleapis.com/v4/spreadsheets';

let cachedToken = null; // { token, expMs }

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function loadCreds() {
  const path = env.GOOGLE_SERVICE_ACCOUNT_JSON || './google-service-account.json';
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw);
}

async function getAccessToken() {
  if (cachedToken && cachedToken.expMs > Date.now() + 60_000) return cachedToken.token;

  const creds = await loadCreds();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = { iss: creds.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 };

  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(creds.private_key);
  const jwt = `${unsigned}.${b64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google token ${res.status}: ${data.error_description || data.error || JSON.stringify(data)}`);

  cachedToken = { token: data.access_token, expMs: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

async function api(method, path, body) {
  if (!env.GOOGLE_SHEET_ID) throw new Error('GOOGLE_SHEET_ID not set in .env');
  const token = await getAccessToken();
  const res = await fetch(`${API}/${env.GOOGLE_SHEET_ID}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Sheets ${res.status}: ${data.error?.message || JSON.stringify(data)}`);
  return data;
}

/** Read a range, e.g. 'Leads!A1:W'. Returns a 2D array (rows of cell values). */
export async function readRange(range) {
  const data = await api('GET', `/values/${encodeURIComponent(range)}`);
  return data.values || [];
}

/** Overwrite a range starting at the given anchor, e.g. writeRange('Leads!A1', rows). */
export async function writeRange(range, values) {
  return api('PUT', `/values/${encodeURIComponent(range)}?valueInputOption=RAW`, { values });
}

/** Clear a range, e.g. 'Leads!A2:W'. */
export async function clearRange(range) {
  return api('POST', `/values/${encodeURIComponent(range)}:clear`, {});
}