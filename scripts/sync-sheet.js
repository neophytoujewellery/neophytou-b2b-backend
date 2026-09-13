import 'dotenv/config';
import pool from '../src/db/pool.js';
import { readRange, writeRange, clearRange } from '../src/lib/sheets.js';

const TAB = 'Leads';
const RANGE = `${TAB}!A1:W`;      // 23 columns, A..W
const QUALIFY_MIN = 45;           // sync leads scored >= this

// Column order shown in the Sheet (header row).
const COLUMNS = [
  'id', 'business_name', 'city', 'fit_score', 'fit_category', 'fit_reason',
  'email', 'email_valid', 'phone', 'website', 'instagram',
  'campaign_status', 'emails_sent', 'delivered', 'opened', 'clicked', 'replied',
  'unsubscribed', 'bounced',
  'do_not_contact', 'send_selected', 'lead_stage', 'notes',
];

// Columns staff can edit in the Sheet — these get pulled back into the DB.
const STAFF_COLUMNS = ['do_not_contact', 'send_selected', 'lead_stage', 'notes'];

const parseBool = (v) => ['true', '1', 'yes', 'y', '✓', 'checked'].includes(String(v ?? '').trim().toLowerCase());

// ---------------------------------------------------------------------------
// PULL — read the Sheet, write staff-edited columns back into the DB.
// ---------------------------------------------------------------------------
async function pull() {
  let rows;
  try {
    rows = await readRange(RANGE);
  } catch (err) {
    console.log(`Pull skipped: ${err.message}`);
    return 0;
  }
  if (rows.length < 2) {
    console.log('Pull: Sheet has no data rows yet — skipping.');
    return 0;
  }

  const header = rows[0].map((h) => String(h).trim());
  const idx = Object.fromEntries(COLUMNS.map((c) => [c, header.indexOf(c)]));
  if (idx.id < 0) {
    console.log('Pull: no "id" column in Sheet header — skipping.');
    return 0;
  }

  let updated = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const id = row[idx.id];
    if (!id || !/^\d+$/.test(String(id).trim())) continue;

    const doNot = idx.do_not_contact >= 0 ? parseBool(row[idx.do_not_contact]) : false;
    const sendSel = idx.send_selected >= 0 ? parseBool(row[idx.send_selected]) : false;
    const stage = idx.lead_stage >= 0 ? (row[idx.lead_stage] || 'new') : 'new';
    const notes = idx.notes >= 0 ? (row[idx.notes] || null) : null;

    const res = await pool.query(
      `UPDATE leads SET do_not_contact = $1, send_selected = $2, lead_stage = $3, notes = $4 WHERE id = $5`,
      [doNot, sendSel, stage, notes, Number(id)]
    );
    updated += res.rowCount;
  }
  console.log(`Pull: ${updated} row(s) of staff edits saved to DB.`);
  return updated;
}

// ---------------------------------------------------------------------------
// PUSH — write fresh DB data (qualified leads) to the Sheet. DB is master.
// ---------------------------------------------------------------------------
async function push() {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS.join(', ')}
     FROM leads
     WHERE fit_score >= $1
     ORDER BY fit_score DESC, id`,
    [QUALIFY_MIN]
  );

  const data = rows.map((r) => COLUMNS.map((c) => {
    const v = r[c];
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v; // Sheets renders TRUE/FALSE
    return v;
  }));

  const table = [COLUMNS, ...data];
  await writeRange(`${TAB}!A1`, table);

  // Clear any stale rows left over below the new data.
  const lastRow = table.length; // header + data
  await clearRange(`${TAB}!A${lastRow + 1}:W`);

  console.log(`Push: ${data.length} qualified lead(s) written to Sheet (fit_score >= ${QUALIFY_MIN}).`);
  return data.length;
}

async function run() {
  console.log('\n🔄 Syncing PostgreSQL ↔ Google Sheets...\n');
  await pull();   // staff edits in first (so they survive the push)
  await push();   // then rewrite the Sheet from the DB
  console.log('\n✅ Sync complete.');
  await pool.end();
}

run().catch(async (err) => {
  console.error('Fatal:', err.message);
  await pool.end();
  process.exit(1);
});