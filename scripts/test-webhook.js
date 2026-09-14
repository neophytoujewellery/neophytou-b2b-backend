import 'dotenv/config';
import env from '../src/config/env.js';

// Simulates Brevo POSTing an event to your LOCAL webhook server.
// The webhook server must be running in another terminal:  node scripts/webhook-server.js
//
// Usage:
//   node scripts/test-webhook.js <email> <event>
// Examples:
//   node scripts/test-webhook.js info@dionjewellerycorfu.com delivered
//   node scripts/test-webhook.js info@dionjewellerycorfu.com opened
//   node scripts/test-webhook.js someshop@example.com hard_bounce
//   node scripts/test-webhook.js someshop@example.com unsubscribed

const PORT = parseInt(env.WEBHOOK_PORT || '3000', 10);
const SECRET = env.WEBHOOK_SECRET || '';

async function run() {
  const email = process.argv[2];
  const event = process.argv[3];

  if (!email || !event) {
    console.error('Usage: node scripts/test-webhook.js <email> <event>');
    console.error('Events: delivered | opened | click | soft_bounce | hard_bounce | unsubscribed | spam');
    process.exit(1);
  }

  // Mimic a Brevo webhook payload
  const payload = {
    event,
    email,
    'message-id': `sim-${Date.now()}`,
    date: new Date().toISOString(),
    tag: 'simulation',
  };

  const url = `http://localhost:${PORT}/webhooks/brevo${SECRET ? `?secret=${encodeURIComponent(SECRET)}` : ''}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log(`→ POST ${url}`);
    console.log(`← ${res.status} ${text}`);
    if (res.ok) {
      console.log(`\n✅ Simulated "${event}" for ${email}. Check the webhook-server terminal + DB.`);
    } else {
      console.log('\n⚠️  Server responded with an error — is the webhook server running?');
    }
  } catch (err) {
    console.error(`\n❌ Could not reach the webhook server on port ${PORT}.`);
    console.error('   Start it first in another terminal:  node scripts/webhook-server.js');
    console.error(`   (${err.message})`);
    process.exit(1);
  }
}

run();