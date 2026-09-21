import pool from '../db/pool.js';

// Starter base message. The admin can edit this from the dashboard (Settings);
// it is stored in the `settings` table and used as the core offer/tone for AI drafts.
export const DEFAULTS = {
  outreach_base:
`I'm reaching out from Neophytou Jewellery, a fine-jewellery house specialising in 18KT gold, natural and lab-grown diamonds, diamond tennis bracelets and necklaces, and engagement and bridal pieces.

We are expanding our network of trade partners, and I believe your boutique could be a strong fit for our collections. I'd be glad to share our wholesale catalogue and terms, with no obligation.

Would a short call in the next week or two suit you?`,
  approval_subject: `Welcome to Neophytou — your trade account`,
  approval_body:
`Dear {contact},

Thank you for applying to become a Neophytou trade partner. We've reviewed {business} and we'd be glad to work with you.

We'll be in touch shortly with our wholesale catalogue, pricing and terms. In the meantime, feel free to reply with any questions.

Warm regards,
{sender}`,

  rejection_subject: `Your Neophytou trade application`,
  rejection_body:
`Dear {contact},

Thank you for your interest in a Neophytou trade partnership, and for telling us about {business}.

After reviewing your application we don't have a fit at the moment. We keep applications on file, so we may reach out if that changes.

We wish you every success.

Warm regards,
{sender}`,
  followup_subject: `Following up — Neophytou fine jewellery`,
  followup_body:
`Dear {contact},

I wanted to gently follow up on my earlier note about supplying {business} with our fine jewellery — 18KT gold, certified diamonds, tennis lines and bridal.

If it's of interest, I'd be glad to send our wholesale catalogue and terms, with no obligation. And if now isn't the right time, no problem at all.

Warm regards,
{sender}`,

  followup_max: `2`,
  followup_days: `7`,
};

export async function getSetting(key) {
  const { rows } = await pool.query(`SELECT value FROM settings WHERE key = $1`, [key]);
  return rows[0]?.value ?? DEFAULTS[key] ?? '';
}

export async function setSetting(key, value) {
  await pool.query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, value]
  );
}