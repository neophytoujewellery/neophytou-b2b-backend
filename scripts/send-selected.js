import 'dotenv/config';
import pool from '../src/db/pool.js';
import env from '../src/config/env.js';
import { loadSuppressedSet } from '../src/lib/suppression.js';
import { checkEligible } from '../src/lib/eligibility.js';
import { buildEmail } from '../src/lib/template.js';
import { sendEmail } from '../src/lib/brevo.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const test = args.includes('--test');
  const live = args.includes('--live');
  const yes = args.includes('--yes');
  const limitArg = parseInt(args.find((a) => /^\d+$/.test(a)) || '0', 10);
  const mode = live ? 'live' : test ? 'test' : 'dry';
  return { mode, yes, limitArg };
}

async function run() {
  const { mode, yes, limitArg } = parseArgs();

  const senderEmail = env.SENDER_EMAIL;
  const senderName = env.SENDER_NAME || 'Neophytou Jewellery';
  const testEmails = String(env.TEST_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);

  // ---- Hard safety gates ----
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

  // In test mode, cap how many leads we process so we never flood our own inbox.
  const limit = limitArg > 0 ? limitArg : mode === 'test' ? 5 : 0;
  const limitClause = limit > 0 ? `LIMIT ${limit}` : '';

  const suppressedSet = await loadSuppressedSet();

  const { rows: leads } = await pool.query(
    `SELECT id, business_name, city, email, email_valid, do_not_contact, campaign_status, emails_sent, fit_category, fit_score
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

    const { subject, html, text } = buildEmail(lead, { senderName, senderEmail });

    // Decide recipients strictly by mode — no leaks possible.
    if (mode === 'dry') {
      console.log(`   ▶️  WOULD send to ${lead.email}  (${lead.business_name})`);
      continue;
    }

    const recipients = mode === 'test' ? testEmails : [lead.email];
    const finalSubject = mode === 'test' ? `[TEST → ${lead.email}] ${subject}` : subject;

    try {
      const { messageId } = await sendEmail({
        to: recipients,
        subject: finalSubject,
        html,
        text,
        senderEmail,
        senderName,
        tags: [`mode:${mode}`, `fit:${lead.fit_category}`],
      });

      // Only a LIVE send marks the real lead as contacted.
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