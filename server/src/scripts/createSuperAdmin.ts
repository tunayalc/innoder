import { loadConfig } from '../config.js';
import { createDb } from '../db.js';
import { hashPassword, passwordPolicy } from '../security.js';

const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const username = process.env.SUPER_ADMIN_USERNAME?.trim().toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD || '';

if (!email || !username || !passwordPolicy(password)) {
  throw new Error('SUPER_ADMIN_EMAIL, SUPER_ADMIN_USERNAME and a strong SUPER_ADMIN_PASSWORD are required.');
}

const db = createDb(loadConfig());
const passwordHash = await hashPassword(password);
await db.query(
  `INSERT INTO users(email, username, name, role, status, password_hash, must_change_password, kvkk_accepted)
   VALUES ($1, $2, 'Sistem Yöneticisi', 'super_admin', 'active', $3, true, false)
   ON CONFLICT (email) DO UPDATE SET
     username = EXCLUDED.username,
     password_hash = EXCLUDED.password_hash,
     must_change_password = true,
     status = 'active',
     token_version = users.token_version + 1`,
  [email, username, passwordHash],
);
process.stdout.write(`Super admin prepared for ${email}. Password change is required at first login.\n`);
await db.end();
