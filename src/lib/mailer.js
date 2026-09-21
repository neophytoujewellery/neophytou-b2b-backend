import env from '../config/env.js';
import pool from '../db/pool.js';
import { isSuppressed } from './suppression.js';
import { sendEmail } from './brevo.js';
import { unsubUrl } from './unsubscribe.js';

const escHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildEmail(bodyText, unsub, senderName) {
  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:560px">` +
    `${escHtml(bodyText).replace(/\n/g, '<br>')}` +
    `<div style="margin-top:28px;padding-top:14px;border-top:1px solid #e5e5e5;font-size:12px;color:#999;text-align:center">` +
    `${escHtml(senderName)}<br>Don't want to receive these emails? ` +
    `<a href="${unsub}" style="color:#555;font-weight:bold;text-decoration:underline">Unsubscribe</a></div></div>`;
  const text = `${bodyText}\n\n—\n${senderName}\nDon't want these emails? Unsubscribe: ${unsub}`;
  return { html, text };
}

/**
 * Send one email to a lead, with placeholder rendering + all send safety.
 * Placeholders: {contact} {business} {sender}
 * @returns {Promise<{ok:boolean, to?:string|string[], dry?:boolean, reason?:string}>}
 */
export async function sendToLead({ leadId, subject, body, mode = 'dry' }) {
  const { rows } = await pool.query(
    `SELECT id, business_name, contact_name, email FROM leads WHERE id = $1`,
    [leadId]
  );
  const lead = rows[0];
  if (!lead || !lead.email) return { ok: false, reason: 'no email' };

  const senderEmail = env.SENDER_EMAIL;
  const senderName = env.SENDER_NAME || 'Neophytou Jewellery';
  const testEmails = String(env.TEST_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);

  if (mode !== 'dry' && !senderEmail) return { ok: false, reason: 'SENDER_EMAIL not set' };
  if (mode === 'test' && testEmails.length === 0) return { ok: false, reason: 'TEST_EMAILS empty' };
  if (await isSuppressed(lead.email)) return { ok: false, reason: 'suppressed' };

  const render = (t) =>
    String(t || '')
      .replace(/\{contact\}/g, lead.contact_name || 'there')
      .replace(/\{business\}/g, lead.business_name || 'your business')
      .replace(/\{sender\}/g, senderName);

  const subj = render(subject);
  const unsub = unsubUrl(lead.email);
  const { html, text } = buildEmail(render(body), unsub, senderName);

  if (mode === 'dry') return { ok: true, dry: true, to: lead.email };

  const recipients = mode === 'test' ? testEmails : [lead.email];
  const finalSubject = mode === 'test' ? `[TEST → ${lead.email}] ${subj}` : subj;

  await sendEmail({
    to: recipients, subject: finalSubject, html, text, senderEmail, senderName,
    headers: { 'List-Unsubscribe': `<${unsub}>` }, tags: [`mode:${mode}`, 'application'],
  });
  return { ok: true, to: recipients };
}