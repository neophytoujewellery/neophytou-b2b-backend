import 'dotenv/config';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import env from '../src/config/env.js';
import pool from '../src/db/pool.js';
import { getSetting } from '../src/lib/settings.js';
import { sendToLead } from '../src/lib/mailer.js';
import { handleEvent } from '../src/lib/events.js';
import { createJob, setStatus, appendLog, getJob, listJobs, runningJobId } from '../src/lib/jobs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = join(__dirname, '..'); // scripts/ -> backend/

const PORT = parseInt(env.API_PORT || '5000', 10);
const TOKEN = env.API_TOKEN || '';

if (!TOKEN) {
  console.error('❌ API_TOKEN is not set in .env — refusing to start (the control API would be open to anyone).');
  process.exit(1);
}

// Maps a job type + params to the existing script + arguments. This reuses the
// exact CLI scripts, so nothing is duplicated.
const JOBS = {
  discover: (p) => {
    const args = ['scripts/discover-country.js', String(p?.country || 'greece')];
    if (p?.city && String(p.city).trim()) args.push(String(p.city).trim());
    return args;
  },
  enrich: (p) => (p?.retryEmpty ? ['scripts/enrich.js', '--retry-empty'] : ['scripts/enrich.js']),
  score: (p) => (p?.rescore ? ['scripts/run-score.js', '--rescore'] : ['scripts/run-score.js']),
  validate: (p) => (p?.hunter ? ['scripts/run-validate.js', '--hunter'] : ['scripts/run-validate.js']),
  sync: () => ['scripts/sync-sheet.js'],
  draft: (p) => (p?.limit ? ['scripts/draft-selected.js', String(p.limit)] : ['scripts/draft-selected.js']),
  followup: (p) => {
    const args = ['scripts/send-followup.js'];
    if (p?.mode === 'live') args.push('--live', '--yes');
    else if (p?.mode === 'test') args.push('--test');
    if (p?.limit) args.push(String(p.limit));
    return args;
  },
  send: (p) => {
    if (p?.mode === 'live') return ['scripts/send-selected.js', '--live', '--yes'];
    if (p?.mode === 'test') return ['scripts/send-selected.js', '--test'];
    return ['scripts/send-selected.js']; // dry-run (default, safe)
  },
};

function runJob(id, type, params) {
  const [script, ...args] = JOBS[type](params);
  setStatus(id, 'running').catch(() => {});

  const child = spawn('node', [script, ...args], { cwd: BACKEND_ROOT });

  let buf = '';
  const flush = async () => {
    if (!buf) return;
    const chunk = buf;
    buf = '';
    try { await appendLog(id, chunk); } catch { /* ignore */ }
  };
  const timer = setInterval(flush, 1000);

  child.stdout.on('data', (d) => { buf += d.toString(); });
  child.stderr.on('data', (d) => { buf += d.toString(); });

  child.on('error', async (err) => {
    clearInterval(timer);
    buf += `\n[spawn error] ${err.message}\n`;
    await flush();
    await setStatus(id, 'failed', -1);
  });

  child.on('close', async (code) => {
    clearInterval(timer);
    await flush();
    await setStatus(id, code === 0 ? 'done' : 'failed', code);
  });
}

