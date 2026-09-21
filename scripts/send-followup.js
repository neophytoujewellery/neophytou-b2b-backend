import 'dotenv/config';
import pool from '../src/db/pool.js';
import env from '../src/config/env.js';
import { loadSuppressedSet, isSuppressed } from '../src/lib/suppression.js';
import { sendEmail } from '../src/lib/brevo.js';
import { unsubUrl } from '../src/lib/unsubscribe.js';
import { getSetting } from '../src/lib/settings.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const mode = args.includes('--live') ? 'live' : args.includes('--test') ? 'test' : 'dry';
  const yes = args.includes('--yes');
  const limit = parseInt(args.find((a) => /^\d+$/.test(a)) || '0', 10);
  return { mode, yes, limit };
}

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

async function run() {
  const { mode, yes, limit } = parseArgs();

  const senderEmail = env.SENDER_EMAIL;
  const senderName = env.SENDER_NAME || 'Neophytou Jewellery';
  const testEmails = String(env.TEST_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);

  if (mode !== 'dry' && !senderEmail) { console.error('❌ SENDER_EMAIL not set.'); process.exit(1); }
  if (mode === 'test' && testEmails.length === 0) { console.error('❌ TEST_EMAILS empty.'); process.exit(1); }
  if (mode === 'live' && !yes) {
    console.error('🛑 LIVE follow-up needs --live --yes. This emails real retailers who did not reply.');
    process.exit(1);
  }

  const subjectTpl = await getSetting('followup_subject');
  const bodyTpl = await getSetting('followup_body');
  const maxFollowups = parseInt((await getSetting('followup_max')) || '2', 10);
  const days = parseInt((await getSetting('followup_days')) || '7', 10);

  const limitClause = limit > 0 ? `LIMIT ${limit}` : '';
  const suppressedSet = await loadSuppressedSet();

  // Follow-up candidates: got the first email, never replied, never opted out,
  // haven't hit the max, and enough days have passed since the last contact.
  const { rows: leads } = await pool.query(
    `SELECT id, business_name, contact_name, email, fit_category,
            COALESCE(followups_sent,0) AS followups_sent
     FROM leads
     WHERE campaign_status = 'sent'
       AND COALESCE(replied,false)      = false
       AND COALESCE(do_not_contact,false) = false
       AND COALESCE(unsubscribed,false) = false
       AND COALESCE(bounced,false)      = false
       AND email IS NOT NULL
       AND COALESCE(followups_sent,0) < $1
       AND COALESCE(last_followup_at, last_email_at) <= now() - ($2 * interval '1 day')
     ORDER BY fit_score DESC ${limitClause}`,
    [maxFollowups, days]
  );

  const banner = {
    dry: '🧪 DRY-RUN — nothing will be sent.',
    test: `✉️  TEST MODE — follow-ups go ONLY to: ${testEmails.join(', ')}`,
    live: '🚨 LIVE MODE — follow-ups go to REAL retailers who did not reply.',
  }[mode];
  console.log(`\n${banner}`);
  console.log(`Rule: max ${maxFollowups} follow-ups, at least ${days} days apart, only if no reply.\n`);
  console.log(`Follow-up candidates: ${leads.length}\n`);

  let sent = 0, skipped = 0;
  const render = (t, lead) =>
    String(t || '')
      .replace(/\{contact\}/g, lead.contact_name || 'there')
      .replace(/\{business\}/g, lead.business_name || 'your business')
      .replace(/\{sender\}/g, senderName);

  for (const lead of leads) {
    // final safety: suppression list
    if (suppressedSet.has(lead.email.toLowerCase()) || (await isSuppressed(lead.email))) {
      console.log(`   ⏭️  ${lead.business_name} — skipped (suppressed)`);
      skipped++;
      continue;
    }

    const subject = render(subjectTpl, lead);
    const unsub = unsubUrl(lead.email);
    const { html, text } = buildEmail(render(bodyTpl, lead), unsub, senderName);
    const nextNo = lead.followups_sent + 1;

    if (mode === 'dry') {
      console.log(`   ▶️  WOULD send follow-up #${nextNo} to ${lead.email}  (${lead.business_name})`);
      continue;
    }

    const recipients = mode === 'test' ? testEmails : [lead.email];
    const finalSubject = mode === 'test' ? `[TEST → ${lead.email}] ${subject}` : subject;

    try {
      await sendEmail({
        to: recipients, subject: finalSubject, html, text, senderEmail, senderName,
        headers: { 'List-Unsubscribe': `<${unsub}>` }, tags: [`mode:${mode}`, 'followup'],
      });
      if (mode === 'live') {
        await pool.query(
          `UPDATE leads SET followups_sent = COALESCE(followups_sent,0) + 1, last_followup_at = now() WHERE id = $1`,
          [lead.id]
        );
      }
      console.log(`   ✅ ${mode === 'test' ? 'TEST' : 'SENT'} follow-up #${nextNo} for ${lead.business_name}`);
      sent++;
    } catch (err) {
      console.log(`   ❌ ${lead.business_name}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n──────── FOLLOW-UP SUMMARY (${mode}) ────────`);
  console.log(`Sent    : ${sent}`);
  console.log(`Skipped : ${skipped}`);
  if (mode === 'test') console.log('Note: test follow-ups do NOT increment the follow-up count.');

  await pool.end();
}

run().catch(async (err) => {
  console.error('Fatal:', err.message);
  await pool.end();
  process.exit(1);
});