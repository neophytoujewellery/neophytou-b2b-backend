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