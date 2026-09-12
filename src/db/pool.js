import pg from 'pg';
import env from '../config/env.js';

const { Pool } = pg;

// Single shared pool for the whole backend. Neon (EU) is the primary source of truth.
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default pool;
