import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pool from '../src/db/pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIGRATIONS = [
  '001_create_leads.sql',
  '002_add_enrichment.sql',
  '003_add_scoring.sql',
  '004_add_validation.sql',
  '005_add_sheet_fields.sql',
  '006_create_suppression.sql',
  '007_add_send_fields.sql',
  '008_add_event_fields.sql',
  '009_create_admins.sql',
  '010_create_jobs.sql',
  '011_add_drafts.sql',
  '012_add_source.sql',
  '013_add_application_status.sql',
  '014_add_followups.sql',
];

async function run() {
  for (const file of MIGRATIONS) {
    const sql = await readFile(join(__dirname, '..', 'sql', file), 'utf8');
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
  }
  console.log('✅ Database schema is ready.');
  await pool.end();
}

run().catch(async (err) => {
  console.error('❌ Migration failed:', err.message);
  await pool.end();
  process.exit(1);
});