import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ DATABASE_URL is missing in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  const res = await pool.query('SELECT NOW() AS now, current_database() AS db');
  console.log('✅ Neon PostgreSQL connected');
  console.log('   Database   :', res.rows[0].db);
  console.log('   Server time:', res.rows[0].now);
} catch (err) {
  console.error('❌ Neon connection failed:', err.message);
  console.error('   Check: is DATABASE_URL correct and does it end with ?sslmode=require ?');
  process.exitCode = 1;
} finally {
  await pool.end();
}
