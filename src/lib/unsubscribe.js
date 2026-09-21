import crypto from 'node:crypto';
import env from '../config/env.js';

const SECRET = env.UNSUB_SECRET || env.DASHBOARD_SECRET || 'unsub-secret-change-me';

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const norm = (e) => String(e || '').trim().toLowerCase();

/** HMAC token that proves this email may unsubscribe (no DB storage needed). */
export function tokenFor(email) {
  return b64url(crypto.createHmac('sha256', SECRET).update(norm(email)).digest());
}

/** Full one-click unsubscribe URL pointing at the frontend. */
export function unsubUrl(email) {
  const base = (env.PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, '');
  const e = b64url(Buffer.from(norm(email), 'utf8'));
  return `${base}/unsubscribe?e=${e}&t=${tokenFor(email)}`;
}