import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../src/db/pool.js';

// Usage:
//   node scripts/reset-admin.js <email> <newpassword>
// Creates the admin if it doesn't exist, or resets the password if it does.
async function run() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  const password = process.argv[3] || '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || password.length < 8) {
    console.error('Usage: node scripts/reset-admin.js <email> <password (8+ chars)>');
    console.error('Example: node scripts/reset-admin.js riyad@example.com MyNewPass123');
    process.exit(1);
  }

  const hash = bcrypt.hashSync(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO admins (email, password_hash) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, (xmax = 0) AS created`,
    [email, hash]
  );

  console.log(rows[0].created
    ? `✅ Admin created: ${email}`
    : `✅ Password reset for existing admin: ${email}`);
  console.log('   You can now log in with this email and the new password.');

  await pool.end();
}

run().catch(async (err) => {
  console.error('Fatal:', err.message);
  await pool.end();
  process.exit(1);
});