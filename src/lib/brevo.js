import env from '../config/env.js';

const ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

/**
 * Send one email via Brevo's transactional API.
 * @param {object} p
 * @param {string|string[]} p.to        recipient email(s)
 * @param {string} p.subject
 * @param {string} p.html
 * @param {string} [p.text]
 * @param {string} p.senderEmail
 * @param {string} p.senderName
 * @param {string[]} [p.tags]
 * @returns {Promise<{messageId:string}>}
 */


export async function sendEmail({ to, subject, html, text, senderEmail, senderName, tags, headers }) {
  const recipients = (Array.isArray(to) ? to : [to])
    .filter(Boolean)
    .map((t) => (typeof t === 'string' ? { email: t } : t));

  if (recipients.length === 0) throw new Error('no recipient');

  const body = {
    sender: { email: senderEmail, name: senderName },
    to: recipients,
    subject,
    htmlContent: html,
  };
  if (text) body.textContent = text;
  if (tags) body.tags = tags;
  if (headers) body.headers = headers;

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${data.message || JSON.stringify(data)}`);
  return { messageId: data.messageId };
}