// ---- helpers ----
const json = (res, obj, status = 200) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
};
const readBody = (req) =>
  new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => { b += c; if (b.length > 1e5) req.destroy(); });
    req.on('end', () => resolve(b));
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/health') return json(res, { ok: true });

  // Public: inbound trade-partner application from the client site.
  if (req.method === 'POST' && url.pathname === '/apply') {
    try {
      const body = JSON.parse((await readBody(req)) || '{}');
      const email = String(body.email || '').trim().toLowerCase();
      const business = String(body.business || '').trim();
      if (!business || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return json(res, { error: 'Please enter a business name and a valid email.' }, 400);
      }
      const stock = Array.isArray(body.stock) ? body.stock.join(', ') : '';
      const notes = [String(body.notes || '').trim(), stock ? `Stocks: ${stock}` : ''].filter(Boolean).join(' | ') || null;
      const placeId = 'inbound:' + email;
      await pool.query(
        `INSERT INTO leads (place_id, business_name, website, country, city, search_term, email, contact_name, notes, source, applied_at)
         VALUES ($1,$2,$3,$4,$5,'inbound',$6,$7,$8,'inbound_application', now())
         ON CONFLICT (place_id) DO UPDATE SET
           business_name = EXCLUDED.business_name, website = EXCLUDED.website,
           country = EXCLUDED.country, city = EXCLUDED.city,
           contact_name = EXCLUDED.contact_name, notes = EXCLUDED.notes,
           source = 'inbound_application', applied_at = now()`,
        [placeId, business, body.website || null, body.country || null, body.city || null, email, body.contact || null, notes]
      );
      await pool.query(`UPDATE leads SET application_status = COALESCE(application_status, 'pending') WHERE place_id = $1`, [placeId]);
      return json(res, { ok: true });
    } catch (err) {
      return json(res, { error: err.message }, 500);
    }
  }

  // Public: Brevo delivery/open/click/bounce/unsubscribe webhook.
  if (req.method === 'POST' && url.pathname === '/webhooks/brevo') {
    const secret = env.WEBHOOK_SECRET || '';
    if (secret && url.searchParams.get('secret') !== secret) {
      return json(res, { error: 'unauthorized' }, 401);
    }
    try {
      const payload = JSON.parse((await readBody(req)) || '{}');
      const events = Array.isArray(payload) ? payload : [payload];
      for (const ev of events) {
        const r = await handleEvent(ev);
        console.log(`[webhook] ${ev.event || ev.type || '?'} ${ev.email || '?'} \u2192 ${JSON.stringify(r)}`);
      }
      return json(res, { ok: true });
    } catch (err) {
      return json(res, { error: err.message }, 400);
    }
  }

  // token auth for everything else
  if (req.headers['x-api-token'] !== TOKEN) return json(res, { error: 'unauthorized' }, 401);

  // ---- Applications: set status (+ send approval/rejection email) ----
  if (req.method === 'POST' && url.pathname === '/application/status') {
    try {
      const b = JSON.parse((await readBody(req)) || '{}');
      const id = Number(b.id);
      const status = b.status;
      const mode = b.mode || 'dry';
      if (!['pending', 'approved', 'rejected'].includes(status)) return json(res, { error: 'invalid status' }, 400);
      await pool.query(`UPDATE leads SET application_status = $1 WHERE id = $2 AND source = 'inbound_application'`, [status, id]);
      let email = { ok: true, skipped: true };
      if (status === 'approved' || status === 'rejected') {
        const subject = await getSetting(status === 'approved' ? 'approval_subject' : 'rejection_subject');
        const body = await getSetting(status === 'approved' ? 'approval_body' : 'rejection_body');
        email = await sendToLead({ leadId: id, subject, body, mode });
      }
      return json(res, { ok: true, email });
    } catch (err) {
      return json(res, { error: err.message }, 500);
    }
  }

  // ---- Applications: manual email ----
  if (req.method === 'POST' && url.pathname === '/application/email') {
    try {
      const b = JSON.parse((await readBody(req)) || '{}');
      if (!b.subject || !b.body) return json(res, { error: 'subject and body required' }, 400);
      const email = await sendToLead({ leadId: Number(b.id), subject: b.subject, body: b.body, mode: b.mode || 'dry' });
      return json(res, { ok: true, email });
    } catch (err) {
      return json(res, { error: err.message }, 500);
    }
  }

  try {
    if (req.method === 'POST' && url.pathname === '/jobs') {
      const body = JSON.parse((await readBody(req)) || '{}');
      const type = body.type;
      if (!JOBS[type]) return json(res, { error: `unknown job type: ${type}` }, 400);

      const busy = await runningJobId();
      if (busy) return json(res, { error: `a job is already running (#${busy}) — wait for it to finish` }, 409);

      const id = await createJob(type, body.params || {});
      runJob(id, type, body.params || {});
      return json(res, { id, type, status: 'running' });
    }

    if (req.method === 'GET' && url.pathname === '/jobs') {
      return json(res, await listJobs(20));
    }

    if (req.method === 'GET' && url.pathname.startsWith('/jobs/')) {
      const id = url.pathname.split('/')[2];
      const job = await getJob(id);
      return job ? json(res, job) : json(res, { error: 'not found' }, 404);
    }

    json(res, { error: 'not found' }, 404);
  } catch (err) {
    json(res, { error: err.message }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`\n⚙️  Neophytou control API on  http://localhost:${PORT}`);
  console.log(`   Job types: ${Object.keys(JOBS).join(', ')}`);
  console.log(`   Auth: send header  x-api-token: <API_TOKEN>\n`);
});