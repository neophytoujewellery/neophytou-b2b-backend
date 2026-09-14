import 'dotenv/config';
import http from 'node:http';
import env from '../src/config/env.js';
import { handleEvent } from '../src/lib/events.js';

const PORT = parseInt(env.WEBHOOK_PORT || '3000', 10);
const SECRET = env.WEBHOOK_SECRET || '';
const PATH = '/webhooks/brevo';

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // health check
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200);
    res.end('ok');
    return;
  }

  if (req.method !== 'POST' || url.pathname !== PATH) {
    res.writeHead(404);
    res.end('not found');
    return;
  }

  // optional shared secret: append ?secret=... to the webhook URL in Brevo
  if (SECRET && url.searchParams.get('secret') !== SECRET) {
    res.writeHead(401);
    res.end('unauthorized');
    return;
  }

  let body = '';
  req.on('data', (c) => {
    body += c;
    if (body.length > 1_000_000) req.destroy();
  });
  req.on('end', async () => {
    try {
      const payload = JSON.parse(body || '{}');
      const events = Array.isArray(payload) ? payload : [payload];
      for (const ev of events) {
        const r = await handleEvent(ev);
        console.log(`[webhook] ${ev.event || ev.type || '?'} ${ev.email || '?'} → ${JSON.stringify(r)}`);
      }
      res.writeHead(200);
      res.end('ok');
    } catch (err) {
      console.error('[webhook] error:', err.message);
      res.writeHead(400);
      res.end('bad request');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🔔 Brevo webhook server listening on http://localhost:${PORT}${PATH}`);
  if (SECRET) console.log('   (shared secret required: append ?secret=... to the URL in Brevo)');
});