import pool from '../db/pool.js';
import { suppress } from './suppression.js';

const norm = (e) => String(e || '').trim().toLowerCase();

async function setFlag(email, col) {
  await pool.query(
    `UPDATE leads SET ${col} = true, last_event = $2, last_event_at = now() WHERE lower(email) = $1`,
    [email, col]
  );
}

/**
 * Handle one Brevo webhook event. Updates the matching lead(s) by email and,
 * for bounce/unsubscribe/complaint, permanently adds the email to suppression.
 * @param {object} ev  Brevo event payload
 * @returns {Promise<{ok:boolean, event?:string, ignored?:string, reason?:string}>}
 */
export async function handleEvent(ev) {
  const email = norm(ev.email);
  const event = String(ev.event || ev.type || '').toLowerCase();
  if (!email || !event) return { ok: false, reason: 'missing email/event' };

  switch (event) {
    case 'delivered':
      await setFlag(email, 'delivered');
      break;

    case 'opened':
    case 'unique_opened':
      await setFlag(email, 'opened');
      break;

    case 'click':
    case 'clicks':
      await setFlag(email, 'clicked');
      break;

    case 'soft_bounce':
      // transient — flag but do NOT permanently suppress
      await setFlag(email, 'bounced');
      break;

    case 'hard_bounce':
    case 'blocked':
    case 'invalid_email':
      await setFlag(email, 'bounced');
      await suppress(email, 'bounce', 'brevo_webhook');
      break;

    case 'unsubscribed':
    case 'unsubscribe':
      await suppress(email, 'unsubscribe', 'brevo_webhook');
      break;

    case 'spam':
    case 'complaint':
      await pool.query(
        `UPDATE leads SET complained = true, last_event = 'complaint', last_event_at = now() WHERE lower(email) = $1`,
        [email]
      );
      await suppress(email, 'complaint', 'brevo_webhook');
      break;

    default:
      return { ok: true, ignored: event };
  }

  return { ok: true, event };
}