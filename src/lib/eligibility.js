import { isSuppressed } from './suppression.js';

/**
 * The single gatekeeper called before ANY email is sent.
 * A lead is eligible only if ALL rules pass.
 *
 * @param {object} lead  row with email, email_valid, do_not_contact, campaign_status, emails_sent
 * @param {object} [opts]
 * @param {Set<string>} [opts.suppressedSet]  pass loadSuppressedSet() for fast bulk checks
 * @returns {Promise<{eligible:boolean, reason:string}>}
 */
export async function checkEligible(lead, opts = {}) {
  const email = String(lead.email || '').trim().toLowerCase();

  // 1) must have a syntactically-valid, MX-verified email
  if (!email || lead.email_valid !== 'valid') {
    return { eligible: false, reason: 'invalid_email' };
  }

  // 2) staff / system Do Not Contact
  if (lead.do_not_contact) {
    return { eligible: false, reason: 'do_not_contact' };
  }

  // 3) permanent global suppression (unsubscribe/bounce/complaint/manual)
  const suppressed = opts.suppressedSet ? opts.suppressedSet.has(email) : await isSuppressed(email);
  if (suppressed) {
    return { eligible: false, reason: 'suppressed' };
  }

  // 4) never emailed before (no duplicates)
  const contacted = (lead.campaign_status && lead.campaign_status !== 'not_contacted') || Number(lead.emails_sent) > 0;
  if (contacted) {
    return { eligible: false, reason: 'already_sent' };
  }

  return { eligible: true, reason: 'ok' };
}