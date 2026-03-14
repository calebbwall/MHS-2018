/**
 * One-time script to create the admin user.
 * Run from the server directory: node scripts/createAdmin.js
 *
 * Usage:
 *   cd /path/to/MHS-2018
 *   node server/scripts/createAdmin.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const readline = require('readline');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
  console.log('\n=== MHS 2018 Admin Account Setup ===\n');

  const email    = await ask('Admin email: ');
  const fullName = await ask('Full name: ');
  const password = await ask('Password (min 8 chars): ');

  if (password.length < 8) {
    console.error('Password too short. Exiting.');
    process.exit(1);
  }

  rl.close();

  try {
    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      console.error('A user with this email already exists.');
      process.exit(1);
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, is_approved, is_admin)
       VALUES ($1, $2, $3, TRUE, TRUE)
       RETURNING id, full_name, email`,
      [fullName, email.toLowerCase(), password_hash]
    );

    console.log('\nAdmin account created successfully!');
    console.log('  ID:    ', result.rows[0].id);
    console.log('  Name:  ', result.rows[0].full_name);
    console.log('  Email: ', result.rows[0].email);
    console.log('\nYou can now log in at /login\n');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
