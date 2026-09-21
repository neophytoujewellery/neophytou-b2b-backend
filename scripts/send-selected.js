import 'dotenv/config';
import pool from '../src/db/pool.js';
import env from '../src/config/env.js';
import { loadSuppressedSet } from '../src/lib/suppression.js';
import { checkEligible } from '../src/lib/eligibility.js';
import { sendEmail } from '../src/lib/brevo.js';
import { unsubUrl } from '../src/lib/unsubscribe.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const test = args.includes('--test');
  const live = args.includes('--live');
  const yes = args.includes('--yes');
  const limitArg = parseInt(args.find((a) => /^\d+$/.test(a)) || '0', 10);
  const mode = live ? 'live' : test ? 'test' : 'dry';
  return { mode, yes, limitArg };
}

const escHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildEmail(bodyText, unsub, senderName) {
  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:560px">` +
    `${escHtml(bodyText).replace(/\n/g, '<br>')}` +
    `<div style="margin-top:28px;padding-top:14px;border-top:1px solid #e5e5e5;font-size:12px;color:#999;text-align:center">` +
    `${escHtml(senderName)}<br>` +
    `Don't want to receive these emails? ` +
    `<a href="${unsub}" style="color:#555;font-weight:bold;text-decoration:underline">Unsubscribe</a>` +
    `</div></div>`;
  const text = `${bodyText}\n\n—\n${senderName}\nDon't want these emails? Unsubscribe: ${unsub}`;
  return { html, text };
}

async function run() {
  const { mode, yes, limitArg } = parseArgs();

  const senderEmail = env.SENDER_EMAIL;
  const senderName = env.SENDER_NAME || 'Neophytou Jewellery';
  const testEmails = String(env.TEST_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);

  if (mode !== 'dry' && !senderEmail) {
    console.error('❌ SENDER_EMAIL not set in .env — refusing to send.');
    process.exit(1);
  }
  if (mode === 'test' && testEmails.length === 0) {
    console.error('❌ TEST mode but TEST_EMAILS is empty in .env — refusing to send.');
    process.exit(1);
  }
  if (mode === 'live' && !yes) {
    console.error('🛑 LIVE mode requires an explicit confirmation flag.');
    console.error('   This would email REAL retailers. If you are absolutely sure, re-run with:  --live --yes');
    process.exit(1);
  }

  const limit = limitArg > 0 ? limitArg : mode === 'test' ? 5 : 0;
  const limitClause = limit > 0 ? `LIMIT ${limit}` : '';

  const suppressedSet = await loadSuppressedSet();

  const { rows: leads } = await pool.query(
    `SELECT id, business_name, city, email, email_valid, do_not_contact, campaign_status, emails_sent,
            fit_category, fit_score, draft_subject, draft_body, draft_status
     FROM leads
     WHERE send_selected = true
     ORDER BY fit_score DESC ${limitClause}`
  );

  const banner = {
    dry: '🧪 DRY-RUN — nothing will be sent.',
    test: `✉️  TEST MODE — emails go ONLY to: ${testEmails.join(', ')}`,
    live: '🚨 LIVE MODE — emails go to REAL retailers.',
  }[mode];
  console.log(`\n${banner}\n`);
  console.log(`Selected leads (send_selected=true): ${leads.length}\n`);

  let sent = 0;
  let skipped = 0;

  for (const lead of leads) {
    const { eligible, reason } = await checkEligible(lead, { suppressedSet });
    if (!eligible) {
      console.log(`   ⏭️  ${lead.business_name} — skipped (${reason})`);
      skipped++;
      continue;
    }

    if (lead.draft_status !== 'approved' || !lead.draft_body) {
      console.log(`   ⏭️  ${lead.business_name} — skipped (draft not approved)`);
      skipped++;
      continue;
    }

    const subject = lead.draft_subject || 'Wholesale partnership — Neophytou fine jewellery';
    const unsub = unsubUrl(lead.email);
    const { html, text } = buildEmail(lead.draft_body, unsub, senderName);

    if (mode === 'dry') {
      console.log(`   ▶️  WOULD send to ${lead.email}  (${lead.business_name})`);
      console.log(`        unsubscribe link: ${unsub}`);
      continue;
    }

    const recipients = mode === 'test' ? testEmails : [lead.email];
    const finalSubject = mode === 'test' ? `[TEST → ${lead.email}] ${subject}` : subject;

    try {
      const { messageId } = await sendEmail({
        to: recipients, subject: finalSubject, html, text, senderEmail, senderName,
        tags: [`mode:${mode}`, `fit:${lead.fit_category}`],
        headers: { 'List-Unsubscribe': `<${unsub}>` },
      });

      if (mode === 'live') {
        await pool.query(
          `UPDATE leads SET campaign_status = 'sent', emails_sent = emails_sent + 1,
                            last_email_at = now(), last_brevo_message_id = $2 WHERE id = $1`,
          [lead.id, messageId || null]
        );
      }

      console.log(`   ✅ ${mode === 'test' ? 'TEST sent' : 'SENT'} for ${lead.business_name} → ${recipients.join(', ')}`);
      sent++;
    } catch (err) {
      console.log(`   ❌ ${lead.business_name}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n──────── SEND SUMMARY (${mode}) ────────`);
  console.log(`Sent    : ${sent}`);
  console.log(`Skipped : ${skipped}`);
  if (mode === 'test') console.log('Note: test sends do NOT mark leads as contacted.');

  await pool.end();
}

run().catch(async (err) => {
  console.error('Fatal:', err.message);
  await pool.end();
  process.exit(1);
